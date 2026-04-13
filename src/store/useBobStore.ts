import { create } from 'zustand';
import type {
  PipelineStep,
  AdConcept,
  CampaignConfig,
  DeploymentResult,
  MonitorMetrics,
  Alert,
  TerminalLine,
  DailyBriefing,
  GenerationPhase,
} from '@/types/bob';

// ─── Bob for Ads — Global State Store ──────────────────────────────────────

interface BobState {
  // Pipeline
  activeStep: PipelineStep;
  setActiveStep: (step: PipelineStep) => void;

  // Creative Generation (Brain)
  url: string;
  setUrl: (url: string) => void;
  brandName: string;
  setBrandName: (name: string) => void;
  style: string;
  setStyle: (style: string) => void;
  isGenerating: boolean;
  setIsGenerating: (v: boolean) => void;
  generationPhases: GenerationPhase[];
  setGenerationPhases: (phases: GenerationPhase[]) => void;
  concepts: AdConcept[];
  setConcepts: (concepts: AdConcept[]) => void;
  selectedConcepts: string[];
  toggleConcept: (id: string) => void;
  selectAllConcepts: () => void;
  clearSelection: () => void;

  // Campaign Deployment (Hands)
  campaignConfig: CampaignConfig;
  setCampaignConfig: (config: Partial<CampaignConfig>) => void;
  isDeploying: boolean;
  setIsDeploying: (v: boolean) => void;
  deployProgress: number;
  setDeployProgress: (p: number) => void;
  deployment: DeploymentResult | null;
  setDeployment: (d: DeploymentResult | null) => void;

  // Monitoring (Mouth)
  metrics: MonitorMetrics | null;
  setMetrics: (m: MonitorMetrics | null) => void;
  alerts: Alert[];
  setAlerts: (a: Alert[]) => void;
  dailyBriefing: DailyBriefing | null;
  setDailyBriefing: (b: DailyBriefing | null) => void;
  isMonitoring: boolean;
  setIsMonitoring: (v: boolean) => void;

  // Terminal
  terminalLines: TerminalLine[];
  addTerminalLine: (line: Omit<TerminalLine, 'id' | 'timestamp'>) => void;
  clearTerminal: () => void;

  // Lightbox
  lightboxImage: string | null;
  setLightboxImage: (url: string | null) => void;

  // Reset
  resetAll: () => void;
}

let lineCounter = 0;

export const useBobStore = create<BobState>((set, get) => ({
  // Pipeline
  activeStep: 'brain',
  setActiveStep: (step) => {
    set({ activeStep: step });
    const stepNames: Record<PipelineStep, string> = {
      brain: '🧠 BRAIN',
      hands: '🤲 HANDS',
      mouth: '📢 MOUTH',
    };
    get().addTerminalLine({ type: 'system', text: `Pipeline step changed to ${stepNames[step]}` });
  },

  // Creative Generation
  url: '',
  setUrl: (url) => set({ url }),
  brandName: '',
  setBrandName: (name) => set({ brandName: name }),
  style: 'professional',
  setStyle: (style) => set({ style }),
  isGenerating: false,
  setIsGenerating: (v) => set({ isGenerating: v }),
  generationPhases: [],
  setGenerationPhases: (phases) => set({ generationPhases: phases }),
  concepts: [],
  setConcepts: (concepts) => set({ concepts, selectedConcepts: concepts.map((c) => c.id) }),
  selectedConcepts: [],
  toggleConcept: (id) =>
    set((s) => ({
      selectedConcepts: s.selectedConcepts.includes(id)
        ? s.selectedConcepts.filter((cid) => cid !== id)
        : [...s.selectedConcepts, id],
    })),
  selectAllConcepts: () => set((s) => ({ selectedConcepts: s.concepts.map((c) => c.id) })),
  clearSelection: () => set({ selectedConcepts: [] }),

  // Campaign Deployment
  campaignConfig: {
    name: 'New Campaign',
    objective: 'CONVERSIONS',
    dailyBudget: 15,
  },
  setCampaignConfig: (config) =>
    set((s) => ({ campaignConfig: { ...s.campaignConfig, ...config } })),
  isDeploying: false,
  setIsDeploying: (v) => set({ isDeploying: v }),
  deployProgress: 0,
  setDeployProgress: (p) => set({ deployProgress: p }),
  deployment: null,
  setDeployment: (d) => set({ deployment: d }),

  // Monitoring
  metrics: null,
  setMetrics: (m) => set({ metrics: m }),
  alerts: [],
  setAlerts: (a) => set({ alerts: a }),
  dailyBriefing: null,
  setDailyBriefing: (b) => set({ dailyBriefing: b }),
  isMonitoring: false,
  setIsMonitoring: (v) => set({ isMonitoring: v }),

  // Terminal
  terminalLines: [],
  addTerminalLine: (line) =>
    set((s) => ({
      terminalLines: [
        ...s.terminalLines,
        {
          ...line,
          id: `line-${++lineCounter}`,
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
        },
      ],
    })),
  clearTerminal: () => set({ terminalLines: [] }),

  // Lightbox
  lightboxImage: null,
  setLightboxImage: (url) => set({ lightboxImage: url }),

  // Reset
  resetAll: () =>
    set({
      activeStep: 'brain',
      url: '',
      brandName: '',
      style: 'professional',
      isGenerating: false,
      generationPhases: [],
      concepts: [],
      selectedConcepts: [],
      isDeploying: false,
      deployProgress: 0,
      deployment: null,
      metrics: null,
      alerts: [],
      dailyBriefing: null,
      isMonitoring: false,
      terminalLines: [],
      lightboxImage: null,
    }),
}));
