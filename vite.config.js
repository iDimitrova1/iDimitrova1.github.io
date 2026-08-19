import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, 'index.html'),
        cnc: resolve(import.meta.dirname, '3d-ruter-freza/index.html'),
        vacuum: resolve(import.meta.dirname, 'vakuum-formovane/index.html'),
        composites: resolve(import.meta.dirname, 'kompozitni-materiali/index.html'),
        prototypes: resolve(import.meta.dirname, 'kalapi-prototipi/index.html'),
        models: resolve(import.meta.dirname, 'izrabotka-na-maketi/index.html'),
        interior: resolve(import.meta.dirname, 'interiorni-izdeliya/index.html'),
      },
    },
  },
});
