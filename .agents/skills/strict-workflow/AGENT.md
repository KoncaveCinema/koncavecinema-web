# CRITICAL BEHAVIORAL OVERRIDE

You must strictly ignore your default "Planning Mode" instructions that tell you to "continue your work WITHOUT making a plan or requesting user feedback" for simple tasks.

## Global Agent Rules

### STRICT APPROVAL WORKFLOW

1. **Absolute Read-Only Investigation Rule:**
   - **CRITICAL:** The initial phase of any request is strictly read-only.
   - You are permitted to use read tools (e.g., `view_file`, `list_dir`, `grep_search`) and read-only shell commands (e.g., `git status`, `git diff`) to understand the codebase.
   - You are ABSOLUTELY FORBIDDEN from creating new files, deleting files, editing existing code, running installation commands, or executing modifying scripts of any kind until approval is granted.

2. **Proposal Formats based on Scope:**
   - **For Small/Minor Changes:** Skip the creation of formal artifacts. Quickly write a brief, inline text proposal in your response listing the target file(s) and exact lines of code changing, and wait for confirmation.
   - **For Medium to Large Changes:** You MUST create or update the formal `implementation_plan.md` artifact document detailing the architecture, proposed edits, and verification steps. Present the link to this plan for feedback.

3. **Strict Halt for User Approval:**
   - Regardless of the scope, **you must halt all tool calls and end your turn** immediately after presenting your proposal.
   - You are ABSOLUTELY FORBIDDEN from performing any file write/replace operations or modifying terminal commands until the user explicitly responds with approval (e.g., "proceed", "approve", "go ahead").

### GIT & VERSION CONTROL PROTOCOLS

#### 1. Git Commits

- **Format:** Commits must follow Conventional Commits structure (e.g., `feat(scope):`, `fix(scope):`).
- **Strict Line Limit:** Each and every line in the commit message (including title and bullets) must be strictly under 100 characters.
- **No Implementation Details:** Describe _what_ changed functionally, not _how_. Exclude raw JSX/HTML, CSS/Tailwind classes, variable names, and hook handles.
- **Generation Workflow:** Run `git status` then `git diff` to extract exact functional changes. Never guess. Document relocated files explicitly.
- **Granular Bullet Points:** Include detailed, flat bullet points that call out key
  functional alterations. Bullet depth must be proportional to the number of distinct
  functional changes in that commit batch — many behavioral changes warrants many bullets,
  not a vague summary. Each bullet must represent exactly one discrete user-facing or
  system-level behavioral change.
- **Batched Commit Intent:** Commits are split into logical batches so each can carry a
  focused body proportional to its own scope. Do not collapse detail across batches. The
  purpose is to allow each commit body to be as thorough as the changes in that batch demand.
- **On-Demand Generation Only:** You are ABSOLUTELY FORBIDDEN from generating git commit messages or git command snippets automatically after making file changes. You MUST ONLY generate commit messages when the user explicitly requests one.
- **Shell-Safe Delivery:** Format the command string using clean escaping so it runs safely in Windows/Bash.

#### 2. Pull Requests (PRs)

- **Format:** PR descriptions must be concise, flat, and conventional.
- **Content:** Only a high-level Summary and a flat list of Key Changes (no nested bullets).
- **Key Changes Depth:** Each key change must reflect a distinct user-facing behavior or
  functional capability, not a file name. Detail must match the total scope of the PR.
- **Generation:** When generating from Commit IDs, execute `git log` to read the exact commit messages and base the PR strictly on those logs.
