const path = require('path');
const dotenv = require('dotenv');
const { chromium, request } = require('playwright');
const {
	requireAdminState,
	verifyApplicationPassword,
} = require('../helpers/wordpress-auth');

const ROOT_DIR = path.resolve(__dirname, '../..');
dotenv.config({ path: path.join(ROOT_DIR, '.env') });

const base = (`https://${process.env.WP_URL || 'pitt.plusmagi.com'}`).replace(/\/$/, '');

async function run() {
	const apiContext = await request.newContext();
	await verifyApplicationPassword(apiContext);
	await apiContext.dispose();

	const browser = await chromium.launch({ headless: true });
	const context = await browser.newContext({ storageState: requireAdminState() });
	const page = await context.newPage();

	await page.goto(`${base}/wp-admin/tools.php?page=plusmagi-blocks`, { waitUntil: 'domcontentloaded', timeout: 60000 });
	const hasSettings = await page.locator('#enable_gap_fill').count();
	const deniedTools = (await page.locator('#wpadminbar').count()) === 0;

	await page.goto(`${base}/wp-admin/post.php?post=660&action=edit`, { waitUntil: 'domcontentloaded', timeout: 90000 });
	const hasLayout = await page.locator('.edit-post-layout').count();
	const hasPanel = await page.locator('button.components-panel__body-toggle').filter({ hasText: /PlusMagi Markdown/i }).count();
	const hasConfig = await page.evaluate(() => {
	return window.plusmagiTagsEditorConfig !== undefined;
	});
	const deniedPost = (await page.locator('#wpadminbar').count()) === 0;

	console.log(JSON.stringify({ hasSettings, deniedTools, hasLayout, hasPanel, hasConfig, deniedPost }, null, 2));

	await context.close();
	await browser.close();
}

run().catch((err) => {
	console.error(err.message);
	process.exit(1);
});
