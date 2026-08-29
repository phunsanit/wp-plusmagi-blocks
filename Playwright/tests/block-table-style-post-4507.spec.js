// @ts-check
const { test, expect, resolveAdminTestUrl } = require('./helpers/admin-test');
const { TABLE_STYLE_GROUPS, TABLE_STYLE_IDS } = require('./fixtures/table-styles');

const POST_ID = 4507;
const ADMIN_URL = process.env.WP_URL_TEST_ADMIN_TABLE_STYLE || resolveAdminTestUrl(`/wp-admin/post.php?post=${POST_ID}&action=edit`);
const FRONT_URL = process.env.WP_URL_TEST_FRONT_TABLE_STYLE;
const TABLE = {
	head: [{ cells: [
		{ content: 'Header 1', tag: 'th' },
		{ content: 'Header 2', tag: 'th' },
		{ content: 'Header 3', tag: 'th' },
		{ content: 'Header 4', tag: 'th' },
	] }],
	body: [
		{ cells: ['Data 1', 'Data 2', 'Data 3', 'Data 4'].map((content) => ({ content, tag: 'td' })) },
		{ cells: ['Data 5', 'Data 6', 'Data 7', 'Data 8'].map((content) => ({ content, tag: 'td' })) },
		{ cells: ['Data 9', 'Data 10', 'Data 11', 'Data 12'].map((content) => ({ content, tag: 'td' })) },
		{ cells: ['Data 13', 'Data 14', 'Data 15', 'Data 16'].map((content) => ({ content, tag: 'td' })) },
	],
	foot: [{ cells: [{ content: 'Total', tag: 'td', colspan: '4' }] }],
};

