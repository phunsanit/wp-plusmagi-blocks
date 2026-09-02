import { defineConfig } from 'vite';

export default defineConfig({
	define: {
		'process.env.NODE_ENV': JSON.stringify('production'),
	},
	build: {
		outDir: '../SVN/trunk/js',
		emptyOutDir: false,
		lib: {
			entry: '../SVN/trunk/js/plusmagi-post_it.tsx',
			name: 'plusmagiPostIt',
			formats: ['iife'],
			fileName: () => 'plusmagi-post_it.js',
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