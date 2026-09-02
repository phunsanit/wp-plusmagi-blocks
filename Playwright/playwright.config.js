// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

/**
 * Playwright configuration for PlusMagi Markdown plugin tests.
 * Target: https://pitt.plusmagi.com  (live WordPress site with plugin installed)
 *
 * Run all guest tests:	   npx playwright test
 * Run with UI:			   npx playwright test --ui
	 * Run admin/block tests:	 npx playwright test --project=admin  (uses ../.env)
 * Show HTML report:		  npx playwright show-report
 */

const ADMIN_STATE = path.join(__dirname, 'auth/admin-state.json');
const FULL_WORDPRESS_TEST = process.env.PLUSMAGI_FULL_TEST === '1';
const ADMIN_ONLY_MATCH = /(block-mermaid-post-4495|block-thesaurus-live-semantic|block-thesaurus-post-4493|block-description-list-post-4494|block-svg-live|block-table-style-post-4507)\.spec\.js/;
const MERMAID_LOCAL_MATCH = /(mermaid-block|diagram-.*|config-.*|block-description-list|block-svg|block-table-style|block-thesaurus-semantic)\.spec\.js/;
const ADMIN_FULL_MATCH = /(mermaid-block|block-mermaid-post-4495|block-thesaurus|block-thesaurus-live-semantic|block-thesaurus-post-4493|block-description-list(?:-post-4494)?|block-svg-live|block-table-style(?:-post-4507)?|diagram-.*|config-.*)\.spec\.js/;

module.exports = defineConfig({
	testDir: './tests',
	timeout: 60_000,

	/* Retry once on CI, never locally */
	retries: process.env.CI ? 1 : 0,

	/* Run tests in parallel by default */
	fullyParallel: true,

	/* Reporter */
	reporter: [
		['html', { outputFolder: 'playwright-report', open: 'never' }],
		['list'],
	],

	/* Shared settings for every test */
	use: {
		baseURL: process.env.WP_URL ? `https://${process.env.WP_URL}` : 'https://pitt.plusmagi.com',

		/* Allow up to 60s for any navigation on this ad-heavy live site */
		navigationTimeout: 60_000,
		actionTimeout: 15_000,

		/* Capture screenshot only on failure */
		screenshot: 'only-on-failure',

		/* Record a video only when retrying a failed test */
		video: 'on-first-retry',

		/* Keep traces on failures for debugging */
		trace: 'on-first-retry',
	},

	projects: [
		// ------------------------------------------------------------------
		// Setup: log in to WP admin and save cookies for the admin project
		// Run: npx playwright test --project=setup  (uses ../.env)
		// ------------------------------------------------------------------
		{
			name: 'setup',
			testMatch: /auth\/admin\.setup\.js/,
			use: { ...devices['Desktop Chrome'] },
		},

		// ------------------------------------------------------------------
		// Guest tests — no authentication required (3 browsers)
		// ------------------------------------------------------------------
		{
			name: 'chromium',
			testIgnore: ADMIN_FULL_MATCH,
			use: { ...devices['Desktop Chrome'] },
		},
		{
			name: 'firefox',
			testIgnore: ADMIN_FULL_MATCH,
			use: { ...devices['Desktop Firefox'] },
		},
		{
			name: 'webkit',
			testIgnore: ADMIN_FULL_MATCH,
			use: { ...devices['Desktop Safari'] },
		},

		// ------------------------------------------------------------------
		// Admin tests — REST auth uses WP_APPLICATION_PASSWORD; browser UI uses saved cookies.
		// Depends on 'setup' verifying REST credentials first.
		// ------------------------------------------------------------------
		{
			name: 'admin',
			testMatch: FULL_WORDPRESS_TEST ? ADMIN_FULL_MATCH : ADMIN_ONLY_MATCH,
			dependencies: ['setup'],
			use: {
				...devices['Desktop Chrome'],
				storageState: ADMIN_STATE,
			},
		},

		...(FULL_WORDPRESS_TEST
			? []
			: [
				{
					name: 'mermaid-local',
					testMatch: MERMAID_LOCAL_MATCH,
					use: { ...devices['Desktop Chrome'] },
				},
			]),
	],
});
