import React from 'react';
import { KPI_LABELS } from '../agents/config';

const KPI_ICONS = {
  gross_margin:   '▲',
  monthly_profit: '$',
  cac:            '◎',
  roas:           '×',
};

export default function KPIDashboard({ kpis }) {
  const s = {
    wrap: { padding: '12px 16px', borderBottom: '1px solid #1e1e1e' },
    label: { fontSize: 10, color: '#555', letterSpacing: '.1em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 10 },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
    card: (hasVal) => ({
      background: hasVal ? '#0f0e0a' : '#111',
      border: `1px solid ${hasVal ? '#2a2200' : '#1a1a1a'}`,
      borderRadius: 8, padding: '10px 12px', transition: 'all .3s',
    }),
    icon: { fontSize: 10, color: '#444', marginBottom: 4, fontFamily: 'var(--font-mono)' },
    val: (hasVal) => ({
      fontSize: 20, fontWeight: 600, fontFamily: 'var(--font-mono)',
      color: hasVal ? '#EF9F27' : '#2a2a2a', marginBottom: 3,
      transition: 'color .3s',
    }),
    key: { fontSize: 10, color: '#555' },
  };

  const KPI_ORDER = ['gross_margin', 'monthly_profit', 'cac', 'roas'];

  return (
    <div style={s.wrap}>
      <div style={s.label}>Live KPIs</div>
      <div style={s.grid}>
        {KPI_ORDER.map(k => {
          const val = kpis[k];
          return (
            <div key={k} style={s.card(!!val)}>
              <div style={s.icon}>{KPI_ICONS[k]}</div>
              <div style={s.val(!!val)}>{val || '—'}</div>
              <div style={s.key}>{KPI_LABELS[k]}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
