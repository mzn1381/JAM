import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import { queryClient } from './api/queryClient'
import { AuthProvider } from './admin/context/AuthContext'
import './i18n'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
          <ToastContainer
            position="bottom-left"
            autoClose={3500}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl
            pauseOnHover
            draggable
          />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
