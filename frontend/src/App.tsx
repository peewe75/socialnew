import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import Layout from './layouts/Layout';
import Dashboard from './pages/Dashboard';
import News from './pages/News';
import Approval from './pages/Approval';
import Publishing from './pages/Publishing';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import { isClerkEnabled } from './config/runtime';

function ProtectedLayoutRoutes() {
  return (
    <Route path="/" element={<Layout />}>
      <Route index element={<Dashboard />} />
      <Route path="news" element={<News />} />
      <Route path="publishing" element={<Publishing />} />
      <Route path="analytics" element={<Analytics />} />
      <Route path="settings" element={<Settings />} />
    </Route>
  );
}

function RequireAuth() {
  const clerkEnabled = isClerkEnabled();

  if (!clerkEnabled) {
    return <Outlet />;
  }

  return (
    <>
      <SignedIn>
        <Outlet />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/approve" element={<Approval />} />
        <Route path="/approve/:id" element={<Approval />} />

        <Route element={<RequireAuth />}>
          {ProtectedLayoutRoutes()}
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
