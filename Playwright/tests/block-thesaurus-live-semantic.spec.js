// @ts-check
const { test, expect, resolveAdminTestUrl } = require('./helpers/admin-test');

test.describe('Thesaurus Block - Live Semantic Output', () => {
	test.setTimeout(600_000);

	const NEW_POST_URL = resolveAdminTestUrl('/wp-admin/post-new.php');

	async function assertVisibleOrThrow(locator, timeoutMs, message) {
		const visible = await locator.first().isVisible({ timeout: timeoutMs }).catch(() => false);
		if (!visible) {
			throw new Error(message);
		}
	}

	async function getEditorScope(page) {
		const inlineEditorRoot = page.locator('.editor-styles-wrapper, .block-editor-writing-flow').first();
		const hasInlineEditor = await inlineEditorRoot.isVisible({ timeout: 3000 }).catch(() => false);
		if (hasInlineEditor) {
			return page;
		}

		await expect(page.frameLocator('iframe').first().locator('body').first()).toBeVisible({ timeout: 20_000 });
		return page.frameLocator('iframe').first();
	}

	async function openEditor(page) {
		await page.goto(NEW_POST_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
		await page.locator('.edit-post-layout').first().waitFor({ state: 'visible', timeout: 60_000 });

		const closeModal = page.locator('.components-modal__header button').first();
		if (await closeModal.isVisible({ timeout: 2000 }).catch(() => false)) {
			await closeModal.click();
		}
	}

	async function insertThesaurusBlock(page) {
		const inserter = page
			.locator('button[aria-label="Block Inserter"], button[aria-label="Add block"], button[aria-label="Add Block"], button[aria-label="ตัวแทรกบล็อก"], button[aria-label="เพิ่มบล็อก"]')
			.first();

		if (await inserter.isVisible({ timeout: 5000 }).catch(() => false)) {
			await inserter.click();
		}

		const searchInput = page.locator('.block-editor-inserter__search input, .components-search-control__input').first();
		await expect(searchInput).toBeVisible({ timeout: 15_000 });
		await searchInput.fill('Thesaurus');

		const blockButton = page.locator(
			'button:has-text("Thesaurus Entry"), button:has-text("Thesaurus"), button:has-text("ศัพท์ใกล้เคียง"), button:has-text("คำพ้องความหมาย")'
		).first();
		await assertVisibleOrThrow(
			blockButton,
			5000,
			'Thesaurus block is not available in this environment (tried English/Thai labels).'
		);
		await blockButton.click();

		const scope = await getEditorScope(page);
		const block = scope.locator('[data-type="my-thesaurus/entry"]').first();
		await expect(block).toBeVisible({ timeout: 20_000 });
		return { scope, block };
	}

	async function addEntry(scope, entry) {
		const addEntryButton = scope.getByRole('button', { name: /\+ Add Thesaurus Entry|เพิ่มรายการศัพท์/i }).first();
		await assertVisibleOrThrow(addEntryButton, 15_000, 'Cannot find add-entry button in Thesaurus block.');
		await addEntryButton.click();
		await expect(scope.getByRole('dialog')).toBeVisible({ timeout: 15_000 });

		await scope.locator('input[placeholder="e.g., Fast"], input[placeholder*="เช่น"]').first().fill(entry.term);
		if (entry.pos) {
			await scope.locator('input[placeholder="e.g., adj., noun, verb"], input[placeholder*="adj."]').first().fill(entry.pos);
		}
		await scope.locator('input[placeholder="The meaning of the term"], input[placeholder*="meaning"]').first().fill(entry.definition);
		if (entry.synonyms) {
			await scope.locator('input[placeholder="e.g., quick, rapid, swift, speedy"], input[placeholder*="quick"]').first().fill(entry.synonyms);
		}
		if (entry.antonyms) {
			await scope.locator('input[placeholder="e.g., slow, sluggish"], input[placeholder*="slow"]').first().fill(entry.antonyms);
		}

		await scope.getByRole('button', { name: /Save Entry|บันทึกรายการ/i }).first().click();
		await expect(scope.getByRole('dialog')).toHaveCount(0);
	}

	async function setHeadingInInspector(page, headingText) {
		const headingInput = page.locator('.block-editor-block-inspector input[type="text"]').first();
		if (await headingInput.isVisible({ timeout: 5000 }).catch(() => false)) {
			await headingInput.fill(headingText);
			return;
		}

		const settingsButton = page
			.locator('button[aria-label="Settings"], button[aria-label="Document settings"], button[aria-label="Block settings"], button[aria-label="การตั้งค่า"], button[aria-label="การตั้งค่าเอกสาร"], button[aria-label="การตั้งค่าบล็อก"]')
			.first();
		if (await settingsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
			const expanded = await settingsButton.getAttribute('aria-expanded');
			if (expanded === 'false') {
				await settingsButton.click();
			}
		}

		await expect(page.locator('.block-editor-block-inspector')).toBeVisible({ timeout: 15_000 });
		const headingLabelInput = page.getByLabel(/Heading|หัวข้อ/i).first();
		await headingLabelInput.fill(headingText);
	}

	async function publishAndOpenFront(page) {
		const titleInput = page.locator('h1.editor-post-title__input, textarea[aria-label="Add title"]').first();
		if (await titleInput.isVisible({ timeout: 5000 }).catch(() => false)) {
			const title = await titleInput.inputValue();
			if (!title.trim()) {
				await titleInput.fill(`Playwright Thesaurus ${Date.now()}`);
			}
		}

		const publishToggle = page.locator('button.editor-post-publish-panel__toggle, button:has-text("Publish"), button:has-text("เผยแพร่")').first();
		await expect(publishToggle).toBeVisible({ timeout: 20_000 });
		await publishToggle.click();

		const confirmPublish = page
			.locator('button.editor-post-publish-button, button.editor-post-publish-button__button')
			.filter({ hasText: /Publish|เผยแพร่/i })
			.last();
		await expect(confirmPublish).toBeVisible({ timeout: 20_000 });
		await confirmPublish.click();

		await page.locator('.editor-post-publish-panel__postpublish-header, .components-snackbar-list').first().waitFor({ state: 'visible', timeout: 30_000 });

		const viewPostLink = page
			.locator('a.editor-post-publish-panel__postpublish-button, a.components-button')
			.filter({ hasText: /View Post|View post|ดูโพสต์|ดูเรื่อง/i })
			.first();
		await expect(viewPostLink).toBeVisible({ timeout: 20_000 });

		const href = await viewPostLink.getAttribute('href');
		if (!href) {
			throw new Error('Cannot resolve published post URL from post-publish panel.');
		}
		await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 60_000 });
	}

	test('publishes thesaurus markup with semantic attributes on frontend', async ({ page }) => {
		await openEditor(page);
		const { scope, block } = await insertThesaurusBlock(page);
		await block.click();
		await setHeadingInInspector(page, 'ศัพท์ใกล้เคียง');
		await addEntry(scope, {
			term: 'Fast',
			pos: 'adj.',
			definition: 'Moving or capable of moving at high speed.',
			synonyms: 'quick, rapid, swift, speedy',
			antonyms: 'slow, sluggish',
		});

		await publishAndOpenFront(page);

		const container = page.locator('.thesaurus-container').first();
		await expect(container).toBeVisible({ timeout: 30_000 });
		await expect(container.locator('h2')).toHaveText('ศัพท์ใกล้เคียง');

		const headingId = await container.locator('h2').first().getAttribute('id');
		expect(headingId).toBeTruthy();
		await expect(container.locator(`dl[aria-labelledby="${headingId}"]`)).toHaveCount(1);

		const entry = container.locator('.thesaurus-entry').first();
		await expect(entry).toHaveAttribute('itemtype', 'https://schema.org/DefinedTerm');
		await expect(entry).toHaveAttribute('data-term', 'fast');
		await expect(entry.locator('dt dfn[itemprop="name"]')).toHaveText('Fast');
		await expect(entry.locator('dd[data-type="definition"][itemprop="description"]')).toContainText('Moving or capable of moving at high speed.');
		await expect(entry.locator('dd[data-type="synonyms"][aria-label="Synonyms for Fast"] ul.tag-list[role="list"] li.tag[itemprop="sameAs"]')).toHaveCount(4);
		await expect(entry.locator('dd[data-type="antonyms"][aria-label="Antonyms for Fast"] ul.tag-list[role="list"] li.tag')).toHaveCount(2);
	});
});
