import React from 'react';
import { Player } from '../types/game';
import { PlayingCard } from './PlayingCard';
import { Flame, Sparkles } from 'lucide-react';

interface OpponentViewProps {
  player: Player;
  isActiveTurn: boolean;
  statusText?: string;
  isDoubting?: boolean;
}

export const OpponentView: React.FC<OpponentViewProps> = ({
  player,
  isActiveTurn,
  statusText,
  isDoubting,
}) => {
  const cardCount = player.cards.length;

  return (
    <div
      className={`relative flex flex-col items-center p-2.5 sm:p-3 rounded-2xl transition-all duration-300 backdrop-blur-md ${
        isActiveTurn
          ? 'bg-amber-500/10 border-2 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)] scale-105'
          : 'bg-black/40 border border-slate-700/60 shadow-lg'
      }`}
    >
      {/* Active turn badge */}
      {isActiveTurn && (
        <div className="absolute -top-3 px-2 py-0.5 bg-amber-400 text-slate-950 font-black text-[10px] rounded-full shadow-md flex items-center gap-1 uppercase tracking-wider animate-bounce">
          <Sparkles className="w-2.5 h-2.5" />
          手番中
        </div>
      )}

      {/* Doubting Shout Floating Badge */}
      {isDoubting && (
        <div className="absolute -top-4 px-3 py-1 bg-red-600 text-white font-black text-xs sm:text-sm rounded-full shadow-[0_0_15px_rgba(239,68,68,0.8)] border border-yellow-300 animate-pulse z-30 flex items-center gap-1">
          <Flame className="w-3.5 h-3.5 text-yellow-300" />
          ダウト！！
        </div>
      )}

      {/* Player Header: Avatar + Name + Title */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center text-lg sm:text-xl shadow-inner shrink-0">
          {player.avatar}
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white text-xs sm:text-sm">{player.name}</span>
            {player.personality && (
              <span className="text-[10px] text-emerald-300/80 font-medium">
                {player.personality.title.split('・')[0]}
              </span>
            )}
          </div>
          <span className="text-[11px] font-semibold text-amber-300/90 tabular-nums">
            残り <strong className="text-white text-xs">{cardCount}</strong> 枚
          </span>
        </div>
      </div>

      {/* Miniature Card Fan Display */}
      <div className="relative h-12 w-28 sm:w-32 flex items-center justify-center overflow-visible my-0.5">
        {Array.from({ length: Math.min(cardCount, 8) }).map((_, i, arr) => {
          const mid = (arr.length - 1) / 2;
          const offset = i - mid;
          const rotation = offset * 6;
          const translateX = offset * 9;
          return (
            <div
              key={i}
              className="absolute transition-transform duration-200"
              style={{
                transform: `translateX(${translateX}px) rotate(${rotation}deg)`,
              }}
            >
              <PlayingCard faceDown size="sm" disabled />
            </div>
          );
        })}
      </div>

      {/* Status speech bubble / action text */}
      {statusText && (
        <div className="mt-1.5 px-2.5 py-0.5 bg-black/60 border border-white/10 rounded-full text-[11px] text-amber-200 font-medium text-center truncate max-w-[140px]">
          {statusText}
        </div>
      )}
    </div>
  );
};
