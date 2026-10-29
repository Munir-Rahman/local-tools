import {test} from 'node:test';
import assert from 'node:assert/strict';
import {unitConversions,convertUnit,unitFamilies} from '../src/unitConversions.ts';
test('1000+ real, unique conversion pairs with valid factors',()=>{
 assert.ok(unitConversions.length>=1000, 'must have at least 1000 conversion pairs');
 assert.equal(new Set(unitConversions.map(x=>x.id)).size,unitConversions.length);
 for(const f of unitFamilies)for(const u of f.units)assert.ok(Number.isFinite(u.factor)&&u.factor>0);
 for(const x of unitConversions)assert.ok(Number.isFinite(convertUnit(x.id,1)));
});
test('known length, storage, area, mass, pressure and temperature examples',()=>{
 const near=(a,b)=>assert.ok(Math.abs(a-b)<=Math.max(1e-8,Math.abs(b)*1e-10),`${a} vs ${b}`);
 near(convertUnit('unit-length-km-mi',1),0.621371192237334);
 near(convertUnit('unit-storage-GiB-MB',1),1073.741824);
 near(convertUnit('unit-mass-lb-kg',1),0.45359237);
 near(convertUnit('unit-area-acre-m2',1),4046.8564224);
 near(convertUnit('unit-pressure-atm-pa',1),101325);
 near(convertUnit('unit-temperature-f-c',32),0);
 near(convertUnit('unit-temperature-c-k',0),273.15);
 assert.throws(()=>convertUnit('unit-temperature-k-c',-1),/absolute zero/);
});
test('round trips are numerically stable',()=>{
 for(const item of unitConversions){
  const reciprocal=`unit-${item.family.code}-${item.to.code}-${item.from.code}`;
  const input=1.23456;
  const output=convertUnit(reciprocal,convertUnit(item.id,input));
  assert.ok(Math.abs(output-input)<1e-7,`${item.id}: ${output}`);
 }
});
