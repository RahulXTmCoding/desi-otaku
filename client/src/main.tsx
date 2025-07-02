import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './pages/App'
import { DevModeProvider } from './context/DevModeContext'
import { initializeAuth } from './utils/clearAuth'
import './index.css'

// Clear any bad auth data on startup
initializeAuth();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DevModeProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </DevModeProvider>
  </React.StrictMode>,
)
