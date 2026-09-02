import { defineConfig } from 'vite';

export default defineConfig({
	define: {
		'process.env.NODE_ENV': JSON.stringify('production'),
	},
	build: {
		outDir: '../SVN/trunk/js',
		emptyOutDir: false,
		lib: {
			entry: '../SVN/trunk/js/plusmagi-sticky_notes.tsx',
			name: 'plusmagiStickyNotes',
			formats: ['iife'],
			fileName: () => 'plusmagi-sticky_notes.js',
		},
		rollupOptions: {
			external: ['react', 'react-dom', /^@wordpress\//],
			output: {
				globals: {
					react: 'React',
					'react-dom': 'ReactDOM',
					'@wordpress/element': 'wp.element',
					'@wordpress/block-editor': 'wp.blockEditor',
					'@wordpress/components': 'wp.components',
				},
			},
		},
	},
});