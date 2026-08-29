import { createElement, Fragment } from '@wordpress/element';
import { InnerBlocks, BlockControls, RichText, useBlockProps } from '@wordpress/block-editor';
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';

const wpGlobals = window as any;
const createIcon = (path: string) => createElement('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, createElement('path', { d: path }));
const formatIndentIncrease = wpGlobals.wp?.icons?.formatIndentIncrease || createIcon('M4 7.2v1.5h16V7.2H4zm8 8.6h8v-1.5h-8v1.5zm-4-4.6l-4 4 4 4 1-1-3-3 3-3-1-1z');
const formatIndentDecrease = wpGlobals.wp?.icons?.formatIndentDecrease || createIcon('M4 7.2v1.5h16V7.2H4zm8 8.6h8v-1.5h-8v1.5zm-4-4.6l4 4-4 4-1-1 3-3-3-3 1-1z');
const trash = wpGlobals.wp?.icons?.trash || createIcon('M6 7h12v13H6V7zm3-3h6l1 1h4v2H4V5h4l1-1z');

const TERM_BLOCK = 'plusmagi-blocks/description-term';
const DD_BLOCK = 'plusmagi-blocks/description';
const LIST_BLOCK = 'plusmagi-blocks/description-list';
const DD_ALLOWED_BLOCKS = [
	'core/paragraph',
	'core/list',
	'core/heading',
	'core/image',
	'core/quote',
	'core/code',
];

function DescriptionEditor({ clientId, attributes, setAttributes }: any) {
	const blockProps = useBlockProps({ className: 'plusmagi-description-list-item' });
	const indent = () => wpGlobals.wp.data.dispatch('core/block-editor').replaceBlocks(clientId, wpGlobals.wp.blocks.createBlock(DD_BLOCK, {}, [wpGlobals.wp.blocks.createBlock('core/paragraph', { content: attributes.term || '' })]));
	const addNextTerm = (event: any) => {
		if (event.key !== 'Enter') {
			return;
		}

		event.preventDefault();
		const parentId = wpGlobals.wp.data.select('core/block-editor').getBlockParents(clientId).slice(-1)[0];
		const parentBlocks = wpGlobals.wp.data.select('core/block-editor').getBlocks(parentId);
		const index = parentBlocks.findIndex((block: any) => block.clientId === clientId);
		wpGlobals.wp.data.dispatch('core/block-editor').insertBlocks(
			wpGlobals.wp.blocks.createBlock(TERM_BLOCK, {}, [wpGlobals.wp.blocks.createBlock(DD_BLOCK)]),
			index + 1,
			parentId
		);
	};

	return createElement(
		'div',
		blockProps,
		createElement(BlockControls, null, createElement(ToolbarGroup, null, createElement(ToolbarButton, {
			icon: formatIndentIncrease,
			title: 'Indent',
			label: 'Indent',
			onClick: indent,
		}), createElement(ToolbarButton, {
			icon: trash,
			title: 'Remove term',
			label: 'Remove term',
			onClick: () => wpGlobals.wp.data.dispatch('core/block-editor').removeBlocks(clientId),
		}))),
		createElement('span', { className: 'plusmagi-description-list-type-label plusmagi-description-list-type-label-dt' }, 'Term'),
		createElement(RichText, {
			tagName: 'div',
			className: 'plusmagi-description-list-term-editor',
			value: attributes.term || '',
			onChange: (term: string) => setAttributes({ term }),
			placeholder: 'Term',
			onKeyDown: addNextTerm,
		}),
		createElement(InnerBlocks, { allowedBlocks: [DD_BLOCK], template: [[DD_BLOCK]], templateLock: false }),
	);
}

function DescriptionSave({ attributes }: any) {
	return createElement(Fragment, null, createElement(RichText.Content, { tagName: 'dt', value: attributes.term || '' }), createElement(InnerBlocks.Content, null));
}

function DdEditor({ clientId }: any) {
	const blockProps = useBlockProps({
		className: 'plusmagi-description-list-definition',
		style: { marginLeft: '20px', paddingLeft: '20px', borderLeft: '2px solid #dcdcde' },
	});
	const addNextDescription = (event: any) => {
		if (event.key !== 'Enter' || event.shiftKey || event.defaultPrevented) {
			return;
		}

		if (event.target.closest('.wp-block-list, [data-type="core/list"], [data-type="core/list-item"]')) {
			return;
		}

		if (!event.target.closest('[data-type="core/paragraph"]')) {
			return;
		}

		event.preventDefault();
		const parentId = wpGlobals.wp.data.select('core/block-editor').getBlockParents(clientId).slice(-1)[0];
		const parentBlocks = wpGlobals.wp.data.select('core/block-editor').getBlocks(parentId);
		const index = parentBlocks.findIndex((block: any) => block.clientId === clientId);
		wpGlobals.wp.data.dispatch('core/block-editor').insertBlocks(
			wpGlobals.wp.blocks.createBlock(DD_BLOCK, {}, [wpGlobals.wp.blocks.createBlock('core/paragraph')]),
			index + 1,
			parentId
		);
	};
	const outdent = () => {
		const blocks = wpGlobals.wp.data.select('core/block-editor').getBlocks(clientId);
		const content = blocks.map((block: any) => block.attributes?.content || '').join('\n').trim();
		wpGlobals.wp.data.dispatch('core/block-editor').replaceBlocks(clientId, wpGlobals.wp.blocks.createBlock(TERM_BLOCK, { term: content }));
	};

	return createElement('div', { ...blockProps, onKeyDownCapture: addNextDescription }, createElement(BlockControls, null, createElement(ToolbarGroup, null, createElement(ToolbarButton, {
		icon: formatIndentDecrease,
		title: 'Outdent',
		label: 'Outdent',
		onClick: outdent,
	}), createElement(ToolbarButton, {
		icon: trash,
		title: 'Remove description',
		label: 'Remove description',
		onClick: () => wpGlobals.wp.data.dispatch('core/block-editor').removeBlocks(clientId),
		}))), createElement('span', { className: 'plusmagi-description-list-type-label plusmagi-description-list-type-label-dd' }, 'Description'), createElement(InnerBlocks, { allowedBlocks: DD_ALLOWED_BLOCKS, template: [['core/paragraph']], templateLock: false }));
}

function DdSave() {
	return createElement('dd', null, createElement(InnerBlocks.Content, null));
}

const blockType = (window as typeof window & { wp?: { blocks?: { registerBlockType?: (name: string, config: Record<string, unknown>) => void } } }).wp?.blocks?.registerBlockType;

if (typeof blockType === 'function') {
	blockType(TERM_BLOCK, {
		apiVersion: 3,
		title: 'PlusMagi - Description term',
		category: 'text',
		icon: 'editor-bold',
		parent: [LIST_BLOCK],
		attributes: { term: { type: 'string', source: 'html', selector: 'dt' } },
		supports: { html: false, reusable: false },
		edit: DescriptionEditor,
		save: DescriptionSave,
	});

	blockType(DD_BLOCK, {
		apiVersion: 3,
		title: 'PlusMagi - Description',
		category: 'text',
		icon: 'editor-paragraph',
		parent: [TERM_BLOCK],
		supports: { html: false, reusable: false },
		edit: DdEditor,
		save: DdSave,
	});

	blockType(LIST_BLOCK, {
		apiVersion: 3,
		title: 'PlusMagi - Description list',
		category: 'text',
		icon: 'editor-ul',
		keywords: ['plusmagi', 'description list', 'definition list', 'dl', 'dt', 'dd'],
		attributes: { ordered: { type: 'boolean', default: true } },
		template: [[TERM_BLOCK, {}, [[DD_BLOCK]]], [TERM_BLOCK, {}, [[DD_BLOCK]]], [TERM_BLOCK, {}, [[DD_BLOCK]]]],
		allowedBlocks: [TERM_BLOCK],
		supports: { html: false },
		edit: () => createElement('div', { className: 'plusmagi-description-list-editor-wrapper' }, createElement('strong', { className: 'plusmagi-description-list-editor-title' }, 'PlusMagi - Description list'), createElement(InnerBlocks, { allowedBlocks: [TERM_BLOCK], template: [[TERM_BLOCK, {}, [[DD_BLOCK]]], [TERM_BLOCK, {}, [[DD_BLOCK]]], [TERM_BLOCK, {}, [[DD_BLOCK]]]], templateLock: false })),
		save: () => createElement('dl', { className: 'wp-block-plusmagi-markdown-description-list' }, createElement(InnerBlocks.Content, null)),
	});
}
