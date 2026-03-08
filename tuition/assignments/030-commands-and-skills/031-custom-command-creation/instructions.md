## Exercise: Create a Claude Skill Generator Skill

### Goal

Create a **reusable skill generator** that helps you create new skills quickly.

By the end, you will have a (meta) **skill** usable via **slash command**.

---

### Task

The `new-skill` skill must:
1. Be invocable via a **slash command** (e.g., `/new-skill`).
2. **Explore the current project structure and conventions** to gather context necessary for generating a skill that fits well within the existing ecosystem.

---

#### Inputs

Your command must accept **two arguments**:

1. `skill-name`
2. `description`

Example invocation:

* `/new-skill code-review "Review a PR"`

---

### Hints 

- Feel free to use [https://code.claude.com/docs/en/skills](https://code.claude.com/docs/en/skills)

---

# Example

```
.claude/skills/
└── my-skill/
    └── SKILL.md
```
