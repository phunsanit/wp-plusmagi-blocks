=== PlusMagi Blocks ===
Contributors: phunsanit
Tags: blocks, mermaid, table, thesaurus, editor
Requires at least: 6.0
Tested up to: 7.1
Stable tag: 1.0.0
Development: https://github.com/phunsanit/wp-plusmagi-blocks
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

PlusMagi Blocks adds Gutenberg tools for Mermaid diagrams, Description Lists, Thesaurus entries, and Word-inspired Table Styles.

== Description ==

PlusMagi Blocks provides a streamlined experience for working with custom content blocks inside WordPress and the block editor.
It adds focused workflows for Mermaid diagrams, description lists, thesaurus entries, and styled tables while keeping the WordPress editing experience intact.

Plugin directory visuals are included via the standard WordPress.org assets:

* Header banner: `assets/banner-1544x500.png` and `assets/banner-772x250.png`
* Plugin icon: `assets/icon-256x256.png` and `assets/icon-128x128.png`

== Features ==

* Mermaid diagram block with Markdown-based editing
* Description List block (`<dl>`/`<dt>`/`<dd>`) with add/remove items
* Thesaurus block for definitions, synonyms, and antonyms
* 107 Microsoft Word-inspired styles for the native Gutenberg Table block
* Optional Banded Columns and in-editor style switching
* Gutenberg-friendly editor integration
* Lightweight plugin structure for easy maintenance
* Simple installation and activation process

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

== Changelog ==

= 1.0.0 =
* Initial public release
* Added PlusMagi Blocks plugin entry point
* Added Mermaid diagram block and Description List block
* Added Thesaurus and 107 Table Styles for native Gutenberg tables
* Added optional Banded Columns and in-editor style switching
* Added basic WordPress plugin scaffold and metadata

== Upgrade Notice ==

= 1.0.0 =
Initial version.
