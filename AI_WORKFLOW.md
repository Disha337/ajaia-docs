# AI workflow disclosure

## Tools used
Disclose only tools actually used while completing this submission. Suggested wording to personalize:
- ChatGPT: scope decomposition, architecture alternatives, starter implementation, documentation structure, and test-case review.
- [Add/remove coding tools actually used, e.g. Cursor, GitHub Copilot, VS Code.]

## Where AI accelerated the work
AI assistance helped turn the broad prompt into a narrow end-to-end product slice, scaffold repetitive UI/API code, outline the relational schema, and draft setup/architecture documentation.

## What required human judgment or changes
The implementation intentionally avoids claiming Google Docs parity. Scope was narrowed to one reliable create/edit/save/share/import loop. Demo identity is explicitly disclosed as non-production. File import is limited to TXT/Markdown and capped at 1 MB. Sharing is owner-managed, and API checks are centralized rather than relying only on hidden UI controls. The use of SQLite plus a persistent deployment disk was selected to avoid ephemeral filesystem data loss.

Review this note before submission and describe the actual AI tools and edits you personally made. Do not claim tools or verification steps you did not perform.

## Verification performed / to perform before submission
- Run `npm run check` and confirm build and test pass.
- Manually execute the smoke-test sequence in ARCHITECTURE.md.
- Verify a deployed URL in a private/incognito browser and test both Disha and Aarav flows.
- Inspect browser console and server logs for errors.
- Confirm a refresh preserves content and sharing.
