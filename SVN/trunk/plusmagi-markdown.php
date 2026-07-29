<?php
/**
 * Plugin Name: PlusMagi Markdown
 * Plugin URI: https://wordpress.org/plugins/plusmagi-markdown/
 * Description: Adds a lightweight Markdown-focused experience for WordPress content authors.
 * Version: 1.0.0
 * Author: Pitt Phunsanit
 * Author URI: https://pitt.plusmagi.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: plusmagi-markdown
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! defined( 'PLUSMAGI_MARKDOWN_VERSION' ) ) {
	define( 'PLUSMAGI_MARKDOWN_VERSION', '1.0.0' );
}

if ( ! defined( 'PLUSMAGI_MARKDOWN_PATH' ) ) {
	define( 'PLUSMAGI_MARKDOWN_PATH', plugin_dir_path( __FILE__ ) );
}

if ( ! defined( 'PLUSMAGI_MARKDOWN_URL' ) ) {
	define( 'PLUSMAGI_MARKDOWN_URL', plugin_dir_url( __FILE__ ) );
}

add_action( 'admin_menu', 'plusmagi_markdown_register_menu' );
add_action( 'admin_enqueue_scripts', 'plusmagi_markdown_enqueue_admin_assets' );
add_action( 'init', 'plusmagi_markdown_register_blocks' );
add_action( 'wp_enqueue_scripts', 'plusmagi_markdown_enqueue_frontend_assets' );

function plusmagi_markdown_is_amp_request() {
	return function_exists( 'amp_is_request' ) && amp_is_request();
}

function plusmagi_markdown_can_render_amp_svg_server_side() {
	if ( is_admin() ) {
		return false;
	}

	if ( defined( 'REST_REQUEST' ) && REST_REQUEST ) {
		return false;
	}

	return true;
}

function plusmagi_markdown_amp_cli_fallback_enabled() {
	return (bool) apply_filters( 'plusmagi_markdown_amp_cli_fallback_enabled', false );
}

function plusmagi_markdown_get_non_amp_url() {
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

function plusmagi_markdown_get_mermaid_cli_command() {
	$command = apply_filters( 'plusmagi_markdown_mermaid_cli_command', 'mmdc' );

	if ( ! is_string( $command ) ) {
		return '';
	}

	$command = trim( $command );

	return $command;
}

function plusmagi_markdown_mermaid_cli_is_available() {
	$command = plusmagi_markdown_get_mermaid_cli_command();

	if ( '' === $command ) {
		return false;
	}

	$required_functions = array(
		'proc_open',
		'proc_close',
		'stream_get_contents',
		'file_put_contents',
		'file_get_contents',
		'unlink',
	);

	foreach ( $required_functions as $required_function ) {
		if ( ! function_exists( $required_function ) || ! is_callable( $required_function ) ) {
			return false;
		}
	}

	if ( ! function_exists( 'wp_tempnam' ) || ! is_callable( 'wp_tempnam' ) ) {
		return false;
	}

	$disabled = ini_get( 'disable_functions' );

	if ( is_string( $disabled ) && '' !== $disabled ) {
		$disabled_functions = array_map( 'trim', explode( ',', $disabled ) );

		if ( in_array( 'proc_open', $disabled_functions, true ) || in_array( 'proc_close', $disabled_functions, true ) ) {
			return false;
		}
	}

	return true;
}

function plusmagi_markdown_render_mermaid_to_svg( $mermaid_code ) {
	try {
		if ( ! plusmagi_markdown_mermaid_cli_is_available() ) {
			return '';
		}

		$normalized = plusmagi_markdown_normalize_source( $mermaid_code );
		$normalized = trim( $normalized );

		if ( '' === $normalized ) {
			return '';
		}

		$page_id = (int) get_queried_object_id();
		$source_hash = md5( $normalized );
		$cache_key = 'plusmagi_md_svg_' . md5( $page_id . '|' . PLUSMAGI_MARKDOWN_VERSION . '|' . $source_hash );
		$cached_svg = get_transient( $cache_key );

		if ( is_string( $cached_svg ) && '' !== $cached_svg ) {
			return $cached_svg;
		}

		$input_file = wp_tempnam( 'plusmagi-mermaid-input' );
		$output_file = wp_tempnam( 'plusmagi-mermaid-output' );

		if ( ! $input_file || ! $output_file ) {
			return '';
		}

		// Mermaid CLI treats output extension as format, so force .svg.
		$output_svg_file = $output_file . '.svg';

		if ( false === file_put_contents( $input_file, $normalized ) ) {
			if ( file_exists( $input_file ) ) {
				unlink( $input_file );
			}
			if ( file_exists( $output_file ) ) {
				unlink( $output_file );
			}

			return '';
		}

		$command = plusmagi_markdown_get_mermaid_cli_command();
		$cli_command = escapeshellcmd( $command ) . ' -q -i ' . escapeshellarg( $input_file ) . ' -o ' . escapeshellarg( $output_svg_file ) . ' -b transparent';

		$descriptors = array(
			0 => array( 'pipe', 'r' ),
			1 => array( 'pipe', 'w' ),
			2 => array( 'pipe', 'w' ),
		);

		$process = proc_open( $cli_command, $descriptors, $pipes );

		if ( ! is_resource( $process ) ) {
			unlink( $input_file );
			if ( file_exists( $output_file ) ) {
				unlink( $output_file );
			}

			return '';
		}

		fclose( $pipes[0] );
		stream_get_contents( $pipes[1] );
		fclose( $pipes[1] );
		stream_get_contents( $pipes[2] );
		fclose( $pipes[2] );
		$exit_code = proc_close( $process );

		unlink( $input_file );
		if ( file_exists( $output_file ) ) {
			unlink( $output_file );
		}

		if ( 0 !== $exit_code || ! file_exists( $output_svg_file ) ) {
			if ( file_exists( $output_svg_file ) ) {
				unlink( $output_svg_file );
			}

			return '';
		}

		$svg = file_get_contents( $output_svg_file );
		unlink( $output_svg_file );

		if ( ! is_string( $svg ) || '' === trim( $svg ) ) {
			return '';
		}

		$svg = trim( $svg );

		if ( false === strpos( $svg, '<svg' ) ) {
			return '';
		}

		set_transient( $cache_key, $svg, DAY_IN_SECONDS * 7 );

		return $svg;
	} catch ( Throwable $error ) {
		return '';
	}
}

function plusmagi_markdown_normalize_source( $source ) {
	$source = str_replace( "\r\n", "\n", (string) $source );
	$source = str_replace( array( '–>', '—>', '−>' ), '-->', $source );
	$source = str_replace( array( '<–', '<—', '<−' ), '<--', $source );
	$source = str_replace( "\xc2\xa0", ' ', $source );

	return $source;
}

function plusmagi_markdown_looks_like_mermaid( $source ) {
	$source = trim( plusmagi_markdown_normalize_source( $source ) );

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

function plusmagi_markdown_extract_mermaid_code( $markdown ) {
	$source = plusmagi_markdown_normalize_source( $markdown );

	if ( preg_match( '/```mermaid\s*([\s\S]*?)```/i', $source, $matches ) ) {
		return trim( $matches[1] );
	}

	if ( plusmagi_markdown_looks_like_mermaid( $source ) ) {
		return trim( $source );
	}

	return '';
}

function plusmagi_markdown_get_allowed_svg_tags() {
	$global_attributes = array(
		'class'                => true,
		'id'                   => true,
		'transform'            => true,
		'style'                => true,
		'fill'                 => true,
		'stroke'               => true,
		'stroke-width'         => true,
		'stroke-linecap'       => true,
		'stroke-linejoin'      => true,
		'stroke-miterlimit'    => true,
		'stroke-dasharray'     => true,
		'stroke-dashoffset'    => true,
		'stroke-opacity'       => true,
		'fill-opacity'         => true,
		'opacity'              => true,
		'font-family'          => true,
		'font-size'            => true,
		'font-weight'          => true,
		'text-anchor'          => true,
		'dominant-baseline'    => true,
		'clip-path'            => true,
		'mask'                 => true,
		'filter'               => true,
		'aria-label'           => true,
		'role'                 => true,
	);

	$tags = array(
		'svg' => array_merge(
			$global_attributes,
			array(
				'xmlns'               => true,
				'xmlns:xlink'         => true,
				'viewbox'             => true,
				'width'               => true,
				'height'              => true,
				'preserveaspectratio' => true,
			)
		),
		'g'              => $global_attributes,
		'path'           => array_merge( $global_attributes, array( 'd' => true ) ),
		'rect'           => array_merge( $global_attributes, array( 'x' => true, 'y' => true, 'rx' => true, 'ry' => true, 'width' => true, 'height' => true ) ),
		'circle'         => array_merge( $global_attributes, array( 'cx' => true, 'cy' => true, 'r' => true ) ),
		'ellipse'        => array_merge( $global_attributes, array( 'cx' => true, 'cy' => true, 'rx' => true, 'ry' => true ) ),
		'line'           => array_merge( $global_attributes, array( 'x1' => true, 'y1' => true, 'x2' => true, 'y2' => true ) ),
		'polyline'       => array_merge( $global_attributes, array( 'points' => true ) ),
		'polygon'        => array_merge( $global_attributes, array( 'points' => true ) ),
		'text'           => array_merge( $global_attributes, array( 'x' => true, 'y' => true, 'dx' => true, 'dy' => true ) ),
		'tspan'          => array_merge( $global_attributes, array( 'x' => true, 'y' => true, 'dx' => true, 'dy' => true ) ),
		'defs'           => $global_attributes,
		'marker'         => array_merge( $global_attributes, array( 'markerwidth' => true, 'markerheight' => true, 'refx' => true, 'refy' => true, 'orient' => true, 'viewbox' => true ) ),
		'use'            => array_merge( $global_attributes, array( 'href' => true, 'xlink:href' => true, 'x' => true, 'y' => true ) ),
		'symbol'         => array_merge( $global_attributes, array( 'viewbox' => true ) ),
		'title'          => array(),
		'desc'           => array(),
		'style'          => array( 'type' => true ),
		'clippath'       => array_merge( $global_attributes, array( 'clipPathUnits' => true ) ),
		'mask'           => array_merge( $global_attributes, array( 'x' => true, 'y' => true, 'width' => true, 'height' => true ) ),
		'pattern'        => array_merge( $global_attributes, array( 'x' => true, 'y' => true, 'width' => true, 'height' => true, 'patternUnits' => true, 'patternTransform' => true ) ),
		'lineargradient' => array_merge( $global_attributes, array( 'id' => true, 'x1' => true, 'y1' => true, 'x2' => true, 'y2' => true, 'gradientUnits' => true, 'gradientTransform' => true ) ),
		'radialgradient' => array_merge( $global_attributes, array( 'id' => true, 'cx' => true, 'cy' => true, 'r' => true, 'fx' => true, 'fy' => true, 'gradientUnits' => true, 'gradientTransform' => true ) ),
		'stop'           => array_merge( $global_attributes, array( 'offset' => true, 'stop-color' => true, 'stop-opacity' => true ) ),
	);

	return $tags;
}

function plusmagi_markdown_sanitize_svg( $svg ) {
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
	$sanitized = is_string( $sanitized ) ? trim( $sanitized ) : '';

	if ( ! is_string( $sanitized ) || '' === trim( $sanitized ) || false === strpos( $sanitized, '<svg' ) ) {
		return '';
	}

	return $sanitized;
}

function plusmagi_markdown_extract_svg_dimensions( $svg ) {
	$default = array(
		'width'  => 1200,
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
				'width'  => $width,
				'height' => $height,
			);
		}
	}

	if ( preg_match( '/\swidth\s*=\s*"([0-9.]+)(?:px)?"/i', $svg, $width_match ) && preg_match( '/\sheight\s*=\s*"([0-9.]+)(?:px)?"/i', $svg, $height_match ) ) {
		$width = (int) round( (float) $width_match[1] );
		$height = (int) round( (float) $height_match[1] );

		if ( $width > 0 && $height > 0 ) {
			return array(
				'width'  => $width,
				'height' => $height,
			);
		}
	}

	return $default;
}

function plusmagi_markdown_store_svg_file( $svg, $mermaid_code ) {
	if ( ! is_string( $svg ) || '' === trim( $svg ) ) {
		return array(
			'path' => '',
			'url'  => '',
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
			'url'  => '',
			'error' => 'uploads-unavailable',
		);
	}

	$base_dir = isset( $uploads['basedir'] ) ? $uploads['basedir'] : '';
	$base_url = isset( $uploads['baseurl'] ) ? $uploads['baseurl'] : '';

	if ( ! is_string( $base_dir ) || ! is_string( $base_url ) || '' === $base_dir || '' === $base_url ) {
		return array(
			'path' => '',
			'url'  => '',
			'error' => 'uploads-base-missing',
		);
	}

	$base_dir = trailingslashit( $base_dir ) . trim( $year_month, '/' );
	$base_url = trailingslashit( $base_url ) . trim( $year_month, '/' );

	if ( ! wp_mkdir_p( $base_dir ) ) {
		return array(
			'path' => '',
			'url'  => '',
			'error' => 'mkdir-failed',
			'target_dir' => $base_dir,
		);
	}

	$normalized = plusmagi_markdown_normalize_source( $mermaid_code );
	$hash = md5( $post_id . '|' . PLUSMAGI_MARKDOWN_VERSION . '|' . $normalized . '|' . $svg );
	$filename = 'plusmagi-mermaid-amp-' . $post_id . '-' . $hash . '.svg';
	$file_path = trailingslashit( $base_dir ) . $filename;
	$file_url = trailingslashit( $base_url ) . $filename;

	if ( ! file_exists( $file_path ) ) {
		$result = file_put_contents( $file_path, $svg );

		if ( false === $result ) {
			return array(
				'path' => '',
				'url'  => '',
				'error' => 'write-failed',
				'target_file' => $file_path,
			);
		}
	}

	return array(
		'path' => $file_path,
		'url'  => $file_url,
		'error' => '',
	);
}

function plusmagi_markdown_amp_debug_enabled() {
	return is_user_logged_in() && current_user_can( 'manage_options' );
}

function plusmagi_markdown_amp_debug_comment( $reason, $context = array() ) {
	if ( ! plusmagi_markdown_amp_debug_enabled() ) {
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

function plusmagi_markdown_build_amp_svg_image( $svg_url, $svg_markup ) {
	if ( ! is_string( $svg_url ) || '' === $svg_url ) {
		return '';
	}

	$size = plusmagi_markdown_extract_svg_dimensions( $svg_markup );

	return '<amp-img src="' . esc_url( $svg_url ) . '" width="' . (int) $size['width'] . '" height="' . (int) $size['height'] . '" layout="intrinsic" alt="Mermaid diagram"></amp-img>';
}

function plusmagi_markdown_register_menu() {
	add_submenu_page(
		'tools.php',
		__( 'PlusMagi Markdown', 'plusmagi-markdown' ),
		__( 'PlusMagi Markdown', 'plusmagi-markdown' ),
		'manage_options',
		'plusmagi-markdown',
		'plusmagi_markdown_render_page'
	);
}

function plusmagi_markdown_enqueue_admin_assets( $hook_suffix ) {
	if ( 'tools_page_plusmagi-markdown' !== $hook_suffix ) {
		return;
	}

	wp_enqueue_style(
		'plusmagi-markdown-admin',
		PLUSMAGI_MARKDOWN_URL . 'css/plusmagi-markdown.css',
		array(),
		PLUSMAGI_MARKDOWN_VERSION
	);
}

function plusmagi_markdown_register_blocks() {
	if ( ! function_exists( 'register_block_type' ) ) {
		return;
	}

	wp_register_script(
		'plusmagi-markdown-mermaid-runtime',
		PLUSMAGI_MARKDOWN_URL . 'js/vendor/mermaid.min.js',
		array(),
		filemtime( PLUSMAGI_MARKDOWN_PATH . 'js/vendor/mermaid.min.js' ),
		true
	);

	register_block_type(
		PLUSMAGI_MARKDOWN_PATH . 'block.json',
		array(
			'render_callback' => 'plusmagi_markdown_render_mermaid_block',
		)
	);

	wp_enqueue_script(
		'plusmagi-markdown-editor',
		PLUSMAGI_MARKDOWN_URL . 'js/plusmagi-markdown.js',
		array( 'wp-blocks', 'wp-components', 'wp-element', 'wp-i18n', 'plusmagi-markdown-mermaid-runtime' ),
		filemtime( PLUSMAGI_MARKDOWN_PATH . 'js/plusmagi-markdown.js' ),
		true
	);
}

function plusmagi_markdown_enqueue_frontend_assets() {
	if ( is_admin() ) {
		return;
	}

	// AMP pages do not allow Mermaid runtime execution.
	if ( plusmagi_markdown_is_amp_request() ) {
		return;
	}

	wp_enqueue_script(
		'plusmagi-markdown-mermaid-runtime'
	);

	wp_enqueue_script(
		'plusmagi-markdown-frontend',
		PLUSMAGI_MARKDOWN_URL . 'js/plusmagi-markdown-frontend.js',
		array( 'plusmagi-markdown-mermaid-runtime' ),
		filemtime( PLUSMAGI_MARKDOWN_PATH . 'js/plusmagi-markdown-frontend.js' ),
		true
	);
}

function plusmagi_markdown_render_mermaid_block( $attributes = array() ) {
	$markdown = isset( $attributes['markdown'] ) ? $attributes['markdown'] : '';
	$raw_amp_svg = isset( $attributes['ampSvg'] ) ? (string) $attributes['ampSvg'] : '';
	$amp_svg = '';

	if ( '# PlusMagi Markdown\n\nWrite markdown here...' === $markdown ) {
		$markdown = '';
	}
	$markdown = plusmagi_markdown_normalize_source( $markdown );
	$mermaid_code = plusmagi_markdown_extract_mermaid_code( $markdown );

	if ( '' !== $mermaid_code ) {
		if ( plusmagi_markdown_is_amp_request() ) {
			$debug = '';
			$amp_svg = '' !== $raw_amp_svg ? plusmagi_markdown_sanitize_svg( $raw_amp_svg ) : '';

			if ( '' !== $amp_svg ) {
				$stored_svg = plusmagi_markdown_store_svg_file( $amp_svg, $mermaid_code );
				$amp_image = plusmagi_markdown_build_amp_svg_image( $stored_svg['url'], $amp_svg );

				if ( '' !== $amp_image ) {
					return '<div class="wp-block-plusmagi-markdown-mermaid"><div class="plusmagi-markdown-front-mermaid plusmagi-markdown-front-mermaid-amp-svg" data-plusmagi-mermaid="1">' . $amp_image . '</div></div>';
				}

				$debug = plusmagi_markdown_amp_debug_comment(
					'amp-svg-present-but-file-image-failed',
					array(
						'store_error' => isset( $stored_svg['error'] ) ? $stored_svg['error'] : '',
						'target_path' => isset( $stored_svg['path'] ) ? $stored_svg['path'] : '',
						'target_url'  => isset( $stored_svg['url'] ) ? $stored_svg['url'] : '',
					)
				);

				return '<div class="wp-block-plusmagi-markdown-mermaid">' . $debug . '<div class="plusmagi-markdown-front-mermaid plusmagi-markdown-front-mermaid-amp-svg" data-plusmagi-mermaid="1">' . $amp_svg . '</div></div>';
			}

			$debug = plusmagi_markdown_amp_debug_comment(
				'amp-svg-missing-or-sanitized-empty',
				array(
					'raw_amp_svg_length' => strlen( $raw_amp_svg ),
				)
			);

			$rendered_svg = '';

			if ( plusmagi_markdown_can_render_amp_svg_server_side() && plusmagi_markdown_amp_cli_fallback_enabled() ) {
				$rendered_svg = plusmagi_markdown_render_mermaid_to_svg( $mermaid_code );
			}

			if ( '' !== $rendered_svg ) {
				$rendered_svg = plusmagi_markdown_sanitize_svg( $rendered_svg );

				if ( '' !== $rendered_svg ) {
					$stored_svg = plusmagi_markdown_store_svg_file( $rendered_svg, $mermaid_code );
					$amp_image = plusmagi_markdown_build_amp_svg_image( $stored_svg['url'], $rendered_svg );

					if ( '' !== $amp_image ) {
						return '<div class="wp-block-plusmagi-markdown-mermaid"><div class="plusmagi-markdown-front-mermaid plusmagi-markdown-front-mermaid-amp-svg" data-plusmagi-mermaid="1">' . $amp_image . '</div></div>';
					}

					$debug = plusmagi_markdown_amp_debug_comment(
						'cli-svg-produced-but-file-image-failed',
						array(
							'store_error' => isset( $stored_svg['error'] ) ? $stored_svg['error'] : '',
							'target_path' => isset( $stored_svg['path'] ) ? $stored_svg['path'] : '',
							'target_url'  => isset( $stored_svg['url'] ) ? $stored_svg['url'] : '',
						)
					);

					return '<div class="wp-block-plusmagi-markdown-mermaid">' . $debug . '<div class="plusmagi-markdown-front-mermaid plusmagi-markdown-front-mermaid-amp-svg" data-plusmagi-mermaid="1">' . $rendered_svg . '</div></div>';
				}
			}

			$non_amp_url = plusmagi_markdown_get_non_amp_url();
			$hint = '<p class="plusmagi-markdown-amp-hint">AMP page could not render Mermaid to SVG on this server. Open the non-AMP view to render the diagram.</p>';

			if ( '' !== $non_amp_url ) {
				$hint = '<p class="plusmagi-markdown-amp-hint">AMP page could not render Mermaid to SVG on this server. <a href="' . esc_url( $non_amp_url ) . '">Open non-AMP view</a> to render the diagram.</p>';
			}

			return '<div class="wp-block-plusmagi-markdown-mermaid">' . $debug . '<div class="plusmagi-markdown-front-mermaid" data-plusmagi-mermaid="1">' . $hint . '<pre class="mermaid">' . esc_html( $mermaid_code ) . '</pre></div></div>';
		}

		return '<div class="wp-block-plusmagi-markdown-mermaid"><div class="plusmagi-markdown-front-mermaid" data-plusmagi-mermaid="1"><pre class="mermaid">' . esc_html( $mermaid_code ) . '</pre></div></div>';
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

	return '<div class="wp-block-plusmagi-markdown-mermaid">' . implode( "\n", $html ) . '</div>';
}

function plusmagi_markdown_render_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( esc_html__( 'You do not have permission to access this page.', 'plusmagi-markdown' ) );
	}
	?>
	<div class="wrap plusmagi-markdown-page">
		<h1><?php esc_html_e( 'PlusMagi Markdown', 'plusmagi-markdown' ); ?></h1>
		<p><?php esc_html_e( 'This plugin is running with the new PlusMagi Markdown entry point.', 'plusmagi-markdown' ); ?></p>
		<ul>
			<li><?php esc_html_e( 'No legacy tags-reindex files are required.', 'plusmagi-markdown' ); ?></li>
			<li><?php esc_html_e( 'The plugin is ready for future Markdown enhancements.', 'plusmagi-markdown' ); ?></li>
		</ul>
	</div>
	<?php
}
