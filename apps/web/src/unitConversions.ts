/** Dimensionally valid, local-only unit conversions. This collection provides independently selectable conversion pairs. */
export type Unit={code:string;label:string;factor:number};
export type UnitFamily={code:string;name:string;units:Unit[]};
const U=(code:string,label:string,factor:number):Unit=>({code,label,factor});
export const unitFamilies:UnitFamily[]=[
 {code:'length',name:'Length',units:[U('mm','Millimeter',.001),U('cm','Centimeter',.01),U('dm','Decimeter',.1),U('m','Meter',1),U('km','Kilometer',1000),U('um','Micrometer',1e-6),U('nm','Nanometer',1e-9),U('in','Inch',.0254),U('ft','Foot',.3048),U('yd','Yard',.9144),U('mi','Mile',1609.344),U('nmi','Nautical mile',1852),U('mil','Thou (mil)',.0000254),U('fathom','Fathom',1.8288),U('chain','Survey chain',20.1168),U('furlong','Furlong',201.168),U('angstrom','Ångström',1e-10),U('au','Astronomical unit',149597870700)]},
 {code:'mass',name:'Mass',units:[U('mg','Milligram',.000001),U('g','Gram',.001),U('kg','Kilogram',1),U('tonne','Metric tonne',1000),U('ug','Microgram',1e-9),U('oz','Ounce',.028349523125),U('lb','Pound',.45359237),U('stone','Stone',6.35029318),U('tonus','US short ton',907.18474),U('tonuk','UK long ton',1016.0469088),U('grain','Grain',.00006479891),U('carat','Carat',.0002),U('slug','Slug',14.5939029372),U('dram','Avoirdupois dram',.0017718451953125)]},
 {code:'area',name:'Area',units:[U('mm2','Square millimeter',1e-6),U('cm2','Square centimeter',1e-4),U('m2','Square meter',1),U('km2','Square kilometer',1e6),U('ha','Hectare',10000),U('are','Are',100),U('acre','Acre',4046.8564224),U('in2','Square inch',.00064516),U('ft2','Square foot',.09290304),U('yd2','Square yard',.83612736),U('mi2','Square mile',2589988.110336),U('rood','Rood',1011.7141056),U('cent','Cent',40.468564224)]},
 {code:'volume',name:'Volume',units:[U('ml','Milliliter',.000001),U('cl','Centiliter',.00001),U('dl','Deciliter',.0001),U('l','Liter',.001),U('m3','Cubic meter',1),U('cm3','Cubic centimeter',1e-6),U('mm3','Cubic millimeter',1e-9),U('in3','Cubic inch',.000016387064),U('ft3','Cubic foot',.028316846592),U('yd3','Cubic yard',.764554857984),U('galus','US liquid gallon',.003785411784),U('galimp','Imperial gallon',.00454609),U('qtus','US liquid quart',.000946352946),U('ptus','US liquid pint',.000473176473),U('cupus','US legal cup',.00024)]},
 {code:'time',name:'Time',units:[U('ns','Nanosecond',1e-9),U('us','Microsecond',1e-6),U('ms','Millisecond',.001),U('sec','Second',1),U('min','Minute',60),U('hr','Hour',3600),U('day','Day',86400),U('week','Week',604800),U('fortnight','Fortnight',1209600),U('year365','365-day year',31536000),U('julian','Julian year (365.25 days)',31557600)]},
 {code:'speed',name:'Speed',units:[U('mps','Meter per second',1),U('kmh','Kilometer per hour',1/3.6),U('mph','Mile per hour',.44704),U('knot','Knot',1852/3600),U('fps','Foot per second',.3048),U('fpm','Foot per minute',.3048/60),U('cmm','Centimeter per minute',.01/60),U('ips','Inch per second',.0254),U('mmin','Meter per minute',1/60),U('kmmin','Kilometer per minute',1000/60),U('miph','Mile per hour (metric check)',1609.344/3600)]},
 {code:'storage',name:'Digital information',units:[U('bit','Bit',1),U('B','Byte',8),U('kbit','Kilobit',1e3),U('Mbit','Megabit',1e6),U('Gbit','Gigabit',1e9),U('kB','Kilobyte',8e3),U('MB','Megabyte',8e6),U('GB','Gigabyte',8e9),U('TB','Terabyte',8e12),U('KiB','Kibibyte',8*1024),U('MiB','Mebibyte',8*1024**2),U('GiB','Gibibyte',8*1024**3),U('TiB','Tebibyte',8*1024**4)]},
 {code:'pressure',name:'Pressure',units:[U('pa','Pascal',1),U('kpa','Kilopascal',1000),U('mpa','Megapascal',1e6),U('bar','Bar',100000),U('mbar','Millibar',100),U('atm','Standard atmosphere',101325),U('psi','Pound per square inch',6894.757293168),U('torr','Torr',101325/760),U('mmhg','Millimeter of mercury (conventional)',133.322387415),U('inhg','Inch of mercury (conventional)',3386.389)]},
 {code:'energy',name:'Energy',units:[U('j','Joule',1),U('kj','Kilojoule',1e3),U('mj','Megajoule',1e6),U('wh','Watt-hour',3600),U('kwh','Kilowatt-hour',3.6e6),U('cal','Thermochemical calorie',4.184),U('kcal','Thermochemical kilocalorie',4184),U('btu','IT British thermal unit',1055.05585262),U('ev','Electronvolt',1.602176634e-19),U('erg','Erg',1e-7)]},
 {code:'power',name:'Power',units:[U('w','Watt',1),U('kw','Kilowatt',1000),U('mw','Megawatt',1e6),U('gw','Gigawatt',1e9),U('milliw','Milliwatt',.001),U('hp','Mechanical horsepower',745.69987158227),U('hpmetric','Metric horsepower',735.49875),U('btuh','BTU (IT) per hour',1055.05585262/3600)]},
 {code:'freq',name:'Frequency',units:[U('hz','Hertz',1),U('khz','Kilohertz',1000),U('mhz','Megahertz',1e6),U('ghz','Gigahertz',1e9),U('thz','Terahertz',1e12),U('rpm','Revolutions per minute',1/60),U('rps','Revolutions per second',1)]},
 {code:'temperature',name:'Temperature',units:[U('c','Celsius',1),U('f','Fahrenheit',1),U('k','Kelvin',1),U('r','Rankine',1)]},
];
export type Conversion={id:string;family:UnitFamily;from:Unit;to:Unit;name:string;category:string;description:string};
export const unitConversions:Conversion[]=unitFamilies.flatMap(f=>f.units.flatMap(from=>f.units.filter(to=>to.code!==from.code).map(to=>({
 id:`unit-${f.code}-${from.code}-${to.code}`,family:f,from,to,
 name:`${from.label} to ${to.label}`,category:'Converters',
 description:`${f.name} · Convert ${from.label} to ${to.label} offline.`
}))));
const byId=new Map(unitConversions.map(x=>[x.id,x]));
export function getConversion(id:string){return byId.get(id);}
export function convertUnit(id:string,value:number):number{
 const spec=byId.get(id);if(!spec)throw Error('Unsupported unit pair');
 if(!Number.isFinite(value))throw Error('Enter a finite numeric value.');
 const {from,to,family}=spec;
 if(family.code==='temperature'){
  const kelvin=from.code==='c'?value+273.15:from.code==='f'?(value+459.67)*5/9:from.code==='r'?value*5/9:value;
  if(kelvin<0)throw Error('Temperature is below absolute zero.');
  return to.code==='c'?kelvin-273.15:to.code==='f'?kelvin*9/5-459.67:to.code==='r'?kelvin*9/5:kelvin;
 }
 const result=value*from.factor/to.factor;
 if(!Number.isFinite(result))throw Error('Result is outside the supported numeric range.');
 return result;
}
