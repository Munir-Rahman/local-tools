import { expect, test } from '@playwright/test';

test('invoice supports multiple editable line items and remembers the prior page',async ({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Templates',exact:true}).click();
  await page.getByRole('button',{name:'Open Invoice Generator'}).click();
  await expect(page.getByRole('heading',{name:'Invoice Generator'})).toBeVisible();
  await page.getByRole('button',{name:/Add item/}).click();
  await expect(page.locator('.v6-lineitem')).toHaveCount(2);
  const rows=page.locator('.v6-lineitem');
  await rows.nth(0).locator('input').nth(0).fill('Keyboard');
  await rows.nth(0).locator('input').nth(1).fill('2');
  await rows.nth(0).locator('input').nth(2).fill('15');
  await rows.nth(1).locator('input').nth(0).fill('Mouse');
  await rows.nth(1).locator('input').nth(1).fill('3');
  await rows.nth(1).locator('input').nth(2).fill('4');
  await expect(page.locator('.invoice-total')).toContainText('42.00');
  await page.getByRole('button',{name:/Back to previous page/}).click();
  await expect(page.getByRole('heading',{name:'Document templates'})).toBeVisible();
});

test('master catalog includes action 5000 but never calls it implemented',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:/5,000-action catalog/}).first().click();
  await page.getByPlaceholder('Search all 5,000 actions...').fill('5000');
  await expect(page.getByText('Set local-only mode for all converters')).toBeVisible();
  await expect(page.getByText('Planned').first()).toBeVisible();
});
