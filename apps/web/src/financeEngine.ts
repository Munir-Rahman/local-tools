/** Local, deterministic financial arithmetic; not tax or religious advice. */
function nonnegative(value:number,label:string):number{
 if(!Number.isFinite(value)||value<0)throw Error(label+' must be a finite non-negative number.');
 return value;
}
export function estimateZakat(assets:number,liabilities:number,nisabValue:number){
 nonnegative(assets,'Assets');nonnegative(liabilities,'Liabilities');nonnegative(nisabValue,'Nisab value');
 if(nisabValue<=0)throw Error('Enter a nisab threshold greater than zero, using current locally verified prices.');
 const netAssets=Math.max(0,assets-liabilities),aboveThreshold=netAssets>=nisabValue;
 return {netAssets,aboveThreshold,estimatedAmount:aboveThreshold?Math.round(netAssets*0.025*100)/100:0,rate:0.025};
}
export function estimateSalaryTax(gross:number,ratePercent:number){
 nonnegative(gross,'Gross salary');
 nonnegative(ratePercent,'Tax percentage');
 if(ratePercent>100)throw Error('Percentage must not exceed 100.');
 const tax=Math.round(gross*ratePercent)/100;
 return {gross,tax,net:Math.round((gross-tax)*100)/100,ratePercent};
}
