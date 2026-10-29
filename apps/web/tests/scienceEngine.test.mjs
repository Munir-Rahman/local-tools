import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateScience,scienceTools} from '../src/scienceEngine.ts';

test('34 scientific tools have unique IDs and aligned input examples',()=>{
 assert.equal(scienceTools.length,34);
 assert.equal(new Set(scienceTools.map(s=>s.id)).size,scienceTools.length);
 for(const s of scienceTools)assert.equal(s.fields.length,s.samples.length,s.id);
});
test('binary hex octal conversion supports huge integers',()=>{
 assert.match(calculateScience('base-converter',['11111111','2','16']), /FF \(base 16\)/);
 assert.match(calculateScience('base-converter',['FF','16','10']),/255 \(base 10\)/);
 assert.throws(()=>calculateScience('base-converter',['102','2','10']),/Invalid digit/);
});
test('bits bytes units use binary and decimal multipliers',()=>{
 assert.match(calculateScience('bits-bytes',['1','GiB','MiB']),/1,024 MiB/);
 assert.match(calculateScience('data-transfer',['125','100']),/10 seconds/);
});
test('Ohms law and parallel resistors',()=>{
 assert.match(calculateScience('ohms-law',['12','2']),/6 Ω/);
 assert.match(calculateScience('resistors-parallel',['100,100']),/50 Ω/);
 assert.throws(()=>calculateScience('ohms-law',['12','0']),/greater than zero/);
});
test('physics and chemistry formulas',()=>{
 assert.match(calculateScience('force',['4','9.81']),/39.24 N/);
 assert.match(calculateScience('kinetic-energy',['2','3']),/9 J/);
 assert.match(calculateScience('ph',['0.00001']),/5 pH/);
 assert.match(calculateScience('molarity',['2','4']),/0.5 mol\/L/);
});