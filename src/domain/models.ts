export type ScoringSystem = 'shinuchi' | 'standard';
export interface Judgements { good: number; ok: number; bad: number; drumroll: number }
export interface ScoreConfig { system: ScoringSystem; initial: number; difference: number }
export interface ScoreInput extends Judgements { config: ScoreConfig }
export interface ScoreRange { minimum: number; maximum: number; exact: boolean; arrangementDependent: boolean }
export interface ReverseConstraints { totalNotes: number; maxDrumroll: number; knownGood?: number; knownOk?: number; knownBad?: number }
export interface Candidate extends Judgements { score: number; range: ScoreRange }
export interface ReverseResult { candidates: Candidate[]; total: number; truncated: boolean }

export const LIMITS = { notes: 200, reverseNotes: 60, drumroll: 500, score: 100_000_000, initial: 100_000, difference: 100_000 } as const;

export function safeInteger(value: number, label: string, maximum: number): number {
  if (!Number.isSafeInteger(value)) throw new Error(`${label}必须是安全整数`);
  if (value < 0) throw new Error(`${label}不能为负数`);
  if (value > maximum) throw new Error(`${label}不能超过 ${maximum}`);
  return value;
}
