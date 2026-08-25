=== PlusMagi Blocks ===
Contributors: phunsanit
Tags: blocks, mermaid, description-list, editor
Requires at least: 6.0
Tested up to: 7.1
Stable tag: 1.0.2
Development: https://github.com/phunsanit/wp-plusmagi-blocks
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

PlusMagi Blocks is a WordPress plugin that adds custom content blocks (Mermaid diagrams, Description Lists, and more) for WordPress content authors.

== Description ==

PlusMagi Blocks provides a streamlined experience for working with custom content blocks inside WordPress and the block editor.
It adds a focused content workflow for authors who need Mermaid diagrams or description lists while keeping the WordPress editing experience intact.

Plugin directory visuals are included via the standard WordPress.org assets:

* Header banner: `assets/banner-1544x500.png` and `assets/banner-772x250.png`
* Plugin icon: `assets/icon-256x256.png` and `assets/icon-128x128.png`

== Features ==

* Mermaid diagram block with Markdown-based editing
* Description List block (<dl>/<dt>/<dd>) with add/remove items
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

== Installation ==

1. Upload the plugin files to the `/wp-content/plugins/plusmagi-blocks` directory
2. Activate the plugin through the 'Plugins' screen in WordPress

== Screenshots ==

1. Plugin header/banner visual style used on plugin page.
2. Mermaid block inserted in Gutenberg with editable Mermaid source.
3. Rendered Mermaid output on frontend post view.

== Changelog ==

= 1.0.2 =
* Removed the server-side Mermaid CLI rendering fallback (used `proc_open`, forbidden by WordPress.org plugin guidelines)
* Updated "Tested up to" to 7.1

= 1.0.1 =
* Added Description List block (`<dl>`/`<dt>`/`<dd>`) with add/remove items
* Fixed AMP validation errors caused by Mermaid diagram `<style>`/`style` attributes
* All blocks now use `apiVersion: 3`

= 1.0.0 =
* Initial public release
* Added PlusMagi Markdown plugin entry point
* Added basic WordPress plugin scaffold and metadata

== Upgrade Notice ==

= 1.0.2 =
Removes forbidden proc_open usage and updates WordPress compatibility to 7.1.

= 1.0.1 =
Adds the Description List block and fixes AMP validation errors for Mermaid diagrams.

= 1.0.0 =
Initial version.
