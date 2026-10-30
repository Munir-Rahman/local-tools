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
