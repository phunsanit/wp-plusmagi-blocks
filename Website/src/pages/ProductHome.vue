<template>
	<div class="site-shell">
		<header class="site-header">
			<a class="brand" href="#top" aria-label="PlusMagi Blocks home">
				<span class="brand-mark"><i class="pi pi-sparkles" /></span>
				<span>PlusMagi <strong>Blocks</strong></span>
			</a>
			<nav aria-label="Primary navigation">
				<a href="#features">Features</a><a href="#workflow">How it works</a><a href="#faq">FAQ</a>
			</nav>
			<a class="header-link" href="https://wordpress.org/plugins/plusmagi-blocks/" target="_blank" rel="noreferrer">Get plugin <i class="pi pi-arrow-up-right" /></a>
		</header>

		<main id="top">
			<section class="hero page-width">
				<div class="hero-copy reveal">
					<p class="release"><span /> Version {{ releaseMeta.version }} available</p>
					<h1>Complex content,<br><em>clearly expressed.</em></h1>
					<p class="lede">Create diagrams, definitions, and rich word references directly inside Gutenberg. No context switching, no fragile embeds.</p>
					<div class="hero-actions">
						<a class="button primary" href="https://wordpress.org/plugins/plusmagi-blocks/" target="_blank" rel="noreferrer"><i class="pi pi-wordpress" /> Install PlusMagi Blocks</a>
						<a class="quiet-link" href="#features">Explore features <i class="pi pi-arrow-down" /></a>
					</div>
					<div class="proof"><span><i class="pi pi-check-circle" /> Native Gutenberg</span><span><i class="pi pi-check-circle" /> Responsive SVG</span><span><i class="pi pi-check-circle" /> AMP ready</span></div>
				</div>

				<div class="editor-window reveal delay-1" aria-label="Mermaid block editor preview">
					<div class="editor-bar"><span><i class="pi pi-plus" /><i class="pi pi-undo" /><i class="pi pi-redo" /></span><strong>Architecture notes</strong><button type="button">Publish</button></div>
					<div class="editor-content">
						<p class="block-label"><i class="pi pi-sitemap" /> PlusMagi Mermaid</p>
						<div class="diagram" aria-hidden="true"><b>Idea</b><i class="pi pi-arrow-right" /><b>Draft</b><i class="pi pi-arrow-right" /><b>Publish</b></div>
						<pre><code><span>flowchart LR</span>
