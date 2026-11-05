import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const handler=require('../../../api/download.js');
const base='https://github.com/Munir-Rahman/local-tools/releases/download/downloads-preview/';
const fixture={assets:[
  {name:'ToolNest-Android-Preview.apk',browser_download_url:base+'ToolNest-Android-Preview.apk',size:35_000_000},
  {name:'ToolNest-Windows-Setup.exe',browser_download_url:base+'ToolNest-Windows-Setup.exe',size:55_000_000},
  {name:'ToolNest-macOS-Preview.dmg',browser_download_url:'https://bad.invalid/malware.dmg',size:53_000_000}
]};
function response(){
  const headers={};
  return {statusCode:200,headers,body:null,
    setHeader(name,value){headers[name.toLowerCase()]=value},
    end(value){this.body=value||''}
  };
}
async function withRelease(release,fn,status=200){
 const original=globalThis.fetch;
 globalThis.fetch=async()=>new Response(JSON.stringify(release),{status,headers:{'Content-Type':'application/json'}});
 try{return await fn()}finally{globalThis.fetch=original}
}
test('public download manifest only reports validated nonempty platform assets',async()=>{
 const res=response();
 await withRelease(fixture,()=>handler({method:'GET',query:{}},res));
 const value=JSON.parse(res.body);
 assert.equal(res.statusCode,200);
 assert.equal(value.platforms.android.available,true);
 assert.equal(value.platforms.windows.available,true);
 assert.equal(value.platforms.macos.available,false);
 assert.equal(value.platforms.linux.available,false);
 assert.equal(value.ios.available,false);
});
test('clicking Android or Windows direct endpoint redirects to a binary, not a GitHub web page',async()=>{
 for(const [id,filename] of [['android','ToolNest-Android-Preview.apk'],['windows','ToolNest-Windows-Setup.exe']]){
  const res=response();
  await withRelease(fixture,()=>handler({method:'GET',query:{platform:id}},res));
  assert.equal(res.statusCode,302);
  assert.equal(res.headers.location,base+filename);
  assert.equal(res.headers['cache-control'],'no-store');
 }
});
test('unpublished and untrusted assets never produce a fake download',async()=>{
 const res=response();
 await withRelease(fixture,()=>handler({method:'GET',query:{platform:'macos'}},res));
 assert.equal(res.statusCode,404);
 assert.equal(res.headers.location,undefined);
});
test('unsupported platforms and missing release use explicit status',async()=>{
 const bad=response();
 await handler({method:'GET',query:{platform:'ios'}},bad);
 assert.equal(bad.statusCode,400);
 const missing=response();
 await withRelease({},()=>handler({method:'GET',query:{platform:'android'}},missing),404);
 assert.equal(missing.statusCode,404);
});
test('installer links and download page exist in React and workbox bypasses download API',()=>{
 const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
 const head=readFileSync(new URL('../src/ToolNestHeader.tsx',import.meta.url),'utf8');
 const site=readFileSync(new URL('../src/DownloadApps.tsx',import.meta.url),'utf8');
 const vite=readFileSync(new URL('../vite.config.ts',import.meta.url),'utf8');
 assert.match(app,/\(page==='dashboard'\|\|page==='downloads'\)\?<>/);
 assert.match(app,/<div id="tn-downloads" className="tn-home-downloads"><DownloadApps\/><\/div>/);
 assert.doesNotMatch(app,/page==='downloads'\?<DownloadApps\/>/);
 assert.equal((app.match(/<DownloadApps\/>/g)||[]).length,1);
 assert.ok(app.indexOf('id="tn-downloads"')>app.indexOf('Explore roadmap <ArrowRight'),'download section must follow the original tool list and roadmap');
 assert.match(app,/scrollIntoView\(\{behavior:'smooth',block:'start'\}\)/);
 assert.match(app,/\['downloads','dashboard','all'/);
 assert.doesNotMatch(app,/<DownloadApps compact\/>/);
 assert.match(head,/onPage\('downloads'\)/);
 assert.match(site,/href=\{url\(platform\.id\)\}/);
 assert.match(vite,/navigateFallbackDenylist/);
});
