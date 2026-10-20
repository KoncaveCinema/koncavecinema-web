# Project Rules

## Workflow Enforcement

- **Mandatory First Step:** At the very start of every single user prompt, before executing any research, running commands, proposing inline changes, or creating planning artifacts, you MUST call `view_file` to inspect both of the following files:
  1. [.agents/skills/strict-workflow/SKILL.md](file:///c:/Users/HP/Documents/koncavecinema-web/.agents/skills/strict-workflow/SKILL.md)
  2. [.agents/skills/strict-workflow/AGENT.md](file:///c:/Users/HP/Documents/koncavecinema-web/.agents/skills/strict-workflow/AGENT.md)
  - **Exception:** You are permitted to bypass this check on follow-up prompts of an active request once the user has explicitly approved the proposal/plan and you are in the execution phase.
- **Compliance:** This step is required to fully align your current state with the mandatory sequential phases (Read-Only Investigation → Scope-Based Proposal → Halt for User Approval → Execution) and Windows execution wrappers.

---

## Global Agent Rules

### STRICT APPROVAL WORKFLOW

#### 1. Absolute Read-Only Investigation Rule

- **CRITICAL:** The initial phase of any request is strictly read-only.
- You are permitted to use read tools (e.g., `view_file`, `list_dir`, `grep_search`) and read-only shell commands (e.g., `git status`, `git diff`) to understand the codebase.
- You are ABSOLUTELY FORBIDDEN from creating new files, deleting files, editing existing code, running installation commands, or executing modifying scripts of any kind until approval is granted.

#### 2. Proposal Formats based on Scope

- **For Small/Minor Changes (e.g., tweaking a few lines of code, styling, simple fixes):**
  - You can skip creating or updating a formal implementation plan document.
  - Instead, quickly write a brief, inline text proposal in your response listing the target file(s), the exact lines of code changing, and wait for confirmation.
- **For Medium to Large Changes (e.g., structural refactoring, multiple file additions/deletions, complex logic):**
  - You MUST create or update the formal `implementation_plan.md` artifact document detailing the architecture, proposed edits, and verification steps.
  - You must present the link to this plan to the user for feedback.

#### 3. Strict Halt for User Approval

- Regardless of the scope (small inline proposal or formal implementation plan), **you must halt all tool calls and end your turn** after presenting it.
- You are ABSOLUTELY FORBIDDEN from performing any file write/replace operations or modifying terminal commands until the user explicitly responds with approval (e.g., "proceed", "approve", "go ahead").

---

### Git & Version Control Rules

#### 1. Git Commits

- **Format:** Commits must follow Conventional Commits structure (e.g., `feat(scope):`, `refactor(scope):`, `chore(scope):`, `fix(scope):`).
- **Strict Line Limit:** Each and every line in the commit message (including the title, blank lines, and bullet points) must be strictly **under 100 characters** to prevent wrapping or truncating.
- **No Implementation Details:** Commit messages must describe _what_ changed functionally from a user or system perspective, not _how_ it was implemented.
  - Do NOT include JSX/HTML tags (e.g., `<div>`, `<form>`).
  - Do NOT include CSS classes or Tailwind utility names (e.g., `bg-linear-to-r`, `py-16`).
  - Do NOT include code-level variables, hook names, or state handlers (e.g., `useState`, `userType`, `isSubmitting`).
  - Focus instead on the functional impact (e.g., "replace interactive feedback form with static lists of attendee benefits").
- **Strict Workflow for Generating Commits:**
  1. Run `git status` to see all changed/staged files.
  2. Run `git diff` and thoroughly analyze the diffs of the files. Never guess or write messages based on what was _intended_ to be done.
  3. For files that were moved or restructured, identify the original file and document all functional modifications made during the relocation (e.g., social handle changes, layout updates).
- **Granular and Elaborate Bullet Points:** Include detailed, individual bullet points that
  clearly call out key functional alterations rather than high-level generic summaries.
  Bullet depth must be proportional to the number of distinct functional changes in that
  batch — a file or group of files with many behavioral changes warrants many bullets, not
  a vague summary. Each bullet must represent exactly one discrete user-facing or
  system-level behavioral change.
- **Batched Commit Intent:** Commits are intentionally split into logical batches so each
  batch can carry a focused, detailed body proportional to its own scope. Do not collapse
  detail across batches. The purpose of batching is to allow each commit body to be as
  thorough as the changes in that batch demand — never thin out bullets to keep a batch short.
- **Shell-Safe Output Generation:** When generating the command line snippet for the user to copy-paste, ensure that the commands and multiline commit messages are cleanly escaped and quoted so that they run safely in both Bash and Windows terminals without syntax or parsing errors.

#### 2. Pull Requests (PRs)

- **Format:** PR descriptions must be concise and conventional.
- **Content:** The description should only contain a high-level **Summary** and a list of **Key Changes**.
- **Simplicity:** The key changes list must NOT contain nested bullet points. Keep it simple
  and flat; if multiple points are needed to convey all changes, list them as flat items.
- **Key Changes Depth:** Each key change must correspond to a distinct functional capability
  or user-facing behavior introduced by the PR, not a restatement of file names. The level
  of detail should reflect the total functional scope of the PR.
- **PR Generation from Commit IDs:** When generating a PR for a specific list of commit IDs:
  1. The agent must retrieve and read the actual commit messages for the specified commit IDs (e.g., using `git log` or appropriate Git commands).
  2. The agent must generate both an **appropriate PR Title** and the PR description based _strictly_ on the content of these retrieved commit messages, not on what it assumes the changes were.
