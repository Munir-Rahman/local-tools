'use strict';
const {app,BrowserWindow,shell,session,dialog}=require('electron');
const path=require('node:path');const fs=require('node:fs');const http=require('node:http');
// Self-contained packaged entrypoint: electron-builder can omit sibling workspace files.
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
let server;
const offlineRoot=()=>app.isPackaged?path.join(process.resourcesPath,'web-dist'):path.resolve(__dirname,'../web/dist');
app.whenReady().then(async()=>{
  const dir=offlineRoot();if(!fs.existsSync(path.join(dir,'index.html'))){throw Error('Build the web app first: npm run build');}
  const local=await startServer(dir);server=local.server;
  const mainWindow=new BrowserWindow({width:1440,height:960,minWidth:880,minHeight:600,show:false,title:'ToolNest — Free Private Tools',backgroundColor:'#fffaf5',autoHideMenuBar:true,
    icon:path.join(__dirname,'assets/icon.png'),webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true,webSecurity:true}});
  const localOrigin=local.url;
  // Never navigate app to arbitrary remote URLs.
  mainWindow.webContents.on('will-navigate',(event,url)=>{if(!url.startsWith(localOrigin+'/'))event.preventDefault()});
  mainWindow.webContents.setWindowOpenHandler(({url})=>{if(url.startsWith('https://'))void shell.openExternal(url);return {action:'deny'}});
  // Desktop has no AdSense integration. Third-party advertising may require a separate approved provider.
  session.defaultSession.webRequest.onBeforeRequest({urls:['*://pagead2.googlesyndication.com/*','*://googleads.g.doubleclick.net/*']},(details,callback)=>callback({cancel:true}));
  // Register before loading: ready-to-show can fire while loadURL is pending.
  mainWindow.once('ready-to-show',()=>{if(!mainWindow.isDestroyed())mainWindow.show();});
  await mainWindow.loadURL(`${local.url}/?desktop=1#dashboard`);
  // Fallback if the ready-to-show event was suppressed on a Windows GPU/driver.
  if(!mainWindow.isDestroyed()&&!mainWindow.isVisible())mainWindow.show();
}).catch(error=>{dialog.showErrorBox('ToolNest could not start',`The local application could not open. ${String(error)}\nPlease reinstall the latest ToolNest setup.`);app.quit();});
app.on('window-all-closed',()=>{if(server)server.close();if(process.platform!=='darwin')app.quit()});
