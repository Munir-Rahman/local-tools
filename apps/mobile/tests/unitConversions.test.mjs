import test from 'node:test';
import assert from 'node:assert/strict';
import {unitConversions,convertUnit,unitFamilies} from '../src/unitConversions.ts';
test('200+ distinct, computable offline conversion routes',()=>{assert.ok(unitConversions.length>=200);assert.equal(new Set(unitConversions.map(x=>x.id)).size,unitConversions.length);for(const c of unitConversions) assert.ok(Number.isFinite(convertUnit(c.id,1)));});
test('conversion factor examples and reciprocal consistency',()=>{
 const eq=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1e-8,Math.abs(b)*1e-9),`${a} != ${b}`);
 eq(convertUnit('unit-length-km-m',1),1000);
 eq(convertUnit('unit-storage-GiB-MB',1),1073.741824);
 eq(convertUnit('unit-temperature-f-c',32),0);
 eq(convertUnit('unit-temperature-c-k',0),273.15);
 for(const c of unitConversions){const x=convertUnit(c.id,1);eq(convertUnit(`unit-${c.family.code}-${c.to.code}-${c.from.code}`,x),1);}
 assert.throws(()=>convertUnit('unit-temperature-k-c',-2),/absolute zero/);
 for(const f of unitFamilies) for(const u of f.units) assert.ok(u.factor>0&&Number.isFinite(u.factor));
});
