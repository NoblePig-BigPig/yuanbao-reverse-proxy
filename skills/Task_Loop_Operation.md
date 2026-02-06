# Task Loop Operation

## Core Principle: Iterative Workflow

Cline's design philosophy is **tool-driven iterative execution**, ensuring task completion through clear steps and tool invocations. Below is the Standard Operating Procedure (SOP):

---

## Phase 1: Requirement Analysis

### Objective
- Understand the user's true intent
- Identify implicit requirements
- Clarify ambiguities
- Define success criteria

### Tools Used
- `ask_followup_question` - Ask clarifying questions
- `read_file` - Review relevant files
- `search_files` - Search codebase
- `list_files` - Understand project structure
- `list_code_definition_names` - Analyze code architecture

### Key Questions
1. What is the final deliverable of this task?
2. Are there existing code or documents to reference?
3. Are there any special constraints or limitations?
4. How do we determine if the task is complete (acceptance criteria)?

---

## Phase 2: Step Planning

### Objective
- Decompose the large task into manageable steps
- Establish clear dependencies
- Estimate complexity of each step
- Create a trackable progress list

### Tools Used
- `plan_mode_respond` - Present detailed plan
- `task_progress` parameter - Create Markdown checklist

### Step List Template
```markdown
- [ ] Step 1: Description
 [ ] Step 2: Description
- [ ] Step 3: Description
...
```

### Step Design Principles
1. **Atomicity**: Each step does one thing
2. **Verifiability**: Each step's completion can be confirmed
3. **Orderliness**: Steps have logical sequence
4. **Independence**: Minimize coupling between steps

---

## Phase 3: Step-by-Step Execution

### Objective
- Complete each planned step sequentially
- Use only one tool per invocation
- Wait for user confirmation before proceeding
- Update progress promptly

### Tools Used
- `read_file` - Read file contents
- `write_to_file` - Create/overwrite files
- `replace_in_file` - Precise file modifications
- `execute_command` - Execute commands
- `use_mcp_tool` - Use MCP server tools
- `search_files` - Search code patterns

### Execution Principles
1. **Single Tool Rule**: Call only one tool at a time
2. **Wait for Confirmation**: Must wait for user response before continuing
3. **Progress Updates**: Update `task_progress` after each tool call
4. **Error Handling**: Report errors immediately and stop

### Example Execution Flow
```
Step 1: Read configuration file
├── Call read_file
├── Wait for user confirmation
├── Analyze results
└── Update progress list

Step 2: Modify configuration
├── Call replace_in_file
├── Wait for user confirmation
├── Analyze results
└── Update progress list
```

---

## Phase 4: Acceptance Verification

### Objective
- Confirm task meets expected goals
- Verify all functions work correctly
- Check edge cases
- Ensure code quality

### Tools Used
- `attempt_completion` - Submit final result
- `execute_command` - Run tests/demos
- `generate_explanation` - Explain changes

### Acceptance Checklist
- [ ] **Completeness**: All required features implemented
- [ ] **Correctness**: Features work as expected
- [ ] **Robustness**: Handles exceptional cases
- [ ] **Maintainability**: Code is clear and readable
- [ ] **Performance**: Meets requirements

### Submission Format
```xml
<attempt_completion>
<result>Clear description of completed work and results</result>
<command>Optional demo command, e.g., open index.html</command>
<task_progress>Final completion status</task_progress>
</attempt_completion>
```

---

## Phase 5: Failure Handling & Re-entry

### Trigger Conditions
- User explicitly expresses dissatisfaction
- Acceptance verification fails
- Requirements misunderstood
- Technical obstacles cannot be overcome

### Re-entry Process
1. **Analyze Feedback**: Understand user dissatisfaction
2. **Re-analyze Requirements**: Previous understanding may have been flawed
3. **Adjust Plan**: Modify step list
4. **Re-execute**: Start from appropriate step

### Re-entry Principles
- Preserve completed correct parts
- Only modify problematic parts
- Document reason for changes
- Avoid repeating the same mistakes

---

## Tool Usage Best Practices

### 1. File Operations
| Scenario            | Recommended Tool  |
| ------------------- | ----------------- |
| Create new file     | `write_to_file`   |
| Small modifications | `replace_in_file` |
| Complete rewrite    | `write_to_file`   |
| View content        | `read_file`       |

### 2. Command Execution
- Always explain command purpose
- Set correct `requires_approval`
- Use flags like `--no-pager`, `-y` to avoid interaction

### 3. Progress Tracking
- Include `task_progress` in every tool call
- Use standard Markdown format
- Keep lists concise and meaningful

---

## Complete Workflow Diagram

```
Start
  │
  ▼
┌─────────────────┐
│ Requirement     │◄──────────────┐
│ Analysis        │               │
└────────┬────────┘               │
         │                        │
         ▼                        │
┌─────────────────┐               │
│ Step Planning   │               │
└────────┬────────┘               │
         │                        │
         ▼                        │
┌─────────────────┐               │
│ Execution       │─── Fail ──────┤
│                 │               │
└────────┬┘               │
         │                        │
         ▼                        │
┌─────────────────┐               │
│ Acceptance      │               │
│ Verification    │               │
└────────┬────────┘               │
         │                        │
    ┌────┴────┐                   │
    │         │                   │
    ▼         ▼                   │
┌───────┐ ┌──────────┐            │
│ Pass  │ │ Fail     │            │
└───┬───┘ └────┬─────┘            │
    │          │                  │
    ▼          └──────┬───────────┘
┌─────────────────┐     │
│ Task Complete   │     │
│                 │     │
└─────────────────┘     │
                        │
              Re-enter Requirement Analysis
```

---

## Summary

Key elements for perfect task execution using Cline:

1. **Clear Communication**: Explain each step clearly
2. **Tool-Driven**: Select appropriate tools for tasks
3. **Iterative Execution**: Confirm each step before proceeding
4. **Continuous Tracking**: Use `task_progress` for visibility
5. **Flexible Response**: Handle failures by re-analyzing requirements

This workflow ensures tasks are completed with high quality and controllability, while maintaining flexibility to handle unexpected situations.