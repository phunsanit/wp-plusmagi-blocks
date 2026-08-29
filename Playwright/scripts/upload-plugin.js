#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const dotenv = require('dotenv');

const ROOT_DIR = path.resolve(__dirname, '../../');
dotenv.config({ path: path.join(ROOT_DIR, '.env') });

const ZIP_DIR = path.join(ROOT_DIR, 'wp-assets');
const BASE_URL = (`https://${process.env.WP_URL || 'pitt.plusmagi.com'}`).replace(/\/$/, '');
const ADMIN_USER = process.env.WP_ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.WP_ADMIN_PASSWORD;
const ZIP_ARG = process.argv[2] ? path.resolve(process.argv[2]) : '';

function isInsideDir(filePath, dirPath) {
	const relative = path.relative(dirPath, filePath);
	return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function pickLatestZip(dirPath) {
	if (!fs.existsSync(dirPath)) {
	throw new Error(`Zip directory not found: ${dirPath}`);
	}

	const files = fs
	.readdirSync(dirPath)
	.filter((name) => name.endsWith('.zip'))
	.map((name) => {
		const absPath = path.join(dirPath, name);
		const stat = fs.statSync(absPath);
		return { absPath, mtime: stat.mtimeMs };
	})
	.sort((a, b) => b.mtime - a.mtime);

	if (!files.length) {
	throw new Error(`No .zip files found in: ${dirPath}`);
	}

	return files[0].absPath;
}

async function login(page) {
	await page.goto(`${BASE_URL}/wp-login.php`, { waitUntil: 'domcontentloaded', timeout: 60000 });
	await page.locator('#user_login').fill(ADMIN_USER);
	await page.locator('#user_pass').fill(ADMIN_PASS);
	await page.locator('#wp-submit').click();
	await page.waitForURL('**/wp-admin/**', { timeout: 60000 });
}

async function uploadAndOverwriteIfNeeded(page, zipPath) {
	await page.goto(`${BASE_URL}/wp-admin/plugin-install.php?tab=upload`, { waitUntil: 'domcontentloaded', timeout: 60000 });

	if (!(await page.locator('#pluginzip').count())) {
	throw new Error('Cannot find plugin upload input (#pluginzip). Access may be denied.');
	}

	await page.locator('#pluginzip').setInputFiles(zipPath);
	await Promise.all([
		page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => null),
		page.locator('#install-plugin-submit').click(),
	]);

	await page.waitForLoadState('domcontentloaded');

	// If same version is uploaded, WordPress shows an overwrite confirmation link.
	const overwriteButton = page.locator('a.update-from-upload-overwrite');
	if (await overwriteButton.isVisible({ timeout: 5000 }).catch(() => false)) {
		await Promise.all([
			page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => null),
			overwriteButton.click(),
		]);
	}

	// Wait for a clear result signal after install/update.
	await page.waitForLoadState('domcontentloaded');

	const successSignals = [
	page.getByText(/plugin updated successfully|plugin installed successfully/i),
	page.locator('.update-message.notice-success, .notice-success'),
	];

	let hasSuccess = false;
	for (const signal of successSignals) {
	if (await signal.count()) {
		hasSuccess = true;
		break;
	}
	}

	if (!hasSuccess) {
	const title = await page.title();
	throw new Error(`Upload flow finished without a visible success message. Current page title: ${title}`);
	}

	const activateButton = page
	.locator('a.button-primary, a.button')
	.filter({ hasText: /activate plugin|activate|เปิดใช้งานปลั๊กอิน|เปิดใช้งาน/i })
	.first();

	if (await activateButton.isVisible({ timeout: 3000 }).catch(() => false)) {
	await Promise.all([
		page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 }),
		activateButton.click(),
	]);

	const activationSuccess = page.locator('.notice-success, .updated').first();
	if (!(await activationSuccess.isVisible({ timeout: 10000 }).catch(() => false))) {
		throw new Error('Plugin activation finished without a visible success message.');
	}
	}
}

async function main() {
	if (!ADMIN_PASS) {
	throw new Error('Missing WP_ADMIN_PASSWORD in environment.');
	}

	const zipPath = ZIP_ARG || pickLatestZip(ZIP_DIR);
	if (!isInsideDir(zipPath, ZIP_DIR)) {
	throw new Error(`Zip file must be inside wp-assets only: ${ZIP_DIR}`);
	}
	if (!fs.existsSync(zipPath)) {
	throw new Error(`Zip file not found: ${zipPath}`);
	}

	console.log(`Using zip: ${zipPath}`);
	console.log(`Target site: ${BASE_URL}`);

	const browser = await chromium.launch({ headless: true });
	const context = await browser.newContext();
	const page = await context.newPage();

	try {
	await login(page);
	await uploadAndOverwriteIfNeeded(page, zipPath);
	console.log('Plugin upload/update completed successfully.');
	} finally {
	await context.close();
	await browser.close();
	}
}

main().catch((error) => {
	console.error(`Upload failed: ${error.message}`);
	process.exit(1);
});
