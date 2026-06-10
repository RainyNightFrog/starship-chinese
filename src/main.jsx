import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { getColorMode, syncDocumentTheme } from './colorMode'
import App from './App.jsx'

syncDocumentTheme({ colorMode: getColorMode() })

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
