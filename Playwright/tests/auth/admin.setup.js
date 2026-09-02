// @ts-check
const { test: setup, expect } = require('@playwright/test');
const {
	ADMIN_STATE_PATH,
	verifyApplicationPassword,
} = require('../../helpers/wordpress-auth');

/**
 * Setup project: verify WordPress credentials and refresh the browser session.
 */
setup('authenticate as WordPress admin', async ({ page, request }) => {
	const user = await verifyApplicationPassword(request);
	expect(user.roles).toContain('administrator');

	const password = process.env.WP_ADMIN_PASSWORD;
	if (!password) {
		throw new Error('WP_ADMIN_PASSWORD is required to refresh the wp-admin browser session.');
	}

	await page.goto('/wp-login.php', { waitUntil: 'domcontentloaded' });
	await page.locator('#user_login').fill(process.env.WP_ADMIN_USER || 'admin');
	await page.locator('#user_pass').fill(password);
	await page.locator('#wp-submit').click();
	await page.waitForURL(/\/wp-admin\//, { timeout: 60_000 });
	await expect(page.locator('#wpadminbar')).toBeVisible();
	await page.context().storageState({ path: ADMIN_STATE_PATH });
});
