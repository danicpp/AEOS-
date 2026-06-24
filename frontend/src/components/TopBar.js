import React from 'react';

const styles = {
  bar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 20px', height: 48, background: '#0f0f0f',
    borderBottom: '1px solid #1e1e1e', flexShrink: 0,
  },
  left: { display: 'flex', alignItems: 'center', gap: 12 },
  logo: { fontSize: 13, fontWeight: 600, color: '#EF9F27', letterSpacing: '.06em', fontFamily: 'var(--font-mono)' },
  badge: { fontSize: 10, padding: '2px 7px', background: '#1a1500', border: '1px solid #3a2f00', borderRadius: 4, color: '#BA7517', fontFamily: 'var(--font-mono)' },
  right: { display: 'flex', alignItems: 'center', gap: 16 },
  stat: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#666' },
  dot: (color) => ({ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }),
  time: { fontSize: 11, color: '#444', fontFamily: 'var(--font-mono)' },
};

function Dot({ color, pulse }) {
  return (
    <div style={{
      ...styles.dot(color),
      boxShadow: pulse ? `0 0 6px ${color}` : 'none',
      animation: pulse ? 'pulse 2s infinite' : 'none',
    }} />
  );
}

export default function TopBar({ running, complete, agentCount, activeCount, error }) {
  const [time, setTime] = React.useState(new Date());
  React.useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const statusColor = error ? '#D85A30' : complete ? '#1D9E75' : running ? '#EF9F27' : '#3a3835';
  const statusText = error ? 'Error' : complete ? 'Mission complete' : running ? 'Mission active' : 'Standby';

  return (
    <>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
      <div style={styles.bar}>
        <div style={styles.left}>
          <span style={styles.logo}>⬡ AEOS</span>
          <span style={styles.badge}>v1.0 · Band of Agents</span>
        </div>
        <div style={styles.right}>
          <div style={styles.stat}>
            <Dot color={statusColor} pulse={running} />
            <span style={{ color: statusColor, fontWeight: 500 }}>{statusText}</span>
          </div>
          <div style={styles.stat}>
            <span style={{ color: '#444' }}>Agents</span>
            <span style={{ color: '#888', fontFamily: 'var(--font-mono)' }}>
              {activeCount}/{agentCount}
            </span>
          </div>
          <div style={styles.time}>{time.toLocaleTimeString()}</div>
        </div>
      </div>
    </>
  );
}
