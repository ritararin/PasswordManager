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
import { PasswordEntry } from './Dashboard';

interface AddPasswordDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (password: Omit<PasswordEntry, 'id' | 'createdAt' | 'modifiedAt'>) => void;
}

export function AddPasswordDialog({ open, onClose, onAdd }: AddPasswordDialogProps) {
  const [website, setWebsite] = useState('');
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('Personal');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onAdd({
      website,
      url,
      username,
      password,
      notes,
      category,
      favicon: `https://www.google.com/s2/favicons?domain=${url}&sz=64`,
    });

    // Reset form
    setWebsite('');
    setUrl('');
    setUsername('');
    setPassword('');
    setNotes('');
    setCategory('Personal');
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
            <Label htmlFor="website">Website Name</Label>
            <Input
              id="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="e.g., GitHub"
              className="mt-1.5 bg-slate-950 border-slate-600 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <Label htmlFor="url">Website URL</Label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com"
              className="mt-1.5 bg-neutral-950 border-neutral-700 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <Label htmlFor="username">Username / Email</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="you@example.com"
              className="mt-1.5 bg-neutral-950 border-neutral-700 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="mt-1.5 bg-slate-950 border-slate-600 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Work, Personal, Shopping"
              className="mt-1.5 bg-slate-950 border-slate-600 focus:border-blue-500"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
              className="mt-1.5 bg-neutral-950 border-neutral-700 focus:border-blue-500 resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1 border-slate-600 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="size-4 mr-2" />
              Add Password
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}