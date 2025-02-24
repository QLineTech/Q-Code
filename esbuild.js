const esbuild = require("esbuild");
const fs = require('fs').promises; // Use fs.promises for async methods
const path = require("path");

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');



/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
	name: 'esbuild-problem-matcher',

	setup(build) {
		build.onStart(() => {
			console.log('[watch] build started');
		});
		build.onEnd((result) => {
			result.errors.forEach(({ text, location }) => {
				console.error(`✘ [ERROR] ${text}`);
				console.error(`    ${location.file}:${location.line}:${location.column}:`);
			});
			console.log('[watch] build finished');
		});
	},
};

/**
 * Plugin to copy webview assets
 * @type {import('esbuild').Plugin}
 */
const copyWebviewAssetsPlugin = {
    name: 'copy-webview-assets',
    setup(build) {
        build.onEnd(async (result) => {
            if (result.errors.length > 0) return; // Skip if build failed
            try {
                const webviewSrc = path.join(__dirname, 'src', 'webview');
                const webviewDest = path.join(__dirname, 'dist', 'webview');
                const files = ['dashboard.html', 'styles.css', 'script.js', 'icon.png'];

                // Ensure destination directory exists
                await fs.mkdir(webviewDest, { recursive: true });

                // Copy each file individually
                for (const file of files) {
                    const srcPath = path.join(webviewSrc, file);
                    const destPath = path.join(webviewDest, file);
                    await fs.copyFile(srcPath, destPath);
                    console.log(`Copied ${file} to ${destPath}`);
                }

                console.log('Webview assets copied successfully');
            } catch (err) {
                console.error('Failed to copy webview assets:', err);
            }
        });
    },
};

async function main() {
	const ctx = await esbuild.context({
		entryPoints: [
			'src/extension.ts'
		],
		bundle: true,
		format: 'cjs',
		minify: production,
		sourcemap: !production,
		sourcesContent: false,
		platform: 'node',
		outfile: 'dist/extension.js',
		external: ['vscode'],
		logLevel: 'silent',
		plugins: [
			/* add to the end of plugins array */
			esbuildProblemMatcherPlugin,
			copyWebviewAssetsPlugin, 
		],
	});
	if (watch) {
		await ctx.watch();
	} else {
		await ctx.rebuild();
		await ctx.dispose();
	}

	
}

main().catch(e => {
	console.error(e);
	process.exit(1);
});
