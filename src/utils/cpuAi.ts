import { Card, CpuPersonality, Player, Rank } from '../types/game';

export const CPU_PERSONALITIES: CpuPersonality[] = [
  {
    id: 'cpu-aoi',
    name: 'アオイ',
    avatar: '👓',
    title: '慎重派・分析家',
    bluffRate: 0.15,
    doubtSuspicion: 0.45,
    color: 'border-cyan-500/40 bg-cyan-950/20 text-cyan-200',
    styleDesc: '手札の確率計算を重視。確証がない限り無理なダウトは避ける。',
  },
  {
    id: 'cpu-ren',
    name: 'レン',
    avatar: '😼',
    title: '勝負師・心理派',
    bluffRate: 0.45,
    doubtSuspicion: 0.65,
    color: 'border-amber-500/40 bg-amber-950/20 text-amber-200',
    styleDesc: '強気のブラフと果敢なダウトで場をかき乱すアグレッシブな性格。',
  },
  {
    id: 'cpu-hana',
    name: 'ハナ',
    avatar: '🌸',
    title: 'バランス・直感派',
    bluffRate: 0.25,
    doubtSuspicion: 0.5,
    color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-200',
    styleDesc: '場の流れと相手の残り枚数を見極めて的確に勝負を仕掛ける。',
  },
];

// CPU selects cards to play for the currentRank
export function cpuChooseCardsToPlay(
  cpu: Player,
  currentRank: Rank
): { cardsToPlay: Card[]; isBluff: boolean } {
  const matchingCards = cpu.cards.filter((c) => c.rank === currentRank);
  const personality = cpu.personality || CPU_PERSONALITIES[0];

  // Case 1: CPU has matching cards
  if (matchingCards.length > 0) {
    // Usually plays truth (85%-95% of time depending on bluffRate)
    const shouldLieAnyway = Math.random() < personality.bluffRate * 0.3;

    if (!shouldLieAnyway) {
      // Play true cards (up to 4)
      const countToPlay = Math.min(4, matchingCards.length);
      return {
        cardsToPlay: matchingCards.slice(0, countToPlay),
        isBluff: false,
      };
    }
  }

  // Case 2: CPU has no matching cards (MUST bluff) or decided to bluff
  // Decide how many cards to bluff with
  let bluffCount = 1;
  const rand = Math.random();
  if (personality.bluffRate > 0.4 && rand < 0.25 && cpu.cards.length >= 2) {
    bluffCount = 2;
  } else if (rand < 0.1 && cpu.cards.length >= 2) {
    bluffCount = 2;
  }

  bluffCount = Math.min(bluffCount, cpu.cards.length, 4);

  // Pick cards to discard (prefer non-vital cards or single cards that don't make pairs)
  // Sort by cards that are least likely to match upcoming turns if possible, or just slice
  const nonMatching = cpu.cards.filter((c) => c.rank !== currentRank);
  const pool = nonMatching.length >= bluffCount ? nonMatching : cpu.cards;

  const chosen = pool.slice(0, bluffCount);
  const actuallyHasLie = chosen.some((c) => c.rank !== currentRank);

  return {
    cardsToPlay: chosen,
    isBluff: actuallyHasLie,
  };
}

// CPU decides whether to call Doubt on the player who just played
export function cpuEvaluateDoubt(
  cpu: Player,
  lastPlayer: Player,
  claimedRank: Rank,
  claimedCount: number,
  pileTotalCount: number,
  isWinningMove: boolean
): boolean {
  // If CPU itself played, it cannot doubt itself
  if (cpu.id === lastPlayer.id) return false;

  const personality = cpu.personality || CPU_PERSONALITIES[0];
  const matchingInCpuHand = cpu.cards.filter((c) => c.rank === claimedRank).length;

  // RULE 1: MATHEMATICAL CERTAINTY (100% LIE)
  // If CPU has C cards of claimedRank, and player played K cards, and C + K > 4
  // There are only 4 cards of each rank in total. This is a definitive lie!
  if (claimedCount + matchingInCpuHand > 4) {
    return true; // 100% guaranteed lie
  }

  // RULE 2: CRITICAL WINNING MOVE
  // If the last player played their LAST remaining cards (about to win!)
  if (isWinningMove) {
    // If the opponent is about to win, everyone is on extreme alert!
    // If CPU holds even 1 card of that rank, likelihood opponent had all remaining is lower
    let doubtChance = 0.65;
    if (matchingInCpuHand >= 2) doubtChance = 0.95;
    if (matchingInCpuHand >= 1) doubtChance = 0.8;
    if (claimedCount >= 3) doubtChance = 0.9;
    return Math.random() < doubtChance;
  }

  // Base doubt probability calculation
  let probability = 0.05;

  // Claimed count impact:
  // Playing 4 of a kind is rare and suspicious
  if (claimedCount === 4) {
    probability += 0.6;
  } else if (claimedCount === 3) {
    probability += 0.35;
  } else if (claimedCount === 2) {
    probability += 0.12;
  } else {
    probability += 0.05;
  }

  // CPU's own holding of that rank
  if (matchingInCpuHand === 3) {
    // If CPU has 3, and opponent plays 2, that's already >4 (handled above).
    // If opponent plays 1, it's the exact last one in the deck! High suspicion.
    probability += 0.65;
  } else if (matchingInCpuHand === 2) {
    // If CPU has 2, opponent claimed 2 -> all 4 cards accounted for. Very suspicious!
    if (claimedCount === 2) {
      probability += 0.55;
    } else {
      probability += 0.25;
    }
  } else if (matchingInCpuHand === 1) {
    probability += 0.1;
  }

  // Pile size risk modifier:
  // If pile is huge (12+ cards), CPU is much more cautious about doubting unless sure
  if (pileTotalCount > 12) {
    probability *= 0.6; // Fear of picking up 12+ cards
  } else if (pileTotalCount <= 4) {
    // If pile is small, penalty for wrong doubt is tiny!
    probability *= 1.35;
  }

  // Personality modifier
  probability *= personality.doubtSuspicion * 1.5;

  // Clamp probability between 0 and 0.92 (never 100% unless mathematical proof)
  const finalProbability = Math.min(0.92, Math.max(0.02, probability));

  return Math.random() < finalProbability;
}
