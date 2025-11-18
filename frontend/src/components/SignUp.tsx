import { useState } from 'react';
import { Shield, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';

interface SignUpProps {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}

export function SignUp({ onSuccess, onSwitchToLogin }: SignUpProps) {
  const [email, setEmail] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 1) return { strength, label: 'Weak', color: 'bg-red-500' };
    if (strength <= 3) return { strength, label: 'Fair', color: 'bg-yellow-500' };
    if (strength <= 4) return { strength, label: 'Good', color: 'bg-blue-500' };
    return { strength, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(masterPassword);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate sign up
    if (masterPassword === confirmPassword && email && masterPassword) {
      onSuccess();
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
          <h2 className="text-2xl mb-2">Create Your Account</h2>
          <p className="text-neutral-400 mb-6">Begin securing your digital life</p>

          <Alert className="mb-6 bg-yellow-950/20 border-yellow-900/50">
            <AlertTriangle className="size-4 text-yellow-500" />
            <AlertDescription className="text-yellow-200/90 text-sm">
              <strong>Important:</strong> Your password cannot be recovered. Please store it in a safe place.
            </AlertDescription>
          </Alert>

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
              />
            </div>

            <div>
              <Label htmlFor="master-password">Password</Label>
              <div className="relative mt-1.5">
                <Input
                  id="master-password"
                  type={showPassword ? 'text' : 'password'}
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  placeholder="Enter a strong password"
                  className="bg-slate-950 border-slate-600 focus:border-blue-500 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {masterPassword && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-neutral-400">Password Strength</span>
                    <span className={`text-xs ${passwordStrength.color.replace('bg-', 'text-')}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${passwordStrength.color} transition-all duration-300`}
                      style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative mt-1.5">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="bg-slate-950 border-slate-600 focus:border-blue-500 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200"
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {confirmPassword && masterPassword !== confirmPassword && (
                <p className="text-xs text-red-400 mt-1.5">Passwords do not match</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 mt-6"
              disabled={!email || !masterPassword || masterPassword !== confirmPassword}
            >
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-neutral-400 text-sm">
              Already have an account?{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Log In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}