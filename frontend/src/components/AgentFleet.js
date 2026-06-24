import React from 'react';
import { AGENTS, STATUS_COLORS } from '../agents/config';

export default function AgentFleet({ statuses, onSelectAgent, selectedAgent }) {
  const s = {
    wrap: { padding: '12px 20px 10px', borderBottom: '1px solid #1e1e1e' },
    label: { fontSize: 10, color: '#555', letterSpacing: '.1em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 10 },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 6 },
    card: (status, selected) => ({
      background: selected ? '#1a1200' : status === 'active' ? '#131000' : status === 'done' ? '#091610' : '#111',
      border: `1px solid ${selected ? '#3a2800' : STATUS_COLORS[status] || '#1e1e1e'}`,
      borderRadius: 8, padding: '8px 10px', cursor: 'pointer', transition: 'all .2s',
      borderLeftWidth: status === 'active' ? 2 : 1,
    }),
    name: { fontSize: 11, fontWeight: 500, color: '#c8c5be', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    status: (s) => ({
      fontSize: 10, fontFamily: 'var(--font-mono)',
      color: STATUS_COLORS[s] || '#444',
      display: 'flex', alignItems: 'center', gap: 4,
    }),
    dot: (s) => ({
      width: 5, height: 5, borderRadius: '50%',
      background: STATUS_COLORS[s] || '#333',
      animation: s === 'active' ? 'pulse 1.4s infinite' : 'none',
    }),
  };

  return (
    <div style={s.wrap}>
      <div style={s.label}>Agent fleet — {Object.values(statuses).filter(v => v === 'active').length} active · {Object.values(statuses).filter(v => v === 'done').length} done</div>
      <div style={s.grid}>
        {AGENTS.map(agent => {
          const status = statuses[agent.id] || 'idle';
          const selected = selectedAgent === agent.id;
          return (
            <div
              key={agent.id}
              style={s.card(status, selected)}
              onClick={() => onSelectAgent(agent.id === selectedAgent ? null : agent.id)}
              title={agent.role}
            >
              <div style={s.name}>{agent.icon} {agent.name}</div>
              <div style={s.status(status)}>
                <div style={s.dot(status)} />
                {status === 'active' ? 'running' : status === 'done' ? 'done' : status === 'error' ? 'error' : 'idle'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
