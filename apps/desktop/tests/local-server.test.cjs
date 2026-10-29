'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const os=require('node:os');const path=require('node:path');const {startServer}=require('../local-server.cjs');
test('desktop local-only static server serves web files with cross-origin isolation',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'toolnest-test-'));fs.writeFileSync(path.join(root,'index.html'),'<h1>ToolNest</h1>');fs.writeFileSync(path.join(root,'core.wasm'),'fake-wasm');
 const {server,url}=await startServer(root);
 try{
  const page=await fetch(url+'/');assert.equal(page.status,200);assert.match(await page.text(),/ToolNest/);assert.equal(page.headers.get('cross-origin-embedder-policy'),'require-corp');
  const wasm=await fetch(url+'/core.wasm');assert.equal(wasm.headers.get('content-type'),'application/wasm');
  const appRoute=await fetch(url+'/#tool/cv-builder');assert.equal(appRoute.status,200);
 }finally{server.close();fs.rmSync(root,{recursive:true,force:true})}
});

// The packaged desktop main entry must not rely on unbundled sibling modules.
test('desktop packaged entrypoint embeds static server',()=>{
 const main=fs.readFileSync(path.resolve(__dirname,'../main.cjs'),'utf8');
 assert.ok(!main.includes("require('./local-server')"));
 assert.match(main,/function startServer\(/);
});
