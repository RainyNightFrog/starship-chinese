import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { getColorMode, syncDocumentTheme } from './colorMode'
import App from './App.jsx'

syncDocumentTheme({ colorMode: getColorMode() })

/** OCR 引擎改為上載模態開啟時懶載 — 學生端首屏更快 */

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
