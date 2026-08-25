<?php
/**
 * Plugin Name: Mermaid Diagram Renderer
 * Plugin URI: https://plusmagi-blocks.plusmagi.com/
 * Description: Adds support for writing, saving, and rendering Mermaid diagrams in WordPress posts and on the frontend.
 * Version: 1.0.0
 * Author: Your Name
 */

// Define constants
define('MM_PLUGIN_PATH', __FILE__);
define('MM_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('MM_PLUGIN_URL', plugin_dir_url(__FILE__));

/**
 * Autoloader for our classes.
 */
require_once MM_PLUGIN_DIR . 'includes/class-frontend-renderer.php';
require_once MM_PLUGIN_DIR . 'includes/class-editor-handler.php';
require_once MM_PLUGIN_DIR . 'includes/class-thesaurus-renderer.php';

/**
 * Main Plugin Class to initialize components.
 */
final class MermaidRenderer {

	private static $instance = null;

	public static function get_instance() {
		if (self::$instance === null) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		// Initialize components that handle core WordPress actions
		new \Mermaid\FrontendRenderer(); // Handles frontend rendering hooks
		new \Mermaid\EditorHandler();   // Handles editor block registration and saving logic
		new \Mermaid\ThesaurusRenderer(); // Handles thesaurus block registration and rendering
	}

	/**
	 * Throttles activation/deactivation hooks if necessary in the future.
	 */
	public static function activate() {
		// Add any setup functions here on activation
	}
}

// Initialize the plugin instance
MermaidRenderer::get_instance();

// Optional: Hook activation for cleanup or initial data seeding
register_activation_hook(__FILE__, ['MermaidRenderer', 'activate']);
