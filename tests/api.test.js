import test from "node:test";
import assert from "node:assert/strict";
process.env.NODE_ENV = "test";
const { app, db } = await import("../server.js");
import http from "node:http";

test("document ownership and shared access are enforced", async (t) => {
  const server=http.createServer(app);
  await new Promise(resolve=>server.listen(0,resolve));
  t.after(()=>{server.close();db.prepare("DELETE FROM shares").run();db.prepare("DELETE FROM documents WHERE title LIKE 'TEST-%'").run();});
  const base=`http://127.0.0.1:${server.address().port}`;
  const req=async (path,user,method="GET",body)=>fetch(base+path,{method,headers:{"x-user-id":user,"content-type":"application/json"},body:body?JSON.stringify(body):undefined});
  const created=await req("/api/documents","u_disha","POST",{title:"TEST-sharing",content:"hello"});
  assert.equal(created.status,201);
  const doc=await created.json();
  assert.equal((await req(`/api/documents/${doc.id}`,"u_aarav")).status,404);
  assert.equal((await req(`/api/documents/${doc.id}/share`,"u_disha","POST",{email:"aarav@ajaia.demo"})).status,200);
  assert.equal((await req(`/api/documents/${doc.id}`,"u_aarav")).status,200);
  assert.equal((await req(`/api/documents/${doc.id}/share`,"u_aarav","POST",{email:"meera@ajaia.demo"})).status,403);
});