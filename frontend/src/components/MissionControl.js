import React, { useState } from 'react';
import { PHASES } from '../agents/config';

const PRESETS = [
  'Launch a profitable Shopify business in the fitness niche',
  'Start a dropshipping store selling pet accessories',
  'Build a print-on-demand brand for minimalist home decor',
  'Launch a supplement brand targeting busy professionals',
  'Create a beauty brand with eco-friendly products',
];

export default function MissionControl({ onLaunch, onReset, running, complete, currentPhase }) {
  const [goal, setGoal] = useState(PRESETS[0]);

  const s = {
    wrap: { padding: '14px 20px', borderBottom: '1px solid #1e1e1e', background: '#0d0d0d' },
    label: { fontSize: 10, color: '#555', letterSpacing: '.1em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 8 },
    row: { display: 'flex', gap: 8, marginBottom: 12 },
    input: {
      flex: 1, background: '#161616', border: '1px solid #2a2a2a', borderRadius: 8,
      padding: '9px 14px', fontSize: 13, color: '#e8e5de', fontFamily: 'var(--font-sans)',
      transition: 'border-color .15s',
    },
    btn: (variant) => ({
      padding: '9px 20px', borderRadius: 8, fontSize: 12, fontWeight: 600,
      cursor: running ? 'not-allowed' : 'pointer', transition: 'all .15s', whiteSpace: 'nowrap',
      background: variant === 'primary' ? '#EF9F27' : '#1a1a1a',
      color: variant === 'primary' ? '#1a0e00' : '#888',
      border: variant === 'primary' ? 'none' : '1px solid #2a2a2a',
      opacity: running && variant === 'primary' ? .5 : 1,
    }),
    presets: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
    preset: { fontSize: 10, padding: '3px 9px', background: '#141414', border: '1px solid #222', borderRadius: 20, color: '#666', cursor: 'pointer', transition: 'all .15s' },
    phases: { display: 'flex', gap: 4, alignItems: 'center' },
    phase: (active, done) => ({
      fontSize: 10, padding: '3px 10px', borderRadius: 20, fontFamily: 'var(--font-mono)',
      background: done ? '#0a1f14' : active ? '#1a1200' : '#111',
      color: done ? '#1D9E75' : active ? '#EF9F27' : '#444',
      border: `1px solid ${done ? '#0f3020' : active ? '#3a2800' : '#1e1e1e'}`,
      transition: 'all .3s',
    }),
    sep: { color: '#2a2a2a', fontSize: 10 },
  };

  return (
    <div style={s.wrap}>
      <div style={s.label}>Mission objective</div>
      <div style={s.row}>
        <input
          style={s.input}
          value={goal}
          onChange={e => setGoal(e.target.value)}
          placeholder="Describe your e-commerce business goal..."
          disabled={running}
          onFocus={e => (e.target.style.borderColor = '#3a2800')}
          onBlur={e => (e.target.style.borderColor = '#2a2a2a')}
        />
        {complete ? (
          <button style={s.btn('secondary')} onClick={onReset}>↺ Reset</button>
        ) : (
          <button style={s.btn('primary')} onClick={() => !running && onLaunch(goal)} disabled={running}>
            {running ? '◉ Running…' : '▶ Launch'}
          </button>
        )}
      </div>
      <div style={s.presets}>
        {PRESETS.map((p, i) => (
          <button key={i} style={s.preset} onClick={() => !running && setGoal(p)}
            onMouseEnter={e => { e.target.style.borderColor = '#3a2800'; e.target.style.color = '#EF9F27'; }}
            onMouseLeave={e => { e.target.style.borderColor = '#222'; e.target.style.color = '#666'; }}>
            {p.length > 48 ? p.slice(0, 48) + '…' : p}
          </button>
        ))}
      </div>
      <div style={s.phases}>
        <span style={{ fontSize: 10, color: '#444', marginRight: 4, fontFamily: 'var(--font-mono)' }}>PHASES</span>
        {PHASES.map((ph, i) => {
          const done = currentPhase > ph.id;
          const active = currentPhase === ph.id;
          return (
            <React.Fragment key={ph.id}>
              <span style={s.phase(active, done)}>
                {done ? '✓ ' : active ? '◉ ' : ''}{ph.label}
              </span>
              {i < PHASES.length - 1 && <span style={s.sep}>›</span>}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
