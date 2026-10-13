import { build } from 'esbuild';
import fs from 'fs';
import path from 'path';

/**
 * CLI 脚本预编译。
 *
 * 这些脚本要在运行镜像里执行，而 Next.js standalone 在 pnpm 工作区下只产出
 * `node_modules/.pnpm`，顶层没有包入口，脚本里的 `import 'mongodb'` 无法解析。
 * 因此与 worker 一样，用 esbuild 把依赖直接 inline 成自包含产物，镜像里只需 COPY 一个文件。
 *
 * 必须用 CJS 输出：把 mongodb 这类 CJS 依赖打进 ESM 产物，运行时会抛
 * `Dynamic require of "timers" is not supported`（esbuild 的已知限制）。
 *
 * 刻意不 minify、不 drop console：产物是运维工具，出问题时需要可读，
 * 且脚本的 stdout/stderr 就是它的输出通道。
 */
const SCRIPT_DIR = __dirname;
const OUTPUT_DIR = path.join(SCRIPT_DIR, 'dist');

/** 会被打包的 CLI 脚本（不含扩展名），源文件与产物同名。 */
const CLI_SCRIPTS = ['reset-root-password'];

async function buildCliScripts() {
  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const name of CLI_SCRIPTS) {
    const entryPoint = path.join(SCRIPT_DIR, `${name}.mjs`);
    const outfile = path.join(OUTPUT_DIR, `${name}.cjs`);

    if (!fs.existsSync(entryPoint)) {
      throw new Error(`CLI script source not found: ${entryPoint}`);
    }

    await build({
      entryPoints: [entryPoint],
      outfile,
      bundle: true,
      platform: 'node',
      format: 'cjs',
      target: 'node18',
      sourcemap: false,
      minify: false,
      treeShaking: true,
      logLevel: 'info'
    });

    console.log(`🔨 CLI 脚本已打包 → ${path.relative(process.cwd(), outfile)}`);
  }
}

buildCliScripts().catch((error) => {
  console.error('❌ CLI 脚本打包失败:', error);
  process.exit(1);
});
