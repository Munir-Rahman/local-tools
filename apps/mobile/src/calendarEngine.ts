/** Offline three-calendar converter. Hijri uses the tabular islamic-civil
 * calendar, not observational crescent announcements. This choice is exposed
 * to users because civil Hijri dates may differ by one or more days locally.
 */
export type CalendarSystem = 'gregorian'|'solar-hijri'|'islamic-hijri';
export const calendarLabels:Record<CalendarSystem,string>={
  'gregorian':'Gregorian',
  'solar-hijri':'Solar Hijri (Afghan/Shamsi)',
  'islamic-hijri':'Islamic Hijri (civil calculation)'
};
export type CalendarParts={year:number;month:number;day:number};
export type CalendarConversion={gregorian:string;solarHijri:string;islamicHijri:string;weekday:string;iso:string};

const DAY_MS=86400000;
const START=Date.UTC(1900,0,1,12);
const END=Date.UTC(2100,11,31,12);
const formatters=new Map<string,Intl.DateTimeFormat>();
function formatter(system:CalendarSystem):Intl.DateTimeFormat{
  const calendar=system==='solar-hijri'?'persian':system==='islamic-hijri'?'islamic-civil':'gregory';
  let result=formatters.get(calendar);
  if(!result){
    result=new Intl.DateTimeFormat('en-US-u-ca-'+calendar+'-nu-latn',{
      year:'numeric',month:'numeric',day:'numeric',timeZone:'UTC'
    });
    if(result.resolvedOptions().calendar!==calendar){
      throw Error('This device does not support the '+calendar+' calendar.');
    }
    formatters.set(calendar,result);
  }
  return result;
}
function parts(date:Date,system:CalendarSystem):CalendarParts{
  if(system==='gregorian')return {year:date.getUTCFullYear(),month:date.getUTCMonth()+1,day:date.getUTCDate()};
  const p=formatter(system).formatToParts(date);
  const number=(type:string)=>{
    const value=p.find(x=>x.type===type)?.value;
    if(!value || !/^[0-9]+$/.test(value))throw Error('Calendar data is not available for '+system+'.');
    return Number(value);
  };
  return {year:number('year'),month:number('month'),day:number('day')};
}
function compare(a:CalendarParts,b:CalendarParts){
  return a.year-b.year || a.month-b.month || a.day-b.day;
}
function pad(n:number){return String(n).padStart(2,'0');}
function iso(p:CalendarParts){return String(p.year).padStart(4,'0')+'-'+pad(p.month)+'-'+pad(p.day);}
function parsed(input:string):CalendarParts{
  const match=/^\s*(\d{4})-(\d{1,2})-(\d{1,2})\s*$/.exec(input);
  if(!match)throw Error('Enter a date as YYYY-MM-DD.');
  const p={year:Number(match[1]),month:Number(match[2]),day:Number(match[3])};
  if(p.month<1||p.month>12||p.day<1||p.day>31)throw Error('Month or day is outside the valid range.');
  return p;
}
export function toGregorianDate(input:string,from:CalendarSystem):Date{
  const requested=parsed(input);
  if(from==='gregorian'){
    if(requested.year<1900||requested.year>2100)throw Error('Supported Gregorian dates: 1900–2100.');
    const time=Date.UTC(requested.year,requested.month-1,requested.day,12);
    const d=new Date(time);
    if(compare(parts(d,'gregorian'),requested)!==0)throw Error('Invalid Gregorian date.');
    return d;
  }
  // Binary-search the supported day range. Formatters use UTC to avoid
  // accidental changes when the local device timezone crosses midnight.
  let lo=0,hi=Math.floor((END-START)/DAY_MS);
  while(lo<=hi){
    const mid=Math.floor((lo+hi)/2);
    const date=new Date(START+mid*DAY_MS);
    const diff=compare(parts(date,from),requested);
    if(diff===0)return date;
    if(diff<0)lo=mid+1;else hi=mid-1;
  }
  throw Error('Invalid date or outside the supported Gregorian range (1900–2100).');
}
export function convertCalendar(input:string,from:CalendarSystem):CalendarConversion{
  const date=toGregorianDate(input,from);
  const g=parts(date,'gregorian'),s=parts(date,'solar-hijri'),h=parts(date,'islamic-hijri');
  return {gregorian:iso(g),solarHijri:iso(s),islamicHijri:iso(h),
    weekday:new Intl.DateTimeFormat('en-US',{weekday:'long',timeZone:'UTC'}).format(date),
    iso:iso(g)};
}
export function daysBetweenGregorian(start:string,end:string):number{
  const a=toGregorianDate(start,'gregorian'),b=toGregorianDate(end,'gregorian');
  return Math.round((b.getTime()-a.getTime())/DAY_MS);
}
