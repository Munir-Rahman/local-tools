import test from 'node:test';
import assert from 'node:assert/strict';
import {convertCalendar,toGregorianDate,daysBetweenGregorian} from '../src/calendarEngine.ts';

test('Afghan Solar Hijri new year: Gregorian 2024-03-20 is 1403-01-01',()=>{
  const x=convertCalendar('2024-03-20','gregorian');
  assert.equal(x.solarHijri,'1403-01-01');
  assert.equal(x.gregorian,'2024-03-20');
  assert.equal(x.weekday,'Wednesday');
});
test('Islamic civil calendar: 1445-09-01 equals Gregorian 2024-03-11',()=>{
  assert.equal(convertCalendar('1445-09-01','islamic-hijri').gregorian,'2024-03-11');
  assert.equal(convertCalendar('2024-03-11','gregorian').islamicHijri,'1445-09-01');
});
test('Gregorian / Afghan / civil Islamic round trips',()=>{
  for(const d of ['2020-02-29','2024-03-20','2026-10-30','2030-12-31','1999-01-01']){
    const x=convertCalendar(d,'gregorian');
    assert.equal(convertCalendar(x.solarHijri,'solar-hijri').gregorian,d);
    assert.equal(convertCalendar(x.islamicHijri,'islamic-hijri').gregorian,d);
  }
});
test('Invalid dates and ranges are rejected',()=>{
  assert.throws(()=>toGregorianDate('2023-02-29','gregorian'),/Invalid Gregorian/);
  assert.throws(()=>toGregorianDate('2026-13-01','gregorian'),/range/);
  assert.throws(()=>toGregorianDate('2026/10/30','gregorian'),/YYYY-MM-DD/);
  assert.throws(()=>toGregorianDate('1800-01-01','gregorian'),/1900/);
  assert.throws(()=>toGregorianDate('1403-13-01','solar-hijri'),/range/);
});
test('Civil day differences correctly cross leap day and years',()=>{
  assert.equal(daysBetweenGregorian('2024-02-28','2024-03-01'),2);
  assert.equal(daysBetweenGregorian('2026-12-31','2027-01-01'),1);
  assert.equal(daysBetweenGregorian('2027-01-01','2026-12-31'),-1);
});
