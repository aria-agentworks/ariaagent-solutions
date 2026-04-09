// ─── Bob for Ads — Utility Functions ──────────────────────────────────────

import type { TerminalLineType } from '@/types/bob';

/**
 * Get a CSS color class for terminal line types
 */
export function getTerminalColor(type: TerminalLineType): string {
  const colors: Record<TerminalLineType, string> = {
    command: 'text-[#39ff14]',
    output: 'text-[#ffb000]',
    error: 'text-[#ff4444]',
    success: 'text-[#4ade80]',
    info: 'text-[#888888]',
    system: 'text-[#ff6b4a]',
  };
  return colors[type];
}

/**
 * Format currency value
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format percentage value
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format large numbers
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Get health score color
 */
export function getHealthColor(score: number): string {
  if (score >= 80) return '#4ade80';
  if (score >= 50) return '#fbbf24';
  return '#ef4444';
}

/**
 * Generate a unique ID
 */
export function generateId(prefix = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Delay utility for simulating async operations
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * CTR classification
 */
export function classifyCTR(ctr: number): { label: string; color: string } {
  if (ctr >= 2.5) return { label: 'Excellent', color: '#4ade80' };
  if (ctr >= 1.5) return { label: 'Good', color: '#fbbf24' };
  if (ctr >= 1.0) return { label: 'Average', color: '#ffb000' };
  return { label: 'Poor', color: '#ef4444' };
}

/**
 * CPC classification
 */
export function classifyCPC(cpc: number): { label: string; color: string } {
  if (cpc <= 0.5) return { label: 'Excellent', color: '#4ade80' };
  if (cpc <= 1.0) return { label: 'Good', color: '#fbbf24' };
  if (cpc <= 1.5) return { label: 'Average', color: '#ffb000' };
  return { label: 'High', color: '#ef4444' };
}
