'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
test('Electron registers ready-to-show before loading the local React app',()=>{
  const code=fs.readFileSync(path.resolve(__dirname,'../main.cjs'),'utf8');
  const registration=code.indexOf("mainWindow.once('ready-to-show'");
  const loading=code.indexOf("await mainWindow.loadURL");
  assert.ok(registration>=0,'missing ready-to-show handler');
  assert.ok(loading>registration,'ready-to-show must be registered before loadURL');
  assert.match(code,/!mainWindow\.isVisible\(\)/);
});
