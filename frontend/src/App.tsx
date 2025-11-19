import { Toaster } from 'sonner';
import { useState } from 'react';
import { SignUp } from './components/SignUp';
import { LogIn } from './components/LogIn';
import { Dashboard } from './components/Dashboard';

type View = 'login' | 'signup' | 'dashboard';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleSignUpSuccess = () => {
    setCurrentView('login');
  };

  const handleLogInSuccess = () => {
    setIsAuthenticated(true);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentView('login');
  };

  return (
    <>
      <div className="min-h-screen bg-slate-950 text-neutral-50">
        {currentView === 'signup' && (
          <SignUp 
            onSuccess={handleSignUpSuccess}
            onSwitchToLogin={() => setCurrentView('login')}
          />
        )}
        
        {currentView === 'login' && (
          <LogIn 
            onSuccess={handleLogInSuccess}
            onSwitchToSignUp={() => setCurrentView('signup')}
          />
        )}
        
        {currentView === 'dashboard' && isAuthenticated && (
          <Dashboard onLogout={handleLogout} />
        )}
      </div>
      <Toaster position="top-right" richColors />
    </>
  );
}