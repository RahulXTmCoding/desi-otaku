module.exports = {
  plugins: [
    require('tailwindcss'),
    require('autoprefixer'),
    // Add PurgeCSS for production builds to remove unused CSS
    ...(process.env.NODE_ENV === 'production' ? [
      require('@fullhuman/postcss-purgecss')({
        content: [
          './src/**/*.{js,ts,jsx,tsx}',
          './index.html',
          './public/index.html'
        ],
        defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
        safelist: [
          // Keep animation classes
          /^animate-/,
          // Keep theme classes
          /^theme-/,
          // Keep dark mode classes
          /^dark:/,
          // Keep hover states
          /^hover:/,
          // Keep focus states  
          /^focus:/,
          // Keep group classes
          /^group/,
          // Keep Tailwind utilities that might be used dynamically
          'transition-all',
          'transform',
          'scale-105',
          'opacity-0',
          'opacity-100',
          // Keep classes that might be added by React
          /^bg-/,
          /^text-/,
          /^border-/,
        ]
      })
    ] : [])
  ],
}
