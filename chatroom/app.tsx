import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth, loginWithRedirect } from 'zitejs/auth';
import { getChannels, getMessages, sendMessage, getOnlineUsers, reportTyping, createDm } from 'zitejs/api';
import type { GetChannelsOutputType, GetMessagesOutputType, GetOnlineUsersOutputType } from 'zitejs/api';
import { ChannelSidebar } from './components/channel-sidebar';
import { ChatArea } from './components/chat-area';
import { OnlineSidebar } from './components/online-sidebar';
import { SettingsModal } from './components/settings-modal';
import { GamesWindow } from './components/games-window';
import { CreateRoomModal } from './components/create-room-modal';
import { DmSearchModal } from './components/dm-search-modal';
import { Toaster } from '@project/components/ui/sonner';
import { toast } from 'sonner';

export type Channel = GetChannelsOutputType['channels'][0];
export type Message = GetMessagesOutputType['messages'][0];
export type OnlineUser = GetOnlineUsersOutputType['users'][0];

export default function App() {
  const { user, isLoading } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showGames, setShowGames] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showDmSearch, setShowDmSearch] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastMsgTime = useRef('');
  const sentIds = useRef(new Set<string>());

  useEffect(() => {
    if (!isLoading && !user) loginWithRedirect();
  }, [isLoading, user]);

  const loadChannels = useCallback(async () => {
    if (!user) return;
    const res = await getChannels({});
    setChannels(res.channels);
    return res.channels;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadChannels().then(chs => {
      if (!chs) return;
      const gen = chs.find(c => c.name === 'General');
      if (gen) setActiveChannelId(gen.id);
      else if (chs[0]) setActiveChannelId(chs[0].id);
    });
    getOnlineUsers({}).then(r => setOnlineUsers(r.users));
    const userPoll = setInterval(() => {
      getOnlineUsers({}).then(r => setOnlineUsers(r.users));
    }, 15000);
    // Also refresh channels periodically to catch new DMs
    const chPoll = setInterval(() => { loadChannels(); }, 10000);
    return () => { clearInterval(userPoll); clearInterval(chPoll); };
  }, [user, loadChannels]);

  const loadMessages = useCallback(async (chId: string, after?: string) => {
    if (!chId) return;
    try {
      const res = await getMessages({ channelId: chId, after, limit: 50 });
      if (after) {
        if (res.messages.length > 0) {
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id));
            const newMsgs = res.messages.filter(m => !existingIds.has(m.id) && !m.id.startsWith('optimistic-'));
            // Also remove any optimistic messages that now have real counterparts
            const cleaned = prev.filter(m => {
              if (!m.id.startsWith('optimistic-')) return true;
              // Remove optimistic msg if a real one with same content exists
              return !res.messages.some(rm => rm.content === m.content && rm.authorId === m.authorId);
            });
            if (newMsgs.length === 0 && cleaned.length === prev.length) return prev;
            return [...cleaned, ...newMsgs];
          });
          lastMsgTime.current = res.messages[res.messages.length - 1].sentAt;
        }
      } else {
        setMessages(res.messages);
        lastMsgTime.current = res.messages.length > 0
          ? res.messages[res.messages.length - 1].sentAt : '';
      }
      setTypingUsers(res.typingUsers);
    } catch { /* ignore polling errors */ }
  }, []);

  useEffect(() => {
    if (!activeChannelId || !user) return;
    lastMsgTime.current = '';
    setMessages([]);
    setTypingUsers([]);
    loadMessages(activeChannelId);
    if (pollRef.current) clearInterval(pollRef.current);
    // Poll every 1.5s for near-instant updates
    pollRef.current = setInterval(() => {
      if (lastMsgTime.current) loadMessages(activeChannelId, lastMsgTime.current);
      else loadMessages(activeChannelId);
    }, 1500);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeChannelId, user, loadMessages]);

  const handleSend = useCallback(async (content: string, imageUrl?: string) => {
    if ((!content.trim() && !imageUrl) || !activeChannelId || !user) return;
    const dedupKey = `${content}|${imageUrl ?? ''}|${Date.now()}`;
    if (sentIds.current.has(dedupKey)) return;
    sentIds.current.add(dedupKey);
    setTimeout(() => sentIds.current.delete(dedupKey), 3000);

    const currentReply = replyTo;
    setReplyTo(null);

    // Optimistic: add message to UI instantly
    const optimisticMsg: Message = {
      id: `optimistic-${Date.now()}`,
      content: content.trim(),
      authorId: user.id,
      authorName: user.name || user.email,
      authorImage: user.image ?? null,
      replyToId: currentReply?.id ?? null,
      replyPreview: currentReply ? currentReply.content.slice(0, 100) : null,
      replyAuthorName: currentReply?.authorName ?? null,
      imageUrl: imageUrl ?? null,
      sentAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      await sendMessage({
        channelId: activeChannelId,
        content: content.trim(),
        replyToId: currentReply?.id,
        replyPreview: currentReply ? currentReply.content.slice(0, 100) : undefined,
        replyAuthorName: currentReply?.authorName,
        imageUrl,
      });
      // Poll immediately to replace optimistic with real
      if (lastMsgTime.current) loadMessages(activeChannelId, lastMsgTime.current);
    } catch (err: unknown) {
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
      const msg = err instanceof Error ? err.message : 'Failed to send message';
      toast.error(msg);
    }
  }, [activeChannelId, replyTo, loadMessages, user]);

  const handleTyping = useCallback(() => {
    if (!activeChannelId) return;
    reportTyping({ channelId: activeChannelId }).catch(() => {});
  }, [activeChannelId]);

  const handleDm = useCallback(async (userId: string) => {
    try {
      const res = await createDm({ targetUserId: userId });
      await loadChannels();
      setActiveChannelId(res.channel.id);
      toast.success('DM started!');
    } catch { toast.error('Could not start DM'); }
  }, [loadChannels]);

  if (isLoading || !user) {
    return <div className="h-dvh flex items-center justify-center bg-background text-foreground">Loading...</div>;
  }

  const activeChannel = channels.find(c => c.id === activeChannelId);
  const currentUserName = user.name || user.email;

  return (
    <>
      <div className="h-dvh flex bg-background text-foreground overflow-hidden">
        <ChannelSidebar
          channels={channels}
          activeChannelId={activeChannelId}
          onSelectChannel={setActiveChannelId}
          onOpenSettings={() => setShowSettings(true)}
          onOpenGames={() => setShowGames(true)}
          onCreateRoom={() => setShowCreateRoom(true)}
          onDmSearch={() => setShowDmSearch(true)}
        />
        <ChatArea
          channel={activeChannel}
          messages={messages}
          currentUserId={user.id}
          currentUserName={currentUserName}
          onSend={handleSend}
          replyTo={replyTo}
          onReply={setReplyTo}
          onCancelReply={() => setReplyTo(null)}
          typingUsers={typingUsers}
          onTyping={handleTyping}
          isReadOnly={activeChannel?.readOnly ?? false}
        />
        <OnlineSidebar users={onlineUsers} onDm={handleDm} currentUserId={user.id} />
      </div>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showGames && <GamesWindow onClose={() => setShowGames(false)} />}
      {showCreateRoom && (
        <CreateRoomModal
          onClose={() => setShowCreateRoom(false)}
          onCreated={async () => { await loadChannels(); setShowCreateRoom(false); }}
        />
      )}
      {showDmSearch && (
        <DmSearchModal
          onClose={() => setShowDmSearch(false)}
          onDm={async (userId) => { await handleDm(userId); setShowDmSearch(false); }}
          currentUserId={user.id}
        />
      )}
      <Toaster />
    </>
  );
}
