import { useState } from 'react';
import { AuthProvider, useAuth } from './auth';
import { AuthShell } from './pages/AuthShell';
import { Landing } from './pages/Landing';
import { Workspace } from './pages/Workspace';

function Shell() {
  const { user, loading } = useAuth();
  const [view, setView] = useState<'landing' | 'auth'>('landing');

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-nautral-500">
        loading…
      </div>
    );
  }

  if (user) return <Workspace />;
  if (view === 'auth') return <AuthShell onBack={() => setView('landing')} />;
  return <Landing onSignup={() => setView('auth')} />;
}

export function App() {
  return (
    <AuthProvider>
      <div className="h-full">
        <Shell />
      </div>
    </AuthProvider>
  );
}
