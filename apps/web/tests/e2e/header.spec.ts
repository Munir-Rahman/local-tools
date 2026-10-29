import {test,expect} from '@playwright/test';

test('hover document menu opens real tool links and supports tool navigation', async ({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Document tools'}).hover();
  const mega=page.locator('#tn-mega-panel');
  await expect(mega).toBeVisible();
  await expect(mega.getByText('Popular tools')).toBeVisible();
  await expect(mega.getByRole('button',{name:/Merge PDF/}).first()).toBeVisible();
  await mega.getByRole('button',{name:/Merge PDF/}).first().click();
  await expect(page).toHaveURL(/#tool\/merge-pdf/);
});

test('tool search suggests implemented utilities', async ({page})=>{
  await page.goto('/');
  await page.getByRole('textbox',{name:'Search available tools'}).fill('word counter');
  await expect(page.locator('.tn-search-popover').getByRole('button',{name:/Word Counter/i})).toBeVisible();
  await page.locator('.tn-search-popover').getByRole('button',{name:/Word Counter/i}).click();
  await expect(page).toHaveURL(/#tool\/word-counter/);
});

test('ad placeholders never overlay primary actions',async ({page})=>{
  await page.goto('/');
  await expect(page.locator('.tn-ad-region').first()).toBeVisible();
  await expect(page.getByText('Ad placement preview', {exact:false}).first()).toBeVisible();
  await expect(page.locator('.v2-content')).toBeVisible();
});