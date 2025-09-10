import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        main: './index.html'
      },
      output: {
        manualChunks: {
          'game-engine': [
            './src/engine/game-engine.js',
            './src/engine/input-manager.js',
            './src/engine/audio-manager.js'
          ],
          'entities': [
            './src/entities/snake.js',
            './src/entities/enemy-ai.js',
            './src/entities/gravity-well.js'
          ],
          'systems': [
            './src/systems/spatial-hash.js',
            './src/systems/particle-system.js',
            './src/systems/constellation-manager.js',
            './src/systems/level-manager.js'
          ],
          'ui': [
            './src/ui/ui-manager.js'
          ],
          'editor': [
            './src/editor/level-editor.js'
          ]
        }
      }
    },
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true
      }
    }
  },
  server: {
    port: 3000,
    open: true,
    cors: true
  },
  preview: {
    port: 4173,
    open: true
  }
});