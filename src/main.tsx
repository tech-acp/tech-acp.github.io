import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AdminPage } from './pages/AdminPage.tsx'

// Handle GitHub Pages 404 redirect
const params = new URLSearchParams(window.location.search)
const redirect = params.get('redirect')
if (redirect) {
  // Clean URL and navigate to the original path
  window.history.replaceState(null, '', redirect)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
