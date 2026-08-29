import { defineConfig } from 'vite';

export default defineConfig({
	build: {
		outDir: '../SVN/trunk/js',
		emptyOutDir: false,
		lib: {
			entry: './zenuml-runtime.ts',
			name: 'plusmagiZenUml',
			formats: ['iife'],
			fileName: () => 'plusmagi-zenuml.js',
		},
	},
});