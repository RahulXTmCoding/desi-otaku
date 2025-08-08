import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './pages/App'
import { DevModeProvider } from './context/DevModeContext'
import { CartProvider } from './context/CartContext'
import { ThemeProvider } from './context/ThemeContext'
import { QueryProvider } from './providers/QueryProvider'
import { initializeAuth } from './utils/clearAuth'
import SEOProvider from './components/SEOProvider'
import './index.css'

// Clear any bad auth data on startup
initializeAuth();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryProvider>
      <SEOProvider>
        <ThemeProvider>
          <DevModeProvider>
            <BrowserRouter>
              <CartProvider>
                <App />
              </CartProvider>
            </BrowserRouter>
          </DevModeProvider>
        </ThemeProvider>
      </SEOProvider>
    </QueryProvider>
  </React.StrictMode>,
)
