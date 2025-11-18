import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { PasswordList } from './PasswordList';
import { PasswordDetailView } from './PasswordDetailView';
import { MasterPasswordConfirmation } from './MasterPasswordConfirmation';
import { AddPasswordDialog } from './AddPasswordDialog';

export interface PasswordEntry {
  id: string;
  website: string;
  url: string;
  username: string;
  password: string;
  notes: string;
  category: string;
  favicon: string;
  createdAt: string;
  modifiedAt: string;
  isWeak?: boolean;
  isReused?: boolean;
}

interface DashboardProps {
  onLogout: () => void;
}

export function Dashboard({ onLogout }: DashboardProps) {
  const [selectedPassword, setSelectedPassword] = useState<PasswordEntry | null>(null);
  const [showPasswordValue, setShowPasswordValue] = useState(false);
  const [showMasterPasswordDialog, setShowMasterPasswordDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [currentView, setCurrentView] = useState<'passwords' | 'notes' | 'cards' | 'settings'>('passwords');

  // Mock data
  const [passwords, setPasswords] = useState<PasswordEntry[]>([
    {
      id: '1',
      website: 'GitHub',
      url: 'https://github.com',
      username: 'john.doe@email.com',
      password: 'GH$ecur3P@ss2024!',
      notes: 'Work account for development projects',
      category: 'Work',
      favicon: 'https://github.githubassets.com/favicons/favicon.svg',
      createdAt: '2024-01-15',
      modifiedAt: '2024-10-20',
    },
    {
      id: '2',
      website: 'Google',
      url: 'https://google.com',
      username: 'personal@gmail.com',
      password: 'GooglePass123',
      notes: 'Personal Google account',
      category: 'Personal',
      favicon: 'https://www.google.com/favicon.ico',
      createdAt: '2023-08-10',
      modifiedAt: '2024-11-01',
      isWeak: true,
    },
    {
      id: '3',
      website: 'Netflix',
      url: 'https://netflix.com',
      username: 'family@email.com',
      password: 'Netflix2023',
      notes: 'Family shared account',
      category: 'Entertainment',
      favicon: 'https://assets.nflxext.com/us/ffe/siteui/common/icons/nficon2023.ico',
      createdAt: '2023-06-22',
      modifiedAt: '2024-06-22',
      isReused: true,
    },
    {
      id: '4',
      website: 'Amazon',
      url: 'https://amazon.com',
      username: 'shopper@email.com',
      password: 'Amz0n$h0pp1ng!2024',
      notes: 'Primary shopping account',
      category: 'Shopping',
      favicon: 'https://www.amazon.com/favicon.ico',
      createdAt: '2024-02-14',
      modifiedAt: '2024-11-10',
    },
    {
      id: '5',
      website: 'LinkedIn',
      url: 'https://linkedin.com',
      username: 'john.doe.professional',
      password: 'L1nk3d!nCareer#99',
      notes: 'Professional networking',
      category: 'Work',
      favicon: 'https://static.licdn.com/sc/h/al2o9zrvru7aqj8e1x2rzsrca',
      createdAt: '2023-11-30',
      modifiedAt: '2024-09-15',
    },
  ]);

  const handleRequestPasswordView = () => {
    setShowMasterPasswordDialog(true);
  };

  const handleMasterPasswordConfirmed = () => {
    setShowPasswordValue(true);
    setShowMasterPasswordDialog(false);
    
    // Auto-hide after 5 minutes
    setTimeout(() => {
      setShowPasswordValue(false);
    }, 5 * 60 * 1000);
  };

  const handleCloseDetail = () => {
    setSelectedPassword(null);
    setShowPasswordValue(false);
  };

  const handleAddPassword = (newPassword: Omit<PasswordEntry, 'id' | 'createdAt' | 'modifiedAt'>) => {
    const now = new Date().toISOString().split('T')[0];
    const password: PasswordEntry = {
      ...newPassword,
      id: Date.now().toString(),
      createdAt: now,
      modifiedAt: now,
    };
    setPasswords([password, ...passwords]);
    setShowAddDialog(false);
  };

  return (
    <div className="flex h-screen bg-slate-950">
      <Sidebar 
        currentView={currentView}
        onViewChange={setCurrentView}
        onLogout={onLogout}
      />
      
      <div className="flex-1 flex">
        {currentView === 'passwords' && (
          <>
            <PasswordList 
              passwords={passwords}
              selectedId={selectedPassword?.id}
              onSelectPassword={setSelectedPassword}
              onAddNew={() => setShowAddDialog(true)}
            />
            
            {selectedPassword && (
              <PasswordDetailView
                password={selectedPassword}
                showPassword={showPasswordValue}
                onRequestPasswordView={handleRequestPasswordView}
                onClose={handleCloseDetail}
              />
            )}
          </>
        )}

        {currentView === 'notes' && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-neutral-500">Secure Notes - Coming Soon</p>
          </div>
        )}

        {currentView === 'cards' && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-neutral-500">Credit Cards - Coming Soon</p>
          </div>
        )}

        {currentView === 'settings' && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-neutral-500">Settings - Coming Soon</p>
          </div>
        )}
      </div>

      <MasterPasswordConfirmation
        open={showMasterPasswordDialog}
        onClose={() => setShowMasterPasswordDialog(false)}
        onConfirm={handleMasterPasswordConfirmed}
      />

      <AddPasswordDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdd={handleAddPassword}
      />
    </div>
  );
}