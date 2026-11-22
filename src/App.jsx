import React, { useEffect, useRef, useState } from "react";
import { Plus, Search, FileText, Users, Clock3, Upload, Share2, ChevronDown, Bold, Italic, Underline, List, ListOrdered, Heading1, Heading2, ArrowLeft, Check, MoreHorizontal, X, Cloud, LockKeyhole } from "lucide-react";

const api = async (url, opts={}) => {
  const headers = { "x-user-id": localStorage.getItem("ajaia-user") || "u_disha", ...(opts.body instanceof FormData ? {} : {"Content-Type":"application/json"}), ...opts.headers };
  const r = await fetch(url,{...opts,headers});
  const data = await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(data.error || "Something went wrong");
  return data;
};
function App(){
 const [users,setUsers]=useState([]), [user,setUser]=useState(localStorage.getItem("ajaia-user")||"u_disha");
 const [docs,setDocs]=useState([]), [active,setActive]=useState(null), [query,setQuery]=useState("");
 const [saving,setSaving]=useState("Saved"), [toast,setToast]=useState(""), [shareOpen,setShareOpen]=useState(false), [shareEmail,setShareEmail]=useState("");
 const [busy,setBusy]=useState(false); const editor=useRef(null), timer=useRef(null), fileRef=useRef(null);
 const notify=(s)=>{setToast(s);setTimeout(()=>setToast(""),2800)};
 const loadDocs=async()=>setDocs(await api("/api/documents"));
 useEffect(()=>{api("/api/users").then(setUsers).catch(e=>notify(e.message));},[]);
 useEffect(()=>{localStorage.setItem("ajaia-user",user);setActive(null);loadDocs().catch(e=>notify(e.message));},[user]);
 useEffect(() => {
  if (editor.current && active) {
    editor.current.innerHTML =
      active.content || "<h1>Start writing</h1><p>Your ideas, organized in one place.</p>";
  }
}, [active?.id]);
 const openDoc=async id=>{try{const d=await api(`/api/documents/${id}`);setActive(d);setShareOpen(false);}catch(e){notify(e.message)}};
 const createDoc=async()=>{try{const d=await api("/api/documents",{method:"POST",body:JSON.stringify({title:"Untitled document"})});await loadDocs();openDoc(d.id);}catch(e){notify(e.message)}};
 const save=async (patch)=>{if(!active)return;setSaving("Saving…");try{const d=await api(`/api/documents/${active.id}`,{method:"PATCH",body:JSON.stringify(patch)});setActive(old=>({...old,...d}));setSaving("Saved");loadDocs();}catch(e){setSaving("Save failed");notify(e.message)}};
 const queueSave=(patch)=>{clearTimeout(timer.current);setSaving("Unsaved changes");timer.current=setTimeout(()=>save(patch),650)};
 const format=cmd=>{editor.current?.focus();document.execCommand(cmd,false,null);if(editor.current)queueSave({content:editor.current.innerHTML});};
 const heading=tag=>{editor.current?.focus();document.execCommand("formatBlock",false,tag);if(editor.current)queueSave({content:editor.current.innerHTML});};
 const importFile=async e=>{const file=e.target.files?.[0];if(!file)return;const fd=new FormData();fd.append("file",file);try{const d=await api("/api/import",{method:"POST",body:fd});await loadDocs();await openDoc(d.id);notify("File imported as a new document");}catch(err){notify(err.message)}e.target.value="";};
 const share=async e=>{e.preventDefault();try{await api(`/api/documents/${active.id}/share`,{method:"POST",body:JSON.stringify({email:shareEmail})});setShareEmail("");await openDoc(active.id);await loadDocs();notify("Document shared successfully");}catch(err){notify(err.message)}};
 const removeShare=async id=>{try{await api(`/api/documents/${active.id}/share/${id}`,{method:"DELETE"});await openDoc(active.id);notify("Access removed");}catch(e){notify(e.message)}};
 const rename=()=>{const title=prompt("Rename document",active.title);if(title?.trim())save({title:title.trim()});};
 const visible=docs.filter(d=>d.title.toLowerCase().includes(query.toLowerCase()));
 const currentUser=users.find(u=>u.id===user);
 return <div className="app-shell">
  <header className="topbar"><div className="brand"><div className="brand-mark">a</div><span>ajaia<span className="brand-light">docs</span></span></div>
   <div className="top-actions"><span className="save-state"><span className={`dot ${saving==="Saved"?"ok":""}`}/>{active?saving:"Workspace ready"}</span><div className="user-select"><span className="avatar">{currentUser?.name?.[0]||"D"}</span><select value={user} onChange={e=>setUser(e.target.value)} aria-label="Switch demo user">{users.map(u=><option value={u.id} key={u.id}>{u.name}</option>)}</select><ChevronDown size={14}/></div></div>
  </header>
  {active ? <main className="editor-page">
   <div className="editor-head"><button className="icon-btn" onClick={()=>{setActive(null);loadDocs()}} title="Back to documents"><ArrowLeft size={18}/></button><div className="doc-heading"><input className="title-input" value={active.title} onChange={e=>{setActive({...active,title:e.target.value});queueSave({title:e.target.value})}} aria-label="Document title"/><div className="doc-meta">{active.access_role==="owner"?"Owned by you":`Shared by ${active.owner?.name}`} · Edited {new Date(active.updated_at).toLocaleString()}</div></div><button className="secondary-btn" onClick={()=>setShareOpen(!shareOpen)}><Share2 size={15}/> Share</button><button className="icon-btn" title="Rename" onClick={rename}><MoreHorizontal size={18}/></button></div>
   <div className="paper-wrap"><div className="toolbar">
    <button title="Bold" onClick={()=>format("bold")}><Bold size={17}/></button><button title="Italic" onClick={()=>format("italic")}><Italic size={17}/></button><button title="Underline" onClick={()=>format("underline")}><Underline size={17}/></button><i/>
    <button title="Heading 1" onClick={()=>heading("h1")}><Heading1 size={18}/></button><button title="Heading 2" onClick={()=>heading("h2")}><Heading2 size={18}/></button><i/>
    <button title="Bulleted list" onClick={()=>format("insertUnorderedList")}><List size={18}/></button><button title="Numbered list" onClick={()=>format("insertOrderedList")}><ListOrdered size={18}/></button>
   </div><div className="paper"><div
  ref={editor}
  className="editable"
  contentEditable
  suppressContentEditableWarning
  onInput={e => queueSave({ content: e.currentTarget.innerHTML })}
  onBlur={() => {
    if (editor.current) {
      save({
        content: editor.current.innerHTML,
        title: active.title
      });
    }
  }}
/></div></div>
   {shareOpen&&<div className="share-panel"><div className="panel-title">Share document <button onClick={()=>setShareOpen(false)} className="icon-btn"><X size={16}/></button></div><p className="muted">Invite a teammate using a demo account email.</p><form onSubmit={share} className="share-form"><input type="email" required placeholder="name@ajaia.demo" value={shareEmail} onChange={e=>setShareEmail(e.target.value)}/><button className="primary-btn">Invite</button></form><div className="share-list"><strong>People with access</strong><div className="person-row"><span className="avatar">{active.owner?.name?.[0]}</span><div><b>{active.owner?.name} (you/owner)</b><small>{active.owner?.email}</small></div><span className="role">Owner</span></div>{active.shares?.map(s=><div className="person-row" key={s.id}><span className="avatar alt">{s.name[0]}</span><div><b>{s.name}</b><small>{s.email}</small></div><button className="remove-btn" onClick={()=>removeShare(s.id)}>Remove</button></div>)}</div><small className="muted">Demo access is available to Aarav and Meera accounts. Switch users from the top-right menu to verify sharing.</small></div>}
  </main> : <main className="dashboard">
   <section className="welcome"><div><div className="eyebrow">YOUR WORKSPACE</div><h1>Good work starts<br/>with a clear page.</h1><p>Create, organize, and share your team's thinking.</p></div><div className="welcome-art"><div className="art-card card-one"><div/><div/><div/></div><div className="art-card card-two"><span>✦</span><b>Ideas into action</b><small>One shared space.</small></div></div></section>
   <section className="doc-section"><div className="section-top"><div><h2>Your documents</h2><p className="muted">A home for the work that matters.</p></div><div className="actions"><label className="secondary-btn upload-btn"><Upload size={15}/> Import file<input ref={fileRef} type="file" accept=".txt,.md,text/plain,text/markdown" onChange={importFile} hidden/></label><button className="primary-btn" onClick={createDoc}><Plus size={16}/> New document</button></div></div>
    <div className="search-row"><Search size={17}/><input placeholder="Search documents..." value={query} onChange={e=>setQuery(e.target.value)}/></div>
    <div className="doc-grid">{visible.map(d=><button className="doc-card" key={d.id} onClick={()=>openDoc(d.id)}><div className="doc-card-top"><div className="file-icon"><FileText size={20}/></div><span className={`kind ${d.kind}`}>{d.kind==="owner"?"My document":"Shared with me"}</span></div><h3>{d.title}</h3><div className="doc-card-foot"><span><Clock3 size={13}/>{new Date(d.updated_at).toLocaleDateString()}</span><span>{d.kind==="owner"?"You":d.owner_name}</span></div></button>)}
    {!visible.length&&<div className="empty"><div className="empty-icon"><FileText size={23}/></div><h3>{query?"No matching documents":"Your workspace is ready"}</h3><p>{query?"Try another search term.":"Create your first document or import a text/Markdown file."}</p>{!query&&<button className="primary-btn" onClick={createDoc}><Plus size={15}/> Create a document</button>}</div>}</div>
   </section><footer className="dashboard-footer"><span><LockKeyhole size={13}/> Private workspace</span><span><Users size={13}/> Sharing with demo teammates</span></footer>
  </main>}
  {toast&&<div className="toast"><Check size={15}/>{toast}</div>}
 </div>
}
export default App;