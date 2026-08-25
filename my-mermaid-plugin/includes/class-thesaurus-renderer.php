<?php
namespace Mermaid;

/**
 * Handles frontend rendering of Thesaurus blocks.
 * Processes block attributes and outputs semantic HTML.
 */
class ThesaurusRenderer {

	public function __construct() {
		// Register the thesaurus block with WordPress
		add_action('init', [$this, 'register_thesaurus_block']);

		// Enqueue frontend styles
		add_action('wp_enqueue_scripts', [$this, 'enqueue_frontend_styles']);
	}

	/**
	 * Register the Thesaurus block type.
	 */
	public function register_thesaurus_block() {
		if (!function_exists('register_block_type')) {
			return;
		}

		register_block_type(
			'my-thesaurus/entry',
			[
				'render_callback' => [$this, 'render_thesaurus_block'],
				'attributes'      => [
					'heading' => [
						'type'    => 'string',
						'default' => 'Semantic Thesaurus',
					],
					'entries' => [
						'type'    => 'array',
						'default' => [],
					],
				],
			]
		);
	}

	/**
	 * Render the Thesaurus block on the frontend.
	 *
	 * @param array $attributes Block attributes containing entries.
	 * @return string HTML output.
	 */
	public function render_thesaurus_block($attributes) {
		if (empty($attributes['entries'])) {
			return '';
		}

		$entries = $attributes['entries'];
		$heading = isset($attributes['heading']) ? sanitize_text_field($attributes['heading']) : 'Semantic Thesaurus';
		if ($heading === '') {
			$heading = 'Semantic Thesaurus';
		}

		$heading_id = function_exists('wp_unique_id')
			? wp_unique_id('thesaurus-heading-')
			: 'thesaurus-heading-' . uniqid();

		$html = '<div class="thesaurus-container">';
		$html .= '<h2 id="' . esc_attr($heading_id) . '">' . esc_html($heading) . '</h2>';
		$html .= '<dl aria-labelledby="' . esc_attr($heading_id) . '">';

		foreach ($entries as $index => $entry) {
			$html .= $this->render_entry($entry, (int) $index);
		}

		$html .= '</dl></div>';

		return $html;
	}

	/**
	 * Render a single thesaurus entry.
	 *
	 * @param array $entry Entry data.
	 * @return string HTML for the entry.
	 */
	private function render_entry($entry, $index) {
		$term       = isset($entry['term']) ? sanitize_text_field($entry['term']) : '';
		$pos        = isset($entry['pos']) ? sanitize_text_field($entry['pos']) : '';
		$definition = isset($entry['definition']) ? wp_kses_post($entry['definition']) : '';
		$synonyms   = isset($entry['synonyms']) ? sanitize_text_field($entry['synonyms']) : '';
		$antonyms   = isset($entry['antonyms']) ? sanitize_text_field($entry['antonyms']) : '';
		$term_slug  = sanitize_title($term ?: 'term');
		$term_id    = 'term-' . $term_slug . '-' . $index;

		$synonym_tags = array_values(array_filter(array_map('trim', explode(',', $synonyms))));
		$antonym_tags = array_values(array_filter(array_map('trim', explode(',', $antonyms))));

		$html = '<div class="thesaurus-entry" itemscope itemtype="https://schema.org/DefinedTerm" data-term="' . esc_attr($term_slug) . '">';

		// Term (dt)
		$html .= '<dt id="' . esc_attr($term_id) . '">';
		$html .= '<dfn itemprop="name" lang="en">' . esc_html($term) . '</dfn>';
		if ($pos) {
			$html .= '<span class="pos" title="' . esc_attr('Part of Speech: ' . $pos) . '" aria-label="' . esc_attr('Part of Speech: ' . $pos) . '">' . esc_html($pos) . '</span>';
		}
		$html .= '</dt>';

		// Definition (dd)
		if ($definition) {
			$html .= '<dd data-type="definition" itemprop="description" aria-describedby="' . esc_attr($term_id) . '">' . wp_kses_post($definition) . '</dd>';
		}

		// Synonyms (dd)
		if (!empty($synonym_tags)) {
			$html .= '<dd data-type="synonyms" aria-label="' . esc_attr('Synonyms for ' . $term) . '">';
			$html .= '<span class="label" aria-hidden="true">Synonyms:</span>';
			$html .= '<ul class="tag-list" role="list">';

			foreach ($synonym_tags as $tag) {
				$html .= '<li class="tag" itemprop="sameAs">' . esc_html($tag) . '</li>';
			}

			$html .= '</ul>';
			$html .= '</dd>';
		}

		// Antonyms (dd)
		if (!empty($antonym_tags)) {
			$html .= '<dd data-type="antonyms" aria-label="' . esc_attr('Antonyms for ' . $term) . '">';
			$html .= '<span class="label" aria-hidden="true">Antonyms:</span>';
			$html .= '<ul class="tag-list" role="list">';

			foreach ($antonym_tags as $tag) {
				$html .= '<li class="tag">' . esc_html($tag) . '</li>';
			}

			$html .= '</ul>';
			$html .= '</dd>';
		}

		$html .= '</div>';

		return $html;
	}

	/**
	 * Enqueue frontend styles for the thesaurus block.
	 */
	public function enqueue_frontend_styles() {
		wp_enqueue_style(
			'thesaurus-block-frontend',
			MM_PLUGIN_URL . 'js/thesaurus-block.css',
			[],
			'1.0'
		);
	}
}
