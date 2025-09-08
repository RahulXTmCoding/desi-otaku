import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './pages/App'
import { DevModeProvider } from './context/DevModeContext'
import { CartProvider } from './context/CartContext'
import { ThemeProvider } from './context/ThemeContext'
import { AOVProvider } from './context/AOVContext'
import { AnalyticsProvider } from './context/AnalyticsContext'
import { QueryProvider } from './providers/QueryProvider'
import { initializeAuth } from './utils/clearAuth'
import SEOProvider from './components/SEOProvider'
import './index.css'

// Clear any bad auth data on startup
initializeAuth();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryProvider>
      <ThemeProvider>
        <AnalyticsProvider>
          <DevModeProvider>
            <AOVProvider>
              <BrowserRouter>
                <SEOProvider>
                  <CartProvider>
                    <App />
                  </CartProvider>
                </SEOProvider>
              </BrowserRouter>
            </AOVProvider>
          </DevModeProvider>
        </AnalyticsProvider>
      </ThemeProvider>
    </QueryProvider>
  </React.StrictMode>,
)
