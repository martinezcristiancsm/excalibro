import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import Canvas from './Canvas.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Canvas />
  </StrictMode>,
)
