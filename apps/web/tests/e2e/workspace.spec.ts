import {test,expect} from '@playwright/test';

test('default light theme and persisted SQLite favorites across reloads',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('.v2')).toHaveClass(/v2-light/);
  await page.getByRole('button',{name:'All tools'}).first().click();
  await page.getByRole('button',{name:'Favorite Merge PDF'}).first().click();
  await page.getByRole('button',{name:'Favorites'}).first().click();
  await expect(page.getByRole('heading',{name:'Merge PDF'})).toBeVisible();
  await page.reload();
  await page.getByRole('button',{name:'Favorites'}).first().click();
  await expect(page.getByRole('heading',{name:'Merge PDF'})).toBeVisible();
  expect(errors).toEqual([]);
});

test('SQLite self-test writes snapshot and verifies data reopens',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Settings'}).first().click();
  await page.getByRole('button',{name:'Test SQLite persistence'}).click();
  await expect(page.getByText('SQLite and IndexedDB persistence verified on this device.')).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});