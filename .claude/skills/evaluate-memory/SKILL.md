---
name: evaluate-memory
description: Validate project context in agent instruction files and help populate missing information.
disable-model-invocation: true
---

**Goal**
Validate that the project's agent instruction file (CLAUDE.md or AGENTS.md at project root) contains adequate context for AI assistants to work effectively with this codebase.

**Detection Strategy**
Check which agent file exists by examining the context currently available to you (your "memory"). Do NOT read files from disk—use only what has already been loaded into your context. If neither CLAUDE.md nor AGENTS.md appears to be in your current context, inform the user that no agent instruction file is currently loaded and suggest they open it in their editor or add it to the conversation.

**Required Context Properties**
The agent file MUST contain these sections with meaningful, project-specific content:

1. **Purpose** - Project goals and objectives (what the project does and why it exists)
2. **Domain Context** - Domain-specific knowledge AI assistants need (business rules, terminology, concepts)
3. **Tech Stack** - Technologies and frameworks used (languages, libraries, tools)
4. **Architecture Patterns** - Key architectural decisions and patterns (e.g., microservices, event-driven, layered architecture)
5. **Testing Strategy** - Testing approach and requirements (types of tests, frameworks, coverage expectations)
6. **Important Constraints** - Technical or regulatory constraints (if applicable)
7. **Workflow Conventions** - Development workflow, or the steps to be automated by the agent (e.g., "compile before finishing", "run unit tests", "launch server"), better if they are listed in a checklist format
8. **Project Non-Obvious Conventions**:
   - Code Style (formatting rules, naming conventions)

The agent file must be under 300 lines to maintain conciseness and focus on essential context.

**Validation Criteria**
For each required property, classify as:
- **Missing**: Section header absent or contains only placeholder text like `[...]`, `[Describe...]`, `[Add...]`, or `[List...]`
- **Sub-optimal**: Section exists but is too brief (< 20 words) or generic/vague
- **Good**: Section has meaningful, project-specific content (≥ 20 words)

**Validation Process**
1. Identify which agent file is in your current context (CLAUDE.md or AGENTS.md)
2. For each required property, check if it exists and classify its quality
3. For each required property, assign a rating:
   - 0 = Missing
   - 1 = Sub-optimal
   - 3 = Good
3. Report findings clearly:
   - List properties that are **missing** or **sub-optimal**
   - For each issue, explain what should be included
   - Summarize which properties are **good**
4. Provide an overall score based on the sum of property ratings (max 24 points)

**Example Validation Report**
```
✓ Validated context in CLAUDE.md

Missing properties (3):
- Purpose: Should describe project goals and what it does
- Domain Context: Should include business rules, terminology, concepts
- Important Constraints: Should list technical, business, or regulatory constraints

Sub-optimal properties (3):
- Tech Stack: Only 8 words - needs more detail about frameworks and tools
- Project Non-Obvious Conventions: Generic description - needs project-specific conventions
- Workflow Conventions: Very brief - should contain a checklist of key steps to automate

Good properties (2):
- Architecture Patterns: Well-documented with clear explanations
- Testing Strategy: Comprehensive with examples

=== Overall Score ===
** 9/24 ** 

Significant context is missing or sub-optimal. Please enhance the agent instruction file with more detailed, project-specific information to improve AI assistant performance.
```

**Important Notes**

***When checking context:***

- The check must address exclusively the agent file currently in your context—do NOT read files outside from AGENTS.md or CLAUDE.md
- Never modify files
- Focus on project-specific details, not generic advice
- Keep tone helpful and educational
