import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  const client = await page.context().newCDPSession(page);

  // No need to throttle the network (Network.overrideNetworkState)

  // Throttle the CPU, to avoid performance differences being hidden by a too fast CPU.
  await client.send('Emulation.setCPUThrottlingRate', { rate: 4 }); // 4x slower
})

test('load first cell', async ({ page }) => {
  for (let i = 0; i < 20; i++) {
    await page.goto('http://localhost:3000');
    await test.step('first-cell', async () => {
      await expect(page.getByRole('cell', { name: `Name0` })).toBeVisible();
    })
  }
});

test('scroll by one row', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.getByRole('cell', { name: `Name0` })).toBeVisible();
  const scroller = page.getByRole('group')

  for (let i = 0; i < 20; i++) {
    await test.step('scrolled', async () => {
      await scroller.evaluate(e => e.scrollTop += 33);
      await expect(page.getByRole('cell', { name: `Name${i}`, exact: true })).toBeVisible();
    })
  }
});

test('scroll by 10 rows', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.getByRole('cell', { name: `Name0` })).toBeVisible();
  const scroller = page.getByRole('group')

  for (let i = 0; i < 20; i++) {
    await test.step('scrolled', async () => {
      await scroller.evaluate(e => e.scrollTop += 330);
      await expect(page.getByRole('cell', { name: `Name${i * 10}`, exact: true })).toBeVisible();
    })
  }
});

test('sort', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.getByRole('cell', { name: `Name0` })).toBeVisible();
  const header = page.getByRole('columnheader', { name: 'Name' });

  for (let i = 0; i < 20; i++) {
    const visibleCell = i%3 === 0 ? "Name1000": i%3 === 1 ? "Name9999" : "Name2"
    await test.step('sorted', async () => {
      await header.click();
      await expect(page.getByRole('cell', { name: visibleCell, exact: true })).toBeVisible();
    })
  }
});
