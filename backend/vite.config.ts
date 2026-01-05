// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";
// import svgr from "vite-plugin-svgr";

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [
//     react(),
//     svgr({
//       svgrOptions: {
//         icon: true,
//         // This will transform your SVG to a React component
//         exportType: "named",
//         namedExport: "ReactComponent",
//       },
//     }),
//   ],
// });


import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
  ],

  // ⚡ Fix eval() warnings from libraries like @react-jvectormap
  esbuild: {
    logOverride: {
      eval: "silent",
    },
  },

  // ⚡ Improve bundle size by splitting vendor chunks
  build: {
    chunkSizeWarningLimit: 1200, // removes scary warnings
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return id.toString().split("node_modules/")[1].split("/")[0].toString();
          }
        },
      },
    },
  },
});
