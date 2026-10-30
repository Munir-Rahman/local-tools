import test from 'node:test';
import assert from 'node:assert/strict';
import {estimateZakat,estimateSalaryTax} from '../src/financeEngine.ts';
test('2.5 percent wealth estimate applies only after user-supplied nisab',()=>{
 assert.deepEqual(estimateZakat(10000,2000,6000),{netAssets:8000,aboveThreshold:true,estimatedAmount:200,rate:0.025});
 assert.equal(estimateZakat(1000,200,900).estimatedAmount,0);
});
test('Liabilities cannot make net wealth negative',()=>{
 assert.equal(estimateZakat(500,700,100).netAssets,0);
 assert.equal(estimateZakat(500,700,100).estimatedAmount,0);
});
test('Nisab must be greater than zero and inputs finite/nonnegative',()=>{
 assert.throws(()=>estimateZakat(500,0,0),/nisab/i);
 assert.throws(()=>estimateZakat(-1,0,100),/non-negative/);
 assert.throws(()=>estimateZakat(100,Infinity,50),/finite/);
});
test('Salary arithmetic uses exactly user-provided rate, not invented legal rates',()=>{
 assert.deepEqual(estimateSalaryTax(10000,10),{gross:10000,tax:1000,net:9000,ratePercent:10});
 assert.equal(estimateSalaryTax(123.45,12.5).tax,15.43);
 assert.throws(()=>estimateSalaryTax(100,110),/exceed 100/);
});
