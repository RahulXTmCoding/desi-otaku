import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './pages/App'
import { DevModeProvider } from './context/DevModeContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DevModeProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </DevModeProvider>
  </React.StrictMode>,
)
