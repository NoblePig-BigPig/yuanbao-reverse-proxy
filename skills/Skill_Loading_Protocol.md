# Skill Loading Protocol

## Purpose

Ensure that Cline loads and understands the skills directory content at the beginning of every conversation session.

---

## The Challenge

Currently, Cline does not automatically retain memory of the `skills/` directory contents between conversation sessions. Each new conversation starts fresh without prior knowledge of custom skills.

---

## Solution: Conversation Initialization Pattern

To ensure Cline knows about skills at the start of every conversation, use this initialization pattern:

### Method 1: Explicit Directory Listing Request

At the very beginning of each conversation, say:

> "Please list the contents of the `skills/` directory and read `Task_Loop_Operation.md`"

This triggers Cline to:
1. Discover available skills
2. Load the core operational procedures
3. Apply them throughout the session

### Method 2: Standard Opening Phrase

Establish a habit of starting every conversation with:

> "Load skills and begin with `Task_Loop_Operation.md`"

### Method 3: Project-Based Initialization

Create a `.clinerules` or file in your project root:

```markdown
# .clinerules

## Skills Directory
- Path: ./skills/
- Required files: Task_Loop_Operation.md
- Action: Always read at session start
```

Then instruct Cline at session start:
> "Read `.clinerules` and load skills accordingly"

---

## Automated Detection Script (Optional)

Add this to your project's startup routine:

```bash
#!/bin/bash
# skill_check.sh
echo "Checking skills directory..."
find ./skills -type f -name "*.md" | while read file; do
    echo "Found skill: $file"
done
echo "Core skill: ./skills/Task_Loop_Operation.md"
```

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────┐
│           CONVERSATION START TEMPLATE                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. "List files in skills/"                            │
│  2. "Read skills/Task_Loop_Operation.md"               │
│  3. "Now I want you to help me with [your task]"       │
│                                                         │
│  → This ensures skills are loaded before task begins   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Integration with Task Loop Operation

Once skills are loaded, Cline will:

1. **Phase 1**: Use `Task_Loop_Operation.md` principles for Requirement Analysis
2. **Phase 2**: Follow the Step Planning methodology
3. **Phase 3**: Execute iteratively using Single Tool Rule
4. **Phase 4**: Apply Acceptance Verification checklist
5. **Phase 5**: Handle failures via Re-entry Process

---

## Best Practices

| Practice         | Description                                       |
| ---------------- | ------------------------------------------------- |
| **Consistency**  | Always start conversations the same way           |
| **Explicitness** | Clearly state that skills should be loaded        |
| **Verification** | Confirm skills are understood before proceeding   |
| **Documentation  | Keep skills directory updated with new procedures |

---

## Summary

To ensure Cline knows about skills in every conversation:

1. **Start each conversation** by asking Cline to list and read the `skills/` directory
2. **Reference `Task_Loop_Operation.md`** explicitly as the guiding framework
3. **Follow the initialization pattern** consistently across all sessions

This protocol guarantees that Cline operates with full awareness of established skills and procedures from the moment each conversation begins.