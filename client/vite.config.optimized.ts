import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  server: {
    allowedHosts: [
      'localhost',
      'rahul.tail6c9a2a.ts.net'
    ]
  },
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunks - rarely change, good for caching
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['lucide-react'],
          
          // Feature-based chunks
          'feature-auth': [
            './src/auth/helper/index.tsx',
            './src/auth/helper/PrivateRoutes.tsx',
            './src/auth/helper/AdminRoutes.tsx'
          ],
          'feature-cart': [
            './src/context/CartContext.tsx',
            './src/core/helper/cartHelper.tsx'
          ],
          'feature-admin': [
            './src/admin/helper/adminapicall.tsx',
            './src/admin/helper/productApiHelper.tsx',
            './src/admin/helper/designapicall.tsx'
          ]
        }
      }
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    
    // Enable source maps for production debugging
    sourcemap: true,
    
    // Minification options
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: ['@vite/client', '@vite/env']
  }
})
