'use strict';

/**
 * Public, same-origin direct download endpoint for ToolNest's published
 * preview release assets. No GitHub web page is ever opened.
 *
 * GET /api/download                 -> available platform flags as JSON
 * GET /api/download?platform=android -> HTTP 302 to signed preview APK asset
 * GET /api/download?platform=windows -> HTTP 302 to unsigned NSIS EXE
 *
 * Release artifacts are served by GitHub's release CDN. Do not proxy large
 * binaries through Vercel functions: function response size limits apply.
 */
const OWNER='Munir-Rahman';
const REPO='local-tools';
const TAG='downloads-preview';
const API_URL='https://api.github.com/repos/'+OWNER+'/'+REPO+'/releases/tags/'+TAG;
const EXTENSIONS=Object.freeze({
  android:'ToolNest-Android-Preview.apk',
  windows:'ToolNest-Windows-Setup.exe',
  macos:'ToolNest-macOS-Preview.dmg',
  linux:'ToolNest-Linux-Preview.AppImage',
});
const PLATFORM_KEYS=Object.keys(EXTENSIONS);
function findAsset(release,platform) {
  const filename=EXTENSIONS[platform];
  if(!filename||!Array.isArray(release?.assets))return null;
  const asset=release.assets.find(a=>a.name===filename);
  // Only allow the expected asset in the expected public repo and tag.
  const url=asset?.browser_download_url;
  const prefix='https://github.com/'+OWNER+'/'+REPO+'/releases/download/'+TAG+'/';
  if(typeof url!=='string'||!url.startsWith(prefix))return null;
  if(new URL(url).pathname.split('/').pop()!==filename)return null;
  if(!(asset.size>0))return null;
  return asset;
}
function json(res,status,data) {
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}
async function handler(req,res) {
  res.setHeader('Cache-Control','public, s-maxage=60, stale-while-revalidate=300');
  if(req.method&&req.method!=='GET'&&req.method!=='HEAD'){
    res.setHeader('Allow','GET, HEAD');
    return json(res,405,{error:'Method not allowed'});
  }
  const platform=(typeof req.query?.platform==='string'?req.query.platform:'').toLowerCase();
  if(platform&&!Object.prototype.hasOwnProperty.call(EXTENSIONS,platform)){
    return json(res,400,{error:'Unsupported platform'});
  }
  let release;
  try {
    const upstream=await fetch(API_URL,{
      headers:{'Accept':'application/vnd.github+json','User-Agent':'ToolNest-Downloads','X-GitHub-Api-Version':'2022-11-28'},
      signal:AbortSignal.timeout(7000)
    });
    if(upstream.status===404)release={assets:[]};
    else if(upstream.ok)release=await upstream.json();
    else throw Error('Release status unavailable ('+upstream.status+')');
  } catch {
    return json(res,503,{error:'Installer release status temporarily unavailable'});
  }
  if(!platform){
    const available=Object.fromEntries(PLATFORM_KEYS.map(name=>{
      const asset=findAsset(release,name);
      return [name,{available:!!asset,size:asset?.size||null}];
    }));
    return json(res,200,{release:TAG,preview:true,platforms:available,ios:{available:false,reason:'No signed App Store or TestFlight iOS release yet'}});
  }
  const asset=findAsset(release,platform);
  if(!asset){
    return json(res,404,{error:'The '+platform+' installer has not been published yet'});
  }
  // GitHub's browser_download_url sets attachment headers and downloads the
  // exact file. No browsing an Actions page or sign-in required.
  res.statusCode=302;
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Location',asset.browser_download_url);
  res.end();
}
module.exports=handler;
module.exports.findAsset=findAsset;
module.exports.EXTENSIONS=EXTENSIONS;
