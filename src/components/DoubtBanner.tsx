import React from 'react';
import { Flame } from 'lucide-react';

interface DoubtBannerProps {
  doubterName: string;
  targetName: string;
  claimedRankLabel: string;
  cardCount: number;
}

export const DoubtBanner: React.FC<DoubtBannerProps> = ({
  doubterName,
  targetName,
  claimedRankLabel,
  cardCount,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none animate-in fade-in duration-150">
      <div className="flex flex-col items-center justify-center p-6 sm:p-8 bg-gradient-to-r from-red-950 via-rose-900 to-red-950 border-y-4 border-amber-400 w-full shadow-[0_0_60px_rgba(239,68,68,0.8)] animate-in zoom-in-90 duration-200">
        <div className="flex items-center gap-2 sm:gap-4 mb-2">
          <Flame className="w-8 h-8 sm:w-12 sm:h-12 text-yellow-300 animate-bounce" />
          <h2 className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-amber-300 to-amber-500 tracking-wider drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
            ダウト！！！
          </h2>
          <Flame className="w-8 h-8 sm:w-12 sm:h-12 text-yellow-300 animate-bounce" />
        </div>

        <div className="text-white text-sm sm:text-lg font-bold flex items-center gap-2">
          <span className="text-amber-300 text-lg sm:text-xl underline decoration-amber-400">
            {doubterName}
          </span>
          <span>が</span>
          <span className="text-rose-200">{targetName}</span>
          <span>の</span>
          <span className="text-amber-300">
            「{claimedRankLabel}」{cardCount}枚
          </span>
          <span>にダウトを宣言！</span>
        </div>
      </div>
    </div>
  );
};
