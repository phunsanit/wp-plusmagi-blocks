<?php
namespace Mermaid;

/**
 * Handles interactions within the WordPress Editor (Gutenberg).
 * Registers custom patterns or manages the block wrapper logic to accept raw markdown.
 */
class EditorHandler {

	public function __construct() {
		// 1. Hook for saving content (if necessary, though default WP behavior often suffices)
		add_filter('save_post', [$this, 'save_mermaid_content']);

		// 2. Hook to register a custom block pattern or set up editor support
		// For simplicity in this example, we will rely on Gutenberg's ability to save markdown,
		// but we MUST ensure the JavaScript loads properly on the editor screen for testing.
		add_action('enqueue_block_editor_assets', [$this, 'enqueue_editor_scripts']);
	}

	/**
	 * Hooked to sanitize content upon saving a post/page.
	 * This ensures that if we want *additional* processing (like escaping or transformation), it happens here.
	 * @param int $post_id The ID of the post being saved.
	 * @return string Sanitized content.
	 */
	public function save_mermaid_content($post_id) {
		// Basic sanitization is done by WP, but this hook allows pre-save modification if needed.
		return get_post_field('post_content', $post_id);
	}

	/**
	 * Enqueues necessary scripts in the block editor to allow Mermaid previews *while editing*.
	 */
	public function enqueue_editor_scripts() {
		if (!is_admin() || !function_exists('get_current_screen') || !get_current_screen() || !get_current_screen()->is_block_editor()) {
			return;
		}

		wp_enqueue_script(
			'mermaid-js',
			'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js',
			array(),
			'10.0.0',
			true
		);

		wp_enqueue_script(
			'my-mermaid-block',
			MM_PLUGIN_URL . 'js/mermaid-block.js',
			array( 'wp-blocks', 'wp-element', 'wp-components', 'wp-editor', 'wp-i18n', 'wp-block-editor', 'mermaid-js' ),
			'1.0',
			true
		);

		wp_enqueue_script(
			'thesaurus-block',
			MM_PLUGIN_URL . 'js/thesaurus-block.js',
			array( 'wp-blocks', 'wp-element', 'wp-components', 'wp-editor', 'wp-i18n', 'wp-block-editor' ),
			'1.0',
			true
		);

		wp_enqueue_style(
			'thesaurus-block-editor',
			MM_PLUGIN_URL . 'js/thesaurus-block.css',
			array(),
			'1.0'
		);
	}
}
