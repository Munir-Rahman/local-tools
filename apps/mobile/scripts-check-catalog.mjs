import fs from 'node:fs';
import assert from 'node:assert/strict';
const path=new URL('./src/catalog.json',import.meta.url);
const list=JSON.parse(fs.readFileSync(path,'utf8'));
assert.equal(list.length,480);
assert.equal(new Set(list.map(x=>x.number)).size,480);
for(let n=1;n<=480;n++)assert.equal(list[n-1].number,n);
console.log('Mobile catalog verified:',list.length,'unique entries');
