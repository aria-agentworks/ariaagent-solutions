'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useBobStore } from '@/store/useBobStore';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Check, Eye } from 'lucide-react';
import type { AdConcept } from '@/types/bob';

const hookColors: Record<string, string> = {
  'SOCIAL PROOF': 'bg-[#4ade80]/15 text-[#4ade80] border-[#4ade80]/30',
  URGENCY: 'bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444]/30',
  CURIOSITY: 'bg-[#a78bfa]/15 text-[#a78bfa] border-[#a78bfa]/30',
  FOMO: 'bg-[#fbbf24]/15 text-[#fbbf24] border-[#fbbf24]/30',
  AUTHORITY: 'bg-[#38bdf8]/15 text-[#38bdf8] border-[#38bdf8]/30',
  EMOTIONAL: 'bg-[#ff6b4a]/15 text-[#ff6b4a] border-[#ff6b4a]/30',
};

function ConceptCard({ concept, isSelected, onToggle, onViewImage }: {
  concept: AdConcept;
  isSelected: boolean;
  onToggle: () => void;
  onViewImage: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`concept-card rounded-xl overflow-hidden bg-[#141414] group ${
        isSelected ? 'selected' : ''
      }`}
      onClick={onToggle}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-[#1a1a1a]">
        <img
          src={concept.imageUrl}
          alt={concept.headline}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {/* Hook Badge */}
        <div className="absolute top-3 left-3">
          <Badge className={`${hookColors[concept.hookType] || 'bg-[#2a2a2a] text-[#888888] border-[#3a3a3a]'} text-[10px] tracking-wider font-bold`}>
            {concept.hookType}
          </Badge>
        </div>
        {/* Selection Indicator */}
        <div className="absolute top-3 right-3">
          <div
            className={`h-6 w-6 rounded-md flex items-center justify-center transition-all ${
              isSelected
                ? 'bg-[#ff6b4a] border border-[#ff6b4a]'
                : 'bg-[#0a0a0a]/60 border border-[#3a3a3a] backdrop-blur-sm'
            }`}
          >
            {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
          </div>
        </div>
        {/* View overlay */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            onViewImage();
          }}
          className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0a0a0a]/70 backdrop-blur-sm border border-[#3a3a3a] cursor-pointer hover:bg-[#1a1a1a]/80">
            <Eye className="h-3.5 w-3.5 text-[#fafafa]" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <h3 className="text-sm font-bold text-[#fafafa] leading-tight line-clamp-2">
          {concept.headline}
        </h3>
        <p className="text-xs text-[#888888] leading-relaxed line-clamp-3">
          {concept.copy}
        </p>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[9px] tracking-wider text-[#555555] border-[#2a2a2a]">
            {concept.emotion}
          </Badge>
        </div>
      </div>
    </motion.div>
  );
}

export default function ConceptCards() {
  const {
    concepts,
    selectedConcepts,
    toggleConcept,
    selectAllConcepts,
    clearSelection,
    setActiveStep,
    addTerminalLine,
    setLightboxImage,
  } = useBobStore();

  if (concepts.length === 0) return null;

  const allSelected = selectedConcepts.length === concepts.length;
  const noneSelected = selectedConcepts.length === 0;

  const handleProceed = () => {
    addTerminalLine({
      type: 'success',
      text: `✓ ${selectedConcepts.length} concepts selected for deployment`,
    });
    setActiveStep('hands');
  };

  return (
    <div className="w-full max-w-6xl mx-auto mt-8">
      {/* Selection Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#888888]">
            {selectedConcepts.length} of {concepts.length} selected
          </span>
          <button
            onClick={() => (allSelected ? clearSelection() : selectAllConcepts())}
            className="text-[10px] text-[#555555] hover:text-[#ff6b4a] transition-colors tracking-wider uppercase"
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={allSelected}
              onCheckedChange={() => (allSelected ? clearSelection() : selectAllConcepts())}
            />
          </div>
          <button
            onClick={handleProceed}
            disabled={noneSelected}
            className={`text-xs font-bold tracking-wider uppercase px-4 py-2 rounded-lg transition-all ${
              noneSelected
                ? 'bg-[#1a1a1a] text-[#555555] cursor-not-allowed'
                : 'bg-[#ff6b4a] hover:bg-[#cc5038] text-white glow-coral'
            }`}
          >
            Deploy Selected →
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {concepts.map((concept, index) => (
            <ConceptCard
              key={concept.id}
              concept={concept}
              isSelected={selectedConcepts.includes(concept.id)}
              onToggle={() => toggleConcept(concept.id)}
              onViewImage={() => setLightboxImage(concept.imageUrl)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
