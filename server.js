import express from "express";
import Database from "better-sqlite3";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: "2mb" }));
const dataDir = process.env.DATA_DIR || path.join(__dirname, "data");
fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(path.join(dataDir, "ajaia.sqlite"));
db.pragma("journal_mode = WAL");
db.exec(`
CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL);
CREATE TABLE IF NOT EXISTS documents (
 id TEXT PRIMARY KEY, title TEXT NOT NULL, content TEXT NOT NULL DEFAULT '',
 owner_id TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
 FOREIGN KEY(owner_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS shares (
 document_id TEXT NOT NULL, user_id TEXT NOT NULL, permission TEXT NOT NULL DEFAULT 'editor',
 PRIMARY KEY(document_id,user_id), FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE,
 FOREIGN KEY(user_id) REFERENCES users(id)
);
`);
const seedUsers = [
 ["u_disha", "Disha Dhope", "disha@ajaia.demo"],
 ["u_aarav", "Aarav Shah", "aarav@ajaia.demo"],
 ["u_meera", "Meera Patel", "meera@ajaia.demo"]
];
const addUser = db.prepare("INSERT OR IGNORE INTO users(id,name,email) VALUES(?,?,?)");
seedUsers.forEach(u => addUser.run(...u));
const users = db.prepare("SELECT id,name,email FROM users").all();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 1024 * 1024 }, fileFilter: (_req,file,cb) => cb(null, /\.(txt|md)$/i.test(file.originalname)) });
const now = () => new Date().toISOString();
const getUser = req => db.prepare("SELECT id,name,email FROM users WHERE id=?").get(req.header("x-user-id") || "u_disha");
function requireUser(req,res,next) { const user=getUser(req); if(!user) return res.status(401).json({error:"Please select a demo user."}); req.user=user; next(); }
function access(docId,userId) {
 return db.prepare(`SELECT d.*, CASE WHEN d.owner_id=? THEN 'owner' ELSE s.permission END AS access_role
 FROM documents d LEFT JOIN shares s ON s.document_id=d.id AND s.user_id=?
 WHERE d.id=? AND (d.owner_id=? OR s.user_id=?)`).get(userId,userId,docId,userId,userId);
}
app.get("/api/health", (_req,res)=>res.json({ok:true}));
app.get("/api/users", (_req,res)=>res.json(users));
app.use("/api", requireUser);
app.get("/api/documents", (req,res) => {
 const rows=db.prepare(`SELECT d.id,d.title,d.updated_at,d.owner_id,u.name AS owner_name,
 CASE WHEN d.owner_id=? THEN 'owner' ELSE 'shared' END AS kind
 FROM documents d JOIN users u ON u.id=d.owner_id
 LEFT JOIN shares s ON s.document_id=d.id AND s.user_id=?
 WHERE d.owner_id=? OR s.user_id=? ORDER BY d.updated_at DESC`).all(req.user.id,req.user.id,req.user.id,req.user.id);
 res.json(rows);
});
app.post("/api/documents", (req,res) => {
 const title=String(req.body.title || "Untitled document").trim().slice(0,120);
 if(!title) return res.status(400).json({error:"A document title is required."});
 const id=crypto.randomUUID(), ts=now();
 db.prepare("INSERT INTO documents(id,title,content,owner_id,created_at,updated_at) VALUES(?,?,?, ?,?,?)").run(id,title,String(req.body.content||""),req.user.id,ts,ts);
 res.status(201).json(access(id,req.user.id));
});
app.get("/api/documents/:id", (req,res) => {
 const doc=access(req.params.id,req.user.id);
 if(!doc) return res.status(404).json({error:"Document not found or you do not have access."});
 res.json({...doc, owner:db.prepare("SELECT name,email FROM users WHERE id=?").get(doc.owner_id),
 shares:db.prepare("SELECT u.id,u.name,u.email,s.permission FROM shares s JOIN users u ON u.id=s.user_id WHERE s.document_id=?").all(doc.id)});
});
app.patch("/api/documents/:id", (req,res) => {
 const doc=access(req.params.id,req.user.id);
 if(!doc) return res.status(404).json({error:"Document not found or you do not have access."});
 const title=req.body.title === undefined ? doc.title : String(req.body.title).trim().slice(0,120);
 const content=req.body.content === undefined ? doc.content : String(req.body.content);
 if(!title) return res.status(400).json({error:"Title cannot be empty."});
 if(content.length>500000) return res.status(413).json({error:"Document content is too large."});
 db.prepare("UPDATE documents SET title=?,content=?,updated_at=? WHERE id=?").run(title,content,now(),doc.id);
 res.json(access(doc.id,req.user.id));
});
app.post("/api/documents/:id/share", (req,res) => {
 const doc=db.prepare("SELECT * FROM documents WHERE id=? AND owner_id=?").get(req.params.id,req.user.id);
 if(!doc) return res.status(403).json({error:"Only the document owner can manage sharing."});
 const email=String(req.body.email||"").trim().toLowerCase();
 const target=db.prepare("SELECT id FROM users WHERE lower(email)=?").get(email);
 if(!target) return res.status(404).json({error:"No demo account found for that email. Try aarav@ajaia.demo or meera@ajaia.demo."});
 if(target.id===req.user.id) return res.status(400).json({error:"You already own this document."});
 db.prepare("INSERT INTO shares(document_id,user_id,permission) VALUES(?,?,'editor') ON CONFLICT(document_id,user_id) DO UPDATE SET permission='editor'").run(doc.id,target.id);
 res.json({ok:true});
});
app.delete("/api/documents/:id/share/:userId", (req,res) => {
 const doc=db.prepare("SELECT id FROM documents WHERE id=? AND owner_id=?").get(req.params.id,req.user.id);
 if(!doc) return res.status(403).json({error:"Only the owner can remove access."});
 db.prepare("DELETE FROM shares WHERE document_id=? AND user_id=?").run(doc.id,req.params.userId);
 res.json({ok:true});
});
app.post("/api/import", upload.single("file"), (req,res) => {
 if(!req.file) return res.status(400).json({error:"Choose a .txt or .md file under 1 MB."});
 const content=req.file.buffer.toString("utf8");
 const title=path.basename(req.file.originalname,path.extname(req.file.originalname)).slice(0,120)||"Imported document";
 const id=crypto.randomUUID(), ts=now();
 db.prepare("INSERT INTO documents(id,title,content,owner_id,created_at,updated_at) VALUES(?,?,?,?,?,?)").run(id,title,content,req.user.id,ts,ts);
 res.status(201).json({id});
});
if (fs.existsSync(path.join(__dirname,"dist"))) {
 app.use(express.static(path.join(__dirname,"dist")));
 app.get("*", (_req,res)=>res.sendFile(path.join(__dirname,"dist","index.html")));
}
const port=Number(process.env.PORT||3001);
if (process.env.NODE_ENV !== "test") app.listen(port,()=>console.log(`Ajaia Docs listening on ${port}`));
export { app, db };