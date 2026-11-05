import { test, expect } from '@playwright/test';

/**
 * Responsive regression for dashboard horizontal overflow. The category
 * controls must wrap inside the viewport instead of stretching the whole page.
 */
test('dashboard never overflows horizontally across common screen sizes',async({page})=>{
  for(const width of [390,768,1024,1280,1440,1680]){
    await page.setViewportSize({width,height:900});
    await page.goto('/#dashboard');
    await page.locator('.v2-tabs').waitFor();
    await page.evaluate(()=>document.fonts.ready);
    const dimensions=await page.evaluate(()=>{
      const root=document.documentElement;
      const tabs=document.querySelector('.v2-tabs') as HTMLElement;
      const last=tabs.querySelector('button:last-child') as HTMLElement;
      const tabBox=tabs.getBoundingClientRect();
      const lastBox=last.getBoundingClientRect();
      return {
        viewport:root.clientWidth,
        document:root.scrollWidth,
        tabsLeft:tabBox.left,
        tabsRight:tabBox.right,
        lastRight:lastBox.right,
        lastLeft:lastBox.left,
        tabHeight:tabBox.height
      };
    });
    expect(dimensions.document,JSON.stringify({width,...dimensions})).toBeLessThanOrEqual(dimensions.viewport+1);
    expect(dimensions.tabsRight,JSON.stringify({width,...dimensions})).toBeLessThanOrEqual(width+1);
    expect(dimensions.lastRight,JSON.stringify({width,...dimensions})).toBeLessThanOrEqual(width+1);
    expect(dimensions.lastLeft,JSON.stringify({width,...dimensions})).toBeGreaterThanOrEqual(-1);
    expect(dimensions.tabHeight).toBeGreaterThan(20);
  }
});
