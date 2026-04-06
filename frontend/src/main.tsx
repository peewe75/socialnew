import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App.tsx'
import './index.css'
import { getClerkPublishableKey, loadRuntimeConfig } from './config/runtime'

async function bootstrap() {
  await loadRuntimeConfig()

  const clerkPublishableKey = getClerkPublishableKey()

  if (!clerkPublishableKey) {
    console.warn('Missing VITE_CLERK_PUBLISHABLE_KEY - auth will not work')
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      {clerkPublishableKey ? (
        <ClerkProvider publishableKey={clerkPublishableKey}>
          <App />
        </ClerkProvider>
      ) : (
        <App />
      )}
    </React.StrictMode>,
  )
}

bootstrap()
