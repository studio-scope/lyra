import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Dev-only QA frame capture.
 *
 * `POST /__qa-capture?name=<path>` writes the raw PNG body to `docs/qa/<path>.png`.
 * Paired with `?capture=1` on the app (which enables `preserveDrawingBuffer`),
 * this is how before/after comparison stills get written to disk without a
 * screenshot tool in the loop.
 *
 * Never registered in a production build.
 */
function qaCapture(): Plugin {
  return {
    name: 'lyra-qa-capture',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__qa-capture', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('POST only');
          return;
        }
        const name = new URL(req.url ?? '', 'http://x').searchParams.get('name');
        // Confine writes to docs/qa and reject anything path-like.
        if (!name || !/^[a-z0-9/-]+$/i.test(name) || name.includes('..')) {
          res.statusCode = 400;
          res.end('bad name');
          return;
        }
        const chunks: Buffer[] = [];
        req.on('data', (c: Buffer) => chunks.push(c));
        req.on('end', () => {
          const file = resolve(process.cwd(), 'docs/qa', `${name}.png`);
          mkdirSync(dirname(file), { recursive: true });
          writeFileSync(file, Buffer.concat(chunks));
          res.statusCode = 200;
          res.end(file);
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), qaCapture()],
  server: { port: 5173 },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1500,
  },
});
