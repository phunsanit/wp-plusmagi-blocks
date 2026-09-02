const { test, expect } = require('@playwright/test');
const path = require('path');
const esbuild = require('esbuild');

const SVG_SCRIPT_PATH = path.resolve(__dirname, '../../SVN/trunk/js/plusmagi-svg.js');

let cachedReactBundle = '';

async function getReactBundle() {
	if (cachedReactBundle) {
		return cachedReactBundle;
	}

	const result = await esbuild.build({
		stdin: {
			contents: `
				import * as React from 'react';
				import { createRoot } from 'react-dom/client';
				window.React = React;
				window.ReactDOM = { createRoot };
			`,
			resolveDir: path.resolve(__dirname, '../../'),
			loader: 'js',
		},
		bundle: true,
		format: 'iife',
		write: false,
		platform: 'browser',
	});

	cachedReactBundle = result.outputFiles[0].text;
	return cachedReactBundle;
}

async function openSvgEditor(page, source = '') {
	await page.setContent('<!doctype html><html><body><div id="root"></div></body></html>');
	await page.addScriptTag({ content: await getReactBundle() });
	await page.addScriptTag({ content: `
		window.__plusmagiBlocks = {};
		window.wp = {
			element: { createElement: React.createElement },
			blockEditor: { useBlockProps: (props) => props || {} },
			components: {
				Notice: ({ children }) => React.createElement('div', { role: 'alert' }, children),
				TextareaControl: ({ label, help, value, onChange, placeholder }) => React.createElement(
					'label',
					null,
					label,
					React.createElement('textarea', { value, placeholder, onChange: (event) => onChange(event.target.value) }),
					React.createElement('span', null, help),
				),
			},
			blocks: {
				registerBlockType(name, config) { window.__plusmagiBlocks[name] = config; },
			},
		};
	` });
	await page.addScriptTag({ path: SVG_SCRIPT_PATH });
	await page.evaluate((svg) => {
		const config = window.__plusmagiBlocks['plusmagi-blocks/svg'];
		const root = window.ReactDOM.createRoot(document.getElementById('root'));
		const Editor = config.edit;
		root.render(React.createElement(Editor, {
			attributes: { svg },
			setAttributes: (attributes) => { window.__updatedAttributes = attributes; },
		}));
	}, source);

	return page.evaluate(() => window.__plusmagiBlocks['plusmagi-blocks/svg']);
}

test.describe('SVG Block', () => {
	test('registers as a dynamic SVG block and updates its source', async ({ page }) => {
		const config = await openSvgEditor(page);

		expect(config.title).toBe('PlusMagi - SVG');
		expect(config.keywords).toContain('svg');
		expect(await page.evaluate(() => typeof window.__plusmagiBlocks['plusmagi-blocks/svg'].save)).toBe('function');
		expect(await page.evaluate(() => window.__plusmagiBlocks['plusmagi-blocks/svg'].save())).toBeNull();

		await page.locator('textarea').fill('<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" /></svg>');
		await expect.poll(() => page.evaluate(() => window.__updatedAttributes)).toEqual({
			svg: '<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" /></svg>',
		});
	});

	test('previews SVG as an image without executing embedded scripts', async ({ page }) => {
		const source = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><script>window.__svgScriptExecuted=true</script><rect width="10" height="10" /></svg>';
		await openSvgEditor(page, source);

		await expect(page.locator('.plusmagi-svg-preview img')).toHaveAttribute('src', /^data:image\/svg\+xml/);
		expect(await page.evaluate(() => window.__svgScriptExecuted || false)).toBe(false);
	});

	test('shows an error instead of previewing non-SVG markup', async ({ page }) => {
		await openSvgEditor(page, '<div>Not SVG</div>');

		await expect(page.getByRole('alert')).toContainText('starts with an <svg> element');
		await expect(page.locator('.plusmagi-svg-preview')).toHaveCount(0);
	});
});