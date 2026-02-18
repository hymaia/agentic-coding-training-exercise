---
name: evaluate-plan
description: Validate the quality and completeness of a user-provided implementation plan.
disable-model-invocation: true
argument-hint: [Text of the implementation plan to validate]
context: fork
---

**Goal**
Validate that a user-provided implementation plan contains adequate context for an AI assistant to execute the work effectively and autonomously.

**Detection Strategy**
Check whether a plan has been provided here: $ARGUMENTS. If no plan is visible, ask the user:

> No plan detected in the current conversation. Please paste your implementation plan so I can validate it.

Do NOT proceed with validation until a plan is provided.

**Required Plan Properties**
The plan MUST contain these sections with meaningful, actionable content:

1. **Feature Description** — A clear explanation of *what* is being built or changed, including scope and expected behavior
2. **Technical Constraints** — Boundaries the implementation must respect (e.g., backward compatibility, performance budgets, API contracts, supported platforms)
3. **Workflow** — Ordered steps to execute the work, with particular emphasis on tests and automated checks (e.g., implement, test, lint, compile, run, deploy — or any project-specific variation)
4. **Architectural / Typing Guidelines** — Design and type-system conventions to follow (e.g., use enums vs. strings, integers vs. floats, optionals vs. defaults, value objects, specific patterns)
5. **Success Criteria** — Concrete, verifiable conditions that determine when the work is done (e.g., "all existing tests pass", "new endpoint returns 201", "coverage ≥ 80%")

**Validation Criteria**
For each required property, classify as:
- **Missing**: Not present or contains only placeholder text like `TODO`, `TBD`, `[...]`, `[Describe...]`
- **Sub-optimal**: Present but too brief (< 15 words), vague, or not actionable
- **Good**: Contains meaningful, specific, actionable content (≥ 15 words)

**Validation Process**
1. Confirm a plan is present in the conversation; if not, ask the user to paste it
2. For each required property, check if it exists and classify its quality
3. For each required property, assign a rating:
   - 0 = Missing
   - 1 = Sub-optimal
   - 3 = Good
4. Report findings clearly:
   - List properties that are **missing** or **sub-optimal**
   - For each issue, explain what should be included
   - Summarize which properties are **good**
5. Provide an overall score based on the sum of property ratings (max 15 points)

**Example Validation Report**
```
✓ Plan validated

Missing properties (1):
- Technical Constraints: Should specify boundaries like backward compatibility, API contracts, or performance requirements

Sub-optimal properties (2):
- Workflow: Only says "implement and test" — should list concrete ordered steps including lint, compile, and which test suites to run
- Architectural / Typing Guidelines: Says "follow conventions" — should specify concrete guidelines (e.g., use enums for status fields, optionals for nullable DB columns)

Good properties (2):
- Feature Description: Clear scope with expected input/output behavior
- Success Criteria: Concrete and verifiable conditions listed

=== Overall Score ===
** 7/15 **

Plan needs improvement before execution. Strengthen the missing and sub-optimal sections to enable reliable autonomous implementation.
```

**Important Notes**

***When checking a plan:***

- Validate only what the user provides — do NOT infer or fill in missing sections yourself
- Never modify the plan — only report on its quality
- Focus on actionability: could an agent execute this plan without further clarification?
- Keep tone helpful and educational
