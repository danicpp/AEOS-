import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function extractNumbers(text) {
  const matches = text.match(/\$\s*([\d,]+)/g) || [];
  return matches.map(m => parseInt(m.replace(/[$,\s]/g, ''), 10)).filter(n => n > 0 && n < 1000000);
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#161616', border: '1px solid #2a2a2a', borderRadius: 6, padding: '8px 12px', fontSize: 11 }}>
      <div style={{ color: '#888', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>
          {p.name}: ${p.value.toLocaleString()}
        </div>
      ))}
    </div>
  );
};

export default function FinanceChart({ reports }) {
  const data = useMemo(() => {
    const financeRep = reports?.finance?.[0]?.body || '';
    const nums = extractNumbers(financeRep);
    if (nums.length >= 3) {
      return [
        { month: 'M1', revenue: nums[0], cost: Math.round(nums[0] * .65), profit: Math.round(nums[0] * .35) },
        { month: 'M2', revenue: nums[1] || nums[0] * 1.4, cost: Math.round((nums[1] || nums[0] * 1.4) * .55), profit: Math.round((nums[1] || nums[0] * 1.4) * .45) },
        { month: 'M3', revenue: nums[2] || nums[0] * 2, cost: Math.round((nums[2] || nums[0] * 2) * .48), profit: Math.round((nums[2] || nums[0] * 2) * .52) },
      ];
    }
    return [
      { month: 'M1', revenue: 2400, cost: 1800, profit: 600 },
      { month: 'M2', revenue: 4200, cost: 2800, profit: 1400 },
      { month: 'M3', revenue: 7000, cost: 4000, profit: 3000 },
    ];
  }, [reports]);

  const s = {
    wrap: { padding: '12px 16px', borderBottom: '1px solid #1e1e1e' },
    label: { fontSize: 10, color: '#555', letterSpacing: '.1em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 12 },
    legend: { display: 'flex', gap: 14, marginBottom: 10 },
    leg: (color) => ({ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#666' }),
    dot: (color) => ({ width: 8, height: 8, borderRadius: 2, background: color }),
  };

  return (
    <div style={s.wrap}>
      <div style={s.label}>90-day projection</div>
      <div style={s.legend}>
        {[['Revenue', '#EF9F27'], ['Cost', '#D85A30'], ['Profit', '#1D9E75']].map(([name, color]) => (
          <div key={name} style={s.leg(color)}>
            <div style={s.dot(color)} />{name}
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={130}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            {[['revenue', '#EF9F27'], ['cost', '#D85A30'], ['profit', '#1D9E75']].map(([k, c]) => (
              <linearGradient key={k} id={`g-${k}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={c} stopOpacity={0.3} />
                <stop offset="95%" stopColor={c} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <XAxis dataKey="month" tick={{ fill: '#444', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#EF9F27" strokeWidth={1.5} fill="url(#g-revenue)" />
          <Area type="monotone" dataKey="cost" name="Cost" stroke="#D85A30" strokeWidth={1.5} fill="url(#g-cost)" />
          <Area type="monotone" dataKey="profit" name="Profit" stroke="#1D9E75" strokeWidth={1.5} fill="url(#g-profit)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
