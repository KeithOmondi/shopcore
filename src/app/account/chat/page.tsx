'use client';

import { useEffect, useRef, useState } from 'react';

import { FormError } from '@/components/AuthBits';
import type { Chat } from '@/lib/account';
import { ApiError, get, post } from '@/lib/client';
import { dateTime } from '@/lib/format';

const versionOf = (c: Chat | null) => c?.version ?? 'none';

/** Live chat with the support team. The page asks the server "anything new?" and the answer comes the moment there is. */
export default function ChatPage() {
  const [chat, setChat] = useState<Chat | null>(null);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const version = useRef('none');
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      let first = true;
      while (live) {
        try {
          const r = await get<{ chat: Chat | null }>(first ? 'support/chat' : `support/chat?v=${encodeURIComponent(version.current)}&wait=8`);
          if (!live) return;
          version.current = versionOf(r.chat);
          setChat(r.chat); setReady(true); setErr('');
          first = false;
        } catch (e) {
          if (!live) return;
          if (e instanceof ApiError && e.code === 'SIGNED_OUT') return;
          setErr('We lost the connection. Trying again…'); setReady(true);
          await new Promise((res) => setTimeout(res, 4000));
        }
      }
    })();
    return () => { live = false; };
  }, []);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [chat?.messages.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setBusy(true);
    try { const r = await post<{ chat: Chat | null }>('support/chat/messages', { text: t }); version.current = versionOf(r.chat); setChat(r.chat); setText(''); setErr(''); }
    catch (e2) { setErr(e2 instanceof ApiError ? e2.message : 'Couldn’t send your message'); } finally { setBusy(false); }
  };

  return (
    <div className="flex max-w-2xl flex-col gap-3">
      <div>
        <h1 className="text-2xl font-extrabold">Chat with us</h1>
        <p className="text-sm text-muted">{chat?.agent ? `You’re chatting with ${chat.agent}.` : 'Send a message and the next available person will reply.'}</p>
      </div>
      <div className="card flex h-[55vh] flex-col gap-3 overflow-y-auto p-4" role="log" aria-live="polite" aria-label="Conversation">
        {!ready && <div className="skeleton h-20" aria-busy="true" />}
        {ready && !chat?.messages.length && <p className="m-auto text-center text-sm text-muted">No messages yet. Say hello!</p>}
        {chat?.messages.map((m) => {
          const mine = m.from === 'customer';
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : ''}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${mine ? 'bg-brand text-white' : 'bg-soft text-ink'}`}>
                {!mine && <p className="text-xs font-bold text-muted">{m.by || 'ShopCore'}</p>}
                <p className="whitespace-pre-line">{m.text}</p>
                <p className={`mt-0.5 text-[11px] ${mine ? 'text-white/75' : 'text-muted'}`}>{dateTime(m.at)}</p>
              </div>
            </div>
          );
        })}
        <div ref={end} />
      </div>
      <FormError message={err} />
      <form onSubmit={send} className="flex gap-2">
        <label htmlFor="chat-text" className="sr-only">Your message</label>
        <input id="chat-text" className="input flex-1" maxLength={2000} placeholder="Type your message" value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" />
        <button className="btn btn-primary" disabled={busy || !text.trim()}>Send</button>
      </form>
    </div>
  );
}
