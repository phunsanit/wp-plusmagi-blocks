const { test: baseTest, expect } = require('@playwright/test');
const path = require('path');
const esbuild = require('esbuild');

const DESCRIPTION_LIST_SCRIPT_PATH = path.resolve(__dirname, '../../../SVN/trunk/js/plusmagi-dl.js');

const test = baseTest;

let cachedReactBundle = '';

// Bundle real React/ReactDOM for the browser so the compiled block (which calls
// the global `React.createElement`, exactly like it does inside wp-admin) can run.
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
			resolveDir: path.resolve(__dirname, '../../../'),
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

// Minimal `wp.element` / `wp.components` / `wp.blocks` stand-ins so the real
// compiled block script can register itself outside of a live WordPress admin.
const WP_STUBS_SCRIPT = `
	window.__plusmagiBlocks = window.__plusmagiBlocks || {};

	function plusmagiField(tagName) {
		return function Field({ label, value, onChange }) {
			return React.createElement(
				'label',
				{ className: 'plusmagi-test-field' },
				React.createElement('span', null, label),
				React.createElement(tagName, {
					value: value || '',
					onChange: (event) => onChange(event.target.value),
				})
			);
		};
	}

	window.wp = window.wp || {};
	window.wp.element = {
		createElement: React.createElement,
		Fragment: React.Fragment,
	};
	window.wp.components = {
		TextControl: plusmagiField('input'),
		TextareaControl: plusmagiField('textarea'),
		Button: function Button({ children, onClick, disabled, className }) {
			return React.createElement('button', { onClick, disabled, className, type: 'button' }, children);
		},
	};
	window.wp.i18n = { __: (value) => value };
	window.wp.blocks = {
		registerBlockType(name, config) {
			window.__plusmagiBlocks[name] = config;
		},
	};
`;

// Controlled wrapper: owns "attributes" state the same way the block editor does,
// then renders the real block's `edit` function with { attributes, setAttributes }.
const MOUNT_EDITOR_SCRIPT = `
	(function mountDescriptionListEditor() {
		const config = window.__plusmagiBlocks['plusmagi-blocks/description-list'];
		if (!config) {
			throw new Error('plusmagi-blocks/description-list block was not registered.');
		}

		const container = document.getElementById('root');
		const root = ReactDOM.createRoot(container);
		let attributes = { items: config.attributes.items.default };

		function render() {
			const setAttributes = (nextAttrs) => {
				attributes = { ...attributes, ...nextAttrs };
				render();
			};
			root.render(React.createElement(config.edit, { attributes, setAttributes }));
		}

		render();
		window.__plusmagiGetAttributes = () => attributes;
	})();
`;

const MOUNT_SAVE_SCRIPT = `
	(function mountDescriptionListSave() {
		const config = window.__plusmagiBlocks['plusmagi-blocks/description-list'];
		const container = document.getElementById('root');
		const root = ReactDOM.createRoot(container);
		window.__plusmagiRenderSave = (attributes) => root.render(React.createElement(config.save, { attributes }));
	})();
`;

async function openDescriptionListEditor(page) {
	await page.setContent('<!doctype html><html><body><div id="root"></div></body></html>');
	await page.addScriptTag({ content: await getReactBundle() });
	await page.addScriptTag({ content: WP_STUBS_SCRIPT });
	await page.addScriptTag({ path: DESCRIPTION_LIST_SCRIPT_PATH });

	return page.evaluate(() => window.__plusmagiBlocks['plusmagi-blocks/description-list']);
}

function itemRow(items, index) {
	return items.nth(index);
}

async function fillTerm(items, index, value) {
	await itemRow(items, index).locator('input').first().fill(value);
}

async function fillDescription(items, index, value) {
	await itemRow(items, index).locator('input').nth(1).fill(value);
}

async function addDescription(items, index) {
	await itemRow(items, index).locator('.plusmagi-description-list-add-description').click();
}

async function fillDescriptionAt(items, itemIndex, descriptionIndex, value) {
	await itemRow(items, itemIndex).locator('input').nth(descriptionIndex + 1).fill(value);
}

async function removeItem(items, index) {
	await itemRow(items, index).locator('.plusmagi-description-list-remove-item').click();
}

async function getAttributes(page) {
	return page.evaluate(() => window.__plusmagiGetAttributes());
}

async function renderSavedList(page, attributes) {
	await page.addScriptTag({ content: MOUNT_SAVE_SCRIPT });
	await page.evaluate((nextAttributes) => window.__plusmagiRenderSave(nextAttributes), attributes);
}

module.exports = {
	test,
	expect,
	openDescriptionListEditor,
	itemRow,
	fillTerm,
	fillDescription,
	addDescription,
	fillDescriptionAt,
	removeItem,
	getAttributes,
	renderSavedList,
};
