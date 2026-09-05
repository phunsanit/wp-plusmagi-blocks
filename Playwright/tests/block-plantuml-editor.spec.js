const { test, expect } = require('@playwright/test');
const path = require('path');
const esbuild = require('esbuild');

const PLANTUML_SCRIPT_PATH = path.resolve(__dirname, '../../SVN/trunk/js/plusmagi-plantuml.js');

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

async function openPlantUmlEditor(page, attributes = {}) {
	await page.setContent('<!doctype html><html><body><div id="root"></div></body></html>');
	await page.addScriptTag({ content: await getReactBundle() });
	await page.addScriptTag({ content: `
		window.__plusmagiBlocks = {};
		window.wp = {
			element: { createElement: React.createElement, useMemo: React.useMemo },
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
				SelectControl: ({ label, value, options, onChange }) => React.createElement(
					'label',
					null,
					label,
					React.createElement(
						'select',
						{ value, onChange: (event) => onChange(event.target.value) },
						options.map((option) => React.createElement('option', { key: option.value, value: option.value }, option.label)),
					),
				),
			},
			blocks: {
				registerBlockType(name, config) { window.__plusmagiBlocks[name] = config; },
			},
		};
	` });
	await page.addScriptTag({ path: PLANTUML_SCRIPT_PATH });
	await page.evaluate(({ source, format }) => {
		const config = window.__plusmagiBlocks['plusmagi-blocks/plantuml'];
		const root = window.ReactDOM.createRoot(document.getElementById('root'));
		const Editor = config.edit;
		root.render(React.createElement(Editor, {
			attributes: { source, format },
			setAttributes: (attrs) => { window.__updatedAttributes = { ...(window.__updatedAttributes || {}), ...attrs }; },
		}));
	}, { source: attributes.source || '', format: attributes.format || 'svg' });

	return page.evaluate(() => window.__plusmagiBlocks['plusmagi-blocks/plantuml']);
}

test.describe('PlantUML Block', () => {
	test('registers as a dynamic PlantUML block and updates its source', async ({ page }) => {
		const config = await openPlantUmlEditor(page);

		expect(config.title).toBe('PlusMagi - PlantUML');
		expect(config.keywords).toContain('plantuml');
		expect(await page.evaluate(() => typeof window.__plusmagiBlocks['plusmagi-blocks/plantuml'].save)).toBe('function');
		expect(await page.evaluate(() => window.__plusmagiBlocks['plusmagi-blocks/plantuml'].save())).toBeNull();

		await page.locator('textarea').fill('@startuml\nAlice -> Bob\n@enduml');
		await expect.poll(() => page.evaluate(() => window.__updatedAttributes)).toEqual({
			source: '@startuml\nAlice -> Bob\n@enduml',
		});
	});

	test('offers SVG and PNG as image format options', async ({ page }) => {
		await openPlantUmlEditor(page, { source: '@startuml\nAlice -> Bob\n@enduml' });

		await expect(page.locator('select option')).toHaveCount(2);
	});

	test('previews an SVG diagram image by default', async ({ page }) => {
		await openPlantUmlEditor(page, { source: '@startuml\nAlice -> Bob\n@enduml' });

		await expect(page.locator('.plusmagi-plantuml-preview img')).toHaveAttribute(
			'src',
			/^https:\/\/www\.plantuml\.com\/plantuml\/svg\/~h[0-9a-f]+$/,
		);
	});

	test('previews a PNG diagram image when the format attribute is png', async ({ page }) => {
		await openPlantUmlEditor(page, { source: '@startuml\nAlice -> Bob\n@enduml', format: 'png' });

		await expect(page.locator('.plusmagi-plantuml-preview img')).toHaveAttribute(
			'src',
			/^https:\/\/www\.plantuml\.com\/plantuml\/png\/~h[0-9a-f]+$/,
		);
	});

	test('shows an error instead of previewing invalid markup', async ({ page }) => {
		await openPlantUmlEditor(page, { source: 'Not PlantUML' });

		await expect(page.getByRole('alert')).toContainText('starts with @startuml');
		await expect(page.locator('.plusmagi-plantuml-preview')).toHaveCount(0);
	});
});
