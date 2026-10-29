/** Offline scientific and engineering calculators. All inputs are explicit and results include units. */
export type ScienceTool = {id:string;name:string;category:string;description:string;fields:string[];samples:string[]};
export const scienceTools:ScienceTool[] = [
  {id:'base-converter',name:'Binary / Octal / Decimal / Hex Converter',category:'Computer',description:'Convert signed integers between bases 2–36 with BigInt.',fields:['Integer','Input base (2-36)','Output base (2-36)'],samples:['101011','2','16']},
  {id:'bits-bytes',name:'Bytes / KB / MB / GB / TB Converter',category:'Computer',description:'Convert between decimal and binary storage units.',fields:['Amount','From (B,KB,MB,GB,TB,KiB,MiB,GiB,TiB)','To'],samples:['1','GiB','MB']},
  {id:'data-transfer',name:'Download Time Calculator',category:'Computer',description:'Estimate minimum transfer time from size and network throughput.',fields:['Data size (MB)','Rate (Mbps)'],samples:['1024','100']},
  {id:'binary-operations',name:'Binary Bitwise Calculator',category:'Computer',description:'AND, OR, XOR, left and right shifts for non-negative integers.',fields:['First decimal integer','Second decimal integer','Operation (and,or,xor,shl,shr)'],samples:['12','5','and']},
  {id:'ohms-law',name:'Ohm’s Law Calculator',category:'Electrical',description:'Find resistance from voltage and current.',fields:['Voltage (V)','Current (A)'],samples:['12','2']},
  {id:'electric-power',name:'Electrical Power Calculator',category:'Electrical',description:'Power = voltage × current for DC circuits.',fields:['Voltage (V)','Current (A)'],samples:['230','5']},
  {id:'energy-kwh',name:'Electrical Energy Cost',category:'Electrical',description:'Calculate kWh and total cost.',fields:['Power (W)','Hours','Price per kWh'],samples:['1500','6','0.12']},
  {id:'resistors-series',name:'Resistors in Series',category:'Electrical',description:'Sum comma-separated resistance values in ohms.',fields:['Resistances (Ω; comma-separated)'],samples:['100,220,330']},
  {id:'resistors-parallel',name:'Resistors in Parallel',category:'Electrical',description:'Equivalent resistance of parallel resistors.',fields:['Resistances (Ω; comma-separated)'],samples:['100,200']},
  {id:'voltage-divider',name:'Voltage Divider',category:'Electrical',description:'Output of a simple unloaded resistive divider.',fields:['Input voltage (V)','Top resistor (Ω)','Bottom resistor (Ω)'],samples:['12','1000','2000']},
  {id:'rc-time',name:'RC Time Constant',category:'Electrical',description:'τ = resistance × capacitance.',fields:['Resistance (Ω)','Capacitance (µF)'],samples:['1000','100']},
  {id:'freq-period',name:'Frequency / Period',category:'Electrical',description:'Calculate period for frequency in hertz.',fields:['Frequency (Hz)'],samples:['50']},
  {id:'force',name:'Newton’s Second Law',category:'Physics',description:'Force = mass × acceleration.',fields:['Mass (kg)','Acceleration (m/s²)'],samples:['8','9.81']},
  {id:'kinetic-energy',name:'Kinetic Energy',category:'Physics',description:'Energy of motion, ½mv².',fields:['Mass (kg)','Velocity (m/s)'],samples:['5','12']},
  {id:'potential-energy',name:'Gravitational Potential Energy',category:'Physics',description:'mgh using local g value.',fields:['Mass (kg)','Height (m)','Gravity (m/s²)'],samples:['5','10','9.81']},
  {id:'speed',name:'Speed / Velocity',category:'Physics',description:'Distance divided by elapsed time.',fields:['Distance (m)','Time (s)'],samples:['100','9.58']},
  {id:'acceleration',name:'Acceleration Calculator',category:'Physics',description:'Change in velocity divided by time.',fields:['Final velocity (m/s)','Initial velocity (m/s)','Time (s)'],samples:['25','5','4']},
  {id:'density',name:'Density Calculator',category:'Physics',description:'Density = mass / volume.',fields:['Mass (kg)','Volume (m³)'],samples:['20','0.01']},
  {id:'pressure',name:'Pressure Calculator',category:'Physics',description:'Force per unit area.',fields:['Force (N)','Area (m²)'],samples:['100','0.5']},
  {id:'wave-speed',name:'Wave Speed / Wavelength',category:'Physics',description:'Wavelength from wave speed and frequency.',fields:['Wave speed (m/s)','Frequency (Hz)'],samples:['343','1000']},
  {id:'heat',name:'Heat Energy Calculator',category:'Physics',description:'Q = mass × specific heat × temperature change.',fields:['Mass (kg)','Specific heat (J/kg·K)','ΔT (K)'],samples:['2','4184','10']},
  {id:'momentum',name:'Linear Momentum',category:'Physics',description:'p = mass × velocity.',fields:['Mass (kg)','Velocity (m/s)'],samples:['3','20']},
  {id:'moles',name:'Mass to Moles',category:'Chemistry',description:'Amount of substance from sample mass and molar mass.',fields:['Sample mass (g)','Molar mass (g/mol)'],samples:['18','18.015']},
  {id:'molarity',name:'Molarity Calculator',category:'Chemistry',description:'Moles per liter of solution.',fields:['Moles (mol)','Solution volume (L)'],samples:['0.5','2']},
  {id:'dilution',name:'Solution Dilution (C1V1=C2V2)',category:'Chemistry',description:'Find initial solution volume needed.',fields:['Initial concentration (mol/L)','Target concentration (mol/L)','Final volume (mL)'],samples:['2','0.5','200']},
  {id:'ph',name:'pH Calculator',category:'Chemistry',description:'pH = −log10(H⁺ activity approximated by concentration).',fields:['Hydrogen-ion concentration (mol/L)'],samples:['0.00001']},
  {id:'ideal-gas',name:'Ideal Gas Law',category:'Chemistry',description:'Calculate gas pressure from nRT/V.',fields:['Amount (mol)','Temperature (K)','Volume (m³)'],samples:['1','298.15','0.024']},
  {id:'mass-percent',name:'Mass Percent of Solution',category:'Chemistry',description:'Solute mass divided by total mass × 100.',fields:['Solute mass (g)','Total solution mass (g)'],samples:['20','200']},
  {id:'concrete-volume',name:'Concrete Volume / Material Estimate',category:'Engineering',description:'Slab volume and optional wastage.',fields:['Length (m)','Width (m)','Thickness (m)','Wastage (%)'],samples:['10','5','0.15','5']},
  {id:'bricks-estimate',name:'Wall Brick Estimate',category:'Engineering',description:'Estimate bricks by face area including mortar joint.',fields:['Wall area (m²)','Brick length (mm)','Brick height (mm)','Mortar joint (mm)'],samples:['20','230','75','10']},
  {id:'efficiency',name:'Engineering Efficiency',category:'Engineering',description:'Efficiency = useful output / input × 100.',fields:['Useful output energy','Input energy'],samples:['85','100']},
  {id:'material-weight',name:'Material Weight Estimate',category:'Engineering',description:'Mass from volume and density.',fields:['Volume (m³)','Density (kg/m³)'],samples:['2','7850']},
  {id:'heat-flow',name:'Heat Conduction Calculator',category:'Engineering',description:'Steady conduction through a flat wall (one dimensional).',fields:['Thermal conductivity (W/m·K)','Area (m²)','ΔT (K)','Thickness (m)'],samples:['0.7','10','20','0.2']},
  {id:'fuel-economy',name:'Fuel Consumption / Economy',category:'Engineering',description:'Liters per 100 km and km per liter.',fields:['Distance (km)','Fuel used (L)'],samples:['500','40']}
];
function n(v:string):number{if(!v.trim()||!Number.isFinite(Number(v)))throw Error('All numeric fields must contain finite numbers.');return Number(v);}
function positive(x:number,name='value'){if(x<=0)throw Error(`${name} must be greater than zero.`);return x;}
function format(x:number,unit=''){if(!Number.isFinite(x))throw Error('The calculation produced an invalid result.');return `${Number(x.toPrecision(12)).toLocaleString('en-US',{maximumFractionDigits:12})}${unit?' '+unit:''}`;}
function parseRes(v:string){const a=v.split(',').map(s=>positive(n(s)));if(a.length===0||a.length>100)throw Error('Enter 1–100 resistance values.');return a;}
const units:Record<string,number>={B:1,KB:1e3,MB:1e6,GB:1e9,TB:1e12,KiB:1024,MiB:1024**2,GiB:1024**3,TiB:1024**4};
function baseInteger(raw:string,from:number){const chars='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';if(!/^[+-]?[0-9A-Za-z]+$/.test(raw.trim()))throw Error('Enter an integer without separators.');const sign=raw[0]==='-'?-1n:1n;const digits=raw.replace(/^[+-]/,'').toUpperCase();let value=0n;for(const c of digits){const digit=chars.indexOf(c);if(digit<0||digit>=from)throw Error(`Invalid digit '${c}' for base ${from}.`);value=value*BigInt(from)+BigInt(digit);}return value*sign;}
export function calculateScience(id:string,values:string[]):string{
 const v=values.map((x,i)=>(id==='base-converter'&&i===0)||(id==='bits-bytes'&&i>0)||(id==='binary-operations'&&i===2)||(id.startsWith('resistors-')&&i===0)?0:n(x));const a=v[0],b=v[1],c=v[2],d=v[3];
 switch(id){
  case 'base-converter':{const from=n(values[1]),to=n(values[2]);if(!Number.isInteger(from)||!Number.isInteger(to)||from<2||from>36||to<2||to>36)throw Error('Bases must be integers from 2 through 36.');return `${values[0]} (base ${from}) = ${baseInteger(values[0],from).toString(to).toUpperCase()} (base ${to})`;}
  case 'bits-bytes':{const from=units[values[1]],to=units[values[2]];if(!from||!to)throw Error('Choose B, KB, MB, GB, TB, KiB, MiB, GiB or TiB.');return format(n(values[0])*from/to,values[2]);}
  case 'data-transfer':return format(positive(a)*8/positive(b),'seconds (ideal, excluding overhead)');
  case 'binary-operations':{const op=values[2].toLowerCase().trim();if(!Number.isSafeInteger(a)||!Number.isSafeInteger(b)||a<0||b<0)throw Error('Use non-negative safe integer operands.');const A=BigInt(a),B=BigInt(b);if((op==='shl'||op==='shr')&&b>1024)throw Error('Shift limited to 1024 bits.');const x=({and:()=>A&B,or:()=>A|B,xor:()=>A^B,shl:()=>A<<B,shr:()=>A>>B} as Record<string,()=>bigint>)[op];if(!x)throw Error('Operation must be and, or, xor, shl or shr.');const out=x();return `${out.toString()} (decimal) = ${out.toString(2)} (binary) = ${out.toString(16).toUpperCase()} (hex)`;}
  case 'ohms-law':return format(a/positive(b),'Ω');
  case 'electric-power':return format(a*b,'W');
  case 'energy-kwh':{const energy=a*b/1000;return `${format(energy,'kWh')} · ${format(energy*c,'currency units')}`;}
  case 'resistors-series':return format(parseRes(values[0]).reduce((s,x)=>s+x,0),'Ω');
  case 'resistors-parallel':return format(1/parseRes(values[0]).reduce((s,x)=>s+1/x,0),'Ω');
  case 'voltage-divider':return format(a*positive(c)/positive(b+c),'V (unloaded)');
  case 'rc-time':return format(a*b/1e6,'seconds');
  case 'freq-period':return format(1/positive(a),'seconds');
  case 'force':return format(a*b,'N');
  case 'kinetic-energy':return format(0.5*a*b*b,'J');
  case 'potential-energy':return format(a*b*c,'J');
  case 'speed':return format(a/positive(b),'m/s');
  case 'acceleration':return format((a-b)/positive(c),'m/s²');
  case 'density':return format(a/positive(b),'kg/m³');
  case 'pressure':return format(a/positive(b),'Pa');
  case 'wave-speed':return format(a/positive(b),'m');
  case 'heat':return format(a*b*c,'J');
  case 'momentum':return format(a*b,'kg·m/s');
  case 'moles':return format(a/positive(b),'mol');
  case 'molarity':return format(a/positive(b),'mol/L');
  case 'dilution':return format(positive(b)*positive(c)/positive(a),'mL stock required');
  case 'ph':return format(-Math.log10(positive(a)),'pH (ideal dilute solution approximation)');
  case 'ideal-gas':return format(a*8.314462618*positive(b)/positive(c),'Pa');
  case 'mass-percent':return format(a/positive(b)*100,'% w/w');
  case 'concrete-volume':return format(positive(a)*positive(b)*positive(c)*(1+d/100),'m³ (with wastage)');
  case 'bricks-estimate':return format(Math.ceil(positive(a)*1e6/((positive(b)+d)*(positive(c)+d))),'bricks (approximate)');
  case 'efficiency':return format(a/positive(b)*100,'%');
  case 'material-weight':return format(a*b,'kg');
  case 'heat-flow':return format(a*b*c/positive(d),'W');
  case 'fuel-economy':return `${format(positive(b)/positive(a)*100,'L/100 km')} · ${format(a/b,'km/L')}`;
  default:throw Error('Unknown calculator.');
 }
}