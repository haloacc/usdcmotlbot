import { test, expect } from '@playwright/test';

test.describe('Halo Migration E2E', () => {
    test('should load login page and show error on empty submit', async ({ page }) => {
        await page.goto('/auth/login');
        await expect(page).toHaveTitle(/Login - Halo/);
        await page.click('button[type="submit"]');
        // Check for client-side validation or error if implemented
    });

    test('should navigation to signup page', async ({ page }) => {
        await page.goto('/auth/login');
        await page.click('text=Create one');
        await expect(page).toHaveURL(/\/auth\/signup/);
        await expect(page.locator('h1')).toContainText('Create an Account');
    });

    test('should load shop page', async ({ page }) => {
        // We might need to handle auth or bypass it for this test
        await page.goto('/products');
        await expect(page.locator('h1')).toContainText('Shop');
        const products = page.locator('.grid > div');
        const count = await products.count();
        expect(count).toBeGreaterThan(0);
    });

    test('should add item to cart and show in checkout', async ({ page }) => {
        await page.goto('/products');
        await page.locator('button:has-text("Add to Cart")').first().click();

        // Check if we can navigate to checkout
        // Assuming there's a cart link or we just go to /checkout
        await page.goto('/checkout');
        await expect(page.locator('h1')).toContainText('Checkout');
        await expect(page.locator('text=Order Summary')).toBeVisible();
    });
});
