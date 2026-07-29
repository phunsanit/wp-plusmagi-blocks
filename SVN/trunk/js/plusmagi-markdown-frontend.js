(function () {
	function getMermaidApi() {
		if (window.mermaid && typeof window.mermaid.initialize === 'function') {
			return window.mermaid;
		}

		if (window.__esbuild_esm_mermaid_nm && window.__esbuild_esm_mermaid_nm.mermaid && window.__esbuild_esm_mermaid_nm.mermaid.default) {
			return window.__esbuild_esm_mermaid_nm.mermaid.default;
		}

		return null;
	}

	function getDiagramCode(node) {
		if (!node) {
			return '';
		}

		return String(node.textContent || '').replace(/\r\n/g, '\n').trim();
	}

	function makeFallbackCode(code) {
		return String(code || '')
			.replace(/^\s*accTitle:\s.*$/gim, '')
			.replace(/^\s*accDescr:\s.*$/gim, '')
			.replace(/\n{3,}/g, '\n\n')
			.trim();
	}

	function makeRenderId(index) {
		return 'plusmagi-front-mermaid-' + Date.now() + '-' + index;
	}

	async function renderBlocksWithRenderApi(api, nodes) {
		for (var i = 0; i < nodes.length; i++) {
			var node = nodes[i];
			if (!node || node.getAttribute('data-plusmagi-rendered') === '1') {
				continue;
			}

			var code = getDiagramCode(node);
			if (!code) {
				continue;
			}

			try {
				var renderResult = await api.render(makeRenderId(i), code);
				node.innerHTML = renderResult.svg || renderResult;
				node.setAttribute('data-plusmagi-rendered', '1');
				continue;
			} catch (firstError) {
				var fallbackCode = makeFallbackCode(code);
				if (!fallbackCode || fallbackCode === code) {
					node.setAttribute('data-plusmagi-render-error', '1');
					if (window.console && typeof window.console.warn === 'function') {
						window.console.warn('PlusMagi Mermaid render failed:', firstError);
					}
					continue;
				}

				try {
					var fallbackResult = await api.render(makeRenderId(i) + '-fallback', fallbackCode);
					node.innerHTML = fallbackResult.svg || fallbackResult;
					node.setAttribute('data-plusmagi-rendered', '1');
					continue;
				} catch (secondError) {
					node.setAttribute('data-plusmagi-render-error', '1');
					if (window.console && typeof window.console.warn === 'function') {
						window.console.warn('PlusMagi Mermaid render failed after fallback:', secondError);
					}
				}
			}
		}
	}

	function renderWithLegacyApi(api, nodes) {
		if (typeof api.run === 'function') {
			api.run({
				querySelector: '.plusmagi-markdown-front-mermaid .mermaid'
			});
			return;
		}

		if (typeof api.init === 'function') {
			api.init(undefined, nodes);
		}
	}

	async function initMermaid() {
		var api = getMermaidApi();
		if (!api) {
			return;
		}

		var nodes = document.querySelectorAll('.plusmagi-markdown-front-mermaid .mermaid');
		if (!nodes.length) {
			return;
		}

		try {
			api.initialize({
				startOnLoad: false,
				securityLevel: 'strict',
				theme: 'default',
				flowchart: {
					htmlLabels: false
				}
			});

			if (typeof api.render === 'function') {
				await renderBlocksWithRenderApi(api, nodes);
				return;
			}

			renderWithLegacyApi(api, nodes);
		} catch (error) {
			if (window.console && typeof window.console.warn === 'function') {
				window.console.warn('PlusMagi Mermaid initialization failed:', error);
			}
		}
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initMermaid);
		return;
	}

	initMermaid();
})();
