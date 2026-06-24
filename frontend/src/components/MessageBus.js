import React, { useEffect, useRef } from 'react';
import { AGENT_MAP } from '../agents/config';

const TYPE_COLORS = {
  task:   '#378ADD',
  result: '#1D9E75',
  query:  '#BA7517',
  alert:  '#D85A30',
  log:    '#555',
};

const TYPE_ICONS = {
  task:   '→',
  result: '✓',
  query:  '?',
  alert:  '⚠',
  log:    '·',
};

export default function MessageBus({ messages }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const s = {
    wrap: { display: 'flex', flexDirection: 'column', height: '100%' },
    header: { padding: '8px 16px 6px', borderBottom: '1px solid #1a1a1a', flexShrink: 0 },
    label: { fontSize: 10, color: '#555', letterSpacing: '.1em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' },
    scroll: { flex: 1, overflowY: 'auto', padding: '6px 0' },
    empty: { padding: '40px 20px', textAlign: 'center', color: '#333', fontSize: 11, fontFamily: 'var(--font-mono)' },
    msg: { display: 'flex', gap: 10, padding: '4px 16px', fontSize: 11, alignItems: 'flex-start', borderBottom: '1px solid #111', transition: 'background .1s' },
    time: { color: '#333', fontFamily: 'var(--font-mono)', minWidth: 56, fontSize: 10, paddingTop: 2, flexShrink: 0 },
    from: (agentId) => ({
      fontSize: 10, padding: '1px 6px', borderRadius: 3, flexShrink: 0, marginTop: 1,
      background: (AGENT_MAP[agentId]?.color || '#444') + '22',
      color: AGENT_MAP[agentId]?.color || '#888',
      fontFamily: 'var(--font-mono)',
    }),
    arrow: (type) => ({ color: TYPE_COLORS[type] || '#444', fontSize: 10, flexShrink: 0, paddingTop: 2 }),
    to: { fontSize: 10, color: '#444', fontFamily: 'var(--font-mono)', flexShrink: 0, paddingTop: 2 },
    content: { color: '#888', lineHeight: 1.5, flex: 1 },
  };

  const fmt = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  };

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div style={s.label}>Inter-agent communication bus · {messages.length} messages</div>
      </div>
      <div style={s.scroll}>
        {messages.length === 0 ? (
          <div style={s.empty}>No messages. Launch a mission to begin.</div>
        ) : (
          messages.map((msg, i) => (
            <div key={msg.id || i} style={s.msg}>
              <span style={s.time}>{fmt(msg.ts || msg.timestamp * 1000)}</span>
              <span style={s.from(msg.sender)}>{msg.sender}</span>
              <span style={s.arrow(msg.type)}>{TYPE_ICONS[msg.type] || '·'}</span>
              <span style={s.to}>{msg.receiver}</span>
              <span style={s.content}>{msg.content}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
