const { test, expect } = require('@playwright/test');
const path = require('path');
const esbuild = require('esbuild');

const THESAURUS_SCRIPT_PATH = path.resolve(__dirname, '../../SVN/trunk/js/plusmagi-thesaurus.js');

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

const WP_STUBS_SCRIPT = `
	window.__plusmagiBlocks = window.__plusmagiBlocks || {};
	window.wp = window.wp || {};
	window.wp.element = {
		createElement: React.createElement,
		Fragment: React.Fragment,
		useState: React.useState,
	};
	window.wp.i18n = { __: (value) => value };
	window.wp.blockEditor = {
		useBlockProps: (props) => props || {},
	};
	window.wp.editor = window.wp.blockEditor;
	window.wp.components = {
		TextControl: function TextControl() { return null; },
		Button: function Button() { return null; },
		Modal: function Modal() { return null; },
		Notice: function Notice() { return null; },
	};
	window.wp.blocks = {
		registerBlockType(name, config) {
			window.__plusmagiBlocks[name] = config;
		},
	};
`;

async function renderSavedMarkup(page, attributes) {
	await page.setContent('<!doctype html><html><body><div id="root"></div></body></html>');
	await page.addScriptTag({ content: await getReactBundle() });
	await page.addScriptTag({ content: WP_STUBS_SCRIPT });
	await page.addScriptTag({ path: THESAURUS_SCRIPT_PATH });

	await page.evaluate((attrs) => {
		const block = window.__plusmagiBlocks['plusmagi-blocks/thesaurus'];
		if (!block || typeof block.save !== 'function') {
			throw new Error('plusmagi-blocks/thesaurus block is not registered.');
		}

		const container = document.getElementById('root');
		const root = window.ReactDOM.createRoot(container);
		const element = block.save({ attributes: attrs });
		root.render(element);
	}, attributes);

	await page.waitForSelector('.plusmagi-thesaurus-container');
}

test.describe('Thesaurus Block - Semantic Attributes', () => {
	test('renders default semantic heading and linked description list', async ({ page }) => {
		await renderSavedMarkup(page, {
			heading: 'Semantic Thesaurus',
			entries: [
				{
					term: 'Fast',
					pos: 'adj.',
					definition: 'Moving or capable of moving at high speed.',
					synonyms: 'quick, rapid, swift, speedy',
					antonyms: 'slow, sluggish',
				},
			],
		});

		const heading = page.locator('.plusmagi-thesaurus-container h2').first();
		await expect(heading).toHaveText('Semantic Thesaurus');

		const headingId = await heading.getAttribute('id');
		expect(headingId).toBeTruthy();

		await expect(page.locator(`dl[aria-labelledby="${headingId}"]`)).toHaveCount(1);
	});

	test('renders schema.org and accessibility attributes for entries', async ({ page }) => {
		await renderSavedMarkup(page, {
			heading: 'ศัพท์ใกล้เคียง',
			entries: [
				{
					term: 'Abundant',
					pos: 'adj.',
					definition: 'Existing or available in large quantities; plentiful.',
					synonyms: 'plentiful, copious, ample',
					antonyms: 'scarce, sparse',
				},
			],
		});

		await expect(page.locator('.plusmagi-thesaurus-container h2')).toHaveText('ศัพท์ใกล้เคียง');

		const entry = page.locator('.plusmagi-thesaurus-entry').first();
		await expect(entry).toHaveAttribute('itemscope', '');
		await expect(entry).toHaveAttribute('itemtype', 'https://schema.org/DefinedTerm');
		await expect(entry).toHaveAttribute('data-term', 'abundant');

		await expect(entry.locator('dt dfn[itemprop="name"]')).toHaveText('Abundant');
		await expect(entry.locator('dd[data-type="definition"][itemprop="description"]')).toHaveCount(1);
		await expect(entry.locator('dd[data-type="synonyms"][aria-label="Synonyms for Abundant"]')).toHaveCount(1);
		await expect(entry.locator('dd[data-type="antonyms"][aria-label="Antonyms for Abundant"]')).toHaveCount(1);
		await expect(entry.locator('ul.tag-list[role="list"] li.tag[itemprop="sameAs"]')).toHaveCount(3);
	});

	test('sorts terms alphabetically and renders semantic relationships', async ({ page }) => {
		await renderSavedMarkup(page, {
			heading: 'Thesaurus',
			entries: [
				{ term: 'Zebra', broaderTerms: 'animal', narrowerTerms: 'plains zebra', relatedTerms: 'horse, donkey' },
				{ term: 'apple', broaderTerms: 'fruit', narrowerTerms: 'gala apple', relatedTerms: 'pear' },
				{ term: 'Banana', broaderTerms: 'fruit', narrowerTerms: 'plantain', relatedTerms: 'mango' },
			],
		});

		await expect(page.locator('.plusmagi-thesaurus-entry dfn')).toHaveText(['apple', 'Banana', 'Zebra']);

		const appleEntry = page.locator('.plusmagi-thesaurus-entry').first();
		await expect(appleEntry.locator('dd[data-type="broader-terms"] .label')).toHaveText('Broader Terms:');
		await expect(appleEntry.locator('dd[data-type="narrower-terms"] .label')).toHaveText('Narrower Terms:');
		await expect(appleEntry.locator('dd[data-type="related-terms"] .label')).toHaveText('Related Terms:');
		await expect(appleEntry.locator('dd[data-type="related-terms"] li.tag')).toHaveText(['pear']);
	});
});
