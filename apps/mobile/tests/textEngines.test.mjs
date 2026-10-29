import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extendedText } from '../src/textEngines.ts';

test('JSON formatting and validation',()=>{assert.equal(extendedText('json-minify',' { "a": 1 } '),'{"a":1}');assert.throws(()=>extendedText('json-validate','{oops}'));});
test('case conversion and deduplication',()=>{assert.equal(extendedText('text-snake','Hello World'),'hello_world');assert.equal(extendedText('text-unique','a\nb\na'),'a\nb');});
test('HTML escaping safely transforms input',()=>assert.equal(extendedText('html-encode','<script>'), '&lt;script&gt;'));
test('numeric bases with large integers',()=>assert.match(extendedText('number-base','0xFF'),/Binary: 11111111/));
test('storage conversion distinguishes MB and MiB',()=>assert.match(extendedText('storage-convert','1048576'),/MiB \(1024²\): 1\.000/));
test('discount and negative input validation',()=>{assert.match(extendedText('discount-calc','100,25'),/Final: 75\.00/);assert.throws(()=>extendedText('discount-calc','100,200'));});
test('temperature and dates',()=>{assert.match(extendedText('temp-convert','32 F'),/Celsius: 0\.000/);assert.equal(extendedText('date-difference','2026-10-01,2026-10-29'),'Difference: 28 days');});
test('CSV escaping avoids formula execution on spreadsheet import',()=>{const result=extendedText('json-csv', '[{"name":"=1+1","age":20}]');assert.match(result,/\x27=1\+1/);});
test('binary text round trip ASCII',()=>assert.equal(extendedText('binary-to-text',extendedText('text-to-binary','ABC')),'ABC'));
