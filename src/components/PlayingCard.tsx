import React from 'react';
import { Card, Suit } from '../types/game';

interface PlayingCardProps {
  card?: Card;
  faceDown?: boolean;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  highlight?: boolean;
  className?: string;
  rotation?: number;
}

const SUIT_ICONS: Record<Suit, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

const SUIT_COLORS: Record<Suit, string> = {
  spades: 'text-slate-900',
  hearts: 'text-rose-600',
  diamonds: 'text-rose-600',
  clubs: 'text-slate-900',
};

export const PlayingCard: React.FC<PlayingCardProps> = ({
  card,
  faceDown = false,
  selected = false,
  onClick,
  disabled = false,
  size = 'md',
  highlight = false,
  className = '',
  rotation = 0,
}) => {
  // Dimensions per size
  const sizeClasses = {
    sm: 'w-10 h-14 text-xs rounded-md',
    md: 'w-14 h-20 sm:w-16 sm:h-24 text-sm sm:text-base rounded-lg',
    lg: 'w-20 h-28 sm:w-24 sm:h-34 text-lg sm:text-xl rounded-xl',
  }[size];

  if (faceDown || !card) {
    return (
      <div
        onClick={!disabled ? onClick : undefined}
        style={{ transform: `rotate(${rotation}deg)` }}
        className={`relative select-none shrink-0 transition-all duration-200 shadow-md ${sizeClasses} ${className} ${
          disabled ? 'opacity-80' : 'cursor-pointer'
        }`}
      >
        <div className="w-full h-full rounded-[inherit] border-2 border-amber-100/40 bg-gradient-to-br from-indigo-900 via-blue-950 to-slate-950 p-1 flex items-center justify-center overflow-hidden">
          {/* Card Back Intricate Lattice Pattern */}
          <div className="w-full h-full rounded-[inherit] border border-amber-300/30 flex items-center justify-center bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:6px_6px]">
            <div className="w-5 h-7 sm:w-6 sm:h-8 rounded-full border border-amber-300/50 flex items-center justify-center bg-indigo-950/80">
              <span className="text-amber-300 font-serif text-xs font-bold">♠</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const suitIcon = SUIT_ICONS[card.suit];

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      style={{
        transform: `rotate(${rotation}deg) ${selected ? 'translateY(-14px)' : 'translateY(0)'}`,
      }}
      className={`relative select-none shrink-0 transition-transform duration-200 ${sizeClasses} ${className} ${
        disabled
          ? 'opacity-60 cursor-not-allowed'
          : 'cursor-pointer hover:-translate-y-2'
      } ${
        selected
          ? 'ring-4 ring-emerald-400 ring-offset-2 ring-offset-emerald-950 shadow-xl'
          : highlight
          ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-900 shadow-lg'
          : 'shadow-md hover:shadow-xl'
      }`}
    >
      <div
        className={`w-full h-full rounded-[inherit] bg-white border border-slate-300/80 p-1 sm:p-1.5 flex flex-col justify-between overflow-hidden ${
          isRed ? 'text-rose-600' : 'text-slate-900'
        }`}
      >
        {/* Top-left rank and suit */}
        <div className="flex flex-col items-center leading-none self-start">
          <span className="font-extrabold tracking-tighter text-xs sm:text-sm font-sans">
            {card.label}
          </span>
          <span className="text-[10px] sm:text-xs leading-none">{suitIcon}</span>
        </div>

        {/* Center suit emblem */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span
            className={`text-2xl sm:text-3xl font-serif select-none ${
              isRed ? 'text-rose-600/90' : 'text-slate-900/90'
            }`}
          >
            {suitIcon}
          </span>
        </div>

        {/* Bottom-right inverted rank and suit */}
        <div className="flex flex-col items-center leading-none self-end rotate-180">
          <span className="font-extrabold tracking-tighter text-xs sm:text-sm font-sans">
            {card.label}
          </span>
          <span className="text-[10px] sm:text-xs leading-none">{suitIcon}</span>
        </div>
      </div>
    </div>
  );
};
