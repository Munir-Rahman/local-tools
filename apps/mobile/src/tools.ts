export type ToolKind = 'pdf'|'image'|'text'|'qr'|'template';
export type ToolId =
  | 'merge-pdf'|'split-pdf'|'extract-pages'|'rotate-pdf'|'number-pdf'|'watermark-pdf'|'images-to-pdf'|'pdf-info'
  | 'resize-image'|'compress-image'|'convert-image'|'rotate-image'|'flip-image'
  | 'json-format'|'word-count'|'text-case'|'text-clean'|'url-encode'|'uuid-generator'
  | 'qr-generator'|'cv-builder'|'invoice-builder';
export type MobileTool = {id:ToolId;name:string;subtitle:string;kind:ToolKind;icon:string;catalog?:number;popular?:boolean;color:string};
export const tools:MobileTool[] = [
  {id:'merge-pdf',name:'Merge PDF',subtitle:'Combine PDF documents',kind:'pdf',icon:'documents-outline',catalog:1,popular:true,color:'#EF5660'},
  {id:'split-pdf',name:'Split PDF',subtitle:'One PDF per page in ZIP',kind:'pdf',icon:'git-branch-outline',catalog:3,color:'#EF5660'},
  {id:'extract-pages',name:'Extract pages',subtitle:'Keep selected PDF pages',kind:'pdf',icon:'cut-outline',catalog:9,color:'#EF5660'},
  {id:'rotate-pdf',name:'Rotate PDF',subtitle:'Turn all PDF pages',kind:'pdf',icon:'refresh-outline',catalog:15,popular:true,color:'#EF5660'},
  {id:'number-pdf',name:'Number pages',subtitle:'Add a page-number footer',kind:'pdf',icon:'list-outline',catalog:34,color:'#EF5660'},
  {id:'watermark-pdf',name:'Watermark PDF',subtitle:'Stamp text across pages',kind:'pdf',icon:'water-outline',catalog:32,color:'#EF5660'},
  {id:'images-to-pdf',name:'Images to PDF',subtitle:'JPG and PNG into one PDF',kind:'pdf',icon:'images-outline',catalog:79,popular:true,color:'#EF5660'},
  {id:'pdf-info',name:'PDF information',subtitle:'Read PDF page details',kind:'pdf',icon:'information-circle-outline',color:'#EF5660'},
  {id:'resize-image',name:'Resize image',subtitle:'Maintain original proportions',kind:'image',icon:'resize-outline',catalog:161,popular:true,color:'#2595CF'},
  {id:'compress-image',name:'Compress image',subtitle:'Re-encode as smaller JPEG',kind:'image',icon:'contract-outline',catalog:166,color:'#2595CF'},
  {id:'convert-image',name:'Image to JPG / PNG',subtitle:'Switch image file format',kind:'image',icon:'swap-horizontal-outline',catalog:142,color:'#2595CF'},
  {id:'rotate-image',name:'Rotate image',subtitle:'Turn the photo 90 degrees',kind:'image',icon:'reload-outline',catalog:163,color:'#2595CF'},
  {id:'flip-image',name:'Flip image',subtitle:'Mirror horizontally',kind:'image',icon:'copy-outline',catalog:164,color:'#2595CF'},
  {id:'json-format',name:'JSON formatter',subtitle:'Format and validate JSON',kind:'text',icon:'code-slash-outline',catalog:301,popular:true,color:'#9162DB'},
  {id:'word-count',name:'Word counter',subtitle:'Words, characters and lines',kind:'text',icon:'text-outline',catalog:281,color:'#9162DB'},
  {id:'text-case',name:'Text case',subtitle:'UPPERCASE or lowercase',kind:'text',icon:'language-outline',catalog:285,color:'#9162DB'},
  {id:'text-clean',name:'Clean whitespace',subtitle:'Trim and normalize spaces',kind:'text',icon:'sparkles-outline',catalog:291,color:'#9162DB'},
  {id:'url-encode',name:'URL encoder',subtitle:'Encode or decode URI text',kind:'text',icon:'link-outline',catalog:314,color:'#9162DB'},
  {id:'uuid-generator',name:'UUID generator',subtitle:'Create a unique identifier',kind:'text',icon:'key-outline',catalog:321,color:'#9162DB'},
  {id:'qr-generator',name:'QR generator',subtitle:'Create and export SVG QR',kind:'qr',icon:'qr-code-outline',catalog:201,popular:true,color:'#19A886'},
  {id:'cv-builder',name:'CV & Resume',subtitle:'Design and export a PDF CV',kind:'template',icon:'person-outline',catalog:433,popular:true,color:'#D18A32'},
  {id:'invoice-builder',name:'Invoice maker',subtitle:'Create a printable invoice',kind:'template',icon:'receipt-outline',catalog:421,color:'#D18A32'}
];
export const byId = (id:string): MobileTool|undefined => tools.find(tool=>tool.id===id);
export const categories=[{id:'all',label:'All',icon:'apps-outline'},{id:'pdf',label:'PDF',icon:'document-text-outline'},{id:'image',label:'Images',icon:'images-outline'},{id:'text',label:'Text & Dev',icon:'code-outline'},{id:'qr',label:'QR',icon:'qr-code-outline'},{id:'template',label:'Templates',icon:'create-outline'}] as const;
