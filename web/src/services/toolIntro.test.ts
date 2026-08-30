import { beforeEach, describe, expect, it } from 'vitest';
import { TOOL_ROSTER as TOOLS } from '../../components/MinigamesScreen';
import {
  TOOL_INTROS_SEEN_KEY,
  TOOL_INTROS,
  hasSeenToolIntro,
  markAllToolIntrosSeen,
  markToolIntroSeen,
  pendingToolIntro,
  resetToolIntros,
  seenToolIntros,
  toolIntroForRoute,
} from './toolIntro';

describe('the tool roster', () => {
  it('names exactly the shelf, in shelf order, wearing its art and face', () => {
    expect(TOOL_INTROS.map(t => t.tool)).toEqual(TOOLS.map(t => t.id));
    for (const intro of TOOL_INTROS) {
      const tile = TOOLS.find(t => t.id === intro.tool)!;
      expect(intro.title, intro.id).toBe(tile.title);
      expect(intro.art, intro.id).toBe(tile.art);
      expect(intro.faceHex.toLowerCase(), intro.id).toBe(tile.face.toLowerCase());
      expect(intro.tagline.length).toBeGreaterThan(10);
      expect(intro.body.length).toBeGreaterThan(60);
    }
  });

  it('finds the intro for a tool route and its subroutes, and nothing for the rest', () => {
    expect(toolIntroForRoute('/scanner')?.id).toBe('blindTasting');
    expect(toolIntroForRoute('/quiz/anything')?.id).toBe('wineExam');
    expect(toolIntroForRoute('/dex')).toBeUndefined();
    expect(toolIntroForRoute('/scannerette')).toBeUndefined();
  });
});

describe('the seen store', () => {
  beforeEach(() => window.localStorage.clear());

  it('is empty on a fresh device, so every tool is pending once', () => {
    expect(seenToolIntros().size).toBe(0);
    expect(pendingToolIntro('/moon-dial')?.id).toBe('moonDial');
    markToolIntroSeen('moonDial');
    expect(pendingToolIntro('/moon-dial')).toBeNull();
    expect(hasSeenToolIntro('moonDial')).toBe(true);
    expect(pendingToolIntro('/quiz')?.id).toBe('wineExam');
  });

  it('drops unknown ids on read — a retired tool leaves no slot behind', () => {
    window.localStorage.setItem(TOOL_INTROS_SEEN_KEY, 'whatsThat,moonDial');
    expect([...seenToolIntros()]).toEqual(['moonDial']);
  });

  it('SKIP THESE spends all six at once; a reset restores them', () => {
    markAllToolIntrosSeen();
    for (const t of TOOL_INTROS) expect(hasSeenToolIntro(t.id)).toBe(true);
    resetToolIntros();
    expect(seenToolIntros().size).toBe(0);
    expect(window.localStorage.getItem(TOOL_INTROS_SEEN_KEY)).toBeNull();
  });
});
