import { Card, Rank, Suit } from '../types/game';

export const SUITS: { suit: Suit; symbol: string; color: string; name: string }[] = [
  { suit: 'spades', symbol: '♠', color: 'text-slate-900', name: 'スペード' },
  { suit: 'hearts', symbol: '♥', color: 'text-red-600', name: 'ハート' },
  { suit: 'diamonds', symbol: '♦', color: 'text-red-600', name: 'ダイヤ' },
  { suit: 'clubs', symbol: '♣', color: 'text-slate-900', name: 'クラブ' },
];

export const RANK_LABELS: Record<Rank, string> = {
  1: 'A',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: 'J',
  12: 'Q',
  13: 'K',
};

export const RANK_NAMES: Record<Rank, string> = {
  1: 'エース (A)',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: 'ジャック (J)',
  12: 'クイーン (Q)',
  13: 'キング (K)',
};

// Generate standard 52 deck without Jokers
export function createDeck(): Card[] {
  const deck: Card[] = [];
  const suits: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
  for (const suit of suits) {
    for (let r = 1; r <= 13; r++) {
      const rank = r as Rank;
      deck.push({
        id: `${suit}-${rank}`,
        suit,
        rank,
        label: RANK_LABELS[rank],
      });
    }
  }
  return deck;
}

// Fisher-Yates shuffle
export function shuffleCards(cards: Card[]): Card[] {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Deal deck evenly to N players
export function dealCards(playerCount: number): Card[][] {
  const deck = shuffleCards(createDeck());
  const hands: Card[][] = Array.from({ length: playerCount }, () => []);

  deck.forEach((card, index) => {
    hands[index % playerCount].push(card);
  });

  return hands;
}

// Next rank: 1 -> 2 -> ... -> 13 -> 1
export function getNextRank(currentRank: Rank): Rank {
  return (currentRank === 13 ? 1 : (currentRank + 1)) as Rank;
}

// Sort cards by rank (1 to 13), then by suit
export function sortCardsByRank(cards: Card[]): Card[] {
  const suitOrder: Record<Suit, number> = {
    spades: 0,
    hearts: 1,
    diamonds: 2,
    clubs: 3,
  };

  return [...cards].sort((a, b) => {
    if (a.rank !== b.rank) {
      return a.rank - b.rank;
    }
    return suitOrder[a.suit] - suitOrder[b.suit];
  });
}

// Sort cards by suit, then by rank
export function sortCardsBySuit(cards: Card[]): Card[] {
  const suitOrder: Record<Suit, number> = {
    spades: 0,
    hearts: 1,
    diamonds: 2,
    clubs: 3,
  };

  return [...cards].sort((a, b) => {
    if (suitOrder[a.suit] !== suitOrder[b.suit]) {
      return suitOrder[a.suit] - suitOrder[b.suit];
    }
    return a.rank - b.rank;
  });
}
