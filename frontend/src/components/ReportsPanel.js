import React, { useState } from 'react';
import { AGENT_MAP, AGENTS } from '../agents/config';

export default function ReportsPanel({ reports, selectedAgent, chatWithAgent }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsg, setChatMsg] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [activeAgent, setActiveAgent] = useState(null);

  const allReports = [];
  Object.entries(reports).forEach(([agentId, reps]) => {
    reps.forEach(rep => allReports.push({ agentId, ...rep }));
  });

  const filtered = selectedAgent
    ? allReports.filter(r => r.agentId === selectedAgent)
    : allReports.slice().reverse();

  const handleChat = async () => {
    if (!chatMsg.trim() || !activeAgent || chatLoading) return;
    const msg = chatMsg.trim();
    setChatMsg('');
    setChatHistory(h => [...h, { role: 'user', content: msg }]);
    setChatLoading(true);
    try {
      const context = (reports[activeAgent] || []).map(r => r.body).join('\n\n').slice(0, 500);
      const resp = await chatWithAgent(activeAgent, msg, context);
      setChatHistory(h => [...h, { role: 'agent', content: resp }]);
    } catch {
      setChatHistory(h => [...h, { role: 'agent', content: '⚠ Error reaching agent.' }]);
    }
    setChatLoading(false);
  };

  const s = {
    wrap: { display: 'flex', flexDirection: 'column', height: '100%' },
    header: { padding: '8px 16px 6px', borderBottom: '1px solid #1a1a1a', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    label: { fontSize: 10, color: '#555', letterSpacing: '.1em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' },
    chatBtn: { fontSize: 10, padding: '3px 10px', background: '#161616', border: '1px solid #2a2a2a', borderRadius: 6, color: '#888', cursor: 'pointer' },
    scroll: { flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 10 },
    empty: { padding: '40px 20px', textAlign: 'center', color: '#333', fontSize: 11, fontFamily: 'var(--font-mono)' },
    card: { background: '#111', border: '1px solid #1e1e1e', borderRadius: 8, overflow: 'hidden' },
    cardHead: (agentId) => ({
      padding: '8px 12px', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', gap: 8,
      background: (AGENT_MAP[agentId]?.color || '#333') + '11',
    }),
    agentTag: (agentId) => ({
      fontSize: 10, padding: '1px 7px', borderRadius: 3, fontFamily: 'var(--font-mono)',
      background: (AGENT_MAP[agentId]?.color || '#333') + '25',
      color: AGENT_MAP[agentId]?.color || '#888',
    }),
    cardTitle: { fontSize: 11, fontWeight: 500, color: '#bbb' },
    cardBody: { padding: '10px 12px', fontSize: 11, color: '#888', lineHeight: 1.7, whiteSpace: 'pre-wrap', maxHeight: 280, overflowY: 'auto' },
    chatWrap: { borderTop: '1px solid #1e1e1e', flexShrink: 0, padding: 12 },
    agentSelect: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 },
    agentChip: (id, sel) => ({
      fontSize: 10, padding: '2px 8px', borderRadius: 4, cursor: 'pointer',
      background: sel ? (AGENT_MAP[id]?.color || '#333') + '30' : '#161616',
      border: `1px solid ${sel ? (AGENT_MAP[id]?.color || '#333') : '#222'}`,
      color: sel ? (AGENT_MAP[id]?.color || '#888') : '#555',
    }),
    chatRow: { display: 'flex', gap: 8 },
    chatInput: { flex: 1, background: '#141414', border: '1px solid #2a2a2a', borderRadius: 6, padding: '7px 10px', fontSize: 11, color: '#e8e5de' },
    sendBtn: { padding: '7px 14px', background: '#EF9F27', color: '#1a0e00', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' },
    chatHistory: { marginBottom: 8, maxHeight: 140, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 },
    chatMsg: (role) => ({ fontSize: 11, padding: '6px 10px', borderRadius: 6, lineHeight: 1.5,
      background: role === 'user' ? '#1a1200' : '#111',
      color: role === 'user' ? '#EF9F27' : '#888',
      borderLeft: `2px solid ${role === 'user' ? '#3a2800' : '#1e1e1e'}`,
    }),
  };

  const agentsWithReports = AGENTS.filter(a => reports[a.id]?.length > 0);

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div style={s.label}>Reports{filtered.length > 0 ? ` · ${filtered.length}` : ''}</div>
        <button style={s.chatBtn} onClick={() => setChatOpen(o => !o)}>
          {chatOpen ? '↑ Hide Chat' : '↓ Chat with Agent'}
        </button>
      </div>
      <div style={s.scroll}>
        {filtered.length === 0 ? (
          <div style={s.empty}>Reports appear as agents complete tasks.</div>
        ) : (
          filtered.map((r, i) => (
            <div key={i} style={s.card}>
              <div style={s.cardHead(r.agentId)}>
                <span style={s.agentTag(r.agentId)}>{r.agentId.toUpperCase()}</span>
                <span style={s.cardTitle}>{r.title}</span>
              </div>
              <div style={s.cardBody}>{r.body}</div>
            </div>
          ))
        )}
      </div>
      {chatOpen && (
        <div style={s.chatWrap}>
          <div style={{ fontSize: 10, color: '#555', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>CHAT WITH AGENT</div>
          <div style={s.agentSelect}>
            {agentsWithReports.map(a => (
              <button key={a.id} style={s.agentChip(a.id, activeAgent === a.id)} onClick={() => setActiveAgent(a.id)}>
                {a.name}
              </button>
            ))}
          </div>
          {chatHistory.length > 0 && (
            <div style={s.chatHistory}>
              {chatHistory.map((m, i) => (
                <div key={i} style={s.chatMsg(m.role)}>{m.content}</div>
              ))}
              {chatLoading && <div style={{ fontSize: 10, color: '#555', fontFamily: 'var(--font-mono)' }}>Agent thinking…</div>}
            </div>
          )}
          <div style={s.chatRow}>
            <input
              style={s.chatInput}
              value={chatMsg}
              onChange={e => setChatMsg(e.target.value)}
              placeholder={activeAgent ? `Ask ${AGENT_MAP[activeAgent]?.name}...` : 'Select an agent above first'}
              onKeyDown={e => e.key === 'Enter' && handleChat()}
              disabled={!activeAgent}
            />
            <button style={s.sendBtn} onClick={handleChat} disabled={!activeAgent || chatLoading}>↗</button>
          </div>
        </div>
      )}
    </div>
  );
}
