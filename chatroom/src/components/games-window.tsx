import { useState, useRef } from 'react';

export function GamesWindow({ onClose }: { onClose: () => void }) {
  const [maximized, setMaximized] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #0d0d14; overflow: hidden; }
        #games { width: 100%; height: 100vh; }
      </style>
    </head>
    <body>
      <div id="games"></div>
      <script src="https://cdn.jsdelivr.net/gh/luminsdk/script@latest/lumin.min.js"><\/script>
      <script>
        Lumin.init({ container: '#games', theme: 'dark' });
      <\/script>
    </body>
    </html>
  `;

  return (
    <div className={`fixed z-50 ${maximized ? 'inset-0' : 'inset-4 md:inset-12 lg:inset-20'} flex flex-col bg-card border border-border rounded-xl overflow-hidden shadow-2xl transition-all`}>
      {/* Title bar */}
      <div className="h-10 flex items-center justify-between px-3 bg-secondary border-b border-border shrink-0">
        <span className="text-sm font-semibold text-foreground">🎮 Games</span>
        <div className="flex items-center gap-2 group/btns">
          <button onClick={onClose} className="w-3.5 h-3.5 rounded-full bg-[#ff5f57] hover:brightness-90 transition-all flex items-center justify-center" title="Close">
            <i className="fa-solid fa-xmark text-[8px] text-black/80 opacity-0 group-hover/btns:opacity-100 transition-opacity" />
          </button>
          <button onClick={() => setMaximized(false)} className="w-3.5 h-3.5 rounded-full bg-[#febc2e] hover:brightness-90 transition-all flex items-center justify-center" title="Minimize">
            <i className="fa-solid fa-minus text-[8px] text-black/80 opacity-0 group-hover/btns:opacity-100 transition-opacity" />
          </button>
          <button onClick={() => setMaximized(!maximized)} className="w-3.5 h-3.5 rounded-full bg-[#28c840] hover:brightness-90 transition-all flex items-center justify-center" title="Maximize">
            <i className="fa-solid fa-expand text-[7px] text-black/80 opacity-0 group-hover/btns:opacity-100 transition-opacity" />
          </button>
        </div>
      </div>
      <iframe
        ref={iframeRef}
        srcDoc={htmlContent}
        className="flex-1 w-full border-0"
        sandbox="allow-scripts allow-same-origin"
        title="Games"
      />
    </div>
  );
}
