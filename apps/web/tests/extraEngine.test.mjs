import test from 'node:test';
import assert from 'node:assert/strict';
import {executeExtra,extras} from '../src/extraEngine.ts';
test('all registered actions have valid input definitions',()=>{
 for(const [id,def] of Object.entries(extras)){
  assert.equal(Number(id),def.number);
  assert.equal(def.inputs.length,def.example.length);
 }
 assert.ok(Object.keys(extras).length>=85);
});
test('text tools',async()=>{
 assert.equal(await executeExtra(281,['one two three']), '3');
 assert.equal(await executeExtra(289,['Hello world']), 'hello_world');
 assert.equal(await executeExtra(293,['a\nb\na']), 'a\nb');
 assert.equal(await executeExtra(295,['abc abc','abc','x']), 'x x');
});
test('JSON and developer',async()=>{
 assert.equal(await executeExtra(302,['{"a":1}']),'Valid JSON');
 assert.equal(await executeExtra(303,['{ "a": 1 }']),'{"a":1}');
 assert.equal(await executeExtra(312,['Hello']),'SGVsbG8=');
 assert.equal(await executeExtra(313,['SGVsbG8=']),'Hello');
 assert.match(await executeExtra(325,['abc']),/^ba7816bf/);
 assert.match(await executeExtra(310,["id,name\n1,O'Brien",'items']),/O''Brien/);
});
test('cryptography roundtrips',async()=>{
 const token=await executeExtra(327,['private value','safe passphrase']);
 assert.equal(await executeExtra(328,[token,'safe passphrase']),'private value');
 const jwt=await executeExtra(330,['{"sub":"42"}','secret']);
 assert.match(await executeExtra(331,[jwt,'secret']),/^Valid HS256/);
 assert.match(await executeExtra(331,[jwt,'wrong']),/^INVALID/);
});
test('design and numeric tools',async()=>{
 assert.equal(await executeExtra(342,['#ff0000']), 'rgb(255, 0, 0)');
 assert.equal(await executeExtra(381,['200','15']),'30');
 assert.equal(await executeExtra(382,['100','20']),'Savings: 20\nFinal price: 80');
 assert.equal(await executeExtra(393,['0','C','F']),'32');
 assert.equal(await executeExtra(397,['1920','1080']),'16:9');
 assert.equal(await executeExtra(399,['7','7']),'7');
});