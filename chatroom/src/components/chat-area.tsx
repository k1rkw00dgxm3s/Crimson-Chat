import { useState, useRef, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { useDebouncedCallback } from 'use-debounce';
import { useUpload } from 'zitejs/upload';
import { toast } from 'sonner';
import type { Message, Channel } from '../App';

// Turns URLs in text into clickable links
function Linkify({ text }: { text: string }) {
  const urlRegex = /(https?:\/\/[^\s<]+)/g;
  const parts = text.split(urlRegex);
  return (
    <>
      {parts.map((part, i) =>
        urlRegex.test(part) ? (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80 break-all">{part}</a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export function ChatArea({
  channel, messages, currentUserId, currentUserName, onSend,
  replyTo, onReply, onCancelReply, typingUsers, onTyping, isReadOnly,
}: {
  channel: Channel | undefined;
  messages: Message[];
  currentUserId: string;
  currentUserName: string;
  onSend: (content: string, imageUrl?: string) => Promise<void>;
  replyTo: Message | null;
  onReply: (msg: Message) => void;
  onCancelReply: () => void;
  typingUsers: string[];
  onTyping: () => void;
  isReadOnly: boolean;
}) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { upload, isUploading } = useUpload();
  const initialScrollDone = useRef(false);

  const debouncedTyping = useDebouncedCallback(onTyping, 2000, { leading: true, trailing: false });

  // Instant scroll to bottom on first load / channel switch
  useEffect(() => {
    initialScrollDone.current = false;
  }, [channel?.id]);

  useEffect(() => {
    if (messages.length === 0) return;
    if (!initialScrollDone.current) {
      // Instant jump on first load
      bottomRef.current?.scrollIntoView({ behavior: 'instant' as ScrollBehavior });
      initialScrollDone.current = true;
    } else {
      // Smooth scroll for new messages
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || sending) return;
    const text = input;
    setInput('');
    setSending(true);
    try {
      await onSend(text);
    } finally {
      setSending(false);
    }
  }, [input, sending, onSend]);

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Only images are allowed'); return; }
    try {
      const { url } = await upload(file);
      await onSend('', url);
    } catch { toast.error('Failed to upload image'); }
    e.target.value = '';
  };

  const filteredTyping = typingUsers.filter(n => n !== currentUserName);

  return (
    <main className="flex-1 flex flex-col min-w-0">
      <div className="h-12 flex items-center gap-2 px-4 border-b border-border bg-card shrink-0">
        <i className="fa-solid fa-hashtag text-muted-foreground" />
        <span className="font-semibold text-foreground">{channel?.name ?? 'General'}</span>
        {isReadOnly && <i className="fa-solid fa-lock text-xs text-muted-foreground" />}
      </div>

      {channel?.name === 'Rules' && messages.length === 0 && (
        <div className="flex-1 overflow-y-auto px-6 py-6"><RulesContent /></div>
      )}

      {(channel?.name !== 'Rules' || messages.length > 0) && (
        <div ref={scrollAreaRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5">
          {channel?.name === 'Rules' && <RulesContent />}
          {messages.map((msg, i) => {
            const prev = messages[i - 1];
            const showHeader = !prev || prev.authorId !== msg.authorId ||
              new Date(msg.sentAt).getTime() - new Date(prev.sentAt).getTime() > 300000;
            return <MessageBubble key={msg.id} msg={msg} showHeader={showHeader} onReply={() => onReply(msg)} />;
          })}
          <div ref={bottomRef} />
        </div>
      )}

      {filteredTyping.length > 0 && (
        <div className="px-4 py-1 text-xs text-muted-foreground animate-pulse">
          {filteredTyping.join(', ')} {filteredTyping.length === 1 ? 'is' : 'are'} typing...
        </div>
      )}

      {replyTo && !isReadOnly && (
        <div className="mx-4 px-3 py-2 bg-secondary rounded-t-lg flex items-center gap-2 text-sm">
          <i className="fa-solid fa-reply text-primary text-xs" />
          <span className="text-muted-foreground">Replying to</span>
          <span className="font-semibold text-primary">{replyTo.authorName}</span>
          <span className="text-muted-foreground truncate flex-1">{replyTo.content}</span>
          <button onClick={onCancelReply} className="text-muted-foreground hover:text-foreground"><i className="fa-solid fa-xmark" /></button>
        </div>
      )}

      {isReadOnly ? (
        <div className="px-4 pb-4 pt-2 shrink-0">
          <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-3 text-sm text-muted-foreground">
            <i className="fa-solid fa-lock text-xs" /> This channel is read-only
          </div>
        </div>
      ) : (
        <div className="px-4 pb-4 pt-2 shrink-0">
          <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2">
            <label className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
              <i className="fa-solid fa-image text-sm" />
              <input type="file" accept="image/*" className="hidden" onChange={handleImage} disabled={isUploading} />
            </label>
            <input
              type="text" value={input}
              onChange={e => { setInput(e.target.value); debouncedTyping(); }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
              placeholder={`Message #${channel?.name ?? 'General'}`}
              className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-sm"
            />
            <button onClick={handleSubmit} disabled={!input.trim() || sending}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40 transition-opacity">
              <i className="fa-solid fa-paper-plane text-xs" />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function RulesContent() {
  return (
    <div className="space-y-3 text-sm text-foreground/80 bg-secondary/30 rounded-lg p-4 border border-border">
      <h2 className="text-lg font-bold text-primary"><i className="fa-solid fa-scroll mr-2" />Server Rules</h2>
      <ol className="list-decimal list-inside space-y-2">
        <li><strong>Be respectful</strong> — No harassment, hate speech, or bullying.</li>
        <li><strong>No spam</strong> — Don't flood channels with repeated messages.</li>
        <li><strong>No NSFW content</strong> — Keep images and messages clean.</li>
        <li><strong>No self-promotion</strong> — Don't advertise without permission.</li>
        <li><strong>Stay on topic</strong> — Use the right channel for your messages.</li>
        <li><strong>No doxxing</strong> — Don't share personal information about others.</li>
        <li><strong>Listen to staff</strong> — Follow moderator instructions.</li>
        <li><strong>Have fun</strong> — This is a community. Be cool! 🎉</li>
      </ol>
    </div>
  );
}

function MessageBubble({ msg, showHeader, onReply }: { msg: Message; showHeader: boolean; onReply: () => void }) {
  const time = format(new Date(msg.sentAt), 'h:mm a');
  return (
    <div className="group relative flex gap-3 px-2 py-0.5 hover:bg-secondary/50 rounded transition-colors">
      {showHeader ? (
        <Avatar name={msg.authorName} image={msg.authorImage} />
      ) : (
        <div className="w-9 shrink-0 flex items-center justify-center">
          <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">{time}</span>
        </div>
      )}
      <div className="min-w-0 flex-1">
        {showHeader && (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-foreground">{msg.authorName}</span>
            {msg.authorName === 'Josh Boudreau' && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-primary/20 text-primary border border-primary/30">Owner</span>
            )}
            <span className="text-[11px] text-muted-foreground">{time}</span>
          </div>
        )}
        {msg.replyToId && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5 pl-1 border-l-2 border-primary/40">
            <span className="font-semibold text-primary/80">{msg.replyAuthorName}</span>
            <span className="truncate max-w-xs">{msg.replyPreview}</span>
          </div>
        )}
        {msg.content && <p className="text-sm text-foreground/90 break-words"><Linkify text={msg.content} /></p>}
        {msg.imageUrl && (
          <img src={msg.imageUrl} alt="shared" className="mt-1 max-w-xs max-h-64 rounded-lg border border-border object-cover" />
        )}
      </div>
      <div className="absolute right-2 -top-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onReply} className="p-1 rounded bg-card border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Reply">
          <i className="fa-solid fa-reply text-xs" />
        </button>
      </div>
    </div>
  );
}

function Avatar({ name, image }: { name: string; image: string | null }) {
  const colors = ['bg-purple-600', 'bg-blue-600', 'bg-green-600', 'bg-pink-600', 'bg-cyan-600', 'bg-red-600', 'bg-indigo-600', 'bg-violet-600'];
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
  return (
    <div className="shrink-0 mt-0.5">
      {image ? (
        <img src={image} alt={name} className="w-9 h-9 rounded-full object-cover" />
      ) : (
        <div className={`w-9 h-9 rounded-full ${colors[idx]} flex items-center justify-center text-white font-bold text-sm`}>
          {name.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}
