---
name: quick-commit
description: Commit staged changes with an auto-generated conventional commit message. Use when the user says "gc", "quick commit", "commit staged changes", or asks to commit with an auto-generated message.
---

# Quick Commit

Commit currently staged changes with an auto-generated conventional commit message.

## Workflow

1. Run `git diff --cached --stat` to check what is staged. If nothing is staged, inform the user and stop.
2. Run `git diff --cached` to read the actual diff.
3. Analyze the diff and generate a concise conventional commit message:
   - Use one of: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`, `style:`, `perf:`
   - Optionally include a scope in parentheses, e.g. `feat(auth):`, `fix(api):`
   - Subject line: imperative mood, max ~72 chars, no trailing period
   - Add a short body only if needed to clarify non-obvious intent
4. Show the proposed message to the user and ask for confirmation before committing.
5. If confirmed, run `git commit -m "<message>"`. If the user suggests edits, apply them first.

## Examples

```
feat(expenses): add receipt upload endpoint
fix(auth): handle expired token refresh correctly
chore: update dependencies
refactor(agent): extract LLM call into shared service
docs: add setup instructions to README
```
