const esbuild = require("esbuild");
const fs = require("fs").promises; // Use promises for async operations
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
	name: "copy-webview-assets",
	setup(build) {
	  build.onEnd(async (result) => {
		if (result.errors.length > 0) return; // Skip if build failed
		try {
		  const srcPath = path.join(__dirname, "src", "webview", "dashboard.html");
		  const destPath = path.join(__dirname, "dist", "webview", "dashboard.html");
		  await fs.mkdir(path.dirname(destPath), { recursive: true }); // Ensure dist/webview exists
		  await fs.copyFile(srcPath, destPath);
		  console.log(`Copied dashboard.html to ${destPath}`);
		} catch (err) {
		  console.error("Failed to copy webview assets:", err);
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
