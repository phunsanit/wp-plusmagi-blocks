const { URL } = require('url');

function resolveAdminTestUrl(pathname = '/wp-admin/post-new.php') {
	const configuredAdminUrl = process.env.WP_URL_TEST_ADMIN;
	if (configuredAdminUrl) {
		return new URL(pathname, configuredAdminUrl).toString();
	}

	const siteBaseUrl = `https://${process.env.WP_URL || 'pitt.plusmagi.com'}`;
	return new URL(pathname, siteBaseUrl).toString();
}

module.exports = { resolveAdminTestUrl };