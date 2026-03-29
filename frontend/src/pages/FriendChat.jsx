import React, { useState, useRef, useEffect } from 'react';

const QUICK_MOODS = [
  { emoji: '😔', label: 'Feeling sad', message: "I'm feeling really sad today and I don't know why." },
  { emoji: '😰', label: 'Stressed out', message: "I'm super stressed and overwhelmed right now." },
  { emoji: '😤', label: 'Feeling angry', message: "I'm feeling really angry and frustrated about something." },
  { emoji: '😴', label: 'Exhausted', message: "I'm mentally and physically exhausted. I have no energy left." },
  { emoji: '😟', label: 'Anxious', message: "I'm feeling very anxious and can't calm my mind." },
  { emoji: '🤗', label: 'Just want to talk', message: "Hey Medi! I just want someone to talk to right now." },
];

const WELCOME_MESSAGE = `Hey there! I'm Medi 👋, your friendly companion here on Medicure.

I'm not a doctor or a therapist — I'm just a friend who genuinely cares about how you're feeling. 💙

Feeling stressed, sad, overwhelmed, or just need someone to talk to? I'm all ears. Tell me what's on your mind.`;

export default function FriendChat({ addToast }) {
  const [messages, setMessages] = useState([
    { role: 'model', text: WELCOME_MESSAGE }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const userMsg = { role: 'user', text: text.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText('');
    setIsTyping(true);

    // Build history (exclude the initial welcome message which was from model, not real history)
    const historyForApi = updatedMessages
      .slice(1) // skip the static welcome message
      .slice(0, -1) // exclude last user message (that's the current message, not history)
      .map(m => ({ role: m.role, text: m.text }));

    try {
      const res = await fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/friend-chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), history: historyForApi })
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(prev => [...prev, { role: 'model', text: data.reply }]);
      } else {
        addToast('Something went wrong. Try again!', 'error');
      }
    } catch {
      addToast('Could not reach the server.', 'error');
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputText);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)' }}>
      {/* Header */}
      <div className="page-header" style={{ paddingBottom: '16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #a855f7, #ec4899)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', boxShadow: '0 0 20px rgba(168,85,247,0.4)',
            flexShrink: 0
          }}>💜</div>
          <div>
            <h1 style={{ margin: 0 }}>Friend Chat</h1>
            <p style={{ margin: 0, marginTop: '2px', color: 'var(--text-muted)', fontSize: '14px' }}>
              Medi · Your caring AI companion · Always here for you 🌿
            </p>
          </div>
        </div>
      </div>

      {/* Quick Mood Buttons */}
      <div style={{
        display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px', flexShrink: 0
      }}>
        {QUICK_MOODS.map((mood, i) => (
          <button key={i}
            onClick={() => sendMessage(mood.message)}
            disabled={isTyping}
            style={{
              background: 'rgba(168,85,247,0.08)',
              border: '1px solid rgba(168,85,247,0.25)',
              borderRadius: '20px',
              padding: '6px 14px',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '5px'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(168,85,247,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(168,85,247,0.08)'}
          >
            {mood.emoji} {mood.label}
          </button>
        ))}
      </div>

      {/* Chat Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '20px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.05)',
        marginBottom: '16px',
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            alignItems: 'flex-end',
            gap: '10px',
            animation: 'fadeIn 0.3s ease'
          }}>
            {/* AI Avatar */}
            {msg.role === 'model' && (
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
              }}>💜</div>
            )}

            {/* Message Bubble */}
            <div style={{
              maxWidth: '70%',
              padding: '12px 16px',
              borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, rgba(139,92,246,0.6), rgba(236,72,153,0.4))'
                : 'rgba(255,255,255,0.06)',
              border: msg.role === 'user'
                ? '1px solid rgba(139,92,246,0.3)'
                : '1px solid rgba(255,255,255,0.08)',
              fontSize: '14px',
              lineHeight: '1.6',
              color: 'var(--text-primary)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {msg.text}
            </div>

            {/* User Avatar */}
            {msg.role === 'user' && (
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
              }}>😊</div>
            )}
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
            }}>💜</div>
            <div style={{
              padding: '12px 18px',
              borderRadius: '18px 18px 18px 4px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', gap: '5px', alignItems: 'center'
            }}>
              {[0, 1, 2].map(j => (
                <div key={j} style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: 'rgba(168,85,247,0.8)',
                  animation: `typingBounce 1.2s ease-in-out ${j * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        gap: '10px',
        alignItems: 'flex-end',
        padding: '16px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.07)',
      }}>
        <textarea
          ref={inputRef}
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Share how you're feeling... I'm here to listen 💙"
          disabled={isTyping}
          rows={1}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: '14px',
            resize: 'none',
            lineHeight: '1.5',
            fontFamily: 'inherit',
            maxHeight: '100px',
            overflowY: 'auto',
          }}
          onInput={e => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
          }}
        />
        <button
          onClick={() => sendMessage(inputText)}
          disabled={isTyping || !inputText.trim()}
          style={{
            width: '44px', height: '44px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #a855f7, #ec4899)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px',
            flexShrink: 0,
            opacity: isTyping || !inputText.trim() ? 0.5 : 1,
            transition: 'opacity 0.2s, transform 0.1s',
          }}
          onMouseEnter={e => { if (!isTyping && inputText.trim()) e.currentTarget.style.transform = 'scale(1.08)'; }}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          ➤
        </button>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes typingBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
