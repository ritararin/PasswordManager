import { useState } from 'react';
import { Shield, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { authService } from '../services/apiService';

interface LogInProps {
  onSuccess: () => void;
  onSwitchToSignUp: () => void;
}

export function LogIn({ onSuccess, onSwitchToSignUp }: LogInProps) {
  const [email, setEmail] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotDialog, setShowForgotDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    const response = await authService.login(email, masterPassword);
    console.log('Login response:', response); // Debug log
    console.log('Token stored:', localStorage.getItem('access_token')); // Debug log
    onSuccess();
  } catch (err: any) {
    setError(err.response?.data?.error || 'Invalid email or password');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-lg">
              <Shield className="size-8" />
            </div>
            <h1 className="text-3xl">SecureVault</h1>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-lg p-8">
          <h2 className="text-2xl mb-2">Welcome Back</h2>
          <p className="text-neutral-400 mb-6">Enter your password to continue</p>

          {error && (
            <div className="mb-4 p-3 bg-red-950/20 border border-red-900/50 rounded-lg">
              <p className="text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="size-4" />
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1.5 bg-slate-950 border-slate-600 focus:border-blue-500"
                required
                disabled={loading}
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="master-password">Password</Label>
                <button
                  type="button"
                  onClick={() => setShowForgotDialog(true)}
                  className="text-xs text-blue-400 hover:text-blue-300"
                  disabled={loading}
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative mt-1.5">
                <Input
                  id="master-password"
                  type={showPassword ? 'text' : 'password'}
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="bg-slate-950 border-slate-600 focus:border-blue-500 pr-10"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 mt-6"
              disabled={!email || !masterPassword || loading}
            >
              {loading ? 'Logging in...' : 'Log In'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-neutral-400 text-sm">
              Don't have an account?{' '}
              <button
                onClick={onSwitchToSignUp}
                className="text-blue-400 hover:text-blue-300 underline"
                disabled={loading}
              >
                Sign Up
              </button>
            </p>
          </div>
        </div>
      </div>

      <Dialog open={showForgotDialog} onOpenChange={setShowForgotDialog}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="size-5 text-red-400" />
              <DialogTitle>Password Recovery</DialogTitle>
            </div>
            <DialogDescription className="text-neutral-300">
              Unfortunately, password recovery is impossible. This is by design to ensure maximum security.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-neutral-400">
              Your password is never stored on our servers and cannot be reset. 
              If you've lost your password, you will need to create a new account.
            </p>
            <p className="text-sm text-neutral-400">
              This security measure ensures that no one, including us, can access your encrypted data.
            </p>
            <Button 
              onClick={() => setShowForgotDialog(false)}
              className="w-full bg-neutral-800 hover:bg-neutral-700"
            >
              I Understand
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}