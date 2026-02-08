import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
    await page.goto('/');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Halo/);
});

test('can type in chat input', async ({ page }) => {
    await page.goto('/');

    // Locate the chat input
    const input = page.locator('textarea[placeholder="Ask to buy something..."]');

    // Type a message
    await input.fill('Hello world');

    // Click send button
    await page.locator('button:has(svg)').last().click();

    // Expect the message to appear in the chat
    await expect(page.getByText('Hello world')).toBeVisible();
});
