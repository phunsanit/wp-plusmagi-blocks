=== PlusMagi Blocks ===
Contributors: phunsanit
Tags: blocks, mermaid, sticky-notes, table, editor
Requires at least: 6.0
Tested up to: 7.1
Stable tag: 1.2.1
Development: https://github.com/phunsanit/wp-plusmagi-blocks
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

PlusMagi Blocks adds Gutenberg tools for Description Lists, Mermaid diagrams, Sticky Notes, inline SVG, Table Styles, and Thesaurus entries.

== Description ==

PlusMagi Blocks provides a streamlined experience for working with custom content blocks inside WordPress and the block editor.
It adds focused workflows for Mermaid diagrams, description lists, thesaurus entries, and styled tables while keeping the WordPress editing experience intact.

Plugin directory visuals are included via the standard WordPress.org assets:

* Header banner: `assets/banner-1544x500.png` and `assets/banner-772x250.png`
* Plugin icon: `assets/icon-256x256.png` and `assets/icon-128x128.png`

== Features ==

* **Description List** - Create accessible term-and-description groups with semantic `<dl>`, `<dt>`, and `<dd>` output. Add or remove items directly in Gutenberg.
* **Mermaid Diagram** - Write Mermaid syntax, catch syntax errors, and preview responsive diagrams before publishing.
* **Sticky Notes** - Add a concise 2 x 3 inch semantic note in yellow, pink, blue, green, orange, or purple.
* **SVG** - Paste SVG markup, inspect a live image preview, and publish sanitized inline vectors with wide and full alignment support.
* **Table Styles** - Apply 107 Microsoft Word-inspired designs to the native Gutenberg Table block, including optional Banded Columns.
* **Thesaurus** - Publish definitions, parts of speech, synonyms, antonyms, and related terms as structured semantic content.

== Mermaid Block Placement Guide ==

1. Open a post or page in the WordPress block editor.
2. Click **+ Add block**.
3. Search for **Mermaid** or **PlusMagi Blocks + Mermaid**.
4. Insert the Mermaid block.
5. Paste Mermaid syntax (for example `graph TD\nA-->B`).
6. Confirm the live preview in editor.
7. Publish and verify diagram rendering on frontend.

Tips:

* Use one Mermaid diagram per block for cleaner editing.
* For long technical articles, split diagrams into multiple Mermaid blocks.
* If preview does not render, check Mermaid syntax first (missing arrows, brackets, keywords).

== SVG Block Guide ==

1. Open the block inserter and search for **SVG** or **PlusMagi**.
2. Insert the **PlusMagi - SVG** block.
3. Paste markup that starts with an `<svg>` element.
4. Confirm the preview in the editor.
5. Publish the post or page.

The block renders responsive inline SVG. Scripts, event handlers, and unsafe inline styles are removed before frontend output.

== Sticky Notes Block Guide ==

1. Open the block inserter and search for **Sticky Notes** or **PlusMagi**.
2. Insert the **PlusMagi - Sticky Notes** block.
3. Write the note and choose one of six colors in the block settings.
4. Publish the post or page.

The block publishes an accessible `<aside role="note">` element in a responsive 2 x 3 inch layout. It supports bold, italic, links, text color, font size, line height, font family, weight, style, decoration, and letter case through Gutenberg controls.

== Description List Guide ==

1. Open the block inserter and search for **Description List** or **PlusMagi**.
2. Insert the **PlusMagi - Description List** block.
3. Enter a term and its description.
4. Use the block controls to add or remove items.
5. Publish the post or page.

Example output:

	<dl>
		<dt>WordPress</dt>
		<dd>A content management system for building websites.</dd>
		<dt>Gutenberg</dt>
		<dd>The block editor included with WordPress.</dd>
	</dl>

The block publishes semantic `<dl>`, `<dt>`, and `<dd>` markup for accessible term-and-description content.

== Table Style Guide ==

1. Insert or select a standard Gutenberg Table block.
2. Open the block settings sidebar and expand **Table Design**.
3. Choose one of the 107 styles.
4. Optionally enable **Banded Columns**.
5. Choose **None** at any time to remove the design without changing table content.

Table Styles extend the native Gutenberg Table block. They do not add a heading to published content.

== Installation ==

1. Upload the plugin files to the `/wp-content/plugins/plusmagi-blocks` directory
2. Activate the plugin through the 'Plugins' screen in WordPress

== Screenshots ==

1. Feature cards for Description List, Mermaid Diagram, Sticky Notes, SVG, Table Styles, and Thesaurus, arranged alphabetically.
2. Sticky Notes feature card showing its color, typography controls, and responsive 2 x 3 inch note preview.

== Changelog ==

= 1.2.1 =
* Standardized the block's display name as Sticky Notes
* Renamed Sticky Notes source and asset files to use the sticky_notes convention
* Preserved compatibility with notes saved using the previous accessibility label

= 1.2.0 =
* Added the Sticky Notes block with semantic note markup
* Added six selectable note colors, Gutenberg typography controls, and responsive frontend styling

= 1.1.0 =
* Added the SVG block with source editing and live preview
* Added sanitized, responsive inline SVG rendering

= 1.0.0 =
* Initial public release
* Added PlusMagi Blocks plugin entry point
* Added Mermaid diagram and Description List blocks
* Added Thesaurus and 107 Table Styles for native Gutenberg tables
* Added optional Banded Columns and in-editor style switching
* Added basic WordPress plugin scaffold and metadata

== Upgrade Notice ==

= 1.2.1 =
Standardizes the Sticky Notes name and asset filenames.

= 1.2.0 =
Adds the Sticky Notes block with six coordinated color themes and native typography controls.

= 1.1.0 =
Adds a new block for editing and publishing sanitized inline SVG.

= 1.0.0 =
Initial version.
