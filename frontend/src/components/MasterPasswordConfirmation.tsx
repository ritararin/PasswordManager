import { useState } from 'react';
import { Shield, Eye, EyeOff, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';

interface MasterPasswordConfirmationProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function MasterPasswordConfirmation({ open, onClose, onConfirm }: MasterPasswordConfirmationProps) {
  const [masterPassword, setMasterPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepRevealed, setKeepRevealed] = useState(true);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate master password verification
    if (masterPassword.length > 0) {
      onConfirm();
      setMasterPassword('');
      setError('');
    } else {
      setError('Master password is required');
    }
  };

  const handleClose = () => {
    setMasterPassword('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-900 border-2 border-yellow-600/50 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-600 rounded-lg">
              <Shield className="size-5" />
            </div>
            <DialogTitle className="text-xl">Security Check</DialogTitle>
          </div>
          <DialogDescription className="text-neutral-300">
            Please confirm your password to reveal the stored password
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-4">
          <div>
            <Label htmlFor="master-password-confirm">Password</Label>
            <div className="relative mt-2">
              <Input
                id="master-password-confirm"
                type={showPassword ? 'text' : 'password'}
                value={masterPassword}
                onChange={(e) => {
                  setMasterPassword(e.target.value);
                  setError('');
                }}
                placeholder="Enter your password"
                className="bg-slate-950 border-slate-600 focus:border-yellow-500 pr-10"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {error && (
              <div className="flex items-center gap-2 mt-2 text-xs text-red-400">
                <AlertCircle className="size-3" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 bg-slate-950 border border-slate-700 rounded-lg p-3">
            <Checkbox
              id="keep-revealed"
              checked={keepRevealed}
              onCheckedChange={(checked) => setKeepRevealed(checked as boolean)}
            />
            <label
              htmlFor="keep-revealed"
              className="text-sm text-neutral-300 cursor-pointer"
            >
              Keep password revealed for 5 minutes
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={handleClose}
              variant="outline"
              className="flex-1 border-neutral-700 hover:bg-neutral-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-neutral-950"
              disabled={!masterPassword}
            >
              Confirm & Reveal
            </Button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
          <p className="text-xs text-neutral-400">
            <strong className="text-neutral-300">Security Note:</strong> This confirmation ensures that only authorized users can view sensitive information.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}