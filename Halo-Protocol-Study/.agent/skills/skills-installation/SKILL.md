---
name: skills-installation
description: How to properly install skills from external repositories into .agent/skills directory
---
# Skills Installation Workflow

This workflow ensures skills are installed correctly into `.agent/skills/` only, without creating unnecessary `.cursor`, `.gemini`, or `.agents` directories.

## Quick Command (Recommended)

```bash
# // turbo-all

# 1. Install the skill using npx (select only Antigravity/.agent, Project scope, Copy)
npx skills add <repo-url> --skill <skill-name>

# 2. Verify the skill is in the correct location
ls -la .agent/skills/<skill-name>/

# 3. Clean up any incorrectly created directories
rm -rf .cursor .gemini .agents 2>/dev/null
```

## Interactive Installation Steps

When running `npx skills add`, the CLI will prompt you with options:

1. **Select agents to install skills to**: Choose ONLY `Antigravity (.agent/skills)`
2. **Installation scope**: Choose `Project` (Install in current directory)
3. **Installation method**: Choose `Copy to all agents` (NOT Symlink)
4. **Proceed with installation**: Yes

## Post-Installation Cleanup

Always run this after installing any skill:

```bash
rm -rf .cursor .gemini .agents 2>/dev/null
```

## Verify Installation

```bash
# Check the skill exists
ls -la .agent/skills/<skill-name>/

# Verify SKILL.md exists
cat .agent/skills/<skill-name>/SKILL.md | head -20
```

## Example: Installing agent-browser

```bash
# Install
npx skills add https://github.com/vercel-labs/agent-browser --skill agent-browser

# During prompts:
# - Select: Antigravity (.agent/skills) ONLY
# - Scope: Project
# - Method: Copy to all agents
# - Proceed: Yes

# Cleanup
rm -rf .cursor .gemini .agents 2>/dev/null

# Verify
ls -la .agent/skills/agent-browser/
```

## Important Notes

- **NEVER** select multiple agents (Cursor, Gemini CLI, etc.) - only select Antigravity
- **ALWAYS** use "Copy" method, not "Symlink" - symlinks break if source is deleted
- **ALWAYS** run cleanup command after installation
- Skills should only exist in `.agent/skills/` directory
