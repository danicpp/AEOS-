import { useState, useCallback, useRef } from 'react';
import { API_BASE } from '../agents/config';

const INITIAL_STATE = {
  running: false,
  phase: 0,
  agentStatuses: {},   // { [agentId]: 'idle'|'active'|'done'|'error' }
  messages: [],        // inter-agent bus messages
  reports: {},         // { [agentId]: [{ title, body }] }
  kpis: {},            // { gross_margin, monthly_profit, cac, roas }
  logs: [],            // system log strings
  complete: false,
  error: null,
};

export function useMission() {
  const [state, setState] = useState(INITIAL_STATE);
  const eventSourceRef = useRef(null);

  const updateState = useCallback((updater) => {
    setState(prev => ({ ...prev, ...updater(prev) }));
  }, []);

  const launch = useCallback(async (goal) => {
    if (state.running) return;

    // Reset
    setState({ ...INITIAL_STATE, running: true });

    // Close any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      let response;
      try {
        response = await fetch(`${API_BASE}/mission/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goal }),
        });
      } catch (networkErr) {
        throw new Error(`Cannot reach backend at ${API_BASE}. Is the server running?`);
      }

      if (!response.ok) {
        let detail = `Server error: ${response.status}`;
        try { const body = await response.json(); detail = body.detail || detail; } catch {}
        throw new Error(detail);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const payload = JSON.parse(line.slice(6));
            handleEvent(payload);
          } catch (e) {
            // ignore parse errors on malformed chunks
          }
        }
      }
    } catch (err) {
      setState(prev => ({ ...prev, running: false, error: err.message }));
    }

    function handleEvent(payload) {
      const { event, ...data } = payload;

      switch (event) {
        case 'agent_status':
          setState(prev => ({
            ...prev,
            agentStatuses: { ...prev.agentStatuses, [data.agent_id]: data.status },
          }));
          break;

        case 'message':
          setState(prev => ({
            ...prev,
            messages: [...prev.messages, { ...data, ts: Date.now() }].slice(-200),
          }));
          break;

        case 'report':
          setState(prev => {
            const existing = prev.reports[data.agent_id] || [];
            return {
              ...prev,
              reports: {
                ...prev.reports,
                [data.agent_id]: [...existing, { title: data.title, body: data.body }],
              },
            };
          });
          break;

        case 'kpi':
          setState(prev => ({
            ...prev,
            kpis: { ...prev.kpis, [data.key]: data.value },
          }));
          break;

        case 'log':
          setState(prev => ({
            ...prev,
            logs: [...prev.logs, { text: data.text, ts: Date.now() }].slice(-100),
            phase: prev.phase + 1,
          }));
          break;

        case 'mission_complete':
          setState(prev => ({ ...prev, running: false, complete: true }));
          break;

        default:
          break;
      }
    }
  }, [state.running]);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const chatWithAgent = useCallback(async (agentId, message, context = '') => {
    const res = await fetch(`${API_BASE}/agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent_id: agentId, message, context }),
    });
    const data = await res.json();
    return data.response;
  }, []);

  return { ...state, launch, reset, chatWithAgent };
}
