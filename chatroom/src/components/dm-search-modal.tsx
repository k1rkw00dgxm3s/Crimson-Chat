import { useState, useEffect } from 'react';
import { getOnlineUsers } from 'zitejs/api';
import type { OnlineUser } from '../App';

const avatarColors = ['bg-purple-600', 'bg-blue-600', 'bg-green-600', 'bg-pink-600', 'bg-cyan-600', 'bg-red-600', 'bg-indigo-600', 'bg-violet-600'];

export function DmSearchModal({ onClose, onDm, currentUserId }: {
  onClose: () => void;
  onDm: (userId: string) => Promise<void>;
  currentUserId: string;
}) {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [dmingId, setDmingId] = useState<string | null>(null);

  useEffect(() => {
    getOnlineUsers({}).then(r => { setUsers(r.users); setLoading(false); });
  }, []);

  const filtered = users
    .filter(u => u.id !== currentUserId)
    .filter(u => !search || u.name.toLowerCase().includes(search.toLowerCase()));

  const handleDm = async (userId: string) => {
    setDmingId(userId);
    await onDm(userId);
    setDmingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl w-full max-w-sm p-5 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground"><i className="fa-solid fa-envelope mr-2" />DM Someone</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><i className="fa-solid fa-xmark text-lg" /></button>
        </div>

        <div className="relative">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by username..."
            className="w-full bg-secondary rounded-lg pl-8 pr-3 py-2 text-sm text-foreground outline-none border border-border focus:border-primary"
            autoFocus
          />
        </div>

        <div className="max-h-64 overflow-y-auto space-y-1">
          {loading && <p className="text-sm text-muted-foreground text-center py-4">Loading users...</p>}
          {!loading && filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
          )}
          {filtered.map(u => {
            const idx = u.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % avatarColors.length;
            return (
              <button
                key={u.id}
                onClick={() => handleDm(u.id)}
                disabled={dmingId === u.id}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors disabled:opacity-50"
              >
                <div className="shrink-0">
                  {u.image ? (
                    <img src={u.image} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className={`w-8 h-8 rounded-full ${avatarColors[idx]} flex items-center justify-center text-white text-xs font-bold`}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="text-sm text-foreground flex-1 text-left truncate">{u.name}</span>
                <i className={`fa-solid ${dmingId === u.id ? 'fa-spinner fa-spin' : 'fa-paper-plane'} text-xs text-muted-foreground`} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
