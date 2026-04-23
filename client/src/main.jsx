import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { fontSize: '13px', borderRadius: '10px', background: '#1a2332', color: '#fff' },
            success: { iconTheme: { primary: '#E8A838', secondary: '#1a2332' } }
          }}
        />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
)