A[Idea] --&gt; B[Draft] --&gt; C[Publish]</code></pre>
					</div>
					<div class="editor-foot"><span><i class="pi pi-bolt" /> Live preview</span><span>SVG · Accessible · Responsive</span></div>
				</div>
			</section>

			<section class="capability-strip"><p>Built for content that needs structure</p><div><span>FLOWCHARTS</span><span>DEFINITIONS</span><span>SYNONYMS</span><span>DOCUMENTATION</span></div></section>

			<section id="features" class="features page-width">
				<div class="section-heading reveal">
					<div><p class="kicker">Everything included</p><h2>Six tools.<br>One clear workflow.</h2></div>
					<p>Focused tools for technical and structured writing, designed to feel at home in the WordPress block editor.</p>
				</div>
				<div class="feature-grid">
					<article v-for="(feature, index) in features" :key="feature.title" class="feature-card reveal" :class="feature.slug" :style="{ animationDelay: `${index * 90}ms` }">
						<div class="card-top"><span>0{{ index + 1 }}</span><i :class="feature.icon" /></div>
						<h3>{{ feature.title }}</h3><p>{{ feature.description }}</p>
						<ul><li v-for="item in feature.items" :key="item"><i class="pi pi-check" />{{ item }}</li></ul>
						<div v-if="feature.slug === 'mermaid'" class="card-demo diagram-demo"><b>Input</b><i class="pi pi-arrow-right" /><b>Preview</b><i class="pi pi-arrow-right" /><b>SVG</b></div>
						<dl v-else-if="feature.slug === 'description'" class="card-demo list-demo"><dt>API</dt><dd>A shared interface</dd><dt>Block</dt><dd>A unit of content</dd></dl>
						<aside v-else-if="feature.slug === 'post-it'" class="card-demo post-it-demo" role="note"><strong>Remember:</strong><p>Clear notes keep the work moving.</p></aside>
						<div v-else-if="feature.slug === 'svg'" class="card-demo svg-demo">
							<code>&lt;svg viewBox="0 0 80 80"&gt;</code>
							<svg viewBox="0 0 80 80" role="img" aria-label="Responsive SVG preview"><path d="M40 7 70 24v32L40 73 10 56V24Z" /><circle cx="40" cy="40" r="13" /><path d="m34 40 5 5 9-11" /></svg>
						</div>
						<div v-else-if="feature.slug === 'thesaurus'" class="card-demo thesaurus-demo"><strong>clear</strong><span>adjective</span><p><b>Synonyms</b> lucid · plain · distinct</p><p><b>Antonyms</b> vague · obscure</p></div>
						<div v-else class="card-demo table-demo">
							<p><span>Table Design</span><strong>Grid Table 2 · Accent 2</strong></p>
							<table aria-label="Styled table preview"><thead><tr><th>Quarter</th><th>Growth</th></tr></thead><tbody><tr><td>Q1</td><td>18%</td></tr><tr><td>Q2</td><td>24%</td></tr></tbody></table>
						</div>
					</article>
				</div>
				<div class="technical-row reveal">
					<div class="technical-icon"><i class="pi pi-bolt" /></div><div><p class="kicker">Beyond the editor</p><h3>Built for the frontend, too.</h3></div>
					<p>Sanitized SVG output, responsive rendering, syntax error feedback, and automatic AMP image generation keep diagrams dependable wherever your content appears.</p>
					<div class="tech-tags"><span>AMP</span><span>SVG</span><span>Semantic HTML</span></div>
				</div>
			</section>

			<section id="workflow" class="workflow"><div class="page-width workflow-inner">
				<div class="workflow-heading reveal"><p class="kicker light">From idea to published</p><h2>Stay in your<br>writing flow.</h2></div>
				<ol><li v-for="(step, index) in steps" :key="step.title" class="reveal" :style="{ animationDelay: `${index * 80}ms` }"><span>0{{ index + 1 }}</span><div><h3>{{ step.title }}</h3><p>{{ step.text }}</p></div></li></ol>
			</div></section>

			<section id="faq" class="faq page-width">
				<div class="faq-heading reveal"><p class="kicker">Good to know</p><h2>Questions,<br>answered plainly.</h2></div>
				<div class="faq-list"><details v-for="item in faq" :key="item.question" class="reveal"><summary>{{ item.question }}<i class="pi pi-plus" /></summary><p>{{ item.answer }}</p></details></div>
			</section>

			<section class="cta page-width reveal"><div><p class="kicker light">Ready when you are</p><h2>Make complex content<br><em>feel simple.</em></h2></div><a class="button light-button" href="https://wordpress.org/plugins/plusmagi-blocks/" target="_blank" rel="noreferrer"><i class="pi pi-download" /> Download v{{ releaseMeta.version }}</a></section>
		</main>

		<footer><a class="brand" href="#top"><span class="brand-mark"><i class="pi pi-sparkles" /></span><span>PlusMagi <strong>Blocks</strong></span></a><p>Open-source blocks for clearer WordPress publishing.</p><span>Version {{ releaseMeta.version }}</span></footer>
	</div>
</template>

<script setup lang="ts">
import { releaseMeta } from '../generated/release-meta';

