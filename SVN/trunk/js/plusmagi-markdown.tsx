import { createElement, useEffect, useMemo, useState } from '@wordpress/element';
import { TextareaControl } from '@wordpress/components';

const defaultMarkdown = '';
const legacyDefaultMarkdown = '# PlusMagi Markdown\n\nWrite markdown here...';

type MarkdownBlockProps = {
	attributes: {
		markdown?: string;
		ampSvg?: string;
	};
	setAttributes: (attrs: Record<string, string>) => void;
};

type MermaidApi = {
	initialize: (config: Record<string, unknown>) => void;
	render: (id: string, code: string) => Promise<{ svg: string }>;
};

type WindowWithMermaid = Window & {
	mermaid?: MermaidApi;
	plusmagiMermaidInitialized?: boolean;
	plusmagiZenUmlReady?: Promise<void>;
};

const mermaidFencePattern = /```mermaid\s*([\s\S]*?)```/i;

function hashString(value: string): string {
	let hash = 5381;

	for (let i = 0; i < value.length; i += 1) {
		hash = (hash * 33) ^ value.charCodeAt(i);
	}

	return (hash >>> 0).toString(36);
}

function makeStableRenderId(code: string): string {
	return `plusmagi-mermaid-${hashString(code)}`;
}

function normalizeMermaidSource(code: string): string {
	return code
		.replace(/\r\n/g, '\n')
		.replace(/[–—−]+>/g, '-->')
		.replace(/<[-–—−]+/g, '<--')
		.replace(/\u00a0/g, ' ');
}

function formatMermaidSource(code: string): string {
	// Keep Mermaid source structure as-authored; indentation can be semantic for some diagrams.
	return normalizeMermaidSource(code).trim();
}

function looksLikeMermaid(code: string): boolean {
	const source = normalizeMermaidSource(code).trim();
	const hasMermaidFrontmatter = /^---\s*[\s\S]*?\n---\s*(?:\n|$)/m.test(source);
	const hasMermaidDefinition = /(^|\n)(graph\s|flowchart\s|sequenceDiagram\b|classDiagram\b|stateDiagram\b|erDiagram\b|journey\b|gantt\b|pie\b|mindmap\b|timeline\b|gitGraph\b|quadrantChart\b|requirementDiagram\b|sankey-beta\b|xychart-beta\b|swimlane-beta\b)/m.test(source);

	if (hasMermaidFrontmatter && hasMermaidDefinition) {
		return true;
	}

	if (/^(%%\{init:|graph\s|flowchart\s|sequenceDiagram\b|classDiagram\b|stateDiagram\b|erDiagram\b|journey\b|gantt\b|pie\b|mindmap\b|timeline\b|gitGraph\b|quadrantChart\b|requirementDiagram\b|sankey-beta\b|xychart-beta\b|swimlane-beta\b)/m.test(source)) {
		return true;
	}

	return /(subgraph\b|\bend\b|-->|---|==>|\|.+\|)/m.test(source);
}

function extractMermaidCode(markdown: string): string {
	const source = normalizeMermaidSource(String(markdown || ''));
	const fenceMatch = source.match(mermaidFencePattern);

	if (fenceMatch && fenceMatch[1]) {
		return formatMermaidSource(fenceMatch[1]);
	}

	if (looksLikeMermaid(source)) {
		return formatMermaidSource(source);
	}

	return '';
}

function stripMermaidFence(markdown: string): string {
	return normalizeMermaidSource(String(markdown || '')).replace(mermaidFencePattern, '').trim();
}

function stripMermaidSource(markdown: string): string {
	const source = normalizeMermaidSource(String(markdown || ''));

	if (mermaidFencePattern.test(source)) {
		return stripMermaidFence(source);
	}

	if (looksLikeMermaid(source)) {
		return '';
	}

	return source;
}

function getMermaidApi(): MermaidApi {
	const runtimeWindow = window as WindowWithMermaid;
	const api = runtimeWindow.mermaid;

	if (!api || typeof api.initialize !== 'function' || typeof api.render !== 'function') {
		throw new Error('Mermaid runtime is not loaded on editor page.');
	}

	if (!runtimeWindow.plusmagiMermaidInitialized) {
		api.initialize({
			startOnLoad: false,
			securityLevel: 'strict',
			theme: 'default',
			flowchart: {
				htmlLabels: false,
			},
		});
		runtimeWindow.plusmagiMermaidInitialized = true;
	}

	return api;
}

function buildPreviewMarkup(markdown: string): string {
	const source = stripMermaidSource(markdown);
	const escaped = source
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');

	let html = '';
	const lines = escaped.split(/\r?\n/);
	const paragraphs: string[] = [];

	const flushParagraph = () => {
		if (paragraphs.length > 0) {
			html += `<p>${paragraphs.join(' ')}</p>`;
			paragraphs.length = 0;
		}
	};

	lines.forEach((line) => {
		if (!line.trim()) {
			flushParagraph();
			return;
		}

		if (/^#{1,6}\s/.test(line)) {
			flushParagraph();
			const level = line.match(/^#+/)?.[0].length || 1;
			const content = line.replace(/^#{1,6}\s/, '');
			html += `<h${level}>${content}</h${level}>`;
			return;
		}

		if (/^-\s/.test(line)) {
			flushParagraph();
			html += `<ul><li>${line.replace(/^-\s/, '')}</li></ul>`;
			return;
		}

		paragraphs.push(line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>'));
	});

	flushParagraph();
	return html;
}

function MarkdownBlockEditor({ attributes, setAttributes }: MarkdownBlockProps) {
	const sourceMarkdown = attributes.markdown ?? defaultMarkdown;
	const markdown = sourceMarkdown === legacyDefaultMarkdown ? defaultMarkdown : sourceMarkdown;
	const mermaidCode = useMemo(() => extractMermaidCode(markdown), [markdown]);
	const previewMarkup = useMemo(() => buildPreviewMarkup(markdown), [markdown]);
	const [mermaidSvg, setMermaidSvg] = useState('');
	const [mermaidError, setMermaidError] = useState('');

	useEffect(() => {
		let isMounted = true;

		if (!mermaidCode) {
			setMermaidSvg('');
			setMermaidError('');
			if (attributes.ampSvg) {
				setAttributes({ ampSvg: '' });
			}
			return () => {
				isMounted = false;
			};
		}

		const renderMermaid = async () => {
			try {
				await (window as WindowWithMermaid).plusmagiZenUmlReady;
				const mermaidApi = getMermaidApi();

				const id = makeStableRenderId(mermaidCode);
				const result = await mermaidApi.render(id, mermaidCode);

				if (isMounted) {
					setMermaidSvg(result.svg);
					setMermaidError('');
					if (attributes.ampSvg !== result.svg) {
						setAttributes({ ampSvg: result.svg });
					}
				}
			} catch (error) {
				if (isMounted) {
					setMermaidSvg('');
					setMermaidError(error instanceof Error ? error.message : 'Unable to render Mermaid diagram.');
					if (attributes.ampSvg) {
						setAttributes({ ampSvg: '' });
					}
				}
			}
		};

		void renderMermaid();

		return () => {
			isMounted = false;
		};
	}, [mermaidCode, setAttributes]);

	return (
		<div className="plusmagi-markdown-editor-wrapper">
			<strong className="plusmagi-markdown-editor-title">PlusMagi Blocks + Mermaid</strong>
			<TextareaControl
				label="Mermaid.js Markdown Editor"
				value={markdown}
				onChange={(value: string) => setAttributes({ markdown: value })}
				placeholder="Write markdown here..."
				help="This block is ready for Mermaid diagram rendering later."
			/>
			<div className="plusmagi-markdown-preview">
				<div className="plusmagi-markdown-preview-label">Live Preview</div>
				{mermaidSvg ? <div className="plusmagi-markdown-mermaid-preview" dangerouslySetInnerHTML={{ __html: mermaidSvg }} /> : null}
				{mermaidError ? <div className="plusmagi-markdown-mermaid-error">{mermaidError}</div> : null}
					{previewMarkup ? <div className="plusmagi-markdown-preview-body" dangerouslySetInnerHTML={{ __html: previewMarkup }} /> : null}
			</div>
		</div>
	);
}

const blockType = (window as typeof window & { wp?: { blocks?: { registerBlockType?: (name: string, config: Record<string, unknown>) => void } } }).wp?.blocks?.registerBlockType;

if (typeof blockType === 'function') {
	blockType('plusmagi-blocks/mermaid', {
		apiVersion: 3,
		attributes: {
			markdown: {
				type: 'string',
				default: defaultMarkdown,
			},
			ampSvg: {
				type: 'string',
				default: '',
			},
		},
		edit: (props: MarkdownBlockProps) => createElement(MarkdownBlockEditor, props),
		save: () => null,
	});
}

