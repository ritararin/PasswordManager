import { AlertTriangle, RefreshCw } from 'lucide-react';
import { PasswordEntry } from './Dashboard';

interface PasswordListItemProps {
  password: PasswordEntry;
  isSelected: boolean;
  onClick: () => void;
}

export function PasswordListItem({ password, isSelected, onClick }: PasswordListItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-3 rounded-lg border transition-all ${
        isSelected
          ? 'bg-blue-600/10 border-blue-600'
          : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="size-10 rounded-lg bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
          {password.favicon ? (
            <img src={password.favicon} alt="" className="size-6" onError={(e) => {
              e.currentTarget.style.display = 'none';
            }} />
          ) : (
            <div className="size-6 bg-blue-600 rounded" />
          )}
        </div>
        
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate">{password.website}</h3>
            {(password.isWeak || password.isReused) && (
              <div className="flex items-center gap-1">
                {password.isWeak && (
                  <AlertTriangle className="size-3.5 text-red-400" title="Weak password" />
                )}
                {password.isReused && (
                  <RefreshCw className="size-3.5 text-yellow-400" title="Reused password" />
                )}
              </div>
            )}
          </div>
          <p className="text-xs text-neutral-400 truncate">{password.username}</p>
        </div>
      </div>
    </button>
  );
}