<?php
namespace Mermaid;

class FrontendRenderer {
	public function __construct() {
		add_filter( 'the_content', array( $this, 'render_mermaid_in_content' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_frontend_assets' ) );
	}

	public function enqueue_frontend_assets() {
		wp_enqueue_script(
			'mermaid-js',
			'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js',
			array(),
			'10.0.0',
			true
		);

		wp_enqueue_script(
			'my-mermaid-frontend',
			MM_PLUGIN_URL . 'js/frontend-renderer.js',
			array( 'mermaid-js' ),
			'1.0',
			true
		);
	}

	public function render_mermaid_in_content( $content ) {
		if ( ! is_singular() ) {
			return $content;
		}

		$pattern = '/<pre class="wp-block-code"><code class="language-mermaid">(.*?)<\/code><\/pre>/s';
		preg_match_all( $pattern, $content, $matches );

		if ( empty( $matches[1] ) ) {
			return $content;
		}

		foreach ( $matches[1] as $index => $source ) {
			$decoded = htmlspecialchars_decode( $source, ENT_QUOTES );
			$replacement = '<div class="mermaid" data-mermaid-source="' . esc_attr( trim( $decoded ) ) . '"></div>';
			$content = str_replace( $matches[0][ $index ], $replacement, $content );
		}

		return $content;
	}
}
