import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const pluginDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(pluginDirectory, '../node_modules/@mermaid-js/mermaid-zenuml/dist/mermaid-zenuml.min.js');
const destination = resolve(pluginDirectory, '../SVN/trunk/js/vendor/mermaid-zenuml.min.js');

await mkdir(dirname(destination), { recursive: true });
await copyFile(source, destination);