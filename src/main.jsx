import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import LocaleProvider from './i18n/LocaleProvider.jsx'

// Web fonts load without blocking the first paint; text swaps in once they arrive.
const fonts = document.createElement('link')
fonts.rel = 'stylesheet'
fonts.href =
  'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Sekuya&family=Zen+Maru+Gothic:wght@500;700&display=swap'
document.head.append(fonts)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LocaleProvider>
      <App />
    </LocaleProvider>
  </StrictMode>,
)
