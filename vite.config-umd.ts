import { resolve } from 'path';
import { defineConfig } from 'vite';

const isProduction = process.env.NODE_ENV === "production";

const plugins = [];


export default defineConfig({
  mode: isProduction ? "production" : "development",
  build: {
    outDir: "build",
    minify: isProduction,
    sourcemap: !isProduction,
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, 'src/maptiler-elevation-control.ts'),
      name: 'maptilerelevationcontrol',
      // the proper extensions will be added
      fileName: (format, entryName) => `${entryName}.${format}.js`,
      formats: ['umd'],
    },
    
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: [
        "@maptiler/sdk"
      ],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {},
      },
    },
  },
  plugins,
})