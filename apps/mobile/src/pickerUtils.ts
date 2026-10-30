/**
 * Pure Android/iOS document-picker helpers.
 * Never infer native storage permissions from a file extension.
 */
export const EXTENSIONS_BY_MIME: Readonly<Record<string,string>> = Object.freeze({
  'image/jpeg':'jpg','image/png':'png','image/webp':'webp',
  'image/heic':'heic','image/heif':'heif',
  'application/pdf':'pdf','application/zip':'zip',
  'application/x-zip-compressed':'zip',
});
export function pickerMimeType(toolId:string,kind:string,allFiles=false):string|string[]{
  if(allFiles)return '*/*';
  if(toolId==='images-to-pdf')return ['image/jpeg','image/png'];
  if(kind==='image')return 'image/*';
  if(kind==='file')return '*/*';
  return 'application/pdf';
}
export function normalizeDocumentName(name:string|undefined,mimeType?:string|null):string{
  const clean=(name||'').replace(/[\\/\u0000-\u001f\u007f]+/g,'_').trim()||'document';
  if(/\.[A-Za-z0-9]{1,12}$/.test(clean))return clean;
  const mime=mimeType?.toLowerCase().split(';',1)[0].trim()||'';
  const extension=EXTENSIONS_BY_MIME[mime];
  return extension?clean+'.'+extension:clean;
}

/** Detect a file type from only its first 16 bytes if a provider omits MIME/name. */
export function extensionFromHeader(header:Uint8Array):string|undefined{
  const has=(...numbers:number[])=>numbers.every((v,i)=>header[i]===v);
  if(has(0x25,0x50,0x44,0x46,0x2d))return 'pdf';
  if(has(0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a))return 'png';
  if(has(0xff,0xd8,0xff))return 'jpg';
  if(has(0x50,0x4b,0x03,0x04))return 'zip';
  const ascii=(from:number,to:number)=>String.fromCharCode(...header.slice(from,to));
  if(header.length>=12&&ascii(0,4)==='RIFF'&&ascii(8,12)==='WEBP')return 'webp';
  if(header.length>=12&&ascii(4,8)==='ftyp'&&/^(heic|heix|hevc|mif1)/.test(ascii(8,12)))return 'heic';
  return undefined;
}
