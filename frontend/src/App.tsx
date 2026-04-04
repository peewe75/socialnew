import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import Layout from './layouts/Layout';
import Dashboard from './pages/Dashboard';
import News from './pages/News';
import Approval from './pages/Approval';
import Publishing from './pages/Publishing';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

const CLERK_ENABLED = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function ProtectedRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="news" element={<News />} />
        <Route path="approve" element={<Approval />} />
        <Route path="approve/:id" element={<Approval />} />
        <Route path="publishing" element={<Publishing />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      {CLERK_ENABLED ? (
        <>
          <SignedIn>
            <ProtectedRoutes />
          </SignedIn>
          <SignedOut>
            <RedirectToSignIn />
          </SignedOut>
        </>
      ) : (
        <ProtectedRoutes />
      )}
    </BrowserRouter>
  );
}

export default App;
