/**
 * 与本地 Ollama 进行对话的 TypeScript 脚本
 * 使用方法: npx tsx chat-with-ollama.ts
 */

// Ollama API 基础地址
const OLLAMA_BASE_URL = 'http://localhost:11434';

// 类型定义
interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface ChatRequest {
    model: string;
    messages: Message[];
    stream?: boolean;
    options?: {
        temperature?: number;
        top_p?: number;
        max_tokens?: number;
    };
}

interface ChatResponse {
    model: string;
    created_at: string;
    message: Message;
    done: boolean;
}

// 检查 Ollama 是否可用
async function checkOllamaHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
        return response.ok;
    } catch (error) {
        return false;
    }
}

// 获取可用的模型列表
async function getAvailableModels(): Promise<string[]> {
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
        if (!response.ok) return;
        const data = await response.json();
        return data.models?.map((m: any) => m.name) || [];
    } catch (error) {
        return [];
    }
}

// 发送聊天请求
async function chat(messages: Message[], model: string = 'llama2'): Promise<string> {
    const requestBody: ChatRequest = {
        model,
        messages,
        stream: false,
        options: {
            temperature: 0.7,
        },
    };

    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        throw new Error(`Ollama API 错误: ${response.status} ${response.statusText}`);
    }

    const data: ChatResponse = await response.json();
    return data.message.content;
}

// 主函数
async function main() {
    console.log('🦙 Ollama 聊天客户端');
    console.log('='.repeat(40));

    // 检查 Ollama 连接
    console.log('正在检查 Ollama 连接...');
    const isHealthy = await checkOllamaHealth();

    if (!isHealthy) {
        console.error('❌ 无法连接到 Ollama，请确保 Ollama 正在运行在 http://localhost:11434');
        console.log('\n启动 Ollama:');
        console.log('  Windows: 在另一个终端运行 "ollama serve"');
        console.log('  macOS/Linux: 在另一个终端运行 "ollama serve"');
        console.log('\n然后拉取模型:');
        console.log('  ollama pull llama2');
        process.exit(1);
    }

    console.log('✅ Ollama 连接成功！');

    // 获取可用模型
    const models = await getAvailableModels();
    if (models.length > 0) {
        console.log(`\n可用模型: ${models.join(', ')}`);
    }

    // 对话历史
    const messages: Message[] = [
        {
            role: 'system',
            content: '你是一个有帮助的 AI 助手。请用中文回答用户的问题。',
        },
    ];

    // 选择模型
    let model = models.includes('llama2') ? 'llama2' : models[0] || 'llama2';
    console.log(`\n当前使用模型: ${model}\n`);

    // 交互式对话循环
    console.log('开始对话吧！输入 "exit" 或 "quit" 退出。\n');

    while (true) {
        // 获取用户输入
        const readline = await import('readline/promises');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        const userInput = await rl.question('👤 你: ');
        rl.close();

        // 检查退出条件
        if (['exit', 'quit', '退出'].includes(userInput.trim().toLowerCase())) {
            console.log('\n👋 再见！');
            break;
        }

        if (!userInput.trim()) {
            continue;
        }

        // 添加用户消息到历史
        messages.push({ role: 'user', content: userInput });

        try {
            // 显示加载状态
            process.stdout.write('🤖 AI: ');

            // 获取 AI 回复
            const response = await chat(messages, model);

            // 清除加载状态并显示回复
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
            console.log(`🤖 AI: ${response}`);

            // 添加 AI 回复到历史
            messages.push({ role: 'assistant', content: response });

        } catch (error: any) {
            console.error(`\n❌ 错误: ${error.message}`);
        }

        console.log(''); // 空行分隔
    }
}

// 运行主函数
main().catch((error) => {
    console.error('程序出错:', error);
    process.exit(1);
});