# Ajaia Docs


## 🚀 Live Demo

**Try the application here:** [Ajaia Docs – Live Application](https://ajaia-docs-7c43.onrender.com/)

A lightweight full-stack collaborative document editor built for the Ajaia engineering assignment.

## Features
- Create, rename, edit, save, reopen, and search documents.
- Rich text: bold, italic, underline, H1/H2, bulleted and numbered lists.
- Import `.txt` and `.md` files (maximum 1 MB) as editable documents.
- Seeded demo accounts, owner/shared document labels, share invitations, and access removal.
- SQLite persistence and API-level access checks.
- Responsive dashboard/editor and an automated sharing/access test.

## Demo accounts
Switch accounts from the top-right selector:
- Disha Dhope — `disha@ajaia.demo` (default owner)
- Aarav Shah — `aarav@ajaia.demo`
- Meera Patel — `meera@ajaia.demo`

There is intentionally no password in this assignment demo. The account selector simulates identity; it is not production authentication. To demonstrate sharing, sign in as Disha, create a document, share it with `aarav@ajaia.demo`, then switch to Aarav and open “Shared with me”.

## Local setup
Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev
```
Open the Vite URL shown in the terminal (usually http://localhost:5173). The API runs on port 3001. SQLite is created in `./data/ajaia.sqlite`.

Production-like local run:
```bash
npm install
npm run build
npm start
```
Open http://localhost:3001.

Run checks:
```bash
npm test
npm run check
```

## File import
Use the Import file button. Supported: UTF-8 `.txt` and `.md`, maximum 1 MB. Import creates a new document; images, PDF, and DOCX are intentionally not supported.

## Deployment (Render)
1. Push this folder to a GitHub repository.
2. In Render, choose **New → Blueprint**, connect the repository, and approve the `render.yaml` blueprint.
3. Wait for build/deploy. The blueprint provisions a persistent disk at `/var/data` for SQLite.
4. Open the Render URL and verify the demo flows described above.
5. Add the exact live URL to `SUBMISSION.md` and `submission/live-url.txt`.

Render free instances may spin down when idle; first request can take a little time. If the free plan no longer supports persistent disks, use a paid disk or switch the database to a hosted Postgres service before claiming durable production persistence.

## Product limitations / next steps
- Demo identity selector is not secure authentication. Production would use OAuth/email login and server-verified sessions.
- Shared users currently have editor access; granular viewer/commenter roles are not implemented.
- No simultaneous real-time editing, conflict resolution, comments, revision history, or rich DOCX/PDF import/export.
- The editor uses browser `contentEditable`/`execCommand` for a small dependency footprint. A production editor should use Tiptap/ProseMirror and sanitize HTML on the server.
- Next 2–4 hours: replace demo identity with authenticated sessions, add content sanitization and a proper editor schema, add optimistic-save conflict handling, and add a second integration test for upload.

## Architecture
See `ARCHITECTURE.md` and `AI_WORKFLOW.md` for the design rationale and AI-use disclosure.