import React, { useEffect, useRef } from 'react';

export default function SystemLog({ logs, error }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs.length]);

  const s = {
    wrap: { padding: '8px 16px', borderTop: '1px solid #1a1a1a', background: '#0a0a0a', flexShrink: 0 },
    label: { fontSize: 10, color: '#444', letterSpacing: '.08em', fontFamily: 'var(--font-mono)', marginBottom: 4 },
    log: { maxHeight: 70, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 },
    entry: (isErr) => ({ fontSize: 10, fontFamily: 'var(--font-mono)', color: isErr ? '#D85A30' : '#555', paddingLeft: 8, borderLeft: `2px solid ${isErr ? '#4a1010' : '#1e1e1e'}` }),
  };

  const ts = () => new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  return (
    <div style={s.wrap}>
      <div style={s.label}>SYSTEM LOG</div>
      <div style={s.log}>
        {logs.map((l, i) => (
          <div key={i} style={s.entry(false)}>[{ts()}] {l.text}</div>
        ))}
        {error && <div style={s.entry(true)}>[ERROR] {error}</div>}
        <div ref={ref} />
      </div>
    </div>
  );
}
