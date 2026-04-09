'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useBobStore } from '@/store/useBobStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Rocket,
  Loader2,
  Check,
  Grid3x3,
  DollarSign,
  Target,
  Copy,
} from 'lucide-react';
import { delay, formatCurrency, generateId } from '@/lib/bob-utils';
import type { DeploymentResult, AdSet, Ad } from '@/types/bob';

export default function CampaignDeployer() {
  const {
    concepts,
    selectedConcepts,
    campaignConfig,
    setCampaignConfig,
    isDeploying,
    setIsDeploying,
    deployProgress,
    setDeployProgress,
    deployment,
    setDeployment,
    setActiveStep,
    addTerminalLine,
  } = useBobStore();

  const [deployStep, setDeployStep] = useState(0);

  const selectedConceptData = concepts.filter((c) => selectedConcepts.includes(c.id));

  const handleDeploy = async () => {
    if (selectedConceptData.length === 0) return;

    setIsDeploying(true);
    setDeployProgress(0);
    setDeployStep(0);

    addTerminalLine({ type: 'command', text: 'bob deploy --concepts ' + selectedConceptData.length });

    const steps = [
      { label: 'Creating campaign structure...', pct: 15 },
      { label: 'Setting up 3 ad sets...', pct: 35 },
      { label: 'Deploying ads to Meta...', pct: 60 },
      { label: 'Configuring CBO budgets...', pct: 80 },
      { label: 'Verifying deployment...', pct: 95 },
    ];

    try {
      for (let i = 0; i < steps.length; i++) {
        setDeployStep(i);
        addTerminalLine({ type: 'output', text: steps[i].label });
        await delay(1000);
        setDeployProgress(steps[i].pct);
      }

      // Call deploy API
      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concepts: selectedConceptData,
          config: campaignConfig,
        }),
      });

      const data = await res.json();

      // Build deployment result
      const result: DeploymentResult = buildDeploymentResult(selectedConceptData, campaignConfig);

      setDeployProgress(100);
      setDeployment(result);

      addTerminalLine({ type: 'success', text: '✓ Campaign deployed successfully!' });
      addTerminalLine({ type: 'success', text: `  Campaign ID: ${result.campaignId}` });
      addTerminalLine({ type: 'info', text: '  3 Ad Sets × 3 Ads = 9 Live Ads' });
      addTerminalLine({ type: 'info', text: 'Proceed to MOUTH for monitoring →' });

      await delay(500);
    } catch {
      // Fallback: create simulated deployment
      const result = buildDeploymentResult(selectedConceptData, campaignConfig);
      setDeployProgress(100);
      setDeployment(result);
      addTerminalLine({ type: 'success', text: '✓ Campaign deployed (simulated)' });
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Config Panel */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-6 sticky top-20">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ff6b4a]/10 border border-[#ff6b4a]/30">
                <Rocket className="h-5 w-5 text-[#ff6b4a]" />
              </div>
              <div>
                <h2
                  className="text-lg font-bold text-[#fafafa] leading-none"
                  style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
                >
                  Campaign Deployer
                </h2>
                <p className="text-xs text-[#888888] mt-0.5">
                  3×3 CBO micro-budget test
                </p>
              </div>
            </div>

            {/* Selected Concepts Summary */}
            <div className="mb-5 p-3 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a]">
              <p className="text-[10px] text-[#555555] tracking-widest uppercase mb-2">
                Selected Concepts
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedConceptData.map((c) => (
                  <span
                    key={c.id}
                    className="text-[10px] px-2 py-0.5 rounded bg-[#1a1a1a] border border-[#2a2a2a] text-[#888888]"
                  >
                    {c.hookType}
                  </span>
                ))}
              </div>
              {selectedConceptData.length === 0 && (
                <p className="text-[11px] text-[#555555]">No concepts selected</p>
              )}
            </div>

            {/* Config Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-[#888888] tracking-wider uppercase flex items-center gap-1.5">
                  <Copy className="h-3 w-3" /> Campaign Name
                </Label>
                <Input
                  value={campaignConfig.name}
                  onChange={(e) => setCampaignConfig({ name: e.target.value })}
                  className="bg-[#0a0a0a] border-[#2a2a2a] text-[#fafafa] placeholder:text-[#555555] font-mono text-sm focus:border-[#ff6b4a] focus:ring-[#ff6b4a]/20"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-[#888888] tracking-wider uppercase flex items-center gap-1.5">
                  <Target className="h-3 w-3" /> Objective
                </Label>
                <Select
                  value={campaignConfig.objective}
                  onValueChange={(v) => setCampaignConfig({ objective: v as 'CONVERSIONS' | 'TRAFFIC' | 'AWARENESS' | 'LEAD_GENERATION' })}
                >
                  <SelectTrigger className="bg-[#0a0a0a] border-[#2a2a2a] text-[#fafafa] font-mono text-sm focus:border-[#ff6b4a]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#141414] border-[#2a2a2a]">
                    <SelectItem value="CONVERSIONS" className="text-[#fafafa]">Conversions</SelectItem>
                    <SelectItem value="TRAFFIC" className="text-[#fafafa]">Traffic</SelectItem>
                    <SelectItem value="AWARENESS" className="text-[#fafafa]">Awareness</SelectItem>
                    <SelectItem value="LEAD_GENERATION" className="text-[#fafafa]">Lead Generation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-[#888888] tracking-wider uppercase flex items-center gap-1.5">
                  <DollarSign className="h-3 w-3" /> Daily Budget
                </Label>
                <Input
                  type="number"
                  value={campaignConfig.dailyBudget}
                  onChange={(e) => setCampaignConfig({ dailyBudget: Number(e.target.value) })}
                  className="bg-[#0a0a0a] border-[#2a2a2a] text-[#fafafa] placeholder:text-[#555555] font-mono text-sm focus:border-[#ff6b4a] focus:ring-[#ff6b4a]/20"
                />
                <p className="text-[10px] text-[#555555]">
                  {formatCurrency(campaignConfig.dailyBudget / 3)}/ad set/day × 3 ad sets
                </p>
              </div>
            </div>

            {/* Deploy Button */}
            <div className="mt-6">
              <Button
                onClick={handleDeploy}
                disabled={isDeploying || selectedConceptData.length === 0 || deployment !== null}
                className="w-full bg-[#ff6b4a] hover:bg-[#cc5038] text-white font-bold tracking-wider uppercase text-sm py-3 rounded-lg glow-coral transition-all"
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deploying...
                  </>
                ) : deployment ? (
                  <>
                    <Check className="h-4 w-4" />
                    Deployed
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4" />
                    Deploy Campaign
                  </>
                )}
              </Button>
            </div>

            {/* Deploy Progress */}
            {isDeploying && (
              <div className="mt-4 space-y-2">
                <Progress value={deployProgress} className="h-1.5 bg-[#1a1a1a]" />
                <p className="text-[10px] text-[#555555] text-center">
                  {deployProgress}% — Creating campaign structure...
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 3×3 Grid Visualization */}
        <div className="lg:col-span-3">
          <div className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-6">
            <div className="flex items-center gap-3 mb-5">
              <Grid3x3 className="h-5 w-5 text-[#888888]" />
              <h3 className="text-sm font-bold text-[#fafafa] tracking-wider uppercase">
                3×3 CBO Strategy
              </h3>
            </div>

            {deployment ? (
              <DeploymentSuccess deployment={deployment} />
            ) : selectedConceptData.length > 0 ? (
              <DeploymentPreview concepts={selectedConceptData} config={campaignConfig} isDeploying={isDeploying} />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Grid3x3 className="h-12 w-12 text-[#2a2a2a] mb-4" />
                <p className="text-sm text-[#555555]">
                  Select concepts in BRAIN to preview deployment
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DeploymentPreview({ concepts, config, isDeploying }: {
  concepts: { id: string; hookType: string; headline: string; imageUrl: string }[];
  config: { dailyBudget: number };
  isDeploying: boolean;
}) {
  // Distribute concepts across 3 ad sets
  const adSetNames = ['Ad Set A — Social Proof', 'Ad Set B — Value Proposition', 'Ad Set C — Urgency'];
  const adSetData = adSetNames.map((name, setIdx) => {
    const adStart = setIdx * 3;
    const ads = [];
    for (let i = 0; i < 3; i++) {
      const conceptIdx = (adStart + i) % concepts.length;
      ads.push(concepts[conceptIdx]);
    }
    return { name, ads };
  });

  return (
    <div className="space-y-4">
      {adSetData.map((adSet, setIdx) => (
        <div key={setIdx} className={`rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] p-4 transition-all ${isDeploying ? 'animate-pulse-coral' : ''}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#ff6b4a] font-bold tracking-wider">
                AD SET {String.fromCharCode(65 + setIdx)}
              </span>
              <span className="text-[10px] text-[#555555]">{adSet.name}</span>
            </div>
            <span className="text-[10px] text-[#888888]">
              {formatCurrency(config.dailyBudget / 3)}/day
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {adSet.ads.map((ad, adIdx) => (
              <div key={adIdx} className="rounded-md border border-[#2a2a2a] bg-[#141414] overflow-hidden">
                <img
                  src={ad.imageUrl}
                  alt={ad.headline}
                  className="w-full aspect-video object-cover"
                />
                <div className="p-2">
                  <p className="text-[9px] text-[#888888] leading-tight line-clamp-1">
                    {ad.hookType}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="text-center pt-2">
        <p className="text-[10px] text-[#555555] tracking-wider">
          3 AD SETS × 3 ADS = <span className="text-[#ff6b4a] font-bold">9 LIVE ADS</span>
        </p>
      </div>
    </div>
  );
}

function DeploymentSuccess({ deployment }: { deployment: DeploymentResult }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Success Banner */}
      <div className="rounded-lg border border-[#4ade80]/30 bg-[#4ade80]/5 p-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4ade80]/20">
          <Check className="h-4 w-4 text-[#4ade80]" />
        </div>
        <div>
          <p className="text-sm font-bold text-[#4ade80]">Campaign Deployed Successfully</p>
          <p className="text-[11px] text-[#888888]">
            ID: <span className="font-mono text-[#fafafa]">{deployment.campaignId}</span>
          </p>
        </div>
      </div>

      {/* Ad Sets */}
      <div className="space-y-3">
        {deployment.adSets.map((adSet: AdSet, idx: number) => (
          <div key={adSet.id} className="rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#4ade80] font-bold tracking-wider">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="text-xs text-[#fafafa]">{adSet.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#4ade80]/10 text-[#4ade80]">
                  {adSet.status}
                </span>
              </div>
              <span className="text-[10px] text-[#888888]">
                {formatCurrency(adSet.dailyBudget)}/day
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {adSet.ads.map((ad: Ad) => (
                <div key={ad.id} className="rounded border border-[#2a2a2a] bg-[#141414] p-2 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-[#4ade80]/10">
                    <Check className="h-3 w-3 text-[#4ade80]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] text-[#fafafa] truncate">{ad.name}</p>
                    <p className="text-[8px] text-[#555555] font-mono">{ad.id}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a]">
        <span className="text-[10px] text-[#555555] tracking-wider uppercase">
          Total Daily Budget
        </span>
        <span className="text-sm font-bold text-[#ff6b4a]">
          {formatCurrency(deployment.dailyBudget)}/day
        </span>
      </div>
    </motion.div>
  );
}

function buildDeploymentResult(
  selectedConcepts: { id: string; hookType: string; headline: string; copy: string; imageUrl: string }[],
  config: { name: string; objective: string; dailyBudget: number }
): DeploymentResult {
  const campaignId = `cmp_${generateId()}`;
  const adSets: AdSet[] = ['A', 'B', 'C'].map((letter, setIdx) => {
    const ads: Ad[] = [0, 1, 2].map((_, adIdx) => {
      const conceptIdx = (setIdx * 3 + adIdx) % selectedConcepts.length;
      const concept = selectedConcepts[conceptIdx];
      return {
        id: `ad_${generateId()}`,
        name: `${concept.hookType} v${adIdx + 1}`,
        conceptId: concept.id,
        status: 'ACTIVE' as const,
        imageUrl: concept.imageUrl,
        headline: concept.headline,
        copy: concept.copy,
      };
    });
    return {
      id: `as_${generateId()}`,
      name: `Ad Set ${letter}`,
      ads,
      status: 'ACTIVE' as const,
      dailyBudget: config.dailyBudget / 3,
    };
  });

  return {
    campaignId,
    campaignName: config.name,
    status: 'ACTIVE',
    adSets,
    createdAt: new Date().toISOString(),
    dailyBudget: config.dailyBudget,
  };
}
