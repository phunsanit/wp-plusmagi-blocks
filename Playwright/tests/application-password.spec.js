// @ts-check
const { test, expect } = require('@playwright/test');
const { verifyApplicationPassword } = require('../helpers/wordpress-auth');

test('@api authenticates an administrator with a WordPress Application Password', async ({ request }) => {
	const user = await verifyApplicationPassword(request);

	expect(user.id).toBeGreaterThan(0);
	expect(user.roles).toContain('administrator');
	expect(user.capabilities?.edit_posts).toBe(true);
	expect(user.capabilities?.upload_files).toBe(true);
	expect(user.capabilities?.manage_options).toBe(true);
});