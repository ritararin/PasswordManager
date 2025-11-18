import { useState } from 'react';
import { Search, Plus, Filter, AlertTriangle, RefreshCw } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { PasswordEntry } from './Dashboard';
import { SecurityHealthWidget } from './SecurityHealthWidget';
import { PasswordListItem } from './PasswordListItem';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface PasswordListProps {
  passwords: PasswordEntry[];
  selectedId?: string;
  onSelectPassword: (password: PasswordEntry) => void;
  onAddNew: () => void;
}

export function PasswordList({ passwords, selectedId, onSelectPassword, onAddNew }: PasswordListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'category'>('recent');

  const weakPasswords = passwords.filter(p => p.isWeak).length;
  const reusedPasswords = passwords.filter(p => p.isReused).length;

  const filteredPasswords = passwords.filter(password =>
    password.website.toLowerCase().includes(searchQuery.toLowerCase()) ||
    password.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedPasswords = [...filteredPasswords].sort((a, b) => {
    if (sortBy === 'name') return a.website.localeCompare(b.website);
    if (sortBy === 'category') return a.category.localeCompare(b.category);
    return new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime();
  });

  return (
    <div className="w-96 border-r border-slate-700 flex flex-col bg-slate-950">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl">Passwords</h2>
          <Button
            onClick={onAddNew}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="size-4 mr-2" />
            New
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
          <Input
            type="text"
            placeholder="Search passwords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-900 border-slate-600 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-neutral-500">
            {filteredPasswords.length} {filteredPasswords.length === 1 ? 'item' : 'items'}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs text-neutral-400 hover:text-neutral-200">
                <Filter className="size-3 mr-1.5" />
                Sort: {sortBy === 'recent' ? 'Recent' : sortBy === 'name' ? 'Name' : 'Category'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-slate-900 border-slate-700">
              <DropdownMenuItem onClick={() => setSortBy('recent')} className="hover:bg-slate-800">
                Recently Modified
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('name')} className="hover:bg-slate-800">
                Name (A-Z)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('category')} className="hover:bg-slate-800">
                Category
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="p-4">
        <SecurityHealthWidget
          weakCount={weakPasswords}
          reusedCount={reusedPasswords}
          totalCount={passwords.length}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pb-4 space-y-2">
          {sortedPasswords.map((password) => (
            <PasswordListItem
              key={password.id}
              password={password}
              isSelected={password.id === selectedId}
              onClick={() => onSelectPassword(password)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}