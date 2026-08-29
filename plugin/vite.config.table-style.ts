import { defineConfig } from 'vite';

export default defineConfig({
	define: {
		'process.env.NODE_ENV': JSON.stringify('production'),
	},
	build: {
		outDir: '../SVN/trunk/js',
		emptyOutDir: false,
		lib: {
			entry: '../SVN/trunk/js/plusmagi-table-style.tsx',
			name: 'plusmagiTableStyle',
			formats: ['iife'],
			fileName: () => 'plusmagi-table-style.js',
		},
		rollupOptions: {
			external: [
				'react',
				'react-dom',
				/^@wordpress\//,
			],
			output: {
				globals: {
					'react': 'React',
					'react-dom': 'ReactDOM',
					'@wordpress/element': 'wp.element',
					'@wordpress/block-editor': 'wp.blockEditor',
					'@wordpress/components': 'wp.components',
					'@wordpress/compose': 'wp.compose',
					'@wordpress/hooks': 'wp.hooks',
				},
			},
		},
	},
});