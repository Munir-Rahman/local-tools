'use strict';
const http=require('node:http');const fs=require('node:fs');const path=require('node:path');
const MIME={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif','.ico':'image/x-icon','.wasm':'application/wasm','.pdf':'application/pdf','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf'};
function startServer(dir){
 const root=fs.realpathSync(dir);
 const server=http.createServer((req,res)=>{
   try{
     const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
     if(pathname.includes('\0')){res.writeHead(400).end();return;}
     const full=path.resolve(root,'.'+path.posix.normalize('/'+pathname));
     if(!(full===root||full.startsWith(root+path.sep))){res.writeHead(403).end();return;}
     let target=full;
     if(!fs.existsSync(target)||fs.statSync(target).isDirectory())target=path.join(root,'index.html');
     const type=MIME[path.extname(target)]||'application/octet-stream';
     res.writeHead(200,{'Content-Type':type,'Cache-Control':type.startsWith('text/html')?'no-store':'public,max-age=3600','Cross-Origin-Opener-Policy':'same-origin','Cross-Origin-Embedder-Policy':'require-corp','Cross-Origin-Resource-Policy':'same-origin','X-Content-Type-Options':'nosniff'});
     if(req.method==='HEAD'){res.end();return;}fs.createReadStream(target).pipe(res);
   }catch(e){res.writeHead(500,{'Content-Type':'text/plain'}).end('Unable to read local app asset');}
 });
 return new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>resolve({server,url:`http://127.0.0.1:${server.address().port}`}))});
}
module.exports={startServer};
