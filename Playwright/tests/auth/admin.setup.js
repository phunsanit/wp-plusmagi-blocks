// @ts-check
const { test: setup, expect } = require('@playwright/test');
const {
	verifyApplicationPassword,
} = require('../../helpers/wordpress-auth');

/**
 * Setup project: verify WordPress REST credentials.
 */
setup('authenticate as WordPress admin', async ({ request }) => {
	const user = await verifyApplicationPassword(request);
	expect(user.roles).toContain('administrator');
});
