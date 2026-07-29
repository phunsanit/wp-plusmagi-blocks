// my-mermaid-plugin/js/editor-initializer.js

/**
 * This script runs in the WordPress Block Editor environment.
 * It finds all preformatted blocks that contain 'mermaid' syntax and initializes Mermaid rendering for them.
 */
jQuery(document).ready(function($) {
	const mermaidBlocks = $('.editor-styles .mermaid'); // Targetting blocks marked as mermaid

	if (mermaidBlocks.length > 0) {
		// Initialize Mermaid specifically for the editor context if it's loaded on load
		// Note: For full stability, this might need to run within a specific block saving lifecycle hook,
		// but this is the best general approach for an initializer script.
		mermaid.initialize({ startOnLoad: false }); // We control when it renders

		$('.editor-styles .mermaid').each(function() {
			const $element = $(this);
			const code = $element.html().trim();

			if (code) {
				// Manually tell Mermaid to render this specific element after initialization
				try {
					mermaid.render('mermaid-' + Math.random().toString(36).substr(2, 9), code)
						.then(svgCode => {
							$element.html(svgCode); // Replace the raw code block with the SVG output
						})
						.catch(error => {
							console.error("Mermaid rendering failed in editor:", error);
							// Fallback: Leave the raw markdown visible if rendering fails
						});
				} catch (e) {
					console.error("Error calling mermaid.render:", e);
				}
			}
		});
	}
});
