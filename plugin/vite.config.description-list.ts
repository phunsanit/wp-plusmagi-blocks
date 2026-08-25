// plugin/vite.config.description-list.ts
import { defineConfig } from 'vite';

export default defineConfig({
	define: {
		'process.env.NODE_ENV': JSON.stringify('production'),
	},
	build: {
		outDir: '../SVN/trunk/js', // Output to the folder loaded by PHP
		emptyOutDir: false, // Do not remove other files in this folder
		lib: {
			entry: '../SVN/trunk/js/plusmagi-description-list.tsx',
			name: 'plusmagiDescriptionList',
			formats: ['iife'],
			fileName: () => 'plusmagi-description-list.js',
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
					'@wordpress/components': 'wp.components',
				},
			},
		},
	},
});
