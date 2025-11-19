import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { PasswordList } from './PasswordList';
import { PasswordDetailView } from './PasswordDetailView';
import { MasterPasswordConfirmation } from './MasterPasswordConfirmation';
import { AddPasswordDialog } from './AddPasswordDialog';
import { passwordService, Password } from '../services/apiService';
import { toast } from 'sonner';

export interface PasswordEntry {
  id: number;
  service_name: string;
  website_url?: string;
  username?: string;
  email_address?: string;
  password?: string;
  notes?: string;
  category: string;
  is_weak: boolean;
  is_reused: boolean;
  created_at: string;
  updated_at: string;
  last_used?: string;
  // For display compatibility
  website?: string;
  url?: string;
  favicon?: string;
  createdAt?: string;
  modifiedAt?: string;
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
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch passwords from backend
  const loadPasswords = async () => {
    setLoading(true);
    try {
      const data = await passwordService.getAll();
      
      // Transform backend data to match frontend format
      const transformedPasswords = data.map((pwd: Password) => ({
        ...pwd,
        id: pwd.id,
        website: pwd.service_name,
        url: pwd.website_url || '',
        username: pwd.username || pwd.email_address || '',
        favicon: pwd.website_url 
          ? `https://www.google.com/s2/favicons?domain=${pwd.website_url}&sz=64`
          : '',
        createdAt: pwd.created_at,
        modifiedAt: pwd.updated_at,
        isWeak: pwd.is_weak,
        isReused: pwd.is_reused,
      }));
      
      setPasswords(transformedPasswords);
    } catch (error: any) {
      toast.error('Failed to load passwords');
      console.error('Error loading passwords:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPasswords();
  }, []);

  const handleRequestPasswordView = async () => {
    if (!selectedPassword) return;
    
    try {
      // Fetch the full password details with decrypted password
      const fullPassword = await passwordService.getById(selectedPassword.id);
      
      // Update the selected password with the decrypted password
      setSelectedPassword({
        ...selectedPassword,
        password: fullPassword.password
      });
      
      setShowPasswordValue(true);
      setShowMasterPasswordDialog(false);
      
      // Auto-hide after 5 minutes
      setTimeout(() => {
        setShowPasswordValue(false);
      }, 5 * 60 * 1000);
    } catch (error) {
      console.error('Error fetching password:', error);
      toast.error('Failed to retrieve password');
      setShowMasterPasswordDialog(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedPassword(null);
    setShowPasswordValue(false);
  };

  const handlePasswordAdded = () => {
    loadPasswords(); // Reload passwords after adding new one
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
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-neutral-500">Loading passwords...</p>
              </div>
            ) : (
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
        onConfirm={handleRequestPasswordView}
      />

      <AddPasswordDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSuccess={handlePasswordAdded}
      />
    </div>
  );
}