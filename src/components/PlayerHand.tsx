import React from 'react';
import { Card, Rank } from '../types/game';
import { RANK_LABELS } from '../utils/cards';
import { PlayingCard } from './PlayingCard';
import { ArrowDownUp, Check, Layers, Sparkles, X } from 'lucide-react';

interface PlayerHandProps {
  cards: Card[];
  selectedCardIds: string[];
  currentRank: Rank;
  isPlayerTurn: boolean;
  onCardToggle: (cardId: string) => void;
  onPlayCards: () => void;
  onSortByRank: () => void;
  onSortBySuit: () => void;
  onQuickSelectMatching: () => void;
  onClearSelection: () => void;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
  cards,
  selectedCardIds,
  currentRank,
  isPlayerTurn,
  onCardToggle,
  onPlayCards,
  onSortByRank,
  onSortBySuit,
  onQuickSelectMatching,
  onClearSelection,
}) => {
  const matchingCardsCount = cards.filter((c) => c.rank === currentRank).length;
  const selectedCount = selectedCardIds.length;
  const canPlay = isPlayerTurn && selectedCount >= 1 && selectedCount <= 4;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center select-none pt-2 pb-4">
      {/* Hand Controls & Turn Banner */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 mb-2">
        {/* Left: Player Status & Selected Count */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs sm:text-sm font-bold text-white">あなたの手札</span>
            <span className="text-xs text-slate-300 tabular-nums">
              ({cards.length}枚)
            </span>
          </div>

          <div className="h-4 w-px bg-white/20 hidden sm:block" />

          {/* Selected feedback */}
          <div className="text-xs text-amber-300 font-semibold flex items-center gap-1">
            <span>選択:</span>
            <span
              className={`tabular-nums px-1.5 py-0.5 rounded text-xs font-bold ${
                selectedCount > 0 ? 'bg-amber-400 text-slate-950' : 'text-slate-400'
              }`}
            >
              {selectedCount}/4枚
            </span>
          </div>

          {selectedCount > 0 && (
            <button
              onClick={onClearSelection}
              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-0.5 hover:underline ml-1 cursor-pointer"
            >
              <X className="w-3 h-3" />
              クリア
            </button>
          )}
        </div>

        {/* Right: Quick actions & Primary Play Button */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Quick select matching cards */}
          {matchingCardsCount > 0 && (
            <button
              onClick={onQuickSelectMatching}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-200 border border-emerald-500/30 flex items-center gap-1 transition-colors cursor-pointer"
              title="現在の指定数字と同じカードを自動選択"
            >
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>「{RANK_LABELS[currentRank]}」を選択 ({matchingCardsCount}枚)</span>
            </button>
          )}

          {/* Sort buttons */}
          <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={onSortByRank}
              className="px-2 py-1 text-[11px] font-medium text-slate-300 hover:text-white rounded hover:bg-slate-700/60 transition-colors cursor-pointer flex items-center gap-1"
              title="数字の小さい順に整列 (A〜K)"
            >
              <ArrowDownUp className="w-3 h-3" />
              数字順
            </button>
            <button
              onClick={onSortBySuit}
              className="px-2 py-1 text-[11px] font-medium text-slate-300 hover:text-white rounded hover:bg-slate-700/60 transition-colors cursor-pointer flex items-center gap-1"
              title="スート順に整列"
            >
              <Layers className="w-3 h-3" />
              マーク順
            </button>
          </div>

          {/* Play Action Button */}
          {isPlayerTurn && (
            <button
              onClick={onPlayCards}
              disabled={!canPlay}
              className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg transition-all cursor-pointer ${
                canPlay
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-amber-400/30 active:scale-95 animate-pulse'
                  : 'bg-slate-700/60 text-slate-400 cursor-not-allowed border border-white/5'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>カードを出す {selectedCount > 0 ? `(${selectedCount}枚)` : ''}</span>
            </button>
          )}
        </div>
      </div>

      {/* Hand Cards Area */}
      <div className="w-full bg-slate-950/40 border border-white/10 rounded-2xl p-3 sm:p-4 min-h-[120px] flex items-center justify-center overflow-x-auto scrollbar-thin">
        {cards.length === 0 ? (
          <div className="text-emerald-400 font-bold text-sm">手札がありません (勝利！)</div>
        ) : (
          <div className="flex items-center -space-x-3 sm:-space-x-4 hover:-space-x-2 transition-all duration-200 py-3 px-2">
            {cards.map((card) => {
              const isSelected = selectedCardIds.includes(card.id);
              const isTargetRank = card.rank === currentRank;

              return (
                <PlayingCard
                  key={card.id}
                  card={card}
                  selected={isSelected}
                  highlight={isTargetRank && !isSelected}
                  onClick={() => onCardToggle(card.id)}
                  size="md"
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Helpful turn hint */}
      <div className="mt-1.5 text-center text-xs text-slate-400">
        {isPlayerTurn ? (
          <span className="text-amber-300 font-medium">
            あなたの手番です！「{RANK_LABELS[currentRank]}」として裏向きに出すカードを1〜4枚選んでください（嘘でもOK！）
          </span>
        ) : (
          <span>他のプレイヤーの手番です。カードが出されたらダウトするか見極めましょう。</span>
        )}
      </div>
    </div>
  );
};
