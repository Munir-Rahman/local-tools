import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeDocumentName,pickerMimeType,EXTENSIONS_BY_MIME} from '../src/pickerUtils.ts';

test('Android images with extensionless names retain a usable JPEG/PNG extension',()=>{
  assert.equal(normalizeDocumentName('image 4377','image/jpeg'),'image 4377.jpg');
  assert.equal(normalizeDocumentName('image 4377','image/png'),'image 4377.png');
  assert.equal(normalizeDocumentName('  image 4377  ','IMAGE/JPEG; charset=utf-8'),'image 4377.jpg');
});
test('PDF and ZIP documents with extensionless provider filenames are recognized',()=>{
  assert.equal(normalizeDocumentName('My CV','application/pdf'),'My CV.pdf');
  assert.equal(normalizeDocumentName('archive','application/zip'),'archive.zip');
  assert.equal(normalizeDocumentName('','application/pdf'),'document.pdf');
});
test('Existing extensions are retained and dangerous path characters removed',()=>{
  assert.equal(normalizeDocumentName('photo.JPEG','image/png'),'photo.JPEG');
  assert.equal(normalizeDocumentName('folder/subfolder\\\\cv','application/pdf'),'folder_subfolder_cv.pdf');
  assert.equal(normalizeDocumentName('    '),'document');
});
test('Images-to-PDF selects only supported JPEG and PNG image MIME types',()=>{
  assert.deepEqual(pickerMimeType('images-to-pdf','pdf'),['image/jpeg','image/png']);
  assert.equal(pickerMimeType('resize-image','image'),'image/*');
  assert.equal(pickerMimeType('merge-pdf','pdf'),'application/pdf');
  assert.equal(pickerMimeType('file-info','file'),'*/*');
  assert.equal(pickerMimeType('merge-pdf','pdf',true),'*/*');
});
test('All mapped MIME types provide usable extensions',()=>{
  for(const [mime,extension] of Object.entries(EXTENSIONS_BY_MIME)){
    assert.ok(mime.includes('/'));
    assert.match(normalizeDocumentName('example',mime),new RegExp('\\\\.'+extension+'$'));
  }
});
test('Regression guards for repeated Android READ permission failures',()=>{
  const engine=readFileSync(new URL('../src/engine.ts',import.meta.url),'utf8');
  const app=readFileSync(new URL('../App.tsx',import.meta.url),'utf8');
  const templates=readFileSync(new URL('../src/templates.ts',import.meta.url),'utf8');
  assert.match(engine,/copyToCacheDirectory:true/);
  assert.doesNotMatch(engine,/await new File\\(uri\\)\\.copy\\(/);
  assert.doesNotMatch(templates,/await new File\\(uri\\)\\.copy\\(/);
  assert.match(app,/normalizeDocumentName\\(asset.name,asset.mimeType\\)/);
  assert.match(app,/copyToCacheDirectory:true/);
});
