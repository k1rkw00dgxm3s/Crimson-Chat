import { useState } from 'react';
import { createRoom } from 'zitejs/api';
import { toast } from 'sonner';

export function CreateRoomModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'Public' | 'Private'>('Public');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) { toast.error('Room name is required'); return; }
    setCreating(true);
    try {
      await createRoom({ name: name.trim(), type });
      toast.success(`Room "${name.trim()}" created!`);
      onCreated();
    } catch { toast.error('Failed to create room'); }
    setCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Create Room</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><i className="fa-solid fa-xmark text-lg" /></button>
        </div>

        <div>
          <label className="block text-sm text-muted-foreground mb-1">Room Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="my-room"
            className="w-full bg-secondary rounded-lg px-3 py-2 text-sm text-foreground outline-none border border-border focus:border-primary"
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
          />
        </div>

        <div>
          <label className="block text-sm text-muted-foreground mb-2">Visibility</label>
          <div className="flex gap-2">
            {(['Public', 'Private'] as const).map(t => (
              <button key={t} onClick={() => setType(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${type === t ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleCreate} disabled={creating}
          className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity">
          {creating ? 'Creating...' : 'Create Room'}
        </button>
      </div>
    </div>
  );
}
