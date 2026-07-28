import { Candidate, Judgements, LIMITS, ReverseConstraints, ReverseResult, ScoreConfig, ScoreInput, ScoreRange, safeInteger } from './models';

export function comboStage(comboBeforeNote: number): 0 | 1 | 2 | 4 | 8 {
  if (comboBeforeNote >= 100) return 8;
  if (comboBeforeNote >= 50) return 4;
  if (comboBeforeNote >= 30) return 2;
  if (comboBeforeNote >= 10) return 1;
  return 0;
}
export const roundDownToTen = (score: number) => Math.floor(score / 10) * 10;
export function noteScore(judgement: 'good' | 'ok' | 'bad', comboBeforeNote: number, config: ScoreConfig): number {
  if (judgement === 'bad') return 0;
  const good = config.system === 'shinuchi' ? 1000 : roundDownToTen(config.initial + comboStage(comboBeforeNote) * config.difference);
  return judgement === 'good' ? good : roundDownToTen(good / 2);
}
export const drumrollScore = (hits: number) => hits * 100;

function validate(input: ScoreInput): void {
  const { good, ok, bad, drumroll, config } = input;
  [good, ok, bad].forEach((v, i) => safeInteger(v, ['良', '可', '不可'][i], LIMITS.notes));
  safeInteger(drumroll, '连打数', LIMITS.drumroll);
  if (good + ok + bad > LIMITS.notes) throw new Error(`良、可、不可之和不能超过 ${LIMITS.notes}`);
  if (config.system === 'standard') {
    safeInteger(config.initial, '初项', LIMITS.initial); safeInteger(config.difference, '公差', LIMITS.difference);
  }
}

/** Exact min/max over every ordering. State merging keeps only extrema for an identical count/combo state. */
export function scoreRange(input: ScoreInput): ScoreRange {
  validate(input);
  type V = [number, number];
  let states = new Map<string, V>([['0,0,0,0', [0, 0]]]);
  const target = [input.good, input.ok, input.bad];
  for (let position = 0; position < input.good + input.ok + input.bad; position++) {
    const next = new Map<string, V>();
    for (const [key, range] of states) {
      const [g, o, b, combo] = key.split(',').map(Number);
      [g, o, b].forEach((used, kind) => {
        if (used >= target[kind]) return;
        const judgement = (['good', 'ok', 'bad'] as const)[kind];
        const counts = [g, o, b]; counts[kind]++;
        const newCombo = judgement === 'bad' ? 0 : combo + 1;
        const points = noteScore(judgement, combo, input.config);
        const newKey = `${counts[0]},${counts[1]},${counts[2]},${newCombo}`;
        const old = next.get(newKey);
        const candidate: V = [range[0] + points, range[1] + points];
        next.set(newKey, old ? [Math.min(old[0], candidate[0]), Math.max(old[1], candidate[1])] : candidate);
      });
    }
    states = next;
  }
  let minimum = Infinity, maximum = -Infinity;
  for (const [key, value] of states) if (key.startsWith(`${input.good},${input.ok},${input.bad},`)) {
    minimum = Math.min(minimum, value[0]); maximum = Math.max(maximum, value[1]);
  }
  minimum += drumrollScore(input.drumroll); maximum += drumrollScore(input.drumroll);
  return { minimum, maximum, exact: minimum === maximum, arrangementDependent: minimum !== maximum };
}

export function reverseScore(targetScore: number, config: ScoreConfig, constraints: ReverseConstraints, page = 1, pageSize = 50): ReverseResult {
  safeInteger(targetScore, '总分', LIMITS.score);
  const n = safeInteger(constraints.totalNotes, '总音符数', LIMITS.reverseNotes);
  const maxRoll = safeInteger(constraints.maxDrumroll, '最大连打数', LIMITS.drumroll);
  const known = [constraints.knownGood, constraints.knownOk, constraints.knownBad];
  known.forEach((v, i) => { if (v !== undefined) safeInteger(v, ['已知良', '已知可', '已知不可'][i], n); });
  if (known.reduce<number>((sum, v) => sum + (v ?? 0), 0) > n) throw new Error('已知良、可、不可之和不能超过总音符数');
  const matches: Candidate[] = [];
  for (let good = 0; good <= n; good++) for (let ok = 0; ok <= n - good; ok++) {
    const bad = n - good - ok;
    if ((known[0] !== undefined && good !== known[0]) || (known[1] !== undefined && ok !== known[1]) || (known[2] !== undefined && bad !== known[2])) continue;
    for (let drumroll = 0; drumroll <= maxRoll; drumroll++) {
      const range = scoreRange({ good, ok, bad, drumroll, config });
      if (targetScore >= range.minimum && targetScore <= range.maximum) matches.push({ good, ok, bad, drumroll, score: targetScore, range });
    }
  }
  const start = Math.max(0, page - 1) * pageSize;
  return { candidates: matches.slice(start, start + pageSize), total: matches.length, truncated: matches.length > start + pageSize };
}