const features = [
	{ slug: 'description', icon: 'pi pi-list', title: 'Description List', description: 'Create accessible term and definition groups using the right semantic HTML.', items: ['Native dl, dt, and dd output', 'Add or remove terms', 'Ordered display option'] },
	{ slug: 'mermaid', icon: 'pi pi-sitemap', title: 'Mermaid Diagram', description: 'Turn compact Mermaid syntax into polished diagrams with immediate visual feedback.', items: ['Live SVG preview', 'Helpful syntax errors', 'Multiple diagrams per post'] },
	{ slug: 'post-it', icon: 'pi pi-bookmark', title: 'Post it', description: 'Place a concise, colorful note inside a post with accessible semantic markup.', items: ['Six note colors', 'Native typography controls', 'Responsive 2 x 3 inch layout'] },
	{ slug: 'svg', icon: 'pi pi-image', title: 'SVG', description: 'Paste vector markup, preview it in Gutenberg, and publish safe responsive graphics.', items: ['Live image preview', 'Sanitized inline output', 'Wide and full alignment'] },
	{ slug: 'table', icon: 'pi pi-table', title: 'Table Styles', description: 'Apply familiar Microsoft Word-inspired designs to the native Gutenberg Table block.', items: ['107 built-in styles', 'Optional banded columns', 'Change styles from the sidebar'] },
	{ slug: 'thesaurus', icon: 'pi pi-book', title: 'Thesaurus', description: 'Publish rich word references with definitions and meaningful lexical relationships.', items: ['Definitions', 'Synonyms and antonyms', 'Semantic structured output'] },
];
const steps = [
	{ title: 'Choose a block', text: 'Search the Gutenberg inserter for PlusMagi, Description List, Mermaid, Post it, SVG, Table Styles, or Thesaurus.' },
	{ title: 'Add your content', text: 'Write a note, diagram, or SVG source, create term pairs, style a table, or build a thesaurus entry without leaving the editor.' },
	{ title: 'Preview as you work', text: 'Check the rendered result immediately and correct diagram syntax before it reaches readers.' },
	{ title: 'Publish everywhere', text: 'Deliver responsive, semantic output on standard WordPress pages and AMP experiences.' },
];
const faq = [
	{ question: 'Can I add multiple Mermaid diagrams to one post?', answer: 'Yes. Use as many Mermaid blocks as needed. One diagram per block keeps long technical documents easy to edit.' },
	{ question: 'What does the Thesaurus block support?', answer: 'Each entry can include a heading, definition, part of speech, synonyms, and antonyms in structured semantic output.' },
	{ question: 'How does AMP support work?', answer: 'The plugin sanitizes the generated SVG, stores it as an image, and emits AMP-compatible image markup with intrinsic dimensions.' },
	{ question: 'Which WordPress version is required?', answer: 'PlusMagi Blocks requires WordPress 6.0 or newer and uses the native Gutenberg editing experience.' },
];
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&family=Newsreader:ital,opsz,wght@1,6..72,600&display=swap');
.site-shell{--ink:#17231d;--forest:#184d3a;--mint:#b8ecce;--paper:#f5f4ed;--coral:#ef6c4d;min-height:100vh;overflow:hidden;background:var(--paper);color:var(--ink);font-family:'Manrope',sans-serif}.page-width{width:min(1216px,calc(100% - 64px));margin-inline:auto}.site-header{position:relative;z-index:10;display:flex;max-width:1280px;margin:auto;padding:24px 32px;align-items:center;justify-content:space-between}.brand{display:inline-flex;align-items:center;gap:10px;color:var(--ink);font-size:17px;text-decoration:none;letter-spacing:-.02em}.brand strong{font-weight:800}.brand-mark{display:grid;width:34px;height:34px;place-items:center;border-radius:6px;background:var(--forest);color:var(--mint);font-size:14px;transform:rotate(-3deg)}nav{display:flex;gap:34px}nav a{color:#526159;font-size:13px;font-weight:700;text-decoration:none}nav a:hover{color:var(--coral)}.header-link{display:flex;align-items:center;gap:7px;border-bottom:1px solid var(--ink);padding:6px 0;color:var(--ink);font-size:13px;font-weight:800;text-decoration:none}.header-link i{font-size:10px}
.hero{min-height:690px;display:grid;grid-template-columns:.92fr 1.08fr;gap:clamp(50px,7vw,110px);align-items:center;padding-block:70px 100px}.release{display:inline-flex;align-items:center;gap:9px;margin:0;border:1px solid #c8cec9;border-radius:999px;padding:7px 12px;color:#526159;font:500 10px 'DM Mono',monospace;letter-spacing:.06em;text-transform:uppercase}.release span{width:7px;height:7px;border-radius:50%;background:var(--coral);box-shadow:0 0 0 4px #ef6c4d22}h1,h2{margin:22px 0 0;font-size:clamp(50px,5.6vw,78px);line-height:.99;letter-spacing:-.055em;font-weight:800}h1 em,.cta h2 em{color:var(--coral);font-family:'Newsreader',serif;font-weight:600}.lede{max-width:570px;margin:27px 0 0;color:#59675f;font-size:18px;line-height:1.7}.hero-actions{display:flex;align-items:center;gap:25px;margin-top:34px}.button{display:inline-flex;min-height:50px;align-items:center;justify-content:center;gap:10px;border-radius:5px;padding:0 22px;font-size:13px;font-weight:800;text-decoration:none;transition:transform .18s}.button:hover{transform:translateY(-2px)}.primary{background:var(--forest);color:white;box-shadow:7px 7px 0 var(--mint)}.quiet-link{display:flex;align-items:center;gap:8px;color:var(--ink);font-size:13px;font-weight:800;text-decoration:none}.proof{display:flex;flex-wrap:wrap;gap:17px;margin-top:32px;color:#68746d;font-size:11px;font-weight:700}.proof span{display:flex;gap:6px;align-items:center}.proof i{color:var(--forest)}
.editor-window{position:relative;transform:rotate(1.2deg);border:1px solid #cbd2cd;border-radius:8px;background:white;box-shadow:22px 28px 0 #d8e6dc,0 32px 70px #18322624}.editor-window:before{content:'';position:absolute;z-index:-1;inset:-35px -38px 43%;background:var(--mint);clip-path:polygon(8% 2%,100% 12%,94% 100%,0 88%)}.editor-bar{height:54px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;border-bottom:1px solid #e2e6e3;padding:0 15px;color:#5f6963;font-size:10px}.editor-bar>span{display:flex;gap:14px}.editor-bar button{justify-self:end;border:0;border-radius:3px;background:var(--forest);color:white;padding:8px 13px;font-size:10px;font-weight:800}.editor-content{padding:clamp(24px,4vw,48px);background-image:radial-gradient(#d4dcd6 1px,transparent 1px);background-size:18px 18px}.block-label{display:inline-flex;gap:8px;margin:0;align-items:center;border-radius:4px;background:var(--ink);color:white;padding:7px 10px;font:500 10px 'DM Mono',monospace}.diagram{min-height:220px;display:flex;align-items:center;justify-content:center}.diagram b,.diagram-demo b{min-width:82px;border:2px solid var(--forest);border-radius:4px;background:white;padding:15px 8px;text-align:center;font-size:11px;box-shadow:4px 4px 0 #d5e7db}.diagram b:nth-of-type(2){border-color:var(--coral);box-shadow:4px 4px 0 #ffdacf}.diagram i,.diagram-demo i{padding:0 10px;color:#7d9185;font-size:12px}pre{margin:0;border-left:3px solid var(--coral);background:#f0f3f0;padding:12px 14px;color:#405148;font:400 10px/1.6 'DM Mono',monospace;white-space:pre-wrap}pre span{color:var(--coral)}.editor-foot{display:flex;justify-content:space-between;padding:12px 16px;color:#738078;font:500 9px 'DM Mono',monospace}.editor-foot span:first-child{color:var(--forest)}
.capability-strip{display:flex;align-items:center;justify-content:space-between;border-block:1px solid #d6d9d2;background:#eeede6;padding:23px max(32px,calc((100vw - 1216px)/2))}.capability-strip p{margin:0;color:#59645e;font:500 11px 'DM Mono',monospace}.capability-strip div{display:flex;gap:clamp(25px,4vw,58px);color:#77817b;font-size:10px;font-weight:800;letter-spacing:.11em}.features{padding-block:125px}.section-heading{display:grid;grid-template-columns:1fr 1fr;gap:50px;align-items:end;margin-bottom:58px}.kicker{margin:0;color:var(--coral);font:500 10px 'DM Mono',monospace;letter-spacing:.12em;text-transform:uppercase}.section-heading h2,.workflow h2,.faq h2{margin-top:12px;font-size:clamp(42px,5vw,64px)}.section-heading>p{max-width:490px;margin:0;color:#5b6860;line-height:1.75}
.feature-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}.feature-card{min-height:500px;display:flex;flex-direction:column;border:1px solid #cfd5d0;border-radius:7px;padding:29px;background:white}.feature-card.mermaid{background:#dff2e6}.feature-card.thesaurus{background:#f1e8db}.feature-card.table{background:#e8eef2}.card-top{display:flex;align-items:center;justify-content:space-between}.card-top span{color:#a5afa8;font:500 13px 'DM Mono',monospace}.card-top>i{display:grid;width:46px;height:46px;place-items:center;border-radius:5px;background:var(--forest);color:var(--mint);font-size:19px}.feature-card h3{margin:30px 0 0;font-size:25px;letter-spacing:-.04em}.feature-card>p{color:#59675f;font-size:14px;line-height:1.65}.feature-card ul{display:grid;gap:8px;margin:18px 0 0;padding:0;list-style:none;color:#3c5146;font-size:11px;font-weight:700}.feature-card li{display:flex;gap:8px;align-items:center}.feature-card li i{color:var(--coral);font-size:9px}.card-demo{margin-top:auto;border-top:1px solid #cad6ce;padding-top:25px}.diagram-demo{display:flex;align-items:center;justify-content:center}.diagram-demo b{min-width:auto;padding:10px 8px;font-size:9px}.list-demo{display:grid;grid-template-columns:.65fr 1.35fr;margin-bottom:0}.list-demo dt,.list-demo dd{margin:0;border-bottom:1px solid #dfe3df;padding:9px 5px;font-size:10px}.list-demo dt{color:var(--forest);font-family:'DM Mono',monospace}.list-demo dd{color:#667169}.thesaurus-demo strong{font-size:17px}.thesaurus-demo>span{margin-left:8px;color:var(--coral);font:500 9px 'DM Mono',monospace}.thesaurus-demo p{margin:9px 0 0;color:#667169;font-size:10px}.thesaurus-demo b{color:var(--forest)}.table-demo>p{display:flex;justify-content:space-between;gap:16px;margin:0 0 12px;font:500 9px 'DM Mono',monospace}.table-demo>p span{color:#667169}.table-demo>p strong{color:#255c76}.table-demo table{width:100%;border-collapse:collapse;font-size:10px}.table-demo th,.table-demo td{border:1px solid #9bafba;padding:8px;text-align:left}.table-demo th{background:#255c76;color:white}.table-demo tbody tr:nth-child(even){background:#d5e3e9}
.technical-row{display:grid;grid-template-columns:auto .7fr 1.3fr auto;gap:24px;align-items:center;margin-top:20px;border:1px solid #ccd3cd;border-radius:7px;padding:28px;background:#fff}.technical-icon{display:grid;width:52px;height:52px;place-items:center;border-radius:50%;background:var(--coral);color:white}.technical-row h3{margin:5px 0 0;font-size:20px}.technical-row>p{margin:0;color:#5d6962;font-size:13px;line-height:1.65}.tech-tags{display:flex;gap:6px;flex-wrap:wrap}.tech-tags span{border:1px solid #cbd2cd;border-radius:99px;padding:6px 9px;font:500 8px 'DM Mono',monospace}.workflow{background:var(--forest);color:white}.workflow-inner{display:grid;grid-template-columns:.85fr 1.15fr;gap:100px;padding-block:115px}.light{color:var(--mint)}.workflow ol{margin:0;padding:0;list-style:none}.workflow li{display:grid;grid-template-columns:55px 1fr;gap:18px;border-top:1px solid #ffffff2e;padding:23px 0}.workflow li:last-child{border-bottom:1px solid #ffffff2e}.workflow li>span{color:var(--mint);font:500 11px 'DM Mono',monospace}.workflow h3{margin:0;font-size:19px}.workflow li p{margin:7px 0 0;color:#bed0c6;font-size:13px;line-height:1.65}
.faq{display:grid;grid-template-columns:.8fr 1.2fr;gap:100px;padding-block:125px}.faq-list details{border-top:1px solid #ccd2cd}.faq-list details:last-child{border-bottom:1px solid #ccd2cd}.faq summary{min-height:75px;display:flex;align-items:center;justify-content:space-between;gap:20px;cursor:pointer;list-style:none;font-size:14px;font-weight:800}.faq summary::-webkit-details-marker{display:none}.faq summary i{color:var(--coral);font-size:12px;transition:transform .18s}.faq details[open] summary i{transform:rotate(45deg)}.faq details p{margin:-5px 40px 24px 0;color:#5d6962;font-size:13px;line-height:1.7}.cta{display:flex;align-items:flex-end;justify-content:space-between;gap:40px;margin-bottom:60px;border-radius:8px;background:var(--ink);padding:65px;color:white}.cta h2{margin-top:10px;font-size:clamp(40px,5vw,60px)}.light-button{flex-shrink:0;background:var(--mint);color:var(--forest);box-shadow:7px 7px 0 var(--coral)}footer{display:flex;max-width:1280px;margin:auto;padding:28px 32px 36px;align-items:center;justify-content:space-between;color:#6d7771;font-size:10px}footer p{margin:0}.reveal{opacity:0;transform:translateY(18px);animation:reveal .65s cubic-bezier(.2,.7,.2,1) forwards}.delay-1{animation-delay:.13s}@keyframes reveal{to{opacity:1;transform:translateY(0)}}
@media(prefers-reduced-motion:reduce){.reveal{opacity:1;transform:none;animation:none}.button{transition:none}}@media(max-width:950px){nav{display:none}.hero{grid-template-columns:1fr;min-height:auto}.editor-window{width:min(680px,100%);justify-self:center}.technical-row{grid-template-columns:auto 1fr}.technical-row>p,.tech-tags{grid-column:2}.workflow-inner,.faq{grid-template-columns:1fr;gap:55px}.cta{align-items:flex-start;flex-direction:column}}@media(max-width:640px){.page-width{width:calc(100% - 40px)}.site-header{padding:18px 20px}.header-link{width:38px;height:38px;justify-content:center;border:1px solid #cbd1cc;border-radius:4px;font-size:0}.header-link i{font-size:12px}.hero{gap:65px;padding-block:45px 75px}.hero h1{font-size:clamp(43px,13vw,58px)}.lede{font-size:16px}.hero-actions{align-items:stretch;flex-direction:column}.quiet-link{justify-content:center}.editor-window{transform:none;box-shadow:10px 14px 0 #d8e6dc}.editor-window:before{inset:-22px -15px 50%}.editor-content{padding:24px 14px}.diagram{min-height:180px}.diagram b{min-width:64px;padding:12px 3px;font-size:9px}.diagram i{padding:0 4px}.editor-foot span:last-child{display:none}.capability-strip{display:block;padding:22px 20px}.capability-strip div{flex-wrap:wrap;gap:12px 20px;margin-top:14px}.features,.faq{padding-block:85px}.section-heading{display:block}.section-heading>p{margin-top:24px}.feature-grid{grid-template-columns:1fr}.feature-card{min-height:500px;padding:25px 21px}.technical-row{grid-template-columns:1fr}.technical-row>p,.tech-tags{grid-column:auto}.workflow-inner{padding-block:85px}.cta{width:calc(100% - 40px);margin-bottom:30px;padding:40px 23px}.cta .button{width:100%;padding-inline:8px}footer{align-items:flex-start;flex-direction:column;gap:15px;padding:25px 20px}}
.feature-card.svg{background:#fff0e8}.svg-demo{display:grid;grid-template-columns:minmax(0,1fr) 100px;gap:20px;align-items:center}.svg-demo code{overflow-wrap:anywhere;color:#934c38;font:500 9px/1.6 'DM Mono',monospace}.svg-demo svg{display:block;width:100px;height:100px}.svg-demo svg>path:first-child{fill:var(--coral);stroke:none}.svg-demo circle{fill:var(--paper)}.svg-demo svg>path:last-child{fill:none;stroke:var(--forest);stroke-width:5;stroke-linecap:round;stroke-linejoin:round}
.feature-card.post-it{background:#fff6c9}.post-it-demo{position:relative;min-height:105px;border:1px solid #d8cb85;background:#fff1a8;padding:25px 22px;box-shadow:5px 6px 0 #17231d14;transform:rotate(-1deg)}.post-it-demo:before{content:'';position:absolute;top:-7px;left:50%;width:55px;height:13px;background:#ffffff99;transform:translateX(-50%)}.post-it-demo strong{color:var(--forest);font-size:13px}.post-it-demo p{margin:8px 0 0;color:#4c523f;font:600 12px/1.6 'Newsreader',serif}
</style>