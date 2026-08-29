type MermaidWithExternalDiagrams = {
	registerExternalDiagrams?: (diagrams: unknown[]) => Promise<void>;
};

declare global {
	interface Window {
		mermaid?: MermaidWithExternalDiagrams;
		'mermaid-zenuml'?: unknown;
		plusmagiZenUmlReady?: Promise<void>;
	}
}

const mermaid = window.mermaid;
const zenuml = window['mermaid-zenuml'];

window.plusmagiZenUmlReady = mermaid?.registerExternalDiagrams && zenuml
	? mermaid.registerExternalDiagrams([zenuml])
	: Promise.reject(new Error('Mermaid or ZenUML runtime is unavailable.'));