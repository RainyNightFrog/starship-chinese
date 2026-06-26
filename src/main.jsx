import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { getColorMode, syncDocumentTheme } from './colorMode'
import App from './App.jsx'
import { preloadTesseractEngine } from './tesseractOcr.js'

syncDocumentTheme({ colorMode: getColorMode() })

/** 應用程式啟動時預載 Singleton Tesseract Worker — chi_tra 僅下載一次 */
preloadTesseractEngine().catch(() => {})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
