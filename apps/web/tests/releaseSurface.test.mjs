import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(path)=>readFileSync(new URL(path,import.meta.url),'utf8');
test('six working calendar routes are included in ToolNest web tool directory',()=>{
  const app=read('../src/App.tsx'),tools=read('../src/CalendarWorkbench.tsx');
  assert.match(app,/calendarToolDefs\.map/);
  for(const id of ['calendar-gregorian','calendar-solar-hijri','calendar-islamic-hijri','calendar-days-between','calendar-add-days','calendar-age']){
    assert.ok(tools.includes(id),id+' must be discoverable');
  }
});
test('account menu uses separate icons rather than one user icon for all links',()=>{
  const h=read('../src/ToolNestHeader.tsx');
  for(const name of ['personal:UserRound','favorites:Heart','recent:Clock3','settings:Palette','about:Info','contact:Mail','faq:CircleHelp']){
    assert.ok(h.includes(name),name);
  }
  assert.match(h,/const Icon=accountIcons\[p\]/);
});
test('footer includes contact, calendar links, privacy and clear catalog qualification',()=>{
  const a=read('../src/App.tsx');
  assert.match(a,/className="v7-footer tn-footer no-print"/);
  assert.match(a,/calendar-solar-hijri/);
  assert.match(a,/5,000 catalog ideas \(not all implemented\)/);
  assert.match(a,/mailto:munirrahmanrahmani0@gmail.com/);
});
test('desktop AdSense remains disabled in web ad component',()=>{
  const ad=read('../src/AdSlot.tsx');
  assert.match(ad,/has\('desktop'\)/);
  assert.match(ad,/location\.protocol==='https:'/);
});
