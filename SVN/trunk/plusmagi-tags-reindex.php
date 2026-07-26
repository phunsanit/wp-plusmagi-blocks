<?php
/**
 * Plugin Name: PlusMagi Tags Reindex
 * Plugin URI:  https://wordpress.org/plugins/plusmagi-tags-reindex
 * Description: Intelligently manage and reindex post tags, recycle unused term IDs safely, and enhance the Gutenberg tags panel.
 * Version:	 1.0.0
 * Author:	  Pitt Phunsanit
 * Author URI:  https://pitt.plusmagi.com
 * License:	 GPLv2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: plusmagi-tags-reindex
 */

if (!defined('ABSPATH')) {
	exit;
}

class Plusmagi_Tags_Reindex {
	const OPTION_ENABLE_GAP_REINDEX = 'plusmagi_tags_reindex_enable_gap_fill';

	private static $instance = null;

	public static function get_instance() {
		if (self::$instance === null) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	public function __construct() {
		// Register REST API endpoints for Gutenberg
		add_action('rest_api_init', [$this, 'register_rest_endpoints']);

		// Handle admin form submissions
		add_action('admin_init', [$this, 'process_form']);

		// Admin menu and asset loading
		add_action('admin_menu', [$this, 'add_admin_menu']);
		add_action('enqueue_block_editor_assets', [$this, 'enqueue_editor_assets']);
		add_filter('plugin_action_links_' . plugin_basename(__FILE__), [$this, 'add_plugin_action_links']);
	}

	public function register_rest_endpoints() {
		// Endpoint 1: Fetch terms with status metrics (published, scheduled, drafts)
		register_rest_route('plusmagi-tags/v1', '/terms-with-stats', [
			'methods'			 => 'GET',
			'callback'			=> [$this, 'get_terms_with_stats'],
			'permission_callback' => fn() => current_user_can('edit_posts'),
			'args'			   => ['ids' => ['required' => true, 'type' => 'string']],
		]);

		// Endpoint 2: Add and reindex tags from Gutenberg
		register_rest_route('plusmagi-tags/v1', '/add-tag', [
			'methods'			 => 'POST',
			'callback'			=> [$this, 'add_reindexed_tag'],
			'permission_callback' => fn() => current_user_can('edit_posts'),
			'args'			   => [
				'name'		 => ['required' => true, 'type' => 'string'],
				'reindex_gaps' => ['required' => false, 'type' => 'boolean'],
			],
		]);
	}

	public function add_plugin_action_links($links) {
		$settings_url = admin_url('tools.php?page=plusmagi-tags-reindex');

		$action_links = [
			'settings' => sprintf(
				'<a href="%s">%s</a>',
				esc_url($settings_url),
				esc_html__('Settings', 'plusmagi-tags-reindex')
			),
		];

		return array_merge($action_links, $links);
	}

	private function is_gap_reindex_enabled(): bool {
		return get_option(self::OPTION_ENABLE_GAP_REINDEX, '1') === '1';
	}

	public function add_admin_menu() {
		add_management_page(
			__('PlusMagi Tags Reindex', 'plusmagi-tags-reindex'),
			__('Tags Reindex', 'plusmagi-tags-reindex'),
			'manage_options',
			'plusmagi-tags-reindex',
			[$this, 'render_admin_page']
		);
	}

	public function enqueue_editor_assets() {
		$script_file = plugin_dir_path(__FILE__) . 'js/plusmagi-tags-reindex.js';
		$script_ver  = file_exists($script_file) ? filemtime($script_file) : '1.0.2';

		wp_enqueue_style(
			'plusmagi-tags-reindex',
			plugin_dir_url(__FILE__) . 'css/plusmagi-tags-reindex.css',
			array(),
			$script_ver
		);

		wp_enqueue_script(
			'plusmagi-tags-reindex',
			plugin_dir_url(__FILE__) . 'js/plusmagi-tags-reindex.js',
			['wp-plugins', 'wp-editor', 'wp-element', 'wp-components', 'wp-data', 'wp-api-fetch', 'wp-core-data', 'wp-dom-ready', 'wp-i18n'],
			$script_ver,
			true
		);

		wp_localize_script(
			'plusmagi-tags-reindex',
			'plusmagiTagsEditorConfig',
			[
				'statusLabels' => [
					'all'	 => __('All', 'plusmagi-tags-reindex'),
					'publish' => __('Published', 'plusmagi-tags-reindex'),
					'future'  => __('Scheduled', 'plusmagi-tags-reindex'),
					'draft'   => __('Drafts', 'plusmagi-tags-reindex'),
				],
				'reindexEnabled' => $this->is_gap_reindex_enabled(),
			]
		);

		wp_set_script_translations(
			'plusmagi-tags-reindex',
			'plusmagi-tags-reindex',
			plugin_dir_path(__FILE__) . 'languages'
		);
	}

	public function add_reindexed_tag($request) {
		$params = $request->get_json_params();
		$raw_names = $params['name'] ?? $request->get_param('name');

		if (empty($raw_names)) {
			return new WP_Error('missing_name', 'Tag name is required', ['status' => 400]);
		}

		if (is_string($raw_names)) {
			$split_tags = explode(',', $raw_names);
		} elseif (is_array($raw_names)) {
			$split_tags = array_reduce($raw_names, fn($carry, $item) => array_merge($carry, explode(',', $item)), []);
		} else {
			return new WP_Error('invalid_format', 'Invalid tag format', ['status' => 400]);
		}

		$tag_names = array_filter(array_map(function ($name) {
			$name = sanitize_text_field($name);
			$name = preg_replace('/\s+/u', ' ', $name);
			return trim($name);
		}, $split_tags));

		if (empty($tag_names)) {
			return new WP_Error('empty_tag_name', 'Tag name cannot be empty', ['status' => 400]);
		}

		$reindex_gaps = $this->is_gap_reindex_enabled();
		if ($request->has_param('reindex_gaps')) {
			$reindex_gaps = rest_sanitize_boolean($request->get_param('reindex_gaps'));
		}

		$tag_names = array_values(array_unique($tag_names));
		usort($tag_names, fn($a, $b) => strcasecmp($a, $b));

		$this->reindex_tags($tag_names, $reindex_gaps);

		$ids = [];
		foreach ($tag_names as $name) {
			$term = term_exists($name, 'post_tag');
			if ($term && !is_wp_error($term)) {
				$ids[] = (int) $term['term_id'];
			}
		}

		return rest_ensure_response(['ids' => $ids]);
	}

	private function reindex_tags($tags, $fill_gaps = true) {
		global $wpdb;
		$inserted_count = 0;

		$wpdb->query('START TRANSACTION');

		try {
			foreach ($tags as $raw_tag) {
				foreach (explode(',', (string) $raw_tag) as $tag_name) {
					$tag_name = trim(sanitize_text_field($tag_name));
					if (empty($tag_name)) continue;

					if ($this->ensure_tag_exists($tag_name)) {
						continue;
					}

					if (!$fill_gaps) {
						$slug   = $this->generate_unique_slug($tag_name);
						$created = wp_insert_term($tag_name, 'post_tag', ['slug' => $slug]);
						if (!is_wp_error($created)) {
							$inserted_count++;
							clean_term_cache((int) $created['term_id'], 'post_tag');
						}
						continue;
					}

					$new_id = $this->insert_with_gap_filling($tag_name);
					if ($new_id) {
						$inserted_count++;
					}
				}
			}

			$wpdb->query('COMMIT');

			if ($fill_gaps) {
				$this->reset_auto_increment();
			}
		} catch (Exception $e) {
			$wpdb->query('ROLLBACK');
		}

		delete_option('post_tag_children');
		return $inserted_count;
	}

	private function ensure_tag_exists($name) {
		global $wpdb;

		$term_id = $wpdb->get_var($wpdb->prepare(
			"SELECT term_id FROM {$wpdb->terms} WHERE name = %s LIMIT 1",
			$name
		));

		if (!$term_id) return false;

		$has_taxonomy = $wpdb->get_var($wpdb->prepare(
			"SELECT 1 FROM {$wpdb->term_taxonomy} WHERE term_id = %d AND taxonomy = 'post_tag' LIMIT 1",
			$term_id
		));

		if (!$has_taxonomy) {
			$wpdb->insert($wpdb->term_taxonomy, [
				'term_id'	 => $term_id,
				'taxonomy'	=> 'post_tag',
				'description' => '',
				'parent'	  => 0,
				'count'	   => 0
			]);
		}
		return true;
	}

	private function generate_unique_slug($name, $exclude_term_id = 0) {
		global $wpdb;

		$base_slug = sanitize_title($name);
		if (empty($base_slug)) {
			$base_slug = 'tag';
		}

		$slug   = $base_slug;
		$suffix = '-tag';
		$count  = 1;

		while (true) {
			if ($exclude_term_id > 0) {
				$existing = $wpdb->get_var($wpdb->prepare(
					"SELECT term_id FROM {$wpdb->terms} WHERE slug = %s AND term_id != %d LIMIT 1",
					$slug,
					$exclude_term_id
				));
			} else {
				$existing = $wpdb->get_var($wpdb->prepare(
					"SELECT term_id FROM {$wpdb->terms} WHERE slug = %s LIMIT 1",
					$slug
				));
			}

			if (!$existing) {
				return $slug;
			}

			if ($count === 1) {
				$slug = $base_slug . $suffix;
			} else {
				$slug = $base_slug . $suffix . '-' . $count;
			}
			$count++;
		}
	}

	private function insert_with_gap_filling($tag_name) {
		$attempt	  = 0;
		$max_attempts = 30;

		while ($attempt < $max_attempts) {
			$candidate_id = $this->find_available_term_id() + $attempt;

			if (!$this->term_id_exists($candidate_id)) {
				$slug = $this->generate_unique_slug($tag_name, $candidate_id);

				if ($this->insert_term_data($candidate_id, $tag_name, $slug)) {
					clean_term_cache($candidate_id, 'post_tag');
					return $candidate_id;
				}
			}
			$attempt++;
		}

		$slug	= $this->generate_unique_slug($tag_name);
		$fallback = wp_insert_term($tag_name, 'post_tag', ['slug' => $slug]);
		return !is_wp_error($fallback) ? $fallback['term_id'] : false;
	}

	private function term_id_exists($id) {
		global $wpdb;
		return (bool) $wpdb->get_var($wpdb->prepare(
			"SELECT term_id FROM {$wpdb->terms} WHERE term_id = %d LIMIT 1",
			$id
		));
	}

	private function insert_term_data($id, $name, $slug) {
		global $wpdb;

		$result = $wpdb->insert($wpdb->terms, [
			'term_id'	=> $id,
			'name'	   => $name,
			'slug'	   => $slug,
			'term_group' => 0
		], ['%d', '%s', '%s', '%d']);

		if (!$result) {
			return false;
		}

		return $wpdb->insert($wpdb->term_taxonomy, [
			'term_id'	 => $id,
			'taxonomy'	=> 'post_tag',
			'description' => '',
			'parent'	  => 0,
			'count'	   => 0
		], ['%d', '%s', '%s', '%d', '%d']);
	}

	private function find_available_term_id() {
		global $wpdb;
		return (int) $wpdb->get_var("
			SELECT MIN(gap.available_id)
			FROM (
				SELECT (t1.term_id + 1) AS available_id
				FROM {$wpdb->terms} t1
				LEFT JOIN {$wpdb->terms} t2 ON t1.term_id + 1 = t2.term_id
				WHERE t2.term_id IS NULL
				UNION SELECT 1
				WHERE NOT EXISTS (SELECT 1 FROM {$wpdb->terms} WHERE term_id = 1)
			) AS gap
		");
	}

	private function reset_auto_increment() {
		global $wpdb;
		$max = $wpdb->get_var("SELECT MAX(term_id) FROM {$wpdb->terms}");

		if ($max) {
			$wpdb->query($wpdb->prepare("ALTER TABLE {$wpdb->terms} AUTO_INCREMENT = %d", (int)$max + 1));
		}
	}

	public function fix_conflicting_term_slugs() {
		global $wpdb;

		$conflicts = $wpdb->get_results("
			SELECT t.term_id, t.name, t.slug
			FROM {$wpdb->terms} t
			JOIN {$wpdb->term_taxonomy} tt ON t.term_id = tt.term_id
			WHERE tt.taxonomy = 'post_tag'
			  AND t.slug IN (
				  SELECT t2.slug
				  FROM {$wpdb->terms} t2
				  JOIN {$wpdb->term_taxonomy} tt2 ON t2.term_id = tt2.term_id
				  WHERE tt2.taxonomy = 'category'
			  )
		");

		$fixed_count = 0;
		if (!empty($conflicts)) {
			foreach ($conflicts as $term) {
				$new_slug = $this->generate_unique_slug($term->name, $term->term_id);
				$updated = $wpdb->update(
					$wpdb->terms,
					['slug' => $new_slug],
					['term_id' => $term->term_id],
					['%s'],
					['%d']
				);

				if ($updated !== false) {
					clean_term_cache($term->term_id, 'post_tag');
					$fixed_count++;
				}
			}
		}

		wp_cache_flush();
		return $fixed_count;
	}

	public function render_admin_page() {
		$enable_gap_reindex = $this->is_gap_reindex_enabled();

		$inserted_param = filter_input(INPUT_GET, 'inserted', FILTER_VALIDATE_INT);
		$fixed_param	= filter_input(INPUT_GET, 'fixed_slugs', FILTER_VALIDATE_INT);
		$error_param	= filter_input(INPUT_GET, 'error', FILTER_DEFAULT);
		$updated_param  = filter_input(INPUT_GET, 'settings_updated', FILTER_DEFAULT);

		$fix_slug_url = wp_nonce_url(
			admin_url('tools.php?page=plusmagi-tags-reindex&action=fix_term_slugs'),
			'plusmagi_fix_slugs_action',
			'plusmagi_fix_slugs_nonce'
		);
		?>
		<div class="wrap">
			<h1><?php echo esc_html(__('PlusMagi Tags Reindex', 'plusmagi-tags-reindex')); ?></h1>
			<p><?php echo esc_html(__('Manage and reindex post tags safely. Missing term_id gaps will be recycled when enabled.', 'plusmagi-tags-reindex')); ?></p>

			<?php
			if ($inserted_param !== null && $inserted_param !== false) {
				echo '<div class="notice notice-success is-dismissible"><p>';
				printf(esc_html__('Successfully inserted %d new tags.', 'plusmagi-tags-reindex'), intval($inserted_param));
				echo '</p></div>';
			}
			if ($fixed_param !== null && $fixed_param !== false) {
				echo '<div class="notice notice-success is-dismissible"><p>';
				printf(esc_html__('Successfully fixed %d conflicting tag slug(s).', 'plusmagi-tags-reindex'), intval($fixed_param));
				echo '</p></div>';
			}
			if ($error_param !== null) {
				echo '<div class="notice notice-error is-dismissible"><p>' .
					 esc_html__('Invalid format or empty tags.', 'plusmagi-tags-reindex') .
					 '</p></div>';
			}
			if ($updated_param !== null) {
				echo '<div class="notice notice-success is-dismissible"><p>' .
					 esc_html__('Settings saved successfully.', 'plusmagi-tags-reindex') .
					 '</p></div>';
			}
			?>

			<form method="post" action="" style="margin: 20px 0;">
				<?php wp_nonce_field('plusmagi_tags_reindex_settings_action', 'plusmagi_tags_reindex_settings_nonce'); ?>
				<table class="form-table">
					<tr>
						<th scope="row"><?php echo esc_html(__('ID Mode', 'plusmagi-tags-reindex')); ?></th>
						<td>
							<label for="enable_gap_reindex">
								<input type="checkbox" id="enable_gap_reindex" name="enable_gap_reindex" value="1"
									   <?php checked($enable_gap_reindex); ?> />
								<?php echo esc_html(__('Enable Gap Filling (Reuse missing term_id)', 'plusmagi-tags-reindex')); ?>
							</label>
							<p class="description"><?php echo esc_html(__('When disabled, new tags use WordPress default auto-increment.', 'plusmagi-tags-reindex')); ?></p>
						</td>
					</tr>
				</table>
				<?php submit_button(__('Save Settings', 'plusmagi-tags-reindex'), 'secondary', 'save_settings'); ?>
			</form>

			<hr />

			<form method="post" action="" style="margin: 20px 0;">
				<?php wp_nonce_field('plusmagi_tags_reindex_action', 'plusmagi_tags_reindex_nonce'); ?>
				<h2><?php echo esc_html(__('Import / Add Tags', 'plusmagi-tags-reindex')); ?></h2>
				<table class="form-table">
					<tr>
						<th scope="row"><label for="tags_input"><?php echo esc_html(__('Tags List', 'plusmagi-tags-reindex')); ?></label></th>
						<td>
							<textarea name="tags_input" id="tags_input" rows="6" cols="80" class="large-text code"
									  placeholder="MacOS, คีย์ลัด, Documentation"></textarea>
							<p class="description"><?php echo esc_html(__('Enter tags separated by commas or new lines.', 'plusmagi-tags-reindex')); ?></p>
						</td>
					</tr>
				</table>
				<?php submit_button(__('Import Tags', 'plusmagi-tags-reindex'), 'primary'); ?>
			</form>

			<hr />

			<div style="margin: 20px 0;">
				<h2><?php echo esc_html(__('Maintenance Tools', 'plusmagi-tags-reindex')); ?></h2>
				<p><?php echo esc_html(__('If you encounter 403 Forbidden errors when editing categories, run this tool to resolve slug conflicts between Tags and Categories.', 'plusmagi-tags-reindex')); ?></p>
				<a href="<?php echo esc_url($fix_slug_url); ?>"
				   class="button button-secondary"
				   onclick="return confirm('<?php echo esc_js(__('Are you sure you want to fix conflicting tag slugs?', 'plusmagi-tags-reindex')); ?>');">
					<?php echo esc_html(__('Fix Conflicting Term Slugs', 'plusmagi-tags-reindex')); ?>
				</a>
			</div>
		</div>
		<?php
	}

	public function process_form() {
		if (!current_user_can('manage_options')) {
			return;
		}

		if (isset($_GET['action']) && $_GET['action'] === 'fix_term_slugs') {
			if (isset($_GET['plusmagi_fix_slugs_nonce']) &&
				wp_verify_nonce(sanitize_text_field(wp_unslash($_GET['plusmagi_fix_slugs_nonce'])), 'plusmagi_fix_slugs_action')) {

				$fixed_count = $this->fix_conflicting_term_slugs();
				wp_safe_redirect(add_query_arg('fixed_slugs', $fixed_count, admin_url('tools.php?page=plusmagi-tags-reindex')));
				exit;
			}
		}

		if (isset($_POST['plusmagi_tags_reindex_settings_nonce']) &&
			wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['plusmagi_tags_reindex_settings_nonce'])), 'plusmagi_tags_reindex_settings_action')) {

			$enable = isset($_POST['enable_gap_reindex']) ? '1' : '0';
			update_option(self::OPTION_ENABLE_GAP_REINDEX, $enable);

			wp_safe_redirect(add_query_arg('settings_updated', '1', admin_url('tools.php?page=plusmagi-tags-reindex')));
			exit;
		}

		if (isset($_POST['plusmagi_tags_reindex_nonce']) &&
			wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['plusmagi_tags_reindex_nonce'])), 'plusmagi_tags_reindex_action')) {

			$raw_input = isset($_POST['tags_input']) ? sanitize_textarea_field(wp_unslash($_POST['tags_input'])) : '';

			if (empty($raw_input)) {
				wp_safe_redirect(add_query_arg('error', '1', admin_url('tools.php?page=plusmagi-tags-reindex')));
				exit;
			}

			// 1. Attempt JSON decoding (for backward compatibility)
			$tags = json_decode($raw_input, true);

			// 2. Fall back to comma-separated or newline string parsing
			if (!is_array($tags)) {
				$raw_input = str_replace(["\r\n", "\r", "\n"], ',', $raw_input);
				$tags	  = explode(',', $raw_input);
			}

			$tags = array_filter(array_map('trim', $tags));

			if (empty($tags)) {
				wp_safe_redirect(add_query_arg('error', '1', admin_url('tools.php?page=plusmagi-tags-reindex')));
				exit;
			}

			$reindex_gaps   = $this->is_gap_reindex_enabled();
			$inserted_count = $this->reindex_tags($tags, $reindex_gaps);

			wp_safe_redirect(add_query_arg(['inserted' => $inserted_count], admin_url('tools.php?page=plusmagi-tags-reindex')));
			exit;
		}
	}

	public function get_terms_with_stats($request) {
		global $wpdb;

		$ids_raw = $request->get_param('ids');
		$ids	 = array_values(array_filter(array_map('intval', explode(',', (string)$ids_raw))));

		if (empty($ids)) {
			return rest_ensure_response([]);
		}

		$terms = get_terms([
			'taxonomy'   => 'post_tag',
			'include'	=> $ids,
			'hide_empty' => false,
		]);

		if (is_wp_error($terms) || empty($terms)) {
			return rest_ensure_response([]);
		}

		$placeholders = implode(',', array_fill(0, count($ids), '%d'));
		$params	   = array_merge(['post_tag'], $ids);

		$rows = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT tt.term_id,
						SUM(CASE WHEN p.post_status = 'publish' THEN 1 ELSE 0 END) AS published,
						SUM(CASE WHEN p.post_status = 'future' THEN 1 ELSE 0 END) AS future,
						SUM(CASE WHEN p.post_status = 'draft' THEN 1 ELSE 0 END) AS draft
				 FROM {$wpdb->term_taxonomy} tt
				 LEFT JOIN {$wpdb->term_relationships} tr ON tt.term_taxonomy_id = tr.term_taxonomy_id
				 LEFT JOIN {$wpdb->posts} p ON tr.object_id = p.ID
				 WHERE tt.taxonomy = %s
				   AND tt.term_id IN ($placeholders)
				 GROUP BY tt.term_id",
				$params
			),
			ARRAY_A
		);

		$stats_map = [];
		if (is_array($rows)) {
			foreach ($rows as $row) {
				$stats_map[(int)$row['term_id']] = [
					'published' => (int)$row['published'],
					'future'	=> (int)$row['future'],
					'draft'	 => (int)$row['draft'],
				];
			}
		}

		$result = [];
		foreach ($terms as $term) {
			$id = (int)$term->term_id;
			$stats = $stats_map[$id] ?? ['published' => 0, 'future' => 0, 'draft' => 0];

			$result[] = [
				'id'		=> $id,
				'name'	  => $term->name,
				'slug'	  => $term->slug,
				'edit_link' => get_edit_term_link($id, 'post_tag'),
				'all'	   => $stats['published'] + $stats['future'] + $stats['draft'],
				'published' => $stats['published'],
				'future'	=> $stats['future'],
				'draft'	 => $stats['draft'],
			];
		}

		usort($result, fn($a, $b) => strcasecmp($a['name'], $b['name']));

		return rest_ensure_response($result);
	}
}

add_action('plugins_loaded', ['Plusmagi_Tags_Reindex', 'get_instance']);