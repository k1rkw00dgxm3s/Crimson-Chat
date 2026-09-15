import type { OnlineUser } from '../App';

const avatarColors = ['bg-purple-600', 'bg-blue-600', 'bg-green-600', 'bg-pink-600', 'bg-cyan-600', 'bg-red-600', 'bg-indigo-600', 'bg-violet-600'];

export function OnlineSidebar({ users, onDm, currentUserId }: { users: OnlineUser[]; onDm: (id: string) => void; currentUserId: string }) {
  return (
    <aside className="w-56 shrink-0 bg-[hsl(270,15%,5%)] border-l border-border flex flex-col">
      <div className="h-12 flex items-center px-4 border-b border-border">
        <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">ONLINE — {users.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {users.map(u => {
          const idx = u.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % avatarColors.length;
          return (
            <div key={u.id} className="group flex items-center gap-2 px-2 py-1.5 rounded hover:bg-secondary/50 transition-colors">
              <div className="relative shrink-0">
                {u.image ? (
                  <img src={u.image} alt={u.name} className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <div className={`w-7 h-7 rounded-full ${avatarColors[idx]} flex items-center justify-center text-white text-xs font-bold`}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-[hsl(270,15%,5%)]" />
              </div>
              <span className="text-sm text-foreground/80 truncate flex-1">{u.name}</span>
              {u.id !== currentUserId && (
                <button onClick={() => onDm(u.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary" title="Send DM">
                  <i className="fa-solid fa-comment text-xs" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
