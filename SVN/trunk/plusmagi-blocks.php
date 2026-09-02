<?php
/**
 * Plugin Name: PlusMagi Blocks
 * Plugin URI: https://plusmagi-blocks.plusmagi.com/
 * Description: Adds custom Gutenberg blocks for SVG, Mermaid diagrams, Description Lists, and more.
 * Version: 1.1.0
 * Author: Pitt Phunsanit
 * Author URI: https://pitt.plusmagi.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: plusmagi-blocks
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! defined( 'PLUSMAGI_BLOCKS_VERSION' ) ) {
	define( 'PLUSMAGI_BLOCKS_VERSION', '1.1.0' );
}

if ( ! defined( 'PLUSMAGI_BLOCKS_PATH' ) ) {
	define( 'PLUSMAGI_BLOCKS_PATH', plugin_dir_path( __FILE__ ) );
}

if ( ! defined( 'PLUSMAGI_BLOCKS_URL' ) ) {
	define( 'PLUSMAGI_BLOCKS_URL', plugin_dir_url( __FILE__ ) );
}

add_action( 'admin_menu', 'plusmagi_blocks_register_menu' );
add_action( 'admin_enqueue_scripts', 'plusmagi_blocks_enqueue_admin_assets' );
add_action( 'init', 'plusmagi_blocks_register_blocks' );
add_action( 'enqueue_block_editor_assets', 'plusmagi_blocks_enqueue_editor_assets' );
add_action( 'wp_enqueue_scripts', 'plusmagi_blocks_enqueue_frontend_assets' );

function plusmagi_blocks_is_amp_request() {
	return function_exists( 'amp_is_request' ) && amp_is_request();
}

function plusmagi_blocks_get_non_amp_url() {
	if ( ! is_singular() ) {
		return '';
	}

	$permalink = get_permalink();

	if ( ! is_string( $permalink ) || '' === $permalink ) {
		return '';
	}

	if ( function_exists( 'amp_remove_endpoint' ) ) {
		$non_amp = amp_remove_endpoint( $permalink );

		if ( is_string( $non_amp ) && '' !== $non_amp ) {
			return $non_amp;
		}
	}

	return add_query_arg( 'noamp', 'available', $permalink );
}

function plusmagi_blocks_normalize_source( $source ) {
	$source = str_replace( "\r\n", "\n", (string) $source );
	$source = str_replace( array( '–>', '—>', '−>' ), '-->', $source );
	$source = str_replace( array( '<–', '<—', '<−' ), '<--', $source );
	$source = str_replace( "\xc2\xa0", ' ', $source );

	return $source;
}

function plusmagi_blocks_looks_like_mermaid( $source ) {
	$source = trim( plusmagi_blocks_normalize_source( $source ) );

	if ( '' === $source ) {
		return false;
	}

	if ( preg_match( '/(^|\n)(graph\s|flowchart\s|sequenceDiagram\b|classDiagram\b|stateDiagram\b|erDiagram\b|journey\b|gantt\b|pie\b|mindmap\b|timeline\b|gitGraph\b|quadrantChart\b|requirementDiagram\b|sankey-beta\b|xychart-beta\b|swimlane-beta\b)/m', $source ) ) {
		return true;
	}

	if ( preg_match( '/(subgraph\b|\bend\b|-->|---|==>|\|.+\|)/m', $source ) ) {
		return true;
	}

	return false;
}

function plusmagi_blocks_extract_mermaid_code( $markdown ) {
	$source = plusmagi_blocks_normalize_source( $markdown );

	if ( preg_match( '/```mermaid\s*([\s\S]*?)```/i', $source, $matches ) ) {
		return trim( $matches[1] );
	}

	if ( plusmagi_blocks_looks_like_mermaid( $source ) ) {
		return trim( $source );
	}

	return '';
}

function plusmagi_blocks_get_allowed_svg_tags() {
	$global_attributes = array(
		'class'								=> true,
		'id'									 => true,
		'transform'						=> true,
		'fill'								 => true,
		'stroke'							 => true,
		'stroke-width'				 => true,
		'stroke-linecap'			 => true,
		'stroke-linejoin'			=> true,
		'stroke-miterlimit'		=> true,
		'stroke-dasharray'		 => true,
		'stroke-dashoffset'		=> true,
		'stroke-opacity'			 => true,
		'fill-opacity'				 => true,
		'opacity'							=> true,
		'font-family'					=> true,
		'font-size'						=> true,
		'font-weight'					=> true,
		'text-anchor'					=> true,
		'dominant-baseline'		=> true,
		'clip-path'						=> true,
		'mask'								 => true,
		'filter'							 => true,
		'aria-label'					 => true,
		'role'								 => true,
	);

	$tags = array(
		'svg' => array_merge(
			$global_attributes,
			array(
				'xmlns'							 => true,
				'xmlns:xlink'				 => true,
				'viewbox'						 => true,
				'width'							 => true,
				'height'							=> true,
				'preserveaspectratio' => true,
			)
		),
		'g'							=> $global_attributes,
		'path'					 => array_merge( $global_attributes, array( 'd' => true ) ),
		'rect'					 => array_merge( $global_attributes, array( 'x' => true, 'y' => true, 'rx' => true, 'ry' => true, 'width' => true, 'height' => true ) ),
		'circle'				 => array_merge( $global_attributes, array( 'cx' => true, 'cy' => true, 'r' => true ) ),
		'ellipse'				=> array_merge( $global_attributes, array( 'cx' => true, 'cy' => true, 'rx' => true, 'ry' => true ) ),
		'line'					 => array_merge( $global_attributes, array( 'x1' => true, 'y1' => true, 'x2' => true, 'y2' => true ) ),
		'polyline'			 => array_merge( $global_attributes, array( 'points' => true ) ),
		'polygon'				=> array_merge( $global_attributes, array( 'points' => true ) ),
		'text'					 => array_merge( $global_attributes, array( 'x' => true, 'y' => true, 'dx' => true, 'dy' => true ) ),
		'tspan'					=> array_merge( $global_attributes, array( 'x' => true, 'y' => true, 'dx' => true, 'dy' => true ) ),
		'foreignobject'	=> array_merge( $global_attributes, array( 'x' => true, 'y' => true, 'width' => true, 'height' => true ) ),
		'defs'					 => $global_attributes,
		'marker'				 => array_merge( $global_attributes, array( 'markerwidth' => true, 'markerheight' => true, 'refx' => true, 'refy' => true, 'orient' => true, 'viewbox' => true ) ),
		'use'						=> array_merge( $global_attributes, array( 'href' => true, 'xlink:href' => true, 'x' => true, 'y' => true ) ),
		'symbol'				 => array_merge( $global_attributes, array( 'viewbox' => true ) ),
		'title'					=> array(),
		'desc'					 => array(),
		'clippath'			 => array_merge( $global_attributes, array( 'clipPathUnits' => true ) ),
		'mask'					 => array_merge( $global_attributes, array( 'x' => true, 'y' => true, 'width' => true, 'height' => true ) ),
		'pattern'				=> array_merge( $global_attributes, array( 'x' => true, 'y' => true, 'width' => true, 'height' => true, 'patternUnits' => true, 'patternTransform' => true ) ),
		'lineargradient' => array_merge( $global_attributes, array( 'id' => true, 'x1' => true, 'y1' => true, 'x2' => true, 'y2' => true, 'gradientUnits' => true, 'gradientTransform' => true ) ),
		'radialgradient' => array_merge( $global_attributes, array( 'id' => true, 'cx' => true, 'cy' => true, 'r' => true, 'fx' => true, 'fy' => true, 'gradientUnits' => true, 'gradientTransform' => true ) ),
		'stop'					 => array_merge( $global_attributes, array( 'offset' => true, 'stop-color' => true, 'stop-opacity' => true ) ),
	);

	return $tags;
}

function plusmagi_blocks_get_allowed_output_tags() {
	$allowed_tags = wp_kses_allowed_html( 'post' );

	foreach ( plusmagi_blocks_get_allowed_svg_tags() as $tag => $attributes ) {
		$allowed_tags[ $tag ] = isset( $allowed_tags[ $tag ] )
			? array_merge( $allowed_tags[ $tag ], $attributes )
			: $attributes;
	}

	$allowed_tags['div']['data-plusmagi-mermaid'] = true;
	$allowed_tags['amp-img'] = array(
		'src'            => true,
		'width'          => true,
		'height'         => true,
		'layout'         => true,
		'alt'            => true,
		'class'          => true,
		'data-skip-lazy' => true,
		'data-no-lazy'   => true,
	);

	return $allowed_tags;
}

function plusmagi_blocks_sanitize_rendered_html( $html ) {
	return wp_kses( (string) $html, plusmagi_blocks_get_allowed_output_tags() );
}

function plusmagi_blocks_sanitize_svg( $svg ) {
	if ( ! is_string( $svg ) ) {
		return '';
	}

	$svg = trim( $svg );

	if ( '' === $svg || false === strpos( $svg, '<svg' ) ) {
		return '';
	}

	// Keep SVG tag/attribute casing intact; strip only active content vectors.
	$sanitized = preg_replace( '#<script\b[^>]*>[\s\S]*?</script>#i', '', $svg );
	$sanitized = preg_replace( '/\son[a-zA-Z-]+\s*=\s*("[^"]*"|\'[^\']*\'|[^\s>]+)/i', '', (string) $sanitized );
	$sanitized = preg_replace( '/\s(?:href|xlink:href)\s*=\s*("\s*javascript:[^"]*"|\'\s*javascript:[^\']*\')/i', '', (string) $sanitized );

	// AMP disallows the `style` attribute and any embedded `<style>` tag outside of
	// `<style amp-custom>`; Mermaid emits both, which was breaking AMP validation
	// on every page (archives, search, author, etc.) that rendered a diagram.
	$sanitized = preg_replace( '#<style\b[^>]*>[\s\S]*?</style>#i', '', (string) $sanitized );
	$sanitized = preg_replace( '/\sstyle\s*=\s*("[^"]*"|\'[^\']*\')/i', '', (string) $sanitized );
	$sanitized = is_string( $sanitized ) ? trim( $sanitized ) : '';

	if ( ! is_string( $sanitized ) || '' === trim( $sanitized ) || false === strpos( $sanitized, '<svg' ) ) {
		return '';
	}

	return wp_kses( $sanitized, plusmagi_blocks_get_allowed_svg_tags() );
}

function plusmagi_blocks_extract_svg_dimensions( $svg ) {
	$default = array(
		'width'	=> 1200,
		'height' => 800,
	);

	if ( ! is_string( $svg ) || '' === trim( $svg ) ) {
		return $default;
	}

	if ( preg_match( '/viewBox\s*=\s*"\s*[-0-9.]+\s+[-0-9.]+\s+([0-9.]+)\s+([0-9.]+)\s*"/i', $svg, $matches ) ) {
		$width = (int) round( (float) $matches[1] );
		$height = (int) round( (float) $matches[2] );

		if ( $width > 0 && $height > 0 ) {
			return array(
				'width'	=> $width,
				'height' => $height,
			);
		}
	}

	if ( preg_match( '/\swidth\s*=\s*"([0-9.]+)(?:px)?"/i', $svg, $width_match ) && preg_match( '/\sheight\s*=\s*"([0-9.]+)(?:px)?"/i', $svg, $height_match ) ) {
		$width = (int) round( (float) $width_match[1] );
		$height = (int) round( (float) $height_match[1] );

		if ( $width > 0 && $height > 0 ) {
			return array(
				'width'	=> $width,
				'height' => $height,
			);
		}
	}

	return $default;
}

function plusmagi_blocks_store_svg_file( $svg, $mermaid_code ) {
	if ( ! is_string( $svg ) || '' === trim( $svg ) ) {
		return array(
			'path' => '',
			'url'	=> '',
			'error' => 'empty-svg',
		);
	}

	$post_id = get_the_ID();

	if ( ! is_numeric( $post_id ) || (int) $post_id <= 0 ) {
		$post_id = get_queried_object_id();
	}

	$post_id = (int) $post_id;
	$post = get_post( $post_id );
	$year_month = '';

	if ( $post instanceof WP_Post ) {
		$year_month = mysql2date( 'Y/m', $post->post_date, false );
	}

	if ( ! is_string( $year_month ) || '' === trim( $year_month ) ) {
		$year_month = gmdate( 'Y/m', current_time( 'timestamp', true ) );
	}

	$uploads = wp_upload_dir( null, true );

	if ( ! is_array( $uploads ) || ! empty( $uploads['error'] ) ) {
		return array(
			'path' => '',
			'url'	=> '',
			'error' => 'uploads-unavailable',
		);
	}

	$base_dir = isset( $uploads['basedir'] ) ? $uploads['basedir'] : '';
	$base_url = isset( $uploads['baseurl'] ) ? $uploads['baseurl'] : '';

	if ( ! is_string( $base_dir ) || ! is_string( $base_url ) || '' === $base_dir || '' === $base_url ) {
		return array(
			'path' => '',
			'url'	=> '',
			'error' => 'uploads-base-missing',
		);
	}

	$relative_dir = 'plusmagi-blocks/' . trim( $year_month, '/' );
	$base_dir = trailingslashit( $base_dir ) . $relative_dir;
	$base_url = trailingslashit( $base_url ) . $relative_dir;

	if ( ! function_exists( 'WP_Filesystem' ) ) {
		require_once ABSPATH . 'wp-admin/includes/file.php';
	}

	global $wp_filesystem;

	if ( ! WP_Filesystem() || ! is_object( $wp_filesystem ) ) {
		return array(
			'path' => '',
			'url'  => '',
			'error' => 'filesystem-unavailable',
		);
	}

	if ( ! $wp_filesystem->is_dir( $base_dir ) && ! $wp_filesystem->mkdir( $base_dir, FS_CHMOD_DIR ) ) {
		return array(
			'path' => '',
			'url'	=> '',
			'error' => 'mkdir-failed',
			'target_dir' => $base_dir,
		);
	}

	$normalized = plusmagi_blocks_normalize_source( $mermaid_code );
	$hash = md5( $post_id . '|' . PLUSMAGI_BLOCKS_VERSION . '|' . $normalized . '|' . $svg );
	$filename = 'plusmagi-mermaid-amp-' . $post_id . '-' . $hash . '.svg';
	$file_path = trailingslashit( $base_dir ) . $filename;
	$file_url = trailingslashit( $base_url ) . $filename;

	if ( ! $wp_filesystem->exists( $file_path ) ) {
		if ( ! $wp_filesystem->put_contents( $file_path, $svg, FS_CHMOD_FILE ) ) {
			return array(
				'path' => '',
				'url'	=> '',
				'error' => 'write-failed',
				'target_file' => $file_path,
			);
		}
	}

	return array(
		'path' => $file_path,
		'url'	=> $file_url,
		'error' => '',
	);
}

function plusmagi_blocks_amp_debug_enabled() {
	return is_user_logged_in() && current_user_can( 'manage_options' );
}

function plusmagi_blocks_amp_debug_comment( $reason, $context = array() ) {
	if ( ! plusmagi_blocks_amp_debug_enabled() ) {
		return '';
	}

	$payload = array_merge(
		array(
			'reason' => (string) $reason,
		),
		is_array( $context ) ? $context : array()
	);

	$encoded = wp_json_encode( $payload );

	if ( ! is_string( $encoded ) || '' === $encoded ) {
		$encoded = '{"reason":"unknown"}';
	}

	return '<!-- plusmagi-markdown-amp-debug ' . $encoded . ' -->';
}

function plusmagi_blocks_build_amp_svg_image( $svg_url, $svg_markup ) {
	if ( ! is_string( $svg_url ) || '' === $svg_url ) {
		return '';
	}

	$size = plusmagi_blocks_extract_svg_dimensions( $svg_markup );

	return '<amp-img src="' . esc_url( $svg_url ) . '" width="' . (int) $size['width'] . '" height="' . (int) $size['height'] . '" layout="intrinsic" alt="Mermaid diagram" class="plusmagi-mermaid-amp-image skip-lazy no-lazy" data-skip-lazy="1" data-no-lazy="1"></amp-img>';
}

function plusmagi_blocks_register_menu() {
	add_submenu_page(
		'tools.php',
		__( 'PlusMagi Blocks', 'plusmagi-blocks' ),
		__( 'PlusMagi Blocks', 'plusmagi-blocks' ),
		'manage_options',
		'plusmagi-blocks',
		'plusmagi_blocks_render_page'
	);
}

function plusmagi_blocks_enqueue_admin_assets( $hook_suffix ) {
	if ( 'tools_page_plusmagi-blocks' !== $hook_suffix ) {
		return;
	}

	wp_enqueue_style(
		'plusmagi-markdown-admin',
		PLUSMAGI_BLOCKS_URL . 'css/plusmagi-markdown.css',
		array(),
		PLUSMAGI_BLOCKS_VERSION
	);
}

function plusmagi_blocks_register_blocks() {
	if ( ! function_exists( 'register_block_type' ) ) {
		return;
	}

	wp_register_script(
		'plusmagi-markdown-mermaid-runtime',
		PLUSMAGI_BLOCKS_URL . 'js/vendor/mermaid.min.js',
		array(),
		filemtime( PLUSMAGI_BLOCKS_PATH . 'js/vendor/mermaid.min.js' ),
		true
	);

	wp_register_script(
		'plusmagi-mermaid-zenuml-runtime',
		PLUSMAGI_BLOCKS_URL . 'js/vendor/mermaid-zenuml.min.js',
		array( 'plusmagi-markdown-mermaid-runtime' ),
		filemtime( PLUSMAGI_BLOCKS_PATH . 'js/vendor/mermaid-zenuml.min.js' ),
		true
	);

	wp_register_script(
		'plusmagi-mermaid-zenuml',
		PLUSMAGI_BLOCKS_URL . 'js/plusmagi-zenuml.js',
		array( 'plusmagi-markdown-mermaid-runtime', 'plusmagi-mermaid-zenuml-runtime' ),
		filemtime( PLUSMAGI_BLOCKS_PATH . 'js/plusmagi-zenuml.js' ),
		true
	);

	wp_register_script(
		'plusmagi-mermaid-editor',
		PLUSMAGI_BLOCKS_URL . 'js/plusmagi-mermaid.js',
		array( 'wp-blocks', 'wp-components', 'wp-element', 'wp-i18n', 'plusmagi-markdown-mermaid-runtime', 'plusmagi-mermaid-zenuml' ),
		filemtime( PLUSMAGI_BLOCKS_PATH . 'js/plusmagi-mermaid.js' ),
		true
	);

	wp_register_script(
		'plusmagi-dl-editor',
		PLUSMAGI_BLOCKS_URL . 'js/plusmagi-dl.js',
		array( 'wp-blocks', 'wp-block-editor', 'wp-components', 'wp-element', 'wp-i18n' ),
		filemtime( PLUSMAGI_BLOCKS_PATH . 'js/plusmagi-dl.js' ),
		true
	);

	wp_register_script(
		'plusmagi-thesaurus-editor',
		PLUSMAGI_BLOCKS_URL . 'js/plusmagi-thesaurus.js',
		array( 'wp-blocks', 'wp-block-editor', 'wp-components', 'wp-element', 'wp-i18n' ),
		filemtime( PLUSMAGI_BLOCKS_PATH . 'js/plusmagi-thesaurus.js' ),
		true
	);

	wp_register_script(
		'plusmagi-table-style-editor',
		PLUSMAGI_BLOCKS_URL . 'js/plusmagi-table-style.js',
		array( 'wp-blocks', 'wp-block-editor', 'wp-components', 'wp-compose', 'wp-element', 'wp-hooks' ),
		filemtime( PLUSMAGI_BLOCKS_PATH . 'js/plusmagi-table-style.js' ),
		true
	);

	wp_register_script(
		'plusmagi-svg-editor',
		PLUSMAGI_BLOCKS_URL . 'js/plusmagi-svg.js',
		array( 'wp-blocks', 'wp-block-editor', 'wp-components', 'wp-element' ),
		filemtime( PLUSMAGI_BLOCKS_PATH . 'js/plusmagi-svg.js' ),
		true
	);

	wp_register_style(
		'plusmagi-table-style',
		PLUSMAGI_BLOCKS_URL . 'css/plusmagi-table-style.css',
		array(),
		filemtime( PLUSMAGI_BLOCKS_PATH . 'css/plusmagi-table-style.css' )
	);

	register_block_type(
		PLUSMAGI_BLOCKS_PATH . 'block.json',
		array(
			'render_callback' => 'plusmagi_blocks_render_mermaid_block',
		)
	);

	register_block_type( PLUSMAGI_BLOCKS_PATH . 'block-thesaurus.json' );

	register_block_type(
		PLUSMAGI_BLOCKS_PATH . 'block-description-list.json',
		array( 'render_callback' => 'plusmagi_blocks_render_description_list' )
	);
	register_block_type( 'plusmagi-blocks/description-term', array( 'editor_script' => 'plusmagi-dl-editor' ) );
	register_block_type( PLUSMAGI_BLOCKS_PATH . 'block-description.json' );
	register_block_type( PLUSMAGI_BLOCKS_PATH . 'block-table-style.json' );
	register_block_type(
		PLUSMAGI_BLOCKS_PATH . 'block-svg.json',
		array( 'render_callback' => 'plusmagi_blocks_render_svg_block' )
	);

}

function plusmagi_blocks_render_svg_block( $attributes = array() ) {
	$source = isset( $attributes['svg'] ) ? (string) $attributes['svg'] : '';

	if ( ! preg_match( '/^\s*<svg(?:\s|>)/i', $source ) ) {
		return '';
	}

	$svg = plusmagi_blocks_sanitize_svg( $source );

	if ( '' === $svg ) {
		return '';
	}

	$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => 'plusmagi-svg' ) );

	return '<div ' . $wrapper_attributes . '>' . $svg . '</div>';
}

function plusmagi_blocks_render_description_list( $attributes, $content ) {
	if ( ! class_exists( 'DOMDocument' ) || ! is_string( $content ) || '' === trim( $content ) ) {
		return wp_kses_post( (string) $content );
	}

	$document = new DOMDocument();
	$previous = libxml_use_internal_errors( true );
	$document->loadHTML( '<?xml encoding="UTF-8">' . $content, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD );
	libxml_clear_errors();
	libxml_use_internal_errors( $previous );
	$ordered_list = $document->getElementsByTagName( 'ol' )->item( 0 );

	if ( ! $ordered_list ) {
		return wp_kses_post( $content );
	}

	$description_list = $document->createElement( 'dl' );
	$description_list->setAttribute( 'class', 'wp-block-plusmagi-markdown-description-list' );

	foreach ( iterator_to_array( $ordered_list->childNodes ) as $term_item ) {
		if ( 'li' !== strtolower( $term_item->nodeName ) ) {
			continue;
		}

		$term = $document->createElement( 'dt' );
		$description_list->appendChild( $term );
		foreach ( iterator_to_array( $term_item->childNodes ) as $child ) {
			if ( 'ol' !== strtolower( $child->nodeName ) ) {
				$term->appendChild( $child->cloneNode( true ) );
			}
		}

		$nested_list = null;
		foreach ( iterator_to_array( $term_item->childNodes ) as $child ) {
			if ( 'ol' === strtolower( $child->nodeName ) ) {
				$nested_list = $child;
				break;
			}
		}

		if ( ! $nested_list ) {
			continue;
		}

		foreach ( iterator_to_array( $nested_list->childNodes ) as $description_item ) {
			if ( 'li' !== strtolower( $description_item->nodeName ) ) {
				continue;
			}

			$description = $document->createElement( 'dd' );
			foreach ( iterator_to_array( $description_item->childNodes ) as $child ) {
				$description->appendChild( $child->cloneNode( true ) );
			}
			$description_list->appendChild( $description );
		}
	}

	return wp_kses_post( $document->saveHTML( $description_list ) );
}

function plusmagi_blocks_enqueue_editor_assets() {
	wp_enqueue_script( 'plusmagi-mermaid-editor' );
	wp_enqueue_script( 'plusmagi-dl-editor' );
	wp_enqueue_script( 'plusmagi-thesaurus-editor' );
	wp_enqueue_script( 'plusmagi-table-style-editor' );
	wp_enqueue_script( 'plusmagi-svg-editor' );
	wp_enqueue_style( 'plusmagi-table-style' );
}

function plusmagi_blocks_enqueue_frontend_assets() {
	if ( is_admin() ) {
		return;
	}

	wp_enqueue_style( 'plusmagi-table-style' );

	// AMP pages do not allow Mermaid runtime execution.
	if ( plusmagi_blocks_is_amp_request() ) {
		return;
	}

	wp_enqueue_script(
		'plusmagi-markdown-mermaid-runtime'
	);

	wp_enqueue_script(
		'plusmagi-markdown-frontend',
		PLUSMAGI_BLOCKS_URL . 'js/plusmagi-markdown-frontend.js',
		array( 'plusmagi-markdown-mermaid-runtime', 'plusmagi-mermaid-zenuml' ),
		filemtime( PLUSMAGI_BLOCKS_PATH . 'js/plusmagi-markdown-frontend.js' ),
		true
	);
}

function plusmagi_blocks_render_mermaid_block( $attributes = array() ) {
	$markdown = isset( $attributes['markdown'] ) ? $attributes['markdown'] : '';
	$raw_amp_svg = isset( $attributes['ampSvg'] ) ? (string) $attributes['ampSvg'] : '';
	$amp_svg = '';

	if ( '# PlusMagi Markdown\n\nWrite markdown here...' === $markdown ) {
		$markdown = '';
	}
	$markdown = plusmagi_blocks_normalize_source( $markdown );
	$mermaid_code = plusmagi_blocks_extract_mermaid_code( $markdown );

	if ( '' !== $mermaid_code ) {
		if ( plusmagi_blocks_is_amp_request() ) {
			$debug = '';
			$amp_svg = '' !== $raw_amp_svg ? plusmagi_blocks_sanitize_svg( $raw_amp_svg ) : '';

			if ( '' !== $amp_svg ) {
				$stored_svg = plusmagi_blocks_store_svg_file( $amp_svg, $mermaid_code );
				$amp_image = plusmagi_blocks_build_amp_svg_image( $stored_svg['url'], $amp_svg );

				if ( '' !== $amp_image ) {
					return plusmagi_blocks_sanitize_rendered_html( '<div class="wp-block-plusmagi-markdown-mermaid"><div class="plusmagi-markdown-front-mermaid plusmagi-markdown-front-mermaid-amp-svg" data-plusmagi-mermaid="1">' . $amp_image . '</div></div>' );
				}

				$debug = plusmagi_blocks_amp_debug_comment(
					'amp-svg-present-but-file-image-failed',
					array(
						'store_error' => isset( $stored_svg['error'] ) ? $stored_svg['error'] : '',
						'target_path' => isset( $stored_svg['path'] ) ? $stored_svg['path'] : '',
						'target_url'	=> isset( $stored_svg['url'] ) ? $stored_svg['url'] : '',
					)
				);

				return plusmagi_blocks_sanitize_rendered_html( '<div class="wp-block-plusmagi-markdown-mermaid">' . $debug . '<div class="plusmagi-markdown-front-mermaid plusmagi-markdown-front-mermaid-amp-svg" data-plusmagi-mermaid="1">' . $amp_svg . '</div></div>' );
			}

			$debug = plusmagi_blocks_amp_debug_comment(
				'amp-svg-missing-or-sanitized-empty',
				array(
					'raw_amp_svg_length' => strlen( $raw_amp_svg ),
				)
			);

			$non_amp_url = plusmagi_blocks_get_non_amp_url();
			$hint = '<p class="plusmagi-markdown-amp-hint">AMP page could not render Mermaid to SVG on this server. Open the non-AMP view to render the diagram.</p>';

			if ( '' !== $non_amp_url ) {
				$hint = '<p class="plusmagi-markdown-amp-hint">AMP page could not render Mermaid to SVG on this server. <a href="' . esc_url( $non_amp_url ) . '">Open non-AMP view</a> to render the diagram.</p>';
			}

			return plusmagi_blocks_sanitize_rendered_html( '<div class="wp-block-plusmagi-markdown-mermaid">' . $debug . '<div class="plusmagi-markdown-front-mermaid" data-plusmagi-mermaid="1">' . $hint . '<pre class="mermaid">' . esc_html( $mermaid_code ) . '</pre></div></div>' );
		}

		return plusmagi_blocks_sanitize_rendered_html( '<div class="wp-block-plusmagi-markdown-mermaid"><div class="plusmagi-markdown-front-mermaid" data-plusmagi-mermaid="1"><pre class="mermaid">' . esc_html( $mermaid_code ) . '</pre></div></div>' );
	}

	$lines = preg_split( '/\n/', $markdown );
	$html = array();
	$paragraph = array();

	$flush_paragraph = static function () use ( &$paragraph, &$html ) {
		if ( empty( $paragraph ) ) {
			return;
		}
		$html[] = '<p>' . implode( ' ', $paragraph ) . '</p>';
		$paragraph = array();
	};

	foreach ( $lines as $line ) {
		if ( '' === trim( $line ) ) {
			$flush_paragraph();
			continue;
		}

		if ( preg_match( '/^(#{1,6})\s+(.*)$/', $line, $matches ) ) {
			$flush_paragraph();
			$level = strlen( $matches[1] );
			$html[] = '<h' . $level . '>' . esc_html( trim( $matches[2] ) ) . '</h' . $level . '>';
			continue;
		}

		if ( preg_match( '/^-\s+(.*)$/', $line, $matches ) ) {
			$flush_paragraph();
			$html[] = '<ul><li>' . esc_html( trim( $matches[1] ) ) . '</li></ul>';
			continue;
		}

		$paragraph[] = esc_html( $line );
	}

	$flush_paragraph();

	if ( empty( $html ) ) {
		return '';
	}

	return plusmagi_blocks_sanitize_rendered_html( '<div class="wp-block-plusmagi-markdown-mermaid">' . implode( "\n", $html ) . '</div>' );
}

function plusmagi_blocks_render_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( esc_html__( 'You do not have permission to access this page.', 'plusmagi-blocks' ) );
	}
	?>
	<div class="wrap plusmagi-markdown-page">
		<h1><?php esc_html_e( 'PlusMagi Blocks', 'plusmagi-blocks' ); ?></h1>
		<p><?php esc_html_e( 'This plugin is running with the new PlusMagi Gutenberg Blocks entry point.', 'plusmagi-blocks' ); ?></p>
		<ul>
			<li><?php esc_html_e( 'No legacy tags-reindex files are required.', 'plusmagi-blocks' ); ?></li>
			<li><?php esc_html_e( 'The plugin is ready for future block enhancements.', 'plusmagi-blocks' ); ?></li>
		</ul>
	</div>
	<?php
}
