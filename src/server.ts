import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import axios, { AxiosError } from 'axios';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3005;

// ============================================
// 🔍 Logging
// ============================================
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] 📨 ${req.method} ${req.url}`);
    next();
});

// ============================================
// ⚙️ Configuration Management
// ============================================
const CONFIG_FILE = path.join(__dirname, '../settings.json'); // Adjusted path for src/
const LEGACY_COOKIE_FILE = path.join(__dirname, '../cookie.txt');

interface Config {
    cookie: string;
    stickyConversationId: string;
}

let config: Config = {
    cookie: '',
    stickyConversationId: ''
};

function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const data = fs.readFileSync(CONFIG_FILE, 'utf8');
            config = { ...config, ...JSON.parse(data) };
            console.log('⚙️ Loaded settings.json');
        } else if (fs.existsSync(LEGACY_COOKIE_FILE)) {
            const cookie = fs.readFileSync(LEGACY_COOKIE_FILE, 'utf8').trim();
            config.cookie = cookie;
            saveConfig();
            console.log('⚠️ Migrated config from cookie.txt');
        }
    } catch (e: any) {
        console.error('❌ Failed to load config:', e.message);
    }
}

function saveConfig() {
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
        console.log('💾 Config saved');
    } catch (e: any) {
        console.error('❌ Failed to save config:', e.message);
    }
}

// Initial load
loadConfig();

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Target-URL', 'Cookie']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.text({ type: 'text/*' }));

// Health Check
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'OK',
        hasCookie: !!config.cookie,
        timestamp: new Date().toISOString()
    });
});

// ============================================
// 🔐 Configuration Endpoints
// ============================================
app.post('/config/cookie', (req: Request, res: Response) => {
    const cookie = req.body.cookie || req.body;

    if (!cookie || (typeof cookie === 'string' && !cookie.trim())) {
        res.status(400).json({
            error: 'Please provide a valid Cookie',
            example: { cookie: 'your_cookie_string_here' }
        });
        return;
    }

    config.cookie = typeof cookie === 'string' ? cookie.trim() : JSON.stringify(cookie);
    saveConfig();

    res.json({
        success: true,
        message: 'Cookie configured successfully',
        preview: config.cookie.substring(0, 50) + '...'
    });
});

app.get('/config/cookie', (req: Request, res: Response) => {
    res.json({
        hasCookie: !!config.cookie,
        preview: config.cookie ? config.cookie.substring(0, 50) + '...' : null
    });
});

app.post('/config/conversation', (req: Request, res: Response) => {
    const { conversationId } = req.body;
    if (conversationId) {
        config.stickyConversationId = conversationId;
        console.log(`📌 Sticky Conversation ID SET: ${config.stickyConversationId}`);
        res.json({
            success: true,
            message: `Session Locked: ${config.stickyConversationId}`,
            conversationId: config.stickyConversationId
        });
    } else {
        config.stickyConversationId = '';
        console.log('📌 Sticky Conversation ID RESET');
        res.json({ success: true, message: 'Session reset to random mode' });
    }
    saveConfig();
});

// ============================================
// 🤖 OpenAI Adapter with Auto-Recovery
// ============================================
interface OpenAIMessage {
    role: string;
    content: string | any[];
}

interface OpenAIRequest {
    messages: OpenAIMessage[];
    model: string;
    stream?: boolean;
}

app.post('/v1/chat/completions', async (req: Request, res: Response) => {
    console.log(`[${new Date().toISOString()}] 🤖 OpenAI Request:`, req.body.model);

    if (!config.cookie) {
        res.status(401).json({
            error: {
                message: 'Cookie not configured',
                type: 'auth_error',
                code: 'no_cookie'
            }
        });
        return;
    }

    await handleChatRequest(req, res);
});

async function handleChatRequest(req: Request, res: Response, isRetry = false) {
    const { messages, model, stream } = req.body as OpenAIRequest;

    console.log(`[${new Date().toISOString()}] 📩 Incoming Messages Count: ${messages?.length}`);
    if (messages?.length > 0) {
        console.log(`[${new Date().toISOString()}] 🔍 First Message Role: ${messages[0].role}`);
        console.log(`[${new Date().toISOString()}] 🔍 Last Message Role: ${messages[messages.length - 1].role}`);
    }

    // 1. Model Mapping
    const selectedModel = {
        id: 'gpt_175B_0404',
        chatModelId: 'hunyuan_gpt_175B_0404',
        extInfo: "{\"modelId\":\"hunyuan_gpt_175B_0404\",\"subModelId\":\"\",\"supportFunctions\":{\"internetSearch\":\"closeInternetSearch\"}}",
        supportFunctions: ["closeInternetSearch"]
    };

    // 2. Prompt Construction
    let prompt = '';
    try {
        if (Array.isArray(messages)) {
            prompt = messages.map(m => {
                let roleName = m.role === 'system' ? 'System' : (m.role === 'assistant' ? 'Assistant' : 'User');
                let contentStr = '';
                if (Array.isArray(m.content)) {
                    contentStr = m.content.map(part => {
                        if (part && typeof part === 'object' && part.type === 'text') {
                            return (part as any).text || '';
                        }
                        return '';
                    }).join('');
                } else {
                    contentStr = String(m.content || '');
                }
                return `${roleName}: ${contentStr}`;
            }).join('\n\n');
        } else {
            prompt = String(messages || '');
        }
    } catch (parseError) {
        console.error('❌ Prompt Parse Error:', parseError);
        prompt = "Context parse error";
    }

    console.log(`[${new Date().toISOString()}] 📝 Final Prompt (preview): ${prompt.substring(0, 200).replace(/\n/g, ' ')}...`);

    // 3. Conversation ID Logic (Auto-Recovery)
    let conversationId = config.stickyConversationId;
    let usingSticky = !!conversationId;

    if (!conversationId) {
        conversationId = uuidv4();
    } else {
        console.log(`📌 Using Sticky ID: ${conversationId}`);
    }

    const agentId = `naQivTmsDa/${conversationId}`;
    const finalUrl = `https://yuanbao.tencent.com/api/chat/${conversationId}`;

    // 4. Payload
    const payload = {
        "model": selectedModel.id,
        "prompt": prompt,
        "displayPrompt": prompt,
        "agentId": 'naQivTmsDa',
        "cid": conversationId,
        "chatModelId": selectedModel.chatModelId,
        "supportFunctions": selectedModel.supportFunctions,
        "chatModelExtInfo": selectedModel.extInfo,
        "plugin": "", "displayPromptType": 1, "isTemporary": false, "projectId": "",
        "docOpenid": "", "options": { "imageIntention": { "needIntentionModel": true, "backendUpdateFlag": 2, "intentionStatus": true } },
        "multimedia": [], "supportHint": 1, "applicationIdList": [], "version": "v2", "extReportParams": null,
        "isAtomInput": false, "offsetOfHour": 8, "offsetOfMinute": 0
    };

    try {
        const response = await axios({
            method: 'post',
            url: finalUrl,
            headers: {
                'Cookie': config.cookie,
                'Content-Type': 'application/json',
                'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
                'Origin': 'https://yuanbao.tencent.com',
                'Referer': 'https://yuanbao.tencent.com/',
                'x-agentid': agentId
            },
            data: payload,
            responseType: 'stream',
            timeout: 120000
        });

        // ==========================================
        // ✅ SUCCESS HANDLER
        // ==========================================
        if (stream) {
            if (!res.headersSent) {
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');
            }

            const flush = (content: string | null, finishReason: string | null = null) => {
                res.write(`data: ${JSON.stringify({
                    id: `chatcmpl-${conversationId}`,
                    object: 'chat.completion.chunk',
                    created: Math.floor(Date.now() / 1000),
                    model: model,
                    choices: [{ index: 0, delta: content ? { content } : {}, finish_reason: finishReason }]
                })}\n\n`);
            };

            response.data.on('data', (buffer: Buffer) => {
                const lines = buffer.toString().split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const jsonStr = line.substring(6).trim();
                        if (jsonStr === '[DONE]') {
                            flush(null, 'stop');
                            res.write('data: [DONE]\n\n');
                            return;
                        }
                        try {
                            const data = JSON.parse(jsonStr);
                            if (data && data.type === 'text' && data.msg) {
                                flush(data.msg);
                            }
                        } catch (e) { }
                    }
                }
            });
            response.data.on('end', () => res.end());
            response.data.on('error', (err: any) => {
                console.error('Stream Error:', err);
                if (!res.headersSent) res.end();
            });
        } else {
            let fullText = '';
            response.data.on('data', (b: Buffer) => {
                const lines = b.toString().split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const jsonStr = line.substring(6).trim();
                        if (jsonStr === '[DONE]') continue;
                        try { const d = JSON.parse(jsonStr); if (d && d.type === 'text' && d.msg) fullText += d.msg; } catch (e) { }
                    }
                }
            });
            response.data.on('end', () => {
                res.json({
                    id: `chatcmpl-${conversationId}`,
                    object: 'chat.completion',
                    created: Math.floor(Date.now() / 1000),
                    model: model,
                    choices: [{ index: 0, message: { role: 'assistant', content: fullText }, finish_reason: 'stop' }]
                });
            });
        }

    } catch (error: any) {
        // ==========================================
        // 🔄 AUTO-RECOVERY LOGIC
        // ==========================================
        const statusCode = error.response?.status;
        const errorData = error.response?.data;
        console.error(`❌ Request Failed (Status: ${statusCode}) - ${error.message}`);
        if (errorData) {
            console.error('📦 Error Response Data:', typeof errorData === 'object' ? JSON.stringify(errorData) : errorData);
        }

        // If we are using a Sticky ID and get a client error (400) or Server Error (500), 
        // it likely means the Session ID is stale/invalid.
        if (usingSticky && !isRetry && (statusCode === 400 || statusCode === 500)) {
            console.log('⚠️ Sticky Session potentially invalid. Triggering Auto-Recovery...');

            // 1. Reset Sticky ID safely
            config.stickyConversationId = '';
            saveConfig(); // Persist the reset

            console.log('🔄 Retrying with FRESH Conversation ID...');

            // 2. Retry request (isRetry = true to prevent infinite loop)
            await handleChatRequest(req, res, true);
            return;
        }

        // Standard Error Handling
        if (!res.headersSent) {
            res.status(500).json({
                error: {
                    message: error.message || 'Internal Server Error',
                    type: 'server_error',
                    code: 500
                }
            });
        }
    }
}

// ============================================
// 💓 Keep Alive
// ============================================
setInterval(async () => {
    if (!config.cookie) return;
    try {
        await axios.head('https://yuanbao.tencent.com/', {
            headers: { 'Cookie': config.cookie, 'User-Agent': 'Mozilla/5.0...' },
            timeout: 10000
        });
        console.log('💓 Keep-alive ping success');
    } catch (e: any) {
        console.log('⚠️ Keep-alive ping failed:', e.message);
    }
}, 5 * 60 * 1000);

// Start
app.listen(PORT, () => {
    console.log(`🚀 (TSX) Server running at http://localhost:${PORT}`);
    console.log(`⚙️ Config file: ${CONFIG_FILE}`);
});
