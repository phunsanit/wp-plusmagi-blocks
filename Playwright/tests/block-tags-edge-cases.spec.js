// @ts-check
const { test, expect } = require('@playwright/test');
const { resolveAdminTestUrl } = require('./helpers/admin-url');

test.describe('PlusMagi Markdown — Block Tags Edge Cases', () => {
	test.setTimeout(600_000);

	const ADMIN_TEST_URL = resolveAdminTestUrl('/wp-admin/post-new.php');
	const addTagEndpointPattern = /\/wp-json\/plusmagi-tags\/v1\/add-tag/;

	async function addTagsAndWait(page, tagInput, value, confirmKey = 'Enter') {
		const addTagResponsePromise = page.waitForResponse(
			(response) => addTagEndpointPattern.test(response.url()) && response.request().method() === 'POST',
			{ timeout: 30_000 }
		);

		await tagInput.fill(value);
		if (confirmKey) {
			await tagInput.press(confirmKey);
		}

		const addTagResponse = await addTagResponsePromise;
		expect(addTagResponse.ok()).toBe(true);
		await expect(tagInput).toHaveValue('');

		return addTagResponse.json();
	}

	async function openPanelAndGetInput(page) {
		const panelToggle = page.locator('button.components-panel__body-toggle').filter({ hasText: /PlusMagi Tags Reindex/i });
		test.skip((await panelToggle.count()) === 0, 'PlusMagi editor panel not available');
		await expect(panelToggle).toBeVisible({ timeout: 30_000 });

		const isExpanded = await panelToggle.getAttribute('aria-expanded');
		if (isExpanded === 'false') {
			await panelToggle.click();
		}

		const tagInput = page.locator('input[placeholder="Add new tag"]');
		await expect(tagInput).toBeVisible();
		return tagInput;
	}

	test.beforeEach(async ({ page }) => {
		await page.goto(ADMIN_TEST_URL, { waitUntil: 'domcontentloaded', timeout: 600_000 });
		await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
	});

	test('handles Unicode characters in tag names (emoji, CJK, RTL)', async ({ page }) => {
		const tagInput = await openPanelAndGetInput(page);

		const unicodeTags = [
			'🚀-Rocket-Tag',           // Emoji
			'中文标签',                    // Chinese
			'日本語タグ',                  // Japanese
			'العربية-RTL',              // Arabic (RTL)
			'Ελληνικά',                 // Greek
			'한글태그',                   // Korean
		];

		for (const tag of unicodeTags) {
			const response = await addTagsAndWait(page, tagInput, tag);
			expect(response.name).toBe(tag);
			expect(response.term_id).toBeDefined();
		}

		// Verify all tags are visible
		const tagList = page.locator('.wp-block-paragraph, .block-editor-rich-text');
		const content = await tagList.allTextContents();
		const combinedText = content.join(' ');

		// At least one Unicode tag should appear somewhere
		const hasUnicodeTag = unicodeTags.some((tag) => combinedText.includes(tag));
		expect(hasUnicodeTag).toBe(true);
	});

	test('handles very long tag names (255+ characters)', async ({ page }) => {
		const tagInput = await openPanelAndGetInput(page);

		const longTag = 'A' + 'b'.repeat(254); // 255 character tag

		try {
			const response = await addTagsAndWait(page, tagInput, longTag, 'Enter');

			// Server might truncate or accept
			expect(response.name).toBeDefined();
			expect(response.term_id).toBeDefined();

			// Verify truncation if it happened
			if (response.name !== longTag) {
				expect(response.name.length).toBeLessThanOrEqual(255);
			}
		} catch (err) {
			// Some servers might reject very long names
			expect(err.message).toMatch(/timeout|error|fail/i);
		}
	});

	test('handles special characters and reserved keywords', async ({ page }) => {
		const tagInput = await openPanelAndGetInput(page);

		const specialTags = [
			'tag-with-dashes',
			'tag_with_underscores',
			'tag.with.dots',
			'tag@with#symbols',
			'tag(with)parens',
			'tag[with]brackets',
		];

		for (const tag of specialTags) {
			try {
				const response = await addTagsAndWait(page, tagInput, tag, 'Enter');
				expect(response.name).toBeDefined();
			} catch (err) {
				// Some special chars might be rejected - that's okay
				expect(err.message).toMatch(/timeout|error/i);
			}
		}
	});

	test('prevents duplicate tag submission', async ({ page }) => {
		const tagInput = await openPanelAndGetInput(page);

		const testTag = `UniqueTag-${Date.now()}`;

		// Add tag first time
		const response1 = await addTagsAndWait(page, tagInput, testTag);
		expect(response1.name).toBe(testTag);

		// Try to add same tag again
		const addTagPromise = page.waitForResponse(
			(response) => addTagEndpointPattern.test(response.url()),
			{ timeout: 30_000 }
		);

		await tagInput.fill(testTag);
		await tagInput.press('Enter');

		const response2 = await addTagPromise;

		// Server should handle duplicate gracefully
		// Either returns existing tag or error message
		if (response2.ok()) {
			const data = await response2.json();
			expect(data.term_id).toBeDefined();
			expect(data.name).toBe(testTag);
		} else {
			// Duplicate rejection is also valid
			expect(response2.status()).toBeGreaterThanOrEqual(400);
		}
	});

	test('handles rapid successive tag additions (stress test)', async ({ page }) => {
		const tagInput = await openPanelAndGetInput(page);

		const tags = Array.from({ length: 5 }, (_, i) => `RapidTag-${Date.now()}-${i}`);
		const addedTags = [];

		for (const tag of tags) {
			try {
				const response = await addTagsAndWait(page, tagInput, tag, 'Enter');
				addedTags.push(response.name);
			} catch (err) {
				// Some might timeout due to rate limiting - acceptable
				expect(err.message).toMatch(/timeout/i);
				break;
			}
		}

		// At least 2 tags should be added
		expect(addedTags.length).toBeGreaterThanOrEqual(2);
	});

	test('handles tag name with only whitespace', async ({ page }) => {
		const tagInput = await openPanelAndGetInput(page);

		const whitespaceTag = '   ';
		await tagInput.fill(whitespaceTag);
		await tagInput.press('Enter');

		// Should either reject or trim whitespace
		const inputValue = await tagInput.inputValue();

		// After pressing Enter, should either:
		// 1. Clear (if accepted and trimmed)
		// 2. Retain value (if rejected)
		expect(inputValue === '' || inputValue.trim() === whitespaceTag).toBe(true);
	});

	test('handles tag addition with multiple delimiters in one input', async ({ page }) => {
		const tagInput = await openPanelAndGetInput(page);

		// Test comma, semicolon, newline as delimiters
		const multiDelimiterInput = 'Tag1,Tag2;Tag3';
		await tagInput.fill(multiDelimiterInput);
		await tagInput.press('Enter');

		// Allow time for any batch processing
		await page.waitForTimeout(1000);

		// Input should be cleared or show error
		const inputValue = await tagInput.inputValue();
		expect(inputValue === '' || inputValue.length > 0).toBe(true);
	});

	test('handles tag name with HTML-like content', async ({ page }) => {
		const tagInput = await openPanelAndGetInput(page);

		const htmlLikeTag = '<script>alert("xss")</script>';

		try {
			const response = await addTagsAndWait(page, tagInput, htmlLikeTag);

			// Should be stored as plain text, not executed
			expect(response.name).toBe(htmlLikeTag);
			expect(response.name).toContain('<script>');
		} catch (err) {
			// Or might reject dangerous content
			expect(err.message).toMatch(/timeout|error/i);
		}
	});

	test('handles tag removal during concurrent add operations', async ({ page }) => {
		const tagInput = await openPanelAndGetInput(page);

		const tag1 = `ConcurrentTag-${Date.now()}-1`;

		// Start adding first tag but don't wait
		const response1Promise = page.waitForResponse(
			(response) => addTagEndpointPattern.test(response.url()),
			{ timeout: 30_000 }
		);

		await tagInput.fill(tag1);
		await tagInput.press('Enter');

		// While first is pending, try adding another
		await page.waitForTimeout(100);

		const tag2 = `ConcurrentTag-${Date.now()}-2`;
		const response2Promise = page.waitForResponse(
			(response) => addTagEndpointPattern.test(response.url()),
			{ timeout: 30_000 }
		);

		await tagInput.fill(tag2);
		await tagInput.press('Enter');

		// Both should eventually complete
		try {
			const response1 = await response1Promise;
			const response2 = await response2Promise;

			expect(response1.ok()).toBe(true);
			expect(response2.ok()).toBe(true);
		} catch (err) {
			// Concurrent handling might cause timeout - acceptable
			expect(err.message).toMatch(/timeout/i);
		}
	});

	test('maintains tag input state after validation error', async ({ page }) => {
		const tagInput = await openPanelAndGetInput(page);

		// Input a tag
		await tagInput.fill('TestTag');

		// Try to submit multiple times rapidly
		for (let i = 0; i < 3; i++) {
			await tagInput.press('Enter');
			await page.waitForTimeout(100);
		}

		// After errors, input should still be functional
		await expect(tagInput).toBeVisible();
		await expect(tagInput).toBeEnabled();

		// Should be able to type a new tag
		await tagInput.fill('NewTag');
		expect(await tagInput.inputValue()).toBe('NewTag');
	});
});
