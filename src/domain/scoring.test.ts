import { describe, expect, it } from 'vitest';
import { comboStage, noteScore, reverseScore, roundDownToTen, scoreRange } from './scoring';
const standard = { system: 'standard' as const, initial: 1000, difference: 100 };
const shinuchi = { system: 'shinuchi' as const, initial: 0, difference: 0 };
describe('scoring', () => {
  it('uses combo stages and rounds down to tens', () => { expect([9,10,30,50,100].map(comboStage)).toEqual([0,1,2,4,8]); expect(roundDownToTen(557)).toBe(550); expect(noteScore('ok', 0, { ...standard, initial: 1015 })).toBe(500); });
  it('supports shinuchi, standard and zero rolls', () => { expect(noteScore('good', 99, shinuchi)).toBe(1000); expect(noteScore('ok', 99, shinuchi)).toBe(500); expect(scoreRange({good:1,ok:0,bad:0,drumroll:0,config:standard}).minimum).toBe(1000); });
  it('scores all-good and mixed judgements', () => { expect(scoreRange({good:10,ok:0,bad:0,drumroll:0,config:standard})).toMatchObject({minimum:10000,maximum:10000}); expect(scoreRange({good:10,ok:1,bad:1,drumroll:0,config:standard}).maximum).toBeGreaterThan(0); });
  it('finds ordering-dependent bounds', () => { const r=scoreRange({good:12,ok:0,bad:1,drumroll:0,config:standard}); expect(r.maximum).toBeGreaterThan(r.minimum); expect(r.arrangementDependent).toBe(true); });
  it('returns no solution and multiple solutions', () => { expect(reverseScore(1, shinuchi,{totalNotes:1,maxDrumroll:0}).total).toBe(0); expect(reverseScore(1000,shinuchi,{totalNotes:1,maxDrumroll:10}).total).toBeGreaterThan(1); });
  it('validates boundary values', () => { expect(() => scoreRange({good:-1,ok:0,bad:0,drumroll:0,config:standard})).toThrow('不能为负数'); expect(() => reverseScore(0,shinuchi,{totalNotes:61,maxDrumroll:0})).toThrow(); });
});
