const esbuild = require('esbuild');
const fs = require('fs');

if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist', { recursive: true });
}

const buildOptions = {
  entryPoints: {
    'dist/app': 'src/app.tsx',
    'dist/main': 'src/main.tsx',
  },
  bundle: true,
  outdir: '.',
  platform: 'browser',
  target: 'es2020',
  format: 'iife',
  jsx: 'automatic',
  loader: {
    '.ts': 'ts',
    '.tsx': 'tsx',
  },
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  minify: true,
  sourcemap: false,
};

const isWatch = process.argv.includes('--watch');

if (isWatch) {
  esbuild.context(buildOptions).then(ctx => {
    ctx.watch();
    console.log('Watching for changes...');
  }).catch(() => process.exit(1));
} else {
  esbuild.build(buildOptions).catch(() => process.exit(1));
}
