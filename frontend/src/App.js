import React, { useState } from 'react';
import { AGENTS } from './agents/config';
import { useMission } from './hooks/useMission';
import TopBar from './components/TopBar';
import MissionControl from './components/MissionControl';
import AgentFleet from './components/AgentFleet';
import MessageBus from './components/MessageBus';
import KPIDashboard from './components/KPIDashboard';
import ReportsPanel from './components/ReportsPanel';
import FinanceChart from './components/FinanceChart';
import SystemLog from './components/SystemLog';

export default function App() {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const mission = useMission();

  const activeCount = Object.values(mission.agentStatuses).filter(s => s === 'active').length;
  const doneCount = Object.values(mission.agentStatuses).filter(s => s === 'done').length;

  const layout = {
    root: { display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--bg)' },
    body: { display: 'flex', flex: 1, overflow: 'hidden' },
    // LEFT column: fleet + message bus + log
    left: { display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden', borderRight: '1px solid #1a1a1a' },
    fleetSection: { flexShrink: 0 },
    busSection: { flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
    // RIGHT column: KPIs + chart + reports
    right: { display: 'flex', flexDirection: 'column', width: 320, flexShrink: 0, overflow: 'hidden' },
    kpiSection: { flexShrink: 0 },
    chartSection: { flexShrink: 0 },
    reportsSection: { flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  };

  return (
    <div style={layout.root}>
      <TopBar
        running={mission.running}
        complete={mission.complete}
        error={mission.error}
        agentCount={AGENTS.length}
        activeCount={activeCount}
      />
      <MissionControl
        onLaunch={mission.launch}
        onReset={mission.reset}
        running={mission.running}
        complete={mission.complete}
        currentPhase={Math.floor(mission.phase / 2)}
      />
      <div style={layout.body}>
        {/* LEFT */}
        <div style={layout.left}>
          <div style={layout.fleetSection}>
            <AgentFleet
              statuses={mission.agentStatuses}
              onSelectAgent={setSelectedAgent}
              selectedAgent={selectedAgent}
            />
          </div>
          <div style={layout.busSection}>
            <MessageBus messages={mission.messages} />
          </div>
          <SystemLog logs={mission.logs} error={mission.error} />
        </div>

        {/* RIGHT */}
        <div style={layout.right}>
          <div style={layout.kpiSection}>
            <KPIDashboard kpis={mission.kpis} />
          </div>
          <div style={layout.chartSection}>
            <FinanceChart reports={mission.reports} />
          </div>
          <div style={layout.reportsSection}>
            <ReportsPanel
              reports={mission.reports}
              selectedAgent={selectedAgent}
              chatWithAgent={mission.chatWithAgent}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
