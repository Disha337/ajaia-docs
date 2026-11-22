# Architecture and prioritization

## Product slice
Ajaia Docs is a small, single-workspace document product. The primary loop is create → edit → save → reopen → share → open as another teammate. The dashboard makes ownership visible, while the editor keeps the toolbar compact and the document canvas central.

## Stack
- React + Vite for a fast client UI.
- Express REST API for document operations.
- SQLite (`better-sqlite3`) for durable relational persistence.
- Multer memory storage for bounded TXT/Markdown import.
- Render Blueprint for a single deployable Node service and persistent disk.

## Data model
- `users(id, name, email)`: three seeded demo identities.
- `documents(id, title, content, owner_id, created_at, updated_at)`.
- `shares(document_id, user_id, permission)`: unique document/user grant.

The `access()` query is the central authorization check. A user can fetch or edit a document only when they own it or have a share row. Only owners can grant or revoke sharing. The API derives identity from `x-user-id`, defaulting to Disha for the demo.

## Deliberate tradeoffs
1. **Single service and SQLite:** reduces deployment and setup complexity. SQLite is appropriate for this low-traffic exercise; persistent disk is required in production hosting.
2. **Seeded identity instead of auth provider:** makes the sharing flow reviewable without credentials or external setup. It is explicitly a demo-only trust boundary, not production authentication.
3. **TXT/MD import:** delivers a useful file workflow with predictable parsing and low implementation risk. DOCX/PDF parsing was cut.
4. **ContentEditable instead of full editor framework:** keeps scope focused on the core formatting commands. A schema-driven editor and HTML sanitization are the next production-hardening steps.
5. **Debounced autosave plus blur save:** balances responsiveness and fewer API calls. No multi-user concurrent editing guarantee is made.

## Verification
- Automated API test verifies private-by-default access, successful owner sharing, shared read access, and denial of share-management by a non-owner.
- Manual smoke test: create document, apply formatting, refresh/reopen, import a text file, share with Aarav, switch identity, verify shared document, and verify Meera cannot access it until invited.

## Known gaps
No production authentication, rich-content sanitization, simultaneous editing, version history, comments, or file attachments. The demo user selector is intentionally not presented as secure login.