'use strict';
const {app,BrowserWindow,shell,session}=require('electron');
const path=require('node:path');const fs=require('node:fs');const {startServer}=require('./local-server');
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
  await mainWindow.loadURL(`${local.url}/?desktop=1#dashboard`);
  mainWindow.once('ready-to-show',()=>mainWindow.show());
});
app.on('window-all-closed',()=>{if(server)server.close();if(process.platform!=='darwin')app.quit()});
