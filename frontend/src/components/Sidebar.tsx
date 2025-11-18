import { Shield, Key, FileText, CreditCard, Settings, LogOut } from 'lucide-react';
import { Button } from './ui/button';

interface SidebarProps {
  currentView: 'passwords' | 'notes' | 'cards' | 'settings';
  onViewChange: (view: 'passwords' | 'notes' | 'cards' | 'settings') => void;
  onLogout: () => void;
}

export function Sidebar({ currentView, onViewChange, onLogout }: SidebarProps) {
  const navItems = [
    { id: 'passwords' as const, label: 'Passwords', icon: Key },
    { id: 'notes' as const, label: 'Secure Notes', icon: FileText },
    { id: 'cards' as const, label: 'Credit Cards', icon: CreditCard },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-700 flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Shield className="size-6" />
          </div>
          <h1 className="text-xl">SecureVault</h1>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-slate-800'
                }`}
              >
                <Icon className="size-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-slate-700">
        <Button
          onClick={onLogout}
          variant="ghost"
          className="w-full justify-start gap-3 text-neutral-400 hover:text-neutral-200 hover:bg-slate-800"
        >
          <LogOut className="size-5" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
}