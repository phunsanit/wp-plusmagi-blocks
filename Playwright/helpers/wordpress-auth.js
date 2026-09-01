const fs = require('fs');
const path = require('path');

const ADMIN_STATE_PATH = path.resolve(__dirname, '../auth/admin-state.json');

function getWordPressAuth() {
	const site = process.env.WP_URL || 'pitt.plusmagi.com';
	const username = process.env.WP_ADMIN_USER || 'admin';
	const applicationPassword = process.env.WP_APPLICATION_PASSWORD || '';
	const baseUrl = /^https?:\/\//i.test(site)
		? site.replace(/\/$/, '')
		: `https://${site.replace(/\/$/, '')}`;

	if (!applicationPassword) {
		throw new Error('WP_APPLICATION_PASSWORD environment variable is required.');
	}

	return { baseUrl, username, applicationPassword };
}

async function verifyApplicationPassword(request) {
	const { baseUrl, username, applicationPassword } = getWordPressAuth();
	const authorization = Buffer.from(`${username}:${applicationPassword}`).toString('base64');
	const response = await request.get(`${baseUrl}/wp-json/wp/v2/users/me?context=edit`, {
		headers: {
			Authorization: `Basic ${authorization}`,
			Accept: 'application/json',
		},
	});

	if (!response.ok()) {
		const body = await response.text();
		throw new Error(`WordPress Application Password authentication failed (${response.status()}): ${body}`);
	}

	return response.json();
}

function requireAdminState() {
	if (!fs.existsSync(ADMIN_STATE_PATH)) {
		throw new Error(
			'Browser admin tests require auth/admin-state.json. Application Passwords authenticate REST API requests but cannot create a wp-admin browser session.'
		);
	}

	return ADMIN_STATE_PATH;
}

module.exports = {
	ADMIN_STATE_PATH,
	getWordPressAuth,
	requireAdminState,
	verifyApplicationPassword,
};