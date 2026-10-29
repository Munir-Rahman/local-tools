import {mkdirSync,copyFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../../..');
const src=resolve(root,'node_modules/@ffmpeg/core/dist/esm');
const dst=resolve(import.meta.dirname,'../public/ffmpeg');
mkdirSync(dst,{recursive:true});
for(const file of ['ffmpeg-core.js','ffmpeg-core.wasm']){
  const source=resolve(src,file);if(!existsSync(source))throw Error(`Missing ${source}; run npm install first.`);
  copyFileSync(source,resolve(dst,file));
}
console.log('Prepared Vite-compatible local FFmpeg ESM core assets (browser/WASM).');
