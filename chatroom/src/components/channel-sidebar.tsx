import { cn } from '@project/components/lib/utils';
import type { Channel } from '../App';

const LOGO_URL = 'https://images.fillout.com/orgid-849891/flowpublicid-ev9qo4syzm/widgetid-default/payAsmqqqD1j3jCMK4bAFy/pasted-image-1789488816387-t76udj8q.png';
const GITHUB_ICON = 'https://cdn.jsdelivr.net/npm/simple-icons@16.31.0/icons/github.svg';

export function ChannelSidebar({
  channels, activeChannelId, onSelectChannel, onOpenSettings, onOpenGames, onCreateRoom, onDmSearch,
}: {
  channels: Channel[];
  activeChannelId: string;
  onSelectChannel: (id: string) => void;
  onOpenSettings: () => void;
  onOpenGames: () => void;
  onCreateRoom: () => void;
  onDmSearch: () => void;
}) {
  const defaultChannels = channels.filter(c => !c.isDm && ['General', 'Links', 'Announcements', 'Rules'].includes(c.name));
  const userRooms = channels.filter(c => !c.isDm && !defaultChannels.includes(c));
  const dms = channels.filter(c => c.isDm);

  return (
    <aside className="w-56 shrink-0 bg-[hsl(270,15%,5%)] flex flex-col border-r border-border">
      <div className="h-14 flex items-center px-3 border-b border-border">
        <img src={LOGO_URL} alt="Crimson Chat" className="h-9 object-contain" />
      </div>

      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        <ChannelGroup label="CHANNELS" channels={defaultChannels} activeId={activeChannelId} onSelect={onSelectChannel} />
        {userRooms.length > 0 && <ChannelGroup label="ROOMS" channels={userRooms} activeId={activeChannelId} onSelect={onSelectChannel} />}
        {dms.length > 0 && <ChannelGroup label="DIRECT MESSAGES" channels={dms} activeId={activeChannelId} onSelect={onSelectChannel} />}

        <div className="space-y-1 pt-2">
          <button onClick={onCreateRoom} className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <i className="fa-solid fa-plus w-4 text-center text-xs" />
            <span>Create Room</span>
          </button>
          <button onClick={onDmSearch} className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <i className="fa-solid fa-envelope w-4 text-center text-xs" />
            <span>DM Someone</span>
          </button>
          <button onClick={onOpenGames} className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <i className="fa-solid fa-gamepad w-4 text-center text-xs" />
            <span>Games</span>
          </button>
          <a href="https://github.com/k1rkw00dgxm3s/Crimson-Chat/" target="_blank" rel="noopener noreferrer"
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <img src={GITHUB_ICON} alt="GitHub" className="w-4 h-4 invert opacity-70" />
            <span>Source Code</span>
          </a>
        </div>
      </div>

      <div className="border-t border-border p-2">
        <button onClick={onOpenSettings} className="w-full flex items-center gap-2 px-2 py-2 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
          <i className="fa-solid fa-gear w-4 text-center text-xs" />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}

const iconMap: Record<string, string> = {
  '📋': 'fa-solid fa-scroll',
  '📢': 'fa-solid fa-bullhorn',
  '#': 'fa-solid fa-hashtag',
  '🔗': 'fa-solid fa-link',
  '💬': 'fa-solid fa-comment',
};

function ChannelGroup({ label, channels, activeId, onSelect }: {
  label: string; channels: Channel[]; activeId: string; onSelect: (id: string) => void;
}) {
  return (
    <div>
      <p className="px-2 mb-1 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">{label}</p>
      {channels.map(ch => (
        <button
          key={ch.id}
          onClick={() => onSelect(ch.id)}
          className={cn(
            'w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors',
            ch.id === activeId ? 'bg-primary/15 text-primary font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          )}
        >
          <i className={`${iconMap[ch.icon] ?? 'fa-solid fa-hashtag'} w-4 text-center text-xs`} />
          <span className="truncate">{ch.name}</span>
          {ch.readOnly && <span className="ml-auto text-[10px] text-muted-foreground"><i className="fa-solid fa-lock" /></span>}
        </button>
      ))}
    </div>
  );
}
