import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Card,
  CpuPersonality,
  DoubtResolution,
  GameLogEntry,
  GamePhase,
  GameStats,
  PlayedCardsRecord,
  Player,
  Rank,
} from './types/game';
import {
  createDeck,
  dealCards,
  getNextRank,
  RANK_LABELS,
  RANK_NAMES,
  sortCardsByRank,
  sortCardsBySuit,
} from './utils/cards';
import { CPU_PERSONALITIES, cpuChooseCardsToPlay, cpuEvaluateDoubt } from './utils/cpuAi';
import { sound } from './utils/audio';
import { TableCenter } from './components/TableCenter';
import { PlayerHand } from './components/PlayerHand';
import { OpponentView } from './components/OpponentView';
import { GameLog } from './components/GameLog';
import { RulesModal } from './components/RulesModal';
import { GameOverModal } from './components/GameOverModal';
import { DoubtBanner } from './components/DoubtBanner';
import {
  BookOpen,
  FastForward,
  Gift,
  HelpCircle,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface AuthoritativeGameState {
  players: Player[];
  pile: Card[];
  currentTurnIndex: number;
  currentRank: Rank;
  lastPlay: PlayedCardsRecord | null;
  phase: GamePhase;
}

export default function App() {
  // Game Setup & Options
  const [phase, setPhase] = useState<GamePhase>('START_MENU');
  const [playerCount, setPlayerCount] = useState<3 | 4>(4);
  const [gameSpeed, setGameSpeed] = useState<'normal' | 'fast'>('normal');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showRules, setShowRules] = useState<boolean>(false);
  // Doubt bonus rule: when a player successfully exposes a liar, their hand decreases by 1 card!
  const [doubtBonus, setDoubtBonus] = useState<boolean>(true);

  // Active Game State for UI rendering
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState<number>(0);
  const [currentRank, setCurrentRank] = useState<Rank>(1); // Starts at A
  const [pile, setPile] = useState<Card[]>([]);
  const [lastPlay, setLastPlay] = useState<PlayedCardsRecord | null>(null);
  const [doubtResult, setDoubtResult] = useState<DoubtResolution | null>(null);
  const [winner, setWinner] = useState<Player | null>(null);

  // Player Hand Interaction
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);

  // Doubt Timing
  const [doubtTimeRemaining, setDoubtTimeRemaining] = useState<number>(100);
  const [activeDoubtShout, setActiveDoubtShout] = useState<{
    doubterName: string;
    targetName: string;
    claimedRankLabel: string;
    cardCount: number;
  } | null>(null);

  // Opponent status text
  const [opponentStatuses, setOpponentStatuses] = useState<Record<string, string>>({});

  // History & Stats
  const [logEntries, setLogEntries] = useState<GameLogEntry[]>([]);
  const [stats, setStats] = useState<GameStats>({
    turnsElapsed: 0,
    doubtsCalled: 0,
    doubtsSuccess: 0,
    bluffsAttempted: 0,
    bluffsSuccessful: 0,
  });

  // AUTHORITATIVE REF: Eliminates React stale closures in timeouts & async workflows
  const stateRef = useRef<AuthoritativeGameState>({
    players: [],
    pile: [],
    currentTurnIndex: 0,
    currentRank: 1,
    lastPlay: null,
    phase: 'START_MENU',
  });

  // Timers and refs
  const doubtTimerRef = useRef<NodeJS.Timeout | null>(null);
  const turnTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const doubtBonusRef = useRef<boolean>(doubtBonus);

  useEffect(() => {
    doubtBonusRef.current = doubtBonus;
  }, [doubtBonus]);

  // Sync sound settings
  useEffect(() => {
    sound.enabled = soundEnabled;
  }, [soundEnabled]);

  // Append to log helper
  const addLog = useCallback((text: string, type: GameLogEntry['type'] = 'info') => {
    setLogEntries((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        text,
        type,
      },
    ]);
  }, []);

  // Initialize a new match
  const startNewGame = useCallback(() => {
    // Clear any active timers
    if (doubtTimerRef.current) clearInterval(doubtTimerRef.current);
    if (turnTimeoutRef.current) clearTimeout(turnTimeoutRef.current);

    sound.playDeal();

    // Setup players: Player + (playerCount - 1) CPUs
    const cpusToUse = CPU_PERSONALITIES.slice(0, playerCount - 1);
    const dealtHands = dealCards(playerCount);

    const initialPlayers: Player[] = [
      {
        id: 'player-human',
        name: 'あなた',
        isHuman: true,
        avatar: '🤠',
        color: 'text-amber-400',
        cards: sortCardsByRank(dealtHands[0]),
      },
      ...cpusToUse.map((cpu, index) => ({
        id: cpu.id,
        name: cpu.name,
        isHuman: false,
        avatar: cpu.avatar,
        color: cpu.color,
        personality: cpu,
        cards: dealtHands[index + 1],
      })),
    ];

    // Update Authoritative Ref
    stateRef.current = {
      players: initialPlayers,
      pile: [],
      currentTurnIndex: 0, // Human goes first
      currentRank: 1, // 'A'
      lastPlay: null,
      phase: 'PLAYER_TURN',
    };

    // Update React State
    setPlayers(initialPlayers);
    setCurrentTurnIndex(0);
    setCurrentRank(1);
    setPile([]);
    setLastPlay(null);
    setDoubtResult(null);
    setSelectedCardIds([]);
    setWinner(null);
    setActiveDoubtShout(null);
    setOpponentStatuses({});
    setLogEntries([]);
    setStats({
      turnsElapsed: 0,
      doubtsCalled: 0,
      doubtsSuccess: 0,
      bluffsAttempted: 0,
      bluffsSuccessful: 0,
    });

    setPhase('PLAYER_TURN');
    addLog(`ゲーム開始！52枚を均等に配りました。まずは「A」からスタートです！`, 'info');
  }, [playerCount, addLog]);

  // Advance to next turn
  const advanceToNextTurn = useCallback(
    (nextPlayerIndex: number, nextRank: Rank) => {
      const currentPlayers = stateRef.current.players;
      // Check if any player has 0 cards remaining
      const potentialWinner = currentPlayers.find((p) => p.cards.length === 0);
      if (potentialWinner) {
        stateRef.current.phase = 'GAME_OVER';
        setWinner(potentialWinner);
        setPhase('GAME_OVER');
        addLog(`【ゲーム終了】${potentialWinner.name} の手札が0枚になり勝利しました！`, 'win');
        return;
      }

      stateRef.current.currentTurnIndex = nextPlayerIndex;
      stateRef.current.currentRank = nextRank;
      stateRef.current.lastPlay = null;

      setCurrentTurnIndex(nextPlayerIndex);
      setCurrentRank(nextRank);
      setLastPlay(null);
      setDoubtResult(null);
      setSelectedCardIds([]);
      setOpponentStatuses({});

      const nextPlayer = currentPlayers[nextPlayerIndex];
      if (nextPlayer.isHuman) {
        stateRef.current.phase = 'PLAYER_TURN';
        setPhase('PLAYER_TURN');
      } else {
        stateRef.current.phase = 'CPU_THINKING';
        setPhase('CPU_THINKING');
      }
    },
    [addLog]
  );

  // Execute Doubt Resolution
  const resolveDoubt = useCallback(
    (doubterId: string, targetId: string) => {
      if (doubtTimerRef.current) clearInterval(doubtTimerRef.current);
      stateRef.current.phase = 'DOUBT_REVEAL';
      setPhase('DOUBT_REVEAL');

      const currentState = stateRef.current;
      const record = currentState.lastPlay;
      if (!record) return;

      const doubter = currentState.players.find((p) => p.id === doubterId)!;
      const target = currentState.players.find((p) => p.id === targetId)!;

      // Dramatic sound and banner
      sound.playDoubtShout();
      setActiveDoubtShout({
        doubterName: doubter.name,
        targetName: target.name,
        claimedRankLabel: RANK_LABELS[record.claimedRank],
        cardCount: record.cards.length,
      });

      addLog(`【ダウト宣言】${doubter.name} が ${target.name} に「ダウト！」と叫びました！`, 'doubt_call');

      // After banner flash (1.1s), reveal cards and apply consequences
      setTimeout(() => {
        setActiveDoubtShout(null);

        const currentPileCards = [...stateRef.current.pile];
        const wasLie = record.isLie;

        let penalizedPlayerId: string;
        let penalizedPlayerName: string;
        let penalizedBeforeCount = 0;
        let penalizedAfterCount = 0;
        let honestPlayerName: string | undefined;
        let honestPlayerCount: number | undefined;
        let doubtBonusPlayerName: string | undefined;
        let doubtBonusPlayerAfterCount: number | undefined;

        if (wasLie) {
          // LIAR CAUGHT! Target took cards and lied
          // Penalty: target (liar) takes the entire pile
          penalizedPlayerId = target.id;
          penalizedPlayerName = target.name;
          sound.playDoubtSuccess();

          // Apply pile to target
          const targetBefore = stateRef.current.players.find((p) => p.id === target.id)!.cards.length;
          penalizedBeforeCount = targetBefore;
          penalizedAfterCount = targetBefore + currentPileCards.length;

          let updatedPlayers = stateRef.current.players.map((p) => {
            if (p.id === target.id) {
              return {
                ...p,
                cards: sortCardsByRank([...p.cards, ...currentPileCards]),
              };
            }
            return p;
          });

          // Check for Doubt Bonus: Doubter successfully exposed a lie!
          if (doubtBonusRef.current) {
            const doubterBefore = updatedPlayers.find((p) => p.id === doubter.id)!;
            if (doubterBefore.cards.length > 0) {
              // Doubter discards 1 card (first/highest card)
              doubtBonusPlayerName = doubter.name;
              doubtBonusPlayerAfterCount = doubterBefore.cards.length - 1;

              updatedPlayers = updatedPlayers.map((p) => {
                if (p.id === doubter.id) {
                  return {
                    ...p,
                    cards: p.cards.slice(1),
                  };
                }
                return p;
              });

              addLog(
                `【ダウト成功】嘘でした！${target.name} は場札 ${currentPileCards.length}枚 を全回収！(手札: ${targetBefore}枚 → ${penalizedAfterCount}枚)`,
                'doubt_success'
              );
              addLog(
                `【ダウト成功ボーナス】${doubter.name} の手札が1枚減りました！(手札: ${doubterBefore.cards.length}枚 → ${doubtBonusPlayerAfterCount}枚)`,
                'info'
              );
            } else {
              addLog(
                `【ダウト成功】嘘でした！${target.name} は場札 ${currentPileCards.length}枚 を全回収！(手札: ${targetBefore}枚 → ${penalizedAfterCount}枚)`,
                'doubt_success'
              );
            }
          } else {
            addLog(
              `【ダウト成功】嘘でした！出されたカードの中に指定の「${RANK_LABELS[record.claimedRank]}」以外が含まれていました！${target.name} は場札 ${currentPileCards.length}枚 を全回収！(手札: ${targetBefore}枚 → ${penalizedAfterCount}枚)`,
              'doubt_success'
            );
          }

          // Authoritative state update
          stateRef.current.players = updatedPlayers;
          stateRef.current.pile = [];
          setPlayers(updatedPlayers);
          setPile([]);
        } else {
          // TRUTH! Doubter was wrong
          // Penalty: doubter takes the entire pile
          penalizedPlayerId = doubter.id;
          penalizedPlayerName = doubter.name;
          sound.playDoubtFail();

          const doubterBefore = stateRef.current.players.find((p) => p.id === doubter.id)!.cards.length;
          penalizedBeforeCount = doubterBefore;
          penalizedAfterCount = doubterBefore + currentPileCards.length;

          const targetPlayer = stateRef.current.players.find((p) => p.id === target.id)!;
          honestPlayerName = target.name;
          honestPlayerCount = targetPlayer.cards.length;

          // Target played truthfully, so target's cards STAY OUT OF HAND (hand remains reduced!)
          // Doubter takes the pile
          const updatedPlayers = stateRef.current.players.map((p) => {
            if (p.id === doubter.id) {
              return {
                ...p,
                cards: sortCardsByRank([...p.cards, ...currentPileCards]),
              };
            }
            return p;
          });

          stateRef.current.players = updatedPlayers;
          stateRef.current.pile = [];
          setPlayers(updatedPlayers);
          setPile([]);

          addLog(
            `【ダウト失敗】真実でした！出されたカードは本物の「${RANK_LABELS[record.claimedRank]}」でした！${target.name} の手札は正常に出され ${honestPlayerCount}枚 に減少！ダウトを間違えた ${doubter.name} は場札 ${currentPileCards.length}枚 を全回収！(手札: ${doubterBefore}枚 → ${penalizedAfterCount}枚)`,
            'doubt_failed'
          );
        }

        // Set Doubt Result for banner display
        const resolution: DoubtResolution = {
          doubterId: doubter.id,
          doubterName: doubter.name,
          targetPlayerId: target.id,
          targetPlayerName: target.name,
          claimedRank: record.claimedRank,
          revealedCards: record.cards,
          wasLie,
          pileCount: currentPileCards.length,
          penalizedPlayerId,
          penalizedPlayerName,
          penalizedPlayerBeforeCount: penalizedBeforeCount,
          penalizedPlayerAfterCount: penalizedAfterCount,
          honestPlayerName,
          honestPlayerCount,
          doubtBonusPlayerName,
          doubtBonusPlayerAfterCount,
        };
        setDoubtResult(resolution);

        // Update match stats
        setStats((prev) => ({
          ...prev,
          doubtsCalled: prev.doubtsCalled + 1,
          doubtsSuccess: prev.doubtsSuccess + (wasLie ? 1 : 0),
        }));

        // Determine next player: next in rotation from target
        const nextIndex =
          (stateRef.current.players.findIndex((p) => p.id === target.id) + 1) %
          stateRef.current.players.length;
        const nextRank = getNextRank(stateRef.current.currentRank);

        const delay = gameSpeed === 'fast' ? 2200 : 3400;
        turnTimeoutRef.current = setTimeout(() => {
          advanceToNextTurn(nextIndex, nextRank);
        }, delay);
      }, 1100);
    },
    [gameSpeed, addLog, advanceToNextTurn]
  );

  // When cards are placed, start Doubt window
  const startDoubtWindow = useCallback(
    (record: PlayedCardsRecord) => {
      stateRef.current.phase = 'WAITING_FOR_DOUBT';
      setPhase('WAITING_FOR_DOUBT');

      const isHumanPlayed = record.playerId === 'player-human';
      const lastPlayer = stateRef.current.players.find((p) => p.id === record.playerId)!;
      const isWinningMove = lastPlayer.cards.length === 0;

      // Case A: Human played -> CPUs decide whether to doubt
      if (isHumanPlayed) {
        const thinkDelay = gameSpeed === 'fast' ? 900 : 1500;
        turnTimeoutRef.current = setTimeout(() => {
          const cpus = stateRef.current.players.filter((p) => !p.isHuman);
          let doubter: Player | null = null;

          for (const cpu of cpus) {
            const wouldDoubt = cpuEvaluateDoubt(
              cpu,
              lastPlayer,
              record.claimedRank,
              record.cards.length,
              stateRef.current.pile.length,
              isWinningMove
            );
            if (wouldDoubt) {
              doubter = cpu;
              break;
            }
          }

          if (doubter) {
            resolveDoubt(doubter.id, lastPlayer.id);
          } else {
            // No CPU doubted: Safe!
            addLog(
              `誰もダウトしませんでした。あなたのカードは手札から正常に減り、場札に加わりました。(残り手札: ${lastPlayer.cards.length}枚)`,
              'info'
            );
            const nextIndex =
              (stateRef.current.currentTurnIndex + 1) % stateRef.current.players.length;
            const nextRank = getNextRank(stateRef.current.currentRank);

            const advanceDelay = gameSpeed === 'fast' ? 600 : 1000;
            turnTimeoutRef.current = setTimeout(() => {
              advanceToNextTurn(nextIndex, nextRank);
            }, advanceDelay);
          }
        }, thinkDelay);
        return;
      }

      // Case B: A CPU played -> Human has a timer window to call Doubt
      const totalTimeMs = gameSpeed === 'fast' ? 3000 : 5000;
      const intervalMs = 50;
      let elapsed = 0;
      setDoubtTimeRemaining(100);

      doubtTimerRef.current = setInterval(() => {
        elapsed += intervalMs;
        const remainingPercent = Math.max(0, 100 - (elapsed / totalTimeMs) * 100);
        setDoubtTimeRemaining(remainingPercent);

        if (elapsed >= totalTimeMs) {
          if (doubtTimerRef.current) clearInterval(doubtTimerRef.current);

          // Human passed (timed out) -> check if another CPU calls doubt
          const otherCpus = stateRef.current.players.filter(
            (p) => !p.isHuman && p.id !== record.playerId
          );
          let doubter: Player | null = null;

          for (const cpu of otherCpus) {
            const wouldDoubt = cpuEvaluateDoubt(
              cpu,
              lastPlayer,
              record.claimedRank,
              record.cards.length,
              stateRef.current.pile.length,
              isWinningMove
            );
            if (wouldDoubt) {
              doubter = cpu;
              break;
            }
          }

          if (doubter) {
            resolveDoubt(doubter.id, lastPlayer.id);
          } else {
            addLog(`ダウトはありませんでした。${record.playerName} のカードは場札に加わりました。`, 'info');
            const nextIndex =
              (stateRef.current.currentTurnIndex + 1) % stateRef.current.players.length;
            const nextRank = getNextRank(stateRef.current.currentRank);
            advanceToNextTurn(nextIndex, nextRank);
          }
        }
      }, intervalMs);
    },
    [gameSpeed, addLog, advanceToNextTurn, resolveDoubt]
  );

  // Human calls Doubt button click
  const handleHumanCallDoubt = () => {
    if (!stateRef.current.lastPlay || phase !== 'WAITING_FOR_DOUBT') return;
    if (doubtTimerRef.current) clearInterval(doubtTimerRef.current);

    const human = stateRef.current.players.find((p) => p.isHuman)!;
    const target = stateRef.current.players.find((p) => p.id === stateRef.current.lastPlay!.playerId)!;

    resolveDoubt(human.id, target.id);
  };

  // Human passes Doubt button click
  const handleHumanPassDoubt = () => {
    if (!stateRef.current.lastPlay || phase !== 'WAITING_FOR_DOUBT') return;
    if (doubtTimerRef.current) clearInterval(doubtTimerRef.current);

    const record = stateRef.current.lastPlay!;
    const target = stateRef.current.players.find((p) => p.id === record.playerId)!;
    const isWinningMove = target.cards.length === 0;

    // Check if other CPUs want to call Doubt
    const otherCpus = stateRef.current.players.filter((p) => !p.isHuman && p.id !== record.playerId);
    let doubter: Player | null = null;

    for (const cpu of otherCpus) {
      const wouldDoubt = cpuEvaluateDoubt(
        cpu,
        target,
        record.claimedRank,
        record.cards.length,
        stateRef.current.pile.length,
        isWinningMove
      );
      if (wouldDoubt) {
        doubter = cpu;
        break;
      }
    }

    if (doubter) {
      resolveDoubt(doubter.id, target.id);
    } else {
      addLog(`あなたはスルーしました。ダウトは発生しませんでした。`, 'info');
      const nextIndex =
        (stateRef.current.currentTurnIndex + 1) % stateRef.current.players.length;
      const nextRank = getNextRank(stateRef.current.currentRank);
      advanceToNextTurn(nextIndex, nextRank);
    }
  };

  // Human plays selected cards
  const handleHumanPlayCards = () => {
    if (phase !== 'PLAYER_TURN') return;
    const human = stateRef.current.players.find((p) => p.isHuman);
    if (!human || selectedCardIds.length === 0 || selectedCardIds.length > 4) return;

    sound.playCardPlace();

    const currentRankTarget = stateRef.current.currentRank;
    const playedCards = human.cards.filter((c) => selectedCardIds.includes(c.id));
    const remainingCards = human.cards.filter((c) => !selectedCardIds.includes(c.id));

    // Check if bluff
    const isLie = playedCards.some((c) => c.rank !== currentRankTarget);

    if (isLie) {
      setStats((prev) => ({ ...prev, bluffsAttempted: prev.bluffsAttempted + 1 }));
    }

    const record: PlayedCardsRecord = {
      playerId: human.id,
      playerName: human.name,
      claimedRank: currentRankTarget,
      cards: playedCards,
      isLie,
    };

    // 1. Permanently remove cards from player hand in authoritative state
    const updatedPlayers = stateRef.current.players.map((p) =>
      p.id === human.id ? { ...p, cards: remainingCards } : p
    );
    // 2. Add to center pile
    const updatedPile = [...stateRef.current.pile, ...playedCards];

    stateRef.current.players = updatedPlayers;
    stateRef.current.pile = updatedPile;
    stateRef.current.lastPlay = record;

    setPlayers(updatedPlayers);
    setPile(updatedPile);
    setLastPlay(record);
    setSelectedCardIds([]);

    addLog(
      `あなた が「${RANK_LABELS[currentRankTarget]}」として ${playedCards.length}枚 のカードを出しました。（手札残り: ${remainingCards.length}枚）`,
      'play'
    );

    setStats((prev) => ({ ...prev, turnsElapsed: prev.turnsElapsed + 1 }));

    startDoubtWindow(record);
  };

  // CPU Turn Execution Loop
  useEffect(() => {
    if (phase !== 'CPU_THINKING') return;

    const currentCpu = stateRef.current.players[stateRef.current.currentTurnIndex];
    if (!currentCpu || currentCpu.isHuman) return;

    setOpponentStatuses((prev) => ({
      ...prev,
      [currentCpu.id]: '手札を吟味中...',
    }));

    const cpuDelay = gameSpeed === 'fast' ? 700 : 1300;
    turnTimeoutRef.current = setTimeout(() => {
      const currentRankTarget = stateRef.current.currentRank;
      const { cardsToPlay, isBluff } = cpuChooseCardsToPlay(currentCpu, currentRankTarget);
      sound.playCardPlace();

      const remainingCpuCards = currentCpu.cards.filter(
        (c) => !cardsToPlay.some((playCard) => playCard.id === c.id)
      );

      const record: PlayedCardsRecord = {
        playerId: currentCpu.id,
        playerName: currentCpu.name,
        claimedRank: currentRankTarget,
        cards: cardsToPlay,
        isLie: isBluff,
      };

      // 1. Permanently remove cards from CPU hand in authoritative state
      const updatedPlayers = stateRef.current.players.map((p) =>
        p.id === currentCpu.id ? { ...p, cards: remainingCpuCards } : p
      );
      // 2. Add to center pile
      const updatedPile = [...stateRef.current.pile, ...cardsToPlay];

      stateRef.current.players = updatedPlayers;
      stateRef.current.pile = updatedPile;
      stateRef.current.lastPlay = record;

      setPlayers(updatedPlayers);
      setPile(updatedPile);
      setLastPlay(record);

      setOpponentStatuses((prev) => ({
        ...prev,
        [currentCpu.id]: `「${RANK_LABELS[currentRankTarget]}」を${cardsToPlay.length}枚提出`,
      }));

      addLog(
        `${currentCpu.name} が「${RANK_LABELS[currentRankTarget]}」として ${cardsToPlay.length}枚 出しました。（残り手札: ${remainingCpuCards.length}枚）`,
        'play'
      );

      setStats((prev) => ({ ...prev, turnsElapsed: prev.turnsElapsed + 1 }));

      startDoubtWindow(record);
    }, cpuDelay);

    return () => {
      if (turnTimeoutRef.current) clearTimeout(turnTimeoutRef.current);
    };
  }, [phase, gameSpeed, addLog, startDoubtWindow]);

  // Player Hand interactions
  const handleToggleCard = (cardId: string) => {
    sound.playCardSelect();
    setSelectedCardIds((prev) => {
      if (prev.includes(cardId)) {
        return prev.filter((id) => id !== cardId);
      }
      if (prev.length >= 4) {
        return prev;
      }
      return [...prev, cardId];
    });
  };

  const handleSortByRank = () => {
    sound.playCardSelect();
    const updated = stateRef.current.players.map((p) =>
      p.isHuman ? { ...p, cards: sortCardsByRank(p.cards) } : p
    );
    stateRef.current.players = updated;
    setPlayers(updated);
  };

  const handleSortBySuit = () => {
    sound.playCardSelect();
    const updated = stateRef.current.players.map((p) =>
      p.isHuman ? { ...p, cards: sortCardsBySuit(p.cards) } : p
    );
    stateRef.current.players = updated;
    setPlayers(updated);
  };

  const handleQuickSelectMatching = () => {
    sound.playCardSelect();
    const human = stateRef.current.players.find((p) => p.isHuman);
    if (!human) return;
    const matchingIds = human.cards
      .filter((c) => c.rank === currentRank)
      .slice(0, 4)
      .map((c) => c.id);
    setSelectedCardIds(matchingIds);
  };

  const handleClearSelection = () => {
    setSelectedCardIds([]);
  };

  const humanPlayer = players.find((p) => p.isHuman);
  const opponents = players.filter((p) => !p.isHuman);

  return (
    <div className="min-h-screen bg-[#071a12] text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Universal Top Bar */}
      <header className="w-full border-b border-emerald-500/20 bg-black/40 backdrop-blur-md px-4 sm:px-6 py-2.5 flex items-center justify-between z-30">
        {/* Brand / Game Title */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-bold text-slate-950 shadow-md">
            ♠
          </div>
          <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">
            トランプ ダウト
          </span>
          <span className="text-xs text-emerald-400/80 hidden sm:inline">
            · 52枚の心理戦
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Doubt Bonus Toggle */}
          <button
            onClick={() => setDoubtBonus((prev) => !prev)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-colors border cursor-pointer ${
              doubtBonus
                ? 'bg-amber-400/20 text-amber-300 border-amber-400/50 shadow-sm'
                : 'bg-white/5 text-slate-400 border-white/10'
            }`}
            title="ダウト成功時に手札が1枚減るボーナスルール"
          >
            <Gift className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">成功ボーナス:</span>
            <span>{doubtBonus ? 'あり (手札-1)' : 'なし'}</span>
          </button>

          {/* Rules button */}
          <button
            onClick={() => setShowRules(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 hover:text-white transition-colors border border-white/10 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>ルール</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled((prev) => !prev)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors border border-white/10 cursor-pointer"
            title={soundEnabled ? '効果音をミュート' : '効果音をオン'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {/* Speed Toggle */}
          {phase !== 'START_MENU' && (
            <button
              onClick={() => setGameSpeed((prev) => (prev === 'normal' ? 'fast' : 'normal'))}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-colors border cursor-pointer ${
                gameSpeed === 'fast'
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                  : 'bg-white/5 text-slate-300 border-white/10'
              }`}
              title="進行速度切り替え"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {gameSpeed === 'fast' ? '高速' : '標準'}
              </span>
            </button>
          )}

          {/* Restart match button */}
          {phase !== 'START_MENU' && (
            <button
              onClick={startNewGame}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors border border-white/10 cursor-pointer"
              title="最初からやり直す"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-between p-2 sm:p-4 max-w-7xl mx-auto w-full relative">
        {/* VIEW 1: START MENU */}
        {phase === 'START_MENU' ? (
          <div className="flex-1 flex flex-col items-center justify-center max-w-xl mx-auto text-center py-8 px-4">
            {/* Casino Badge / Mascot */}
            <div className="relative mb-6">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-emerald-800 to-emerald-950 border-2 border-amber-400/50 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                <span className="text-5xl sm:text-6xl drop-shadow-lg">🃏</span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-500 mb-3 tracking-tight">
              トランプ ダウト
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-md mx-auto mb-8 leading-relaxed">
              AからKまで順番にカードを裏向きで提出。
              相手の嘘を見抜いて「ダウト！」とコール！
              手札をいち早く出し切れば勝利！
            </p>

            {/* Match Setup Options */}
            <div className="w-full bg-black/40 backdrop-blur-md rounded-2xl border border-emerald-500/30 p-5 mb-8 text-left space-y-4 shadow-xl">
              <div>
                <label className="text-xs font-bold text-amber-300 uppercase tracking-wider block mb-2">
                  プレイヤー人数 (52枚均等分配)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPlayerCount(4)}
                    className={`py-3 px-4 rounded-xl border text-sm font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      playerCount === 4
                        ? 'bg-emerald-950/80 border-amber-400 text-white shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                        : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>4人対戦（王道）</span>
                    <span className="text-[11px] font-normal text-emerald-300/80">
                      各自 13枚
                    </span>
                  </button>

                  <button
                    onClick={() => setPlayerCount(3)}
                    className={`py-3 px-4 rounded-xl border text-sm font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      playerCount === 3
                        ? 'bg-emerald-950/80 border-amber-400 text-white shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                        : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>3人対戦</span>
                    <span className="text-[11px] font-normal text-emerald-300/80">
                      各自 17~18枚
                    </span>
                  </button>
                </div>
              </div>

              {/* Doubt Bonus Setting */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    ダウト成功ボーナス
                  </label>
                  <span className="text-[11px] text-emerald-300">
                    見破り成功で手札が1枚減る
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setDoubtBonus(true)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      doubtBonus
                        ? 'bg-emerald-950/80 border-amber-400 text-white shadow-sm'
                        : 'bg-slate-900/60 border-slate-700 text-slate-400'
                    }`}
                  >
                    あり（成功で手札-1枚）
                  </button>
                  <button
                    onClick={() => setDoubtBonus(false)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      !doubtBonus
                        ? 'bg-emerald-950/80 border-amber-400 text-white shadow-sm'
                        : 'bg-slate-900/60 border-slate-700 text-slate-400'
                    }`}
                  >
                    なし（嘘つき全回収のみ）
                  </button>
                </div>
              </div>

              {/* Speed Option */}
              <div>
                <label className="text-xs font-bold text-amber-300 uppercase tracking-wider block mb-2">
                  ゲーム進行スピード
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setGameSpeed('normal')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      gameSpeed === 'normal'
                        ? 'bg-emerald-950/80 border-amber-400 text-white'
                        : 'bg-slate-900/60 border-slate-700 text-slate-400'
                    }`}
                  >
                    標準（じっくり）
                  </button>
                  <button
                    onClick={() => setGameSpeed('fast')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      gameSpeed === 'fast'
                        ? 'bg-emerald-950/80 border-amber-400 text-white'
                        : 'bg-slate-900/60 border-slate-700 text-slate-400'
                    }`}
                  >
                    高速（サクサク）
                  </button>
                </div>
              </div>
            </div>

            {/* Launch buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              <button
                onClick={startNewGame}
                className="w-full py-4 px-6 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-base sm:text-lg rounded-2xl shadow-xl shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>ゲームを始める</span>
              </button>

              <button
                onClick={() => setShowRules(true)}
                className="w-full sm:w-auto py-4 px-6 bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-semibold text-sm rounded-2xl border border-slate-700 transition-colors cursor-pointer whitespace-nowrap"
              >
                ルールを確認
              </button>
            </div>
          </div>
        ) : (
          /* VIEW 2: ACTIVE PLAYING ARENA */
          <div className="w-full flex-1 flex flex-col justify-between">
            {/* Top Zone: Opponent CPUs */}
            <div className="w-full flex items-center justify-around gap-2 sm:gap-4 my-2 px-1">
              {opponents.map((opp) => {
                const isActive = players[currentTurnIndex]?.id === opp.id;
                const isDoubting = activeDoubtShout?.doubterName === opp.name;
                return (
                  <OpponentView
                    key={opp.id}
                    player={opp}
                    isActiveTurn={isActive}
                    statusText={opponentStatuses[opp.id]}
                    isDoubting={isDoubting}
                  />
                );
              })}
            </div>

            {/* Center Felt Board */}
            <div className="w-full flex items-center justify-center my-auto py-1">
              <TableCenter
                currentRank={currentRank}
                pile={pile}
                lastPlay={lastPlay}
                doubtResult={doubtResult}
                isDoubtWindowOpen={phase === 'WAITING_FOR_DOUBT'}
                canPlayerDoubt={lastPlay?.playerId !== 'player-human'}
                doubtTimeRemaining={doubtTimeRemaining}
                onCallDoubt={handleHumanCallDoubt}
                onPassDoubt={handleHumanPassDoubt}
                activePlayer={players[currentTurnIndex]}
              />
            </div>

            {/* Bottom Zone: Human Player Hand & Controls */}
            {humanPlayer && (
              <PlayerHand
                cards={humanPlayer.cards}
                selectedCardIds={selectedCardIds}
                currentRank={currentRank}
                isPlayerTurn={phase === 'PLAYER_TURN'}
                onCardToggle={handleToggleCard}
                onPlayCards={handleHumanPlayCards}
                onSortByRank={handleSortByRank}
                onSortBySuit={handleSortBySuit}
                onQuickSelectMatching={handleQuickSelectMatching}
                onClearSelection={handleClearSelection}
              />
            )}

            {/* Collapsible / Floating Game History Log at bottom */}
            <div className="w-full max-w-4xl mx-auto mt-2">
              <GameLog entries={logEntries} />
            </div>
          </div>
        )}
      </main>

      {/* Dramatic Fullscreen Doubt Shout Banner */}
      {activeDoubtShout && (
        <DoubtBanner
          doubterName={activeDoubtShout.doubterName}
          targetName={activeDoubtShout.targetName}
          claimedRankLabel={activeDoubtShout.claimedRankLabel}
          cardCount={activeDoubtShout.cardCount}
        />
      )}

      {/* Rules Modal */}
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />

      {/* Game Over Modal */}
      {phase === 'GAME_OVER' && winner && (
        <GameOverModal
          winner={winner}
          players={players}
          stats={stats}
          onPlayAgain={startNewGame}
          onReturnToMenu={() => setPhase('START_MENU')}
        />
      )}
    </div>
  );
}
