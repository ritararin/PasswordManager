import { X, Eye, Copy, ExternalLink, Calendar, Tag } from 'lucide-react';
import { Button } from './ui/button';
import { PasswordEntry } from './Dashboard';
import { toast } from 'sonner@2.0.3';

interface PasswordDetailViewProps {
  password: PasswordEntry;
  showPassword: boolean;
  onRequestPasswordView: () => void;
  onClose: () => void;
}

export function PasswordDetailView({
  password,
  showPassword,
  onRequestPasswordView,
  onClose,
}: PasswordDetailViewProps) {
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <div className="flex-1 bg-neutral-950 border-l border-neutral-800">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-lg bg-slate-900 flex items-center justify-center overflow-hidden">
              {password.favicon ? (
                <img src={password.favicon} alt="" className="size-8" onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }} />
              ) : (
                <div className="size-8 bg-blue-600 rounded" />
              )}
            </div>
            <div>
              <h2 className="text-xl">{password.website}</h2>
              <a
                href={password.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                {password.url}
                <ExternalLink className="size-3" />
              </a>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-neutral-400 hover:text-neutral-200"
          >
            <X className="size-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl space-y-6">
            {/* Username */}
            <div>
              <label className="text-sm text-neutral-400 mb-2 block">Username / Email</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3">
                  <span className="text-neutral-100">{password.username}</span>
                </div>
                <Button
                  onClick={() => handleCopy(password.username, 'Username')}
                  variant="ghost"
                  size="sm"
                  className="text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
                >
                  <Copy className="size-4" />
                </Button>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-sm text-neutral-400 mb-2 block">Password</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 font-mono">
                  {showPassword ? (
                    <span className="text-white font-semibold tracking-wide">{password.password}</span>
                  ) : (
                    <span className="text-neutral-100">••••••••••••</span>
                  )}
                </div>
                <Button
                  onClick={showPassword ? () => handleCopy(password.password, 'Password') : onRequestPasswordView}
                  variant="ghost"
                  size="sm"
                  className="text-neutral-400 hover:text-neutral-200 hover:bg-slate-800"
                >
                  {showPassword ? <Copy className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
              {!showPassword && (
                <p className="text-xs text-neutral-500 mt-2">
                  Click the eye icon to reveal password (requires password confirmation)
                </p>
              )}
              {showPassword && (
                <p className="text-xs text-green-400 mt-2">
                  Password revealed - will auto-hide in 5 minutes
                </p>
              )}
            </div>

            {/* Notes */}
            {password.notes && (
              <div>
                <label className="text-sm text-neutral-400 mb-2 block">Notes</label>
                <div className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3">
                  <p className="text-neutral-300 text-sm">{password.notes}</p>
                </div>
              </div>
            )}

            {/* Category */}
            <div>
              <label className="text-sm text-neutral-400 mb-2 block">Category</label>
              <div className="inline-flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2">
                <Tag className="size-4 text-neutral-400" />
                <span className="text-sm text-neutral-300">{password.category}</span>
              </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-800">
              <div>
                <label className="text-xs text-neutral-500 mb-1 block flex items-center gap-1.5">
                  <Calendar className="size-3" />
                  Created
                </label>
                <p className="text-sm text-neutral-300">{password.createdAt}</p>
              </div>
              <div>
                <label className="text-xs text-neutral-500 mb-1 block flex items-center gap-1.5">
                  <Calendar className="size-3" />
                  Last Modified
                </label>
                <p className="text-sm text-neutral-300">{password.modifiedAt}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-4 border-t border-slate-700">
              <h3 className="text-sm text-neutral-400 mb-3">Quick Actions</h3>
              <div className="flex gap-2">
                <Button
                  onClick={() => window.open(password.url, '_blank')}
                  variant="outline"
                  size="sm"
                  className="border-neutral-700 hover:bg-neutral-800"
                >
                  <ExternalLink className="size-4 mr-2" />
                  Go to Website
                </Button>
                <Button
                  onClick={() => handleCopy(password.username, 'Username')}
                  variant="outline"
                  size="sm"
                  className="border-slate-600 hover:bg-slate-800"
                >
                  <Copy className="size-4 mr-2" />
                  Copy Username
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}