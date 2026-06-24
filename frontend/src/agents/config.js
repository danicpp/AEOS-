export const AGENTS = [
  { id: 'ceo',       name: 'CEO Agent',           color: '#7F77DD', icon: '⬡', role: 'Orchestrator & strategic planner'       },
  { id: 'research',  name: 'Product Research',     color: '#1D9E75', icon: '🔍', role: 'Trend discovery & demand analysis'      },
  { id: 'market',    name: 'Market Intel',          color: '#BA7517', icon: '📊', role: 'Competitor & positioning analysis'       },
  { id: 'supplier',  name: 'Supplier Scout',        color: '#D4537E', icon: '🏭', role: 'Sourcing & procurement'                 },
  { id: 'pricing',   name: 'Pricing Agent',         color: '#378ADD', icon: '💰', role: 'Margin & profitability calc'            },
  { id: 'inventory', name: 'Inventory Forecast',    color: '#D85A30', icon: '📦', role: 'Demand prediction & stock planning'     },
  { id: 'shopify',   name: 'Store Builder',         color: '#0F6E56', icon: '🛍', role: 'Listing & SEO optimization'             },
  { id: 'marketing', name: 'Marketing Agent',       color: '#534AB7', icon: '📣', role: 'Campaigns & ad strategy'               },
  { id: 'content',   name: 'Content Creator',       color: '#A32D2D', icon: '🎬', role: 'Creative assets & scripts'             },
  { id: 'support',   name: 'Support Agent',         color: '#085041', icon: '💬', role: 'Customer comms & CX'                   },
  { id: 'logistics', name: 'Logistics Agent',       color: '#854F0B', icon: '🚚', role: 'Fulfillment & delivery'                },
  { id: 'finance',   name: 'Finance Agent',         color: '#185FA5', icon: '📈', role: 'Revenue & cost tracking'               },
  { id: 'risk',      name: 'Risk & Compliance',     color: '#791F1F', icon: '⚠', role: 'Policy & risk monitoring'              },
];

export const AGENT_MAP = Object.fromEntries(AGENTS.map(a => [a.id, a]));

export const PHASES = [
  { id: 1, label: 'Strategy',   agents: ['ceo'] },
  { id: 2, label: 'Research',   agents: ['research', 'market'] },
  { id: 3, label: 'Economics',  agents: ['supplier', 'pricing'] },
  { id: 4, label: 'Go-to-Market', agents: ['shopify', 'marketing', 'content'] },
  { id: 5, label: 'Operations', agents: ['logistics', 'finance', 'risk', 'inventory', 'support'] },
  { id: 6, label: 'Synthesis',  agents: ['ceo'] },
];

export const STATUS_COLORS = {
  idle:   '#3a3835',
  active: '#EF9F27',
  done:   '#1D9E75',
  error:  '#D85A30',
};

export const KPI_LABELS = {
  gross_margin:   'Gross Margin',
  monthly_profit: 'Monthly Profit',
  cac:            'Est. CAC',
  roas:           'Target ROAS',
};

export const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8002';
