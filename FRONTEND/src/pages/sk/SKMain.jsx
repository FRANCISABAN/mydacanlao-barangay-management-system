import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import SKApp from './SKApp.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SKApp />
  </StrictMode>,
)