import { useState } from 'react';
import { Plus } from 'lucide-react';
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
import { Textarea } from './ui/textarea';
import { passwordService } from '../services/apiService';
import { toast } from 'sonner';

interface AddPasswordDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddPasswordDialog({ open, onClose, onSuccess }: AddPasswordDialogProps) {
  const [serviceName, setServiceName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('Personal');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await passwordService.create({
        service_name: serviceName,
        password: password,
        website_url: websiteUrl,
        username: username,
        notes: notes,
        category: category,
      });

      toast.success('Password added successfully!');
      
      // Reset form
      setServiceName('');
      setWebsiteUrl('');
      setUsername('');
      setPassword('');
      setNotes('');
      setCategory('Personal');
      
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Add New Password</DialogTitle>
          <DialogDescription className="text-neutral-400">
            Securely store a new password in your vault
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div>
            <Label htmlFor="service-name">Website Name</Label>
            <Input
              id="service-name"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              placeholder="e.g., GitHub"
              className="mt-1.5 bg-slate-950 border-slate-600 focus:border-blue-500 text-white placeholder:text-neutral-500"
              required
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="url">Website URL</Label>
            <Input
              id="url"
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://github.com"
              className="mt-1.5 bg-slate-950 border-slate-600 focus:border-blue-500 text-white placeholder:text-neutral-500"
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="username">Username / Email</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="you@example.com"
              className="mt-1.5 bg-slate-950 border-slate-600 focus:border-blue-500 text-white placeholder:text-neutral-500"
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="mt-1.5 bg-slate-950 border-slate-600 focus:border-blue-500 text-white placeholder:text-neutral-500 pr-10"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200"
                disabled={loading}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Work, Personal, Shopping"
              className="mt-1.5 bg-slate-950 border-slate-600 focus:border-blue-500 text-white placeholder:text-neutral-500"
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
              className="mt-1.5 bg-slate-950 border-slate-600 focus:border-blue-500 resize-none text-white placeholder:text-neutral-500"
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1 border-slate-600 hover:bg-slate-800"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              <Plus className="size-4 mr-2" />
              {loading ? 'Adding...' : 'Add Password'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}