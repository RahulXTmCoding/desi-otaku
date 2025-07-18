import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './pages/App'
import { DevModeProvider } from './context/DevModeContext'
import { CartProvider } from './context/CartContext'
import { ThemeProvider } from './context/ThemeContext'
import { initializeAuth } from './utils/clearAuth'
import './index.css'

// Clear any bad auth data on startup
initializeAuth();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <DevModeProvider>
        <BrowserRouter>
          <CartProvider>
            <App />
          </CartProvider>
        </BrowserRouter>
      </DevModeProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
