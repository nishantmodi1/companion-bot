import React, { useState, useRef, useEffect, useCallback, type KeyboardEvent, type ChangeEvent } from 'react';
import { useNavigate, useParams, useLocation, Navigate } from 'react-router-dom';
import type { Message, HistoryEntry } from '../types/types';
import { getRoleById } from '../role/roles';
import { sendMessage, appendHistory } from '../services/api';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import PageLayout from './PageLayout';

interface LocationState { userName?: string; roleId?: string; }

const RATE_LIMIT_MS = 3000;
const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const QUICK_REPLIES: Record<string, string[]> = {
  Partner:      ['Miss you 💕', 'How are you?', 'Good morning! ☀️', 'Thinking of you 💭'],
  Family:       ['I\'m okay 😊', 'Love you ❤️', 'Need to talk 💬', 'How are you?'],
  Social:       ['What\'s up?! 😄', 'Long time no see!', 'We need to meet 🤝', 'Spill the tea ☕'],
  Professional: ['Need advice 💡', 'Feeling stuck', 'Got a win! 🎉', 'What should I do?'],
  Wellness:     ['Not feeling great', 'Need to vent', 'Had a good day!', 'Anxious lately 😟'],
};

const ChatScreen: React.FC = () => {
  const navigate  = useNavigate();
  const { id }    = useParams<{ id: string }>();
  const location  = useLocation();
  const state     = (location.state ?? {}) as LocationState;
  const role      = getRoleById(id ?? '');
  const userName  = state.userName ?? '';

  if (!role || !userName) return <Navigate to="/" replace />;

  const [messages,     setMessages]     = useState<Message[]>([{
    id: uid(), role: 'assistant', content: role.greeting(userName), time: now(),
  }]);
  const [input,        setInput]        = useState('');
  const [busy,         setBusy]         = useState(false);
  const [showProfile,  setShowProfile]  = useState(false);
  const [showMenu,     setShowMenu]     = useState(false);
  const [showClear,    setShowClear]    = useState(false);
  const [showScrollBtn,setShowScrollBtn]= useState(false);

  const bottomRef  = useRef<HTMLDivElement>(null);
  const textaRef   = useRef<HTMLTextAreaElement>(null);
  const scrollRef  = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HistoryEntry[]>([]);
  const lastSent   = useRef(0);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, busy]);
  useEffect(() => { textaRef.current?.focus(); }, []);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 200);
  }, []);

  const push = (r: Message['role'], content: string) =>
    setMessages(p => [...p, { id: uid(), role: r, content, time: now() }]);

  const send = useCallback(async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || busy) return;
    if (Date.now() - lastSent.current < RATE_LIMIT_MS) return;
    lastSent.current = Date.now();

    if (!textOverride) {
      setInput('');
      if (textaRef.current) textaRef.current.style.height = 'auto';
    }
    push('user', text);
    setBusy(true);

    try {
      const res = await sendMessage(role, userName, historyRef.current, text);
      if (res.isRateLimit)  push('assistant', '⏳ Ek second ruko jaan... 💕');
      else if (res.error)   push('assistant', `Kuch gadbad ho gayi 😅\n${res.error}`);
      else if (res.reply) {
        historyRef.current = appendHistory(historyRef.current, text, res.reply);
        push('assistant', res.reply);
      }
    } catch {
      push('assistant', '😔 Network issue. Please try again.');
    } finally {
      setBusy(false);
    }
  }, [input, busy, role, userName]);

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); }
  };
  const autoResize = (e: ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
  };

  const exportChat = () => {
    const txt = messages.map(m => `[${m.time}] ${m.role === 'user' ? userName : role.label}: ${m.content}`).join('\n\n');
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([txt], { type: 'text/plain' })),
      download: `chat-${role.label}-${Date.now()}.txt`,
    });
    a.click();
    setShowMenu(false);
  };

  const clearChat = () => {
    setMessages([{ id: uid(), role: 'assistant', content: role.greeting(userName), time: now() }]);
    historyRef.current = [];
    setShowClear(false);
  };

  const canSend     = input.trim().length > 0 && !busy;
  const userMsgs    = messages.filter(m => m.role === 'user').length;
  const quickReplies = QUICK_REPLIES[role.category] ?? [];

  return (
    <PageLayout>
      <div className="flex flex-col" style={{ height: '99dvh', }}>

        {/* ══ HEADER ══ */}
        <header className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 sticky top-0 z-20"
          style={{
            background: `linear-gradient(135deg,${role.g1}ee,${role.g2}cc)`,
            borderBottom: `1px solid ${role.color}40`,
            boxShadow: `0 1px 0 rgba(255,255,255,0.12) inset, 0 6px 36px ${role.color}45`,
          }}>

          {/* Back */}
          <button
            className="press flex items-center justify-center rounded-xl"
            style={{ width:38, height:38, background:'rgba(0,0,0,0.24)', border:'1px solid rgba(255,255,255,0.18)', cursor:'pointer' }}
            onClick={() => navigate('/')}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="white" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Avatar */}
          <button className="relative border-none bg-transparent cursor-pointer"
            onClick={() => setShowProfile(true)}>
            <div className="anim-beat flex items-center justify-center rounded-2xl"
              style={{
                width:44, height:44, fontSize:22,
                background:'rgba(0,0,0,0.24)',
                border:'2px solid rgba(255,255,255,0.5)',
                boxShadow:'inset 0 1px 0 rgba(255,255,255,0.22)',
              }}>{role.emoji}</div>
            <span className="anim-ring absolute rounded-full bg-emerald-400 block"
              style={{ width:13, height:13, bottom:-1, right:-1, border:'2.5px solid #07071a' }} />
          </button>

          {/* Name + status */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold leading-tight truncate"
              style={{ fontSize: 'clamp(13px, 3.5vw, 15px)', fontFamily:"'Playfair Display',Georgia,serif", textShadow:'0 1px 8px rgba(0,0,0,0.4)' }}>
              {role.label}
            </p>
            <p className="flex items-center gap-1.5 mt-0.5" style={{ fontSize: 'clamp(10px, 2.5vw, 11px)', color:'rgba(255,255,255,0.65)' }}>
              <span className="rounded-full bg-emerald-400" style={{ width:6, height:6, display:'block' }} />
              {busy ? <span style={{ fontStyle:'italic' }}>typing…</span> : <span>Online · {userName}</span>}
            </p>
          </div>

          {/* Menu button */}
          <div className="relative">
            <button
              className="press flex items-center justify-center rounded-xl"
              style={{ width:38, height:38, background:'rgba(0,0,0,0.24)', border:'1px solid rgba(255,255,255,0.16)', cursor:'pointer' }}
              onClick={() => setShowMenu(v => !v)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="5"  r="1.5" fill="white"/>
                <circle cx="12" cy="12" r="1.5" fill="white"/>
                <circle cx="12" cy="19" r="1.5" fill="white"/>
              </svg>
            </button>

            {showMenu && (
              <div className="anim-fade-up absolute right-0 top-12 overflow-hidden z-50 rounded-2xl"
                style={{
                  minWidth:180, background:'#0f0f26',
                  border:'1px solid rgba(255,255,255,0.1)',
                  boxShadow:'0 20px 60px rgba(0,0,0,0.65)',
                }}>
                {[
                  { icon:'📋', label:'Export Chat', action: exportChat },
                  { icon:'🗑️', label:'Clear Chat',  action: () => { setShowMenu(false); setShowClear(true); } },
                  { icon:'👤', label:'Profile',      action: () => { setShowMenu(false); setShowProfile(true); } },
                ].map(item => (
                  <button key={item.label} onClick={item.action}
                    className="w-full flex items-center gap-3 border-none text-left font-medium"
                    style={{
                      padding:'13px 18px', fontSize:13, cursor:'pointer',
                      background:'transparent', color:'rgba(255,255,255,0.78)',
                      transition:'background 0.15s ease',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background='rgba(255,255,255,0.06)')}
                    onMouseLeave={e => (e.currentTarget.style.background='transparent')}
                  >
                    <span style={{ fontSize:16 }}>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* ══ MESSAGES ══ */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto"
          onScroll={handleScroll}
          onClick={() => { if (showMenu) setShowMenu(false); }}
        >
          <div className="w-full px-3 sm:px-4 md:px-6 pt-5 pb-2 flex flex-col gap-3">

            {/* Date chip */}
            <div className="flex items-center justify-center mb-2">
              <span className="px-4 py-1.5 rounded-full font-medium"
                style={{ fontSize:11, background:'rgba(255,255,255,0.055)', color:'rgba(255,255,255,0.3)', border:'1px solid rgba(255,255,255,0.07)' }}>
                {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' })}
              </span>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-1">
              <div className="flex-1" style={{ height:1, background:'rgba(255,255,255,0.05)' }} />
              <span className="font-semibold px-3 py-1 rounded-full"
                style={{ fontSize:11, background:`${role.color}18`, color:`${role.color}cc`, border:`1px solid ${role.color}25` }}>
                {role.emoji} Chat started
              </span>
              <div className="flex-1" style={{ height:1, background:'rgba(255,255,255,0.05)' }} />
            </div>

            {/* Messages */}
            {messages.map(m => (
              <MessageBubble key={m.id} message={m} role={role} userName={userName} />
            ))}
            {busy && <TypingIndicator role={role} />}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* ══ SCROLL TO BOTTOM ══ */}
        {showScrollBtn && (
          <button className="press anim-fade-up absolute rounded-full flex items-center justify-center z-20"
            style={{
              width: 'clamp(38px, 8vw, 42px)',
              height: 'clamp(38px, 8vw, 42px)',
              bottom: 'clamp(120px, 25vh, 160px)',
              right: 'clamp(12px, 4vw, 20px)',
              border:'none', cursor:'pointer',
              background:role.color, boxShadow:`0 4px 20px ${role.color}65`,
            }}
            onClick={() => bottomRef.current?.scrollIntoView({ behavior:'smooth' })}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M12 19l-7-7M12 19l7-7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}

        {/* ══ QUICK REPLIES ══ */}
        {userMsgs === 0 && quickReplies.length > 0 && (
          <div className="px-4 pb-2 max-w-4xl mx-auto w-full">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 justify-start sm:justify-center">
              {quickReplies.map(qr => (
                <button key={qr} onClick={() => void send(qr)}
                  className="rounded-2xl font-semibold"
                  style={{
                    padding: 'clamp(6px, 2.5vw, 7px) clamp(10px, 3.5vw, 14px)',
            fontSize: 'clamp(11px, 3vw, 12px)', cursor:'pointer',
                    background:`${role.color}18`, color:role.color,
                    border:`1px solid ${role.color}35`, whiteSpace:'nowrap',
                    transition:'transform 0.18s ease, background 0.18s ease',
                  }}
                  onMouseEnter={e => { (e.currentTarget.style.background=`${role.color}28`); e.currentTarget.style.transform='translateY(-2px)'; }}
                  onMouseLeave={e => { (e.currentTarget.style.background=`${role.color}18`); e.currentTarget.style.transform='none'; }}
                >{qr}</button>
              ))}
            </div>
          </div>
        )}

        {/* ══ INPUT BAR ══ */}
        <footer className="px-4 pt-3 pb-6"
          style={{
            background:'rgba(7,7,26,0.96)',
            backdropFilter:'blur(28px)',
            borderTop:'1px solid rgba(255,255,255,0.07)',
            boxShadow:'0 -12px 48px rgba(0,0,0,0.5)',
          }}>
          <div className="max-w-5xl mx-auto flex gap-2.5 items-end">
            {/* Textarea wrapper */}
            <div className="flex-1 flex items-end rounded-2xl"
              style={{
                background:'rgba(255,255,255,0.065)',
                border:`1.5px solid ${input ? role.color + '80' : 'rgba(255,255,255,0.1)'}`,
                boxShadow: input ? `0 0 0 3px ${role.color}14, inset 0 1px 0 rgba(255,255,255,0.06)` : 'none',
                transition:'border-color 0.2s ease, box-shadow 0.2s ease',
              }}>
              <textarea
                ref={textaRef}
                value={input}
                rows={1}
                onChange={e => { setInput(e.target.value); autoResize(e); }}
                onKeyDown={handleKey}
                placeholder={`Message ${role.label}…`}
                className="flex-1 bg-transparent border-none outline-none text-sm leading-relaxed px-4 py-3"
                style={{
                  maxHeight:140, color:'rgba(255,255,255,0.92)',
                  caretColor:role.color, resize:'none',
                }}
              />
            </div>

            {/* Send button */}
            <button
              className="press flex items-center justify-center rounded-full"
              onClick={() => void send()}
              disabled={!canSend}
              style={{
                width:44, height:44, border:'none', cursor: canSend ? 'pointer' : 'not-allowed',
                background: canSend ? `linear-gradient(135deg,${role.g1},${role.g2})` : 'rgba(255,255,255,0.07)',
                boxShadow: canSend ? `0 4px 22px ${role.color}60, inset 0 1px 0 rgba(255,255,255,0.22)` : 'none',
                outline: canSend ? `1px solid ${role.color}55` : '1px solid rgba(255,255,255,0.08)',
                transition:'all 0.2s ease',
              }}
            >
              {busy ? (
                <div style={{
                  width:16, height:16, borderRadius:'50%',
                  border:'2px solid rgba(255,255,255,0.3)',
                  borderTopColor:'white',
                  animation:'spin 0.7s linear infinite',
                }} />
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13" stroke={canSend?'#fff':'rgba(255,255,255,0.22)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke={canSend?'#fff':'rgba(255,255,255,0.22)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
          <p className="text-center mt-2 max-w-2xl mx-auto" style={{ fontSize:10, color:'rgba(255,255,255,0.1)' }}>
            Enter to send · Shift+Enter for new line
          </p>
        </footer>
      </div>

      {/* ══ PROFILE SHEET ── CENTERED */}
      {showProfile && (
        <div className="anim-backdrop fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
          style={{ background:'rgba(0,0,0,0.85)', backdropFilter:'blur(12px)' }}
          onClick={() => setShowProfile(false)}>
          <div className="anim-slide-up rounded-3xl p-4 sm:p-6 w-full max-h-[90vh] overflow-y-auto"
            style={{
              maxWidth: 'min(420px, 90vw)',
              background:'linear-gradient(135deg, #0d0d22 0%, #0a0a1a 100%)',
              border:`1px solid ${role.color}40`,
              boxShadow:`0 40px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05), 0 8px 30px ${role.color}30`,
            }}
            onClick={e => e.stopPropagation()}>

            {/* Close button */}
            <button 
              className="absolute rounded-full flex items-center justify-center"
              style={{ top:16, right:16, width:32, height:32, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer' }}
              onClick={() => setShowProfile(false)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>

            {/* Avatar + name */}
            <div className="flex flex-col items-center gap-3 mb-6">
              <div className="anim-beat flex items-center justify-center rounded-3xl"
                style={{
                  width:88, height:88, fontSize:44,
                  background:`linear-gradient(135deg,${role.g1},${role.g2})`,
                  boxShadow:`0 0 0 2px rgba(255,255,255,0.2) inset, 0 0 0 4px rgba(255,255,255,0.05), 0 12px 40px ${role.color}60`,
                }}>{role.emoji}</div>
              <div className="text-center">
                <h2 className="text-white font-bold" style={{ fontSize:22, fontFamily:"'Playfair Display',serif", letterSpacing:'-0.3px' }}>{role.label}</h2>
                <p style={{ fontSize:13, color:'rgba(255,255,255,0.45)', marginTop:6 }}>{role.tagline}</p>
              </div>
              <div className="flex items-center gap-2 rounded-full font-semibold"
                style={{ padding:'6px 14px', fontSize:11, background:`${role.color}18`, color:role.color, border:`1px solid ${role.color}30` }}>
                <span className="rounded-full bg-emerald-400 block animate-pulse" style={{ width:7, height:7 }} />
                Active now
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 mb-5">
              {[
                { icon:'💬', val:String(messages.length), lbl:'Messages' },
                { icon:'✍️', val:userMsgs > 0 ? String(userMsgs) : '—', lbl:'Sent' },
                { icon:'🏷️', val:role.category, lbl:'Type' },
              ].map(s => (
                <div key={s.lbl} className="text-center rounded-2xl sm:py-3"
                  style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ fontSize:24 }}>{s.icon}</div>
                  <div className="font-bold mt-1" style={{ fontSize:15, color:'rgba(255,255,255,0.9)' }}>{s.val}</div>
                  <div style={{ fontSize:10.5, color:'rgba(255,255,255,0.3)', marginTop:2 }}>{s.lbl}</div>
                </div>
              ))}
            </div>

            {/* Chatting as */}
            <div className="flex items-center gap-3 rounded-2xl p-3.5 mb-6"
              style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-center rounded-xl text-sm font-black text-white"
                style={{ width:42, height:42, background:`linear-gradient(135deg,${role.g1},${role.g2})`, boxShadow:`0 3px 12px ${role.color}50` }}>
                {userName.slice(0,2).toUpperCase()}
              </div>
              <div className="flex-1">
                <p style={{ fontSize:10.5, color:'rgba(255,255,255,0.3)', letterSpacing:'0.5px' }}>CHATTING AS</p>
                <p className="font-bold" style={{ fontSize:15, color:'rgba(255,255,255,0.92)' }}>{userName}</p>
              </div>
              <span className="rounded-full" style={{ fontSize:10, padding:'3px 10px', background:`${role.color}15`, color:role.color }}>Active</span>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button className="press flex-1 rounded-2xl font-semibold transition-all duration-200 order-2 sm:order-1"
                style={{
                  padding: 'clamp(12px, 3.5vw, 14px) 0',
            fontSize: 'clamp(13px, 3.5vw, 14px)', cursor:'pointer',
                  background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.55)',
                  border:'1px solid rgba(255,255,255,0.1)',
                }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.1)'; e.currentTarget.style.transform='translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.transform='none'; }}
                onClick={() => { setShowProfile(false); navigate('/'); }}>
                ← Change Role
              </button>
              <button className="press flex-1 rounded-2xl font-bold text-white transition-all duration-200 order-1 sm:order-2"
                style={{
                  padding: 'clamp(12px, 3.5vw, 14px) 0',
            fontSize: 'clamp(13px, 3.5vw, 14px)', cursor:'pointer', border:'none',
                  background:`linear-gradient(135deg,${role.g1},${role.g2})`,
                  boxShadow:`0 6px 20px ${role.color}55, inset 0 1px 0 rgba(255,255,255,0.2)`,
                }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 12px 28px ${role.color}70, inset 0 1px 0 rgba(255,255,255,0.25)`; }}
                onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow=`0 6px 20px ${role.color}55, inset 0 1px 0 rgba(255,255,255,0.2)`; }}
                onClick={() => setShowProfile(false)}>
                Continue Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ CLEAR CHAT MODAL ══ */}
      {showClear && (
        <div className="anim-backdrop absolute inset-0 z-50 flex items-center justify-center px-6"
          style={{ background:'rgba(0,0,0,0.78)', backdropFilter:'blur(8px)' }}
          onClick={() => setShowClear(false)}>
          <div className="anim-fade-up w-full rounded-3xl p-6"
            style={{
              maxWidth:360, background:'#0d0d22',
              border:'1px solid rgba(255,255,255,0.1)',
              boxShadow:'0 30px 80px rgba(0,0,0,0.8)',
            }}
            onClick={e => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div style={{ fontSize:44, marginBottom:12 }}>🗑️</div>
              <h3 className="text-white font-bold mb-2"
                style={{ fontSize:18, fontFamily:"'Playfair Display',serif" }}>Clear Chat?</h3>
              <p style={{ fontSize:14, color:'rgba(255,255,255,0.4)', lineHeight:1.6 }}>
                All messages will be removed and {role.label} will greet you fresh.
              </p>
            </div>
            <div className="flex gap-3">
              <button className="press flex-1 rounded-2xl font-semibold"
                style={{ padding:'13px 0', fontSize:14, cursor:'pointer', background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.5)', border:'1px solid rgba(255,255,255,0.09)' }}
                onClick={() => setShowClear(false)}>Cancel</button>
              <button className="press flex-1 rounded-2xl font-bold text-white"
                style={{ padding:'13px 0', fontSize:14, cursor:'pointer', border:'none', background:'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow:'0 4px 20px rgba(239,68,68,0.4)' }}
                onClick={clearChat}>Clear Chat</button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default ChatScreen;
