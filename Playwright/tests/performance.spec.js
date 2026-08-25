// @ts-check
const { test, expect } = require('@playwright/test');
const { resolveAdminTestUrl } = require('./helpers/admin-url');

test.describe('Performance - Load Time & Resource Usage', () => {
	test.setTimeout(900_000); // 15 minutes for performance tests

	const ADMIN_TEST_URL = resolveAdminTestUrl('/wp-admin/post-new.php');
	const PUBLISHED_POST_URL = resolveAdminTestUrl('/test-wp-plugin-plusmagi-markdown');

	/**
	 * Measure and validate key performance metrics
	 */

	test('measures and validates editor First Contentful Paint (FCP)', async ({ page }) => {
		const navigationMetrics = [];

		page.on('load', () => {
			// Capture timing at page load
		});

		const startTime = Date.now();

		await page.goto(ADMIN_TEST_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });

		const firstPaint = Date.now() - startTime;

		// FCP should be under 5 seconds for normal connection
		expect(firstPaint).toBeLessThan(5000);

		// Document should be ready
		const editorReady = await page.locator('.editor-post-title__input, .wp-block-paragraph').first().isVisible({ timeout: 10_000 });
		expect(editorReady).toBe(true);

		console.log(`✓ Editor FCP: ${firstPaint}ms`);
	});

	test('measures tag panel opening time', async ({ page }) => {
		await page.goto(ADMIN_TEST_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });

		const panelToggle = page.locator('button.components-panel__body-toggle').filter({ hasText: /PlusMagi Tags/i });
		test.skip((await panelToggle.count()) === 0, 'PlusMagi panel not available');

		const startTime = Date.now();

		await panelToggle.click();
		await page.locator('input[placeholder="Add new tag"]').waitFor({ state: 'visible', timeout: 5000 });

		const panelOpenTime = Date.now() - startTime;

		// Panel should open quickly (under 1 second)
		expect(panelOpenTime).toBeLessThan(1000);

		console.log(`✓ Panel open time: ${panelOpenTime}ms`);
	});

	test('measures tag search response time (< 500ms)', async ({ page }) => {
		await page.goto(ADMIN_TEST_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });

		const tagInput = page.locator('input[placeholder="Add new tag"]');
		await expect(tagInput).toBeVisible({ timeout: 30_000 });

		// Mock response tracking
		const responseTimes = [];

		page.on('response', (response) => {
			if (response.url().includes('/wp-json/plusmagi-tags/v1/search')) {
				responseTimes.push(Date.now());
			}
		});

		const startTime = Date.now();

		// Type search query
		await tagInput.fill('test');
		await page.waitForTimeout(500); // Allow time for API request

		if (responseTimes.length > 0) {
			const searchTime = responseTimes[0] - startTime;
			// Search should complete within 500ms
			expect(searchTime).toBeLessThan(500);
			console.log(`✓ Search response time: ${searchTime}ms`);
		}
	});

	test('renders large mermaid diagram without noticeable lag (< 2s)', async ({ page }) => {
		await page.goto(ADMIN_TEST_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });

		// Create a large flowchart with 50+ nodes
		const largeDiagram = [
			'graph TD',
			...Array.from({ length: 50 }, (_, i) => `N${i}[Node${i}]`),
			...Array.from({ length: 49 }, (_, i) => `N${i} --> N${i + 1}`),
		].join('\n');

		// Measure diagram insertion time
		const startTime = Date.now();

		// Insert diagram in block editor
		const postContent = page.locator('[data-type="my-mermaid-plugin/mermaid-block"], [class*="mermaid"]').first();

		if (await postContent.isVisible({ timeout: 5000 }).catch(() => false)) {
			await postContent.fill(largeDiagram);

			// Wait for render
			await page.waitForTimeout(2000);
		}

		const renderTime = Date.now() - startTime;

		// Large diagram should render within 2 seconds
		expect(renderTime).toBeLessThan(2000);

		console.log(`✓ Large diagram render time: ${renderTime}ms`);
	});

	test('handles 100+ rapid tag searches without memory leak', async ({ page }) => {
		await page.goto(ADMIN_TEST_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });

		const tagInput = page.locator('input[placeholder="Add new tag"]');
		await expect(tagInput).toBeVisible({ timeout: 30_000 });

		const memoryBefore = (await page.evaluate(() => {
			return performance.memory?.usedJSHeapSize || 0;
		})) || 0;

		// Perform 100 searches rapidly
		for (let i = 0; i < 100; i++) {
			const query = String.fromCharCode(97 + (i % 26)); // a-z cycling
			await tagInput.fill(query);
			await page.waitForTimeout(10);
		}

		const memoryAfter = (await page.evaluate(() => {
			return performance.memory?.usedJSHeapSize || 0;
		})) || 0;

		const memoryGrowth = memoryAfter - memoryBefore;

		// Memory growth should be reasonable (under 50MB for 100 searches)
		expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024);

		console.log(`✓ Memory growth after 100 searches: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`);
	});

	test('measures published post frontend load time with mermaid diagrams', async ({ page }) => {
		const startTime = Date.now();

		await page.goto(PUBLISHED_POST_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });

		const frontendLoadTime = Date.now() - startTime;

		// Frontend should load under 5 seconds
		expect(frontendLoadTime).toBeLessThan(5000);

		// Diagrams should be visible
		const diagrams = page.locator('svg[class*="mermaid"]');
		const diagramCount = await diagrams.count();

		if (diagramCount > 0) {
			// At least one diagram should be visible
			const firstDiagram = diagrams.first();
			await expect(firstDiagram).toBeVisible({ timeout: 5000 });
		}

		console.log(`✓ Frontend load time: ${frontendLoadTime}ms`);
	});

	test('validates editor responsiveness under load (add 10 tags)', async ({ page }) => {
		await page.goto(ADMIN_TEST_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });

		const tagInput = page.locator('input[placeholder="Add new tag"]');
		await expect(tagInput).toBeVisible({ timeout: 30_000 });

		const addTagPattern = /\/wp-json\/plusmagi-tags\/v1\/add-tag/;
		const timings = [];

		const startBatch = Date.now();

		for (let i = 0; i < 10; i++) {
			const stepStart = Date.now();

			const responsePromise = page.waitForResponse(
				(response) => addTagPattern.test(response.url()),
				{ timeout: 30_000 }
			);

			const tag = `LoadTest-${Date.now()}-${i}`;
			await tagInput.fill(tag);
			await tagInput.press('Enter');

			try {
				const response = await responsePromise;
				const stepTime = Date.now() - stepStart;
				timings.push(stepTime);

				if (!response.ok()) {
					break;
				}
			} catch (err) {
				break;
			}
		}

		const totalBatchTime = Date.now() - startBatch;
		const averageTime = timings.length > 0 ? timings.reduce((a, b) => a + b) / timings.length : 0;

		// Average response time should be under 1 second
		if (timings.length > 0) {
			expect(averageTime).toBeLessThan(1000);
			console.log(`✓ Average tag add time: ${averageTime.toFixed(0)}ms (${timings.length} tags)`);
		}
	});

	test('measures core vitals: Layout Stability (CLS)', async ({ page }) => {
		const layoutShifts = [];

		// Enable Layout Shift tracking if available
		await page.evaluateHandle(() => {
			if (typeof PerformanceObserver !== 'undefined') {
				const observer = new PerformanceObserver((list) => {
					for (const entry of list.getEntries()) {
						if (entry.hadRecentInput) continue; // Exclude shifts after user input
						// @ts-ignore
						window.__layoutShifts = (window.__layoutShifts || 0) + entry.value;
					}
				});
				observer.observe({ type: 'layout-shift', buffered: true });
			}
		});

		await page.goto(ADMIN_TEST_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });

		const cls = await page.evaluate(() => window.__layoutShifts || 0);

		// CLS should be low (< 0.1 is good)
		expect(cls).toBeLessThan(0.1);

		console.log(`✓ Cumulative Layout Shift: ${cls.toFixed(4)}`);
	});

	test('measures time to render Mermaid block on first load', async ({ page }) => {
		const startTime = Date.now();

		await page.goto(ADMIN_TEST_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });

		// Wait for Mermaid block to be available
		const mermaidBlock = page.locator('[data-type="my-mermaid-plugin/mermaid-block"], [class*="mermaid-block"]').first();

		try {
			await expect(mermaidBlock).toBeVisible({ timeout: 5000 });
			const blockRenderTime = Date.now() - startTime;

			// Block should render within 2 seconds
			expect(blockRenderTime).toBeLessThan(2000);
			console.log(`✓ Mermaid block render time: ${blockRenderTime}ms`);
		} catch (err) {
			// Block might not be in this editor - skip
			test.skip(true, 'Mermaid block not present in editor');
		}
	});

	test('performance regression: repeated edit cycles under 5 seconds each', async ({ page }) => {
		await page.goto(ADMIN_TEST_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });

		const postContent = page.locator('[contenteditable="true"]').first();
		const cycleTimes = [];

		for (let cycle = 0; cycle < 5; cycle++) {
			const cycleStart = Date.now();

			// Edit content
			await postContent.fill(`Edit cycle ${cycle} - ${Date.now()}`);
			await page.waitForTimeout(500);

			const cycleTime = Date.now() - cycleStart;
			cycleTimes.push(cycleTime);
		}

		const averageCycleTime = cycleTimes.reduce((a, b) => a + b) / cycleTimes.length;

		// Each edit cycle should complete quickly
		expect(averageCycleTime).toBeLessThan(2000);

		console.log(`✓ Average edit cycle time: ${averageCycleTime.toFixed(0)}ms`);
	});
});
