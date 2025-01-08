import { resolve } from 'path';
import { defineConfig } from 'vite';

const isProduction = process.env.NODE_ENV === "production";

export default defineConfig({
  mode: isProduction ? "production" : "development",
  build: {
    outDir: "build",
    minify: isProduction,
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, 'src/maptiler-elevation-profile-control.ts'),
      name: 'maptilerelevationprofilecontrol',
      fileName: (format, entryName) => `${entryName}.${format}.min.js`,
      formats: ['umd'],
    },
    
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled into your library
      external: [
        "@maptiler/sdk"
      ],
      output: {
        // Provide global variables to use in the UMD build for externalized deps
        globals: {
          "@maptiler/sdk": "maptilersdk",
        },
      },
    },
  },
  plugins: [],
});
