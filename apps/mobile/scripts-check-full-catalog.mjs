// The 5,000-entry roadmap must travel with apps/mobile in no-Git EAS archives.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'src','catalog');
const entries=[];
for(let i=0;i<20;i++){
  const file=path.join(root,'chunk-'+String(i).padStart(2,'0')+'.json');
  assert.ok(fs.existsSync(file),'Mobile catalog missing from EAS archive: '+file);
  const chunk=JSON.parse(fs.readFileSync(file,'utf8'));
  assert.ok(Array.isArray(chunk)&&chunk.length===250,'Expected 250 entries in '+file);
  entries.push(...chunk);
}
assert.equal(entries.length,5000);
assert.equal(new Set(entries.map(x=>x.number)).size,5000);
for(let n=0;n<5000;n++)assert.equal(entries[n].number,n+1);
const source=fs.readFileSync(path.resolve(import.meta.dirname,'src','masterCatalog.ts'),'utf8');
assert.ok(!source.includes('packages/catalog/'),'All mobile catalogs must be inside apps/mobile');
console.log('Verified 5000 numbered mobile-local roadmap entries; no missing EAS catalog imports.');