test.describe('Table Style Post 4507', () => {
	test.setTimeout(600_000);

	test('writes all styles with paired Banded Columns examples and verifies semantic frontend markup', async ({ page }) => {
		await page.goto(ADMIN_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });

		if (page.url().includes('/wp-login.php')) {
			test.skip(true, 'Admin session is not available in this project/browser.');
		}

		await expect(page.locator('.edit-post-layout, .interface-interface-skeleton').first()).toBeVisible({ timeout: 60_000 });
		await page.waitForFunction(
			() => {
				const tableStyle = window.wp?.blocks?.getBlockType('plusmagi-blocks/table-style');
				const coreTable = window.wp?.blocks?.getBlockType('core/table');
				return Boolean(
					tableStyle
					&& coreTable?.attributes?.plusmagiStyleId
					&& coreTable?.attributes?.plusmagiBandedColumns,
				);
			},
			null,
			{ timeout: 30_000 },
		);

		const savedPost = await page.evaluate(async ({ groups, tableAttributes, totalStyles }) => {
			const { createBlock } = window.wp.blocks;
			const originalTitle = window.wp.data.select('core/editor').getEditedPostAttribute('title');
			let styleIndex = 0;
			const blocks = groups.flatMap(({ heading, styles }) => {
				const groupBlocks = [createBlock('core/heading', { level: 2, content: heading })];

				for (const styleId of styles) {
					const supportsBandedColumns = !heading.startsWith('Plain');
					const innerBlocks = supportsBandedColumns
						? [
							createBlock('core/paragraph', { content: 'Banded Columns: Off', className: 'plusmagi-banded-columns-state' }),
							createBlock('core/table', { ...structuredClone(tableAttributes), className: styleId }),
							createBlock('core/paragraph', { content: 'Banded Columns: On', className: 'plusmagi-banded-columns-state' }),
							createBlock('core/table', { ...structuredClone(tableAttributes), className: `${styleId} is-banded-columns` }),
						]
						: [createBlock('core/table', { ...structuredClone(tableAttributes), className: styleId })];

					groupBlocks.push(createBlock('plusmagi-blocks/table-style', {
						styleId,
						compareBandedColumns: supportsBandedColumns,
					}, innerBlocks));
					styleIndex += 1;

					if (styleIndex < totalStyles) {
						groupBlocks.push(createBlock('core/separator'));
					}
				}

				return groupBlocks;
			});

			window.wp.data.dispatch('core/block-editor').resetBlocks(blocks);
			await window.wp.data.dispatch('core/editor').savePost();

			return {
				originalTitle,
				savedTitle: window.wp.data.select('core/editor').getEditedPostAttribute('title'),
				permalink: window.wp.data.select('core/editor').getPermalink(),
			};
		}, { groups: TABLE_STYLE_GROUPS, tableAttributes: TABLE, totalStyles: TABLE_STYLE_IDS.length });

		expect(savedPost.savedTitle).toBe(savedPost.originalTitle);
		expect(savedPost.permalink).toBeTruthy();
		await expect.poll(() => page.evaluate(() => window.wp.data.select('core/editor').isSavingPost())).toBe(false);
		await page.goto(FRONT_URL || savedPost.permalink, { waitUntil: 'domcontentloaded', timeout: 60_000 });

		const article = page.locator('article').first();
		const tableStyles = article.locator('.wp-block-plusmagi-blocks-table-style');
		const catalogHeadings = article.locator('h2').filter({ hasText: /^(Plain Tables \(9\)|Grid Tables \(49\)|List Tables \(49\))$/ });
		await expect(tableStyles).toHaveCount(107);
		await expect(catalogHeadings).toHaveText(TABLE_STYLE_GROUPS.map(({ heading }) => heading));
		await expect(tableStyles.locator(':scope > h3.plusmagi-table-style-id')).toHaveText(TABLE_STYLE_IDS);
		await expect(article.locator('hr.wp-block-separator')).toHaveCount(106);
		await expect(tableStyles.locator('table')).toHaveCount(205);
		await expect(tableStyles.locator('thead th')).toHaveCount(820);
		await expect(tableStyles.locator('tbody tr')).toHaveCount(820);
		await expect(tableStyles.locator('tbody td')).toHaveCount(3280);
		await expect(tableStyles.locator('tfoot td')).toHaveCount(205);
		expect(await tableStyles.locator('tfoot td').evaluateAll((cells) => (
			cells.every((cell) => cell.getAttribute('colspan') === '4')
		))).toBe(true);
		const bandedStateLabels = tableStyles.locator(':scope > p.plusmagi-banded-columns-state');
		await expect(bandedStateLabels).toHaveCount(196);
		await expect(bandedStateLabels).toHaveText(Array.from(
			{ length: 196 },
			(_, index) => `Banded Columns: ${index % 2 === 0 ? 'Off' : 'On'}`,
		));

		const matchingStyleClasses = await tableStyles.evaluateAll((nodes, styleIds) => nodes.every((node, index) => (
			node.classList.contains(styleIds[index])
		)), TABLE_STYLE_IDS);
		expect(matchingStyleClasses).toBe(true);
		expect(await tableStyles.evaluateAll((nodes) => nodes.slice(9).every((node) => {
			const children = [...node.children];
			return children[0]?.matches('h3.plusmagi-table-style-id')
				&& children[1]?.matches('p.plusmagi-banded-columns-state')
				&& children[1]?.textContent === 'Banded Columns: Off'
				&& children[2]?.matches('.wp-block-table')
				&& children[3]?.matches('p.plusmagi-banded-columns-state')
				&& children[3]?.textContent === 'Banded Columns: On'
				&& children[4]?.matches('.wp-block-table.is-banded-columns');
		}))).toBe(true);

		const computedStyles = await page.evaluate(() => {
			const getTableStyle = (styleId) => {
				const block = document.querySelector(`.wp-block-plusmagi-blocks-table-style.${styleId}`);
				const heading = block?.querySelector('thead th');
				const evenRow = block?.querySelector('tbody tr:nth-child(2)');

				return {
					headingBackground: heading ? getComputedStyle(heading).backgroundColor : '',
					headingBorderStyle: heading ? getComputedStyle(heading).borderTopStyle : '',
					evenRowBackground: evenRow ? getComputedStyle(evenRow).backgroundColor : '',
				};
			};

			return {
				normal: getTableStyle('TableNormal'),
				accentGrid: getTableStyle('GridTable2-Accent2'),
				darkList: getTableStyle('ListTable5Dark-Accent5'),
			};
		});

		expect(computedStyles.normal.headingBorderStyle).toBe('none');
		expect(computedStyles.accentGrid.headingBackground).toBe('rgb(237, 125, 49)');
		expect(computedStyles.accentGrid.evenRowBackground).toBe('rgb(252, 228, 214)');
		expect(computedStyles.darkList.headingBackground).toBe('rgb(47, 84, 150)');
		expect(computedStyles.darkList.evenRowBackground).toBe('rgb(180, 198, 231)');

		const bandedColumnBackgrounds = await page.evaluate(() => {
			const wrapper = document.querySelector('.wp-block-plusmagi-blocks-table-style.GridTable2-Accent2');
			const tableFigures = wrapper ? [...wrapper.querySelectorAll('.wp-block-table')] : [];
			return tableFigures.map((tableFigure) => {
				const cell = tableFigure.querySelector('tbody tr:first-child td:nth-child(2)');
				return cell ? getComputedStyle(cell).backgroundColor : '';
			});
		});
		expect(bandedColumnBackgrounds).toEqual(['rgba(0, 0, 0, 0)', 'rgb(252, 228, 214)']);
	});
});