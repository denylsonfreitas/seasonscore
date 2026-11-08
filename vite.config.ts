import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const vendorChunks: Record<string, string[]> = {
  vendor: ['react', 'react-dom', 'react-router', 'react-router-dom', 'scheduler'],
  ui: ['@chakra-ui', '@emotion', 'framer-motion'],
  firebase: ['firebase', '@firebase'],
  utils: ['date-fns'],
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2
      },
      mangle: {
        safari10: true
      },
      format: {
        comments: false
      }
    },
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined
          for (const [chunk, packages] of Object.entries(vendorChunks)) {
            if (packages.some((pkg) => id.includes(`/node_modules/${pkg}/`))) {
              return chunk
            }
          }
          return undefined
        },
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    sourcemap: false,
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: false
  },
  server: {
    hmr: {
      overlay: true
    },
    fs: {
      strict: true,
      allow: ['.'],
      deny: [
        '.git',
        '.env',
        '.env.*',
        'node_modules/.cache',
        '**/node_modules/**/.git'
      ]
    }
  },
  preview: {
    port: 4173
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom', 
      '@chakra-ui/react', 
      'firebase/auth', 
      'firebase/firestore'
    ]
  }
})
