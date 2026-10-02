import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { GameStats, Player } from '../types/game';
import { Award, RotateCcw, Trophy } from 'lucide-react';
import { sound } from '../utils/audio';

interface GameOverModalProps {
  winner: Player;
  players: Player[];
  stats: GameStats;
  onPlayAgain: () => void;
  onReturnToMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  winner,
  players,
  stats,
  onPlayAgain,
  onReturnToMenu,
}) => {
  const isHumanWinner = winner.isHuman;

  useEffect(() => {
    if (isHumanWinner) {
      sound.playVictory();
      // Shoot confetti
      const end = Date.now() + 2.5 * 1000;
      const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899'];

      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    }
  }, [isHumanWinner]);

  // Sort players by remaining card count
  const sortedPlayers = [...players].sort((a, b) => a.cards.length - b.cards.length);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-400/60 rounded-3xl p-6 sm:p-8 shadow-2xl text-center flex flex-col items-center">
        {/* Trophy / Winner Icon */}
        <div className="relative mb-3">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 flex items-center justify-center shadow-[0_0_30px_rgba(251,191,36,0.6)] text-4xl">
            {isHumanWinner ? '👑' : winner.avatar}
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-500 mb-1">
          {isHumanWinner ? '見事な勝利！' : `${winner.name} の勝利！`}
        </h2>

        <p className="text-sm text-slate-300 mb-5">
          {isHumanWinner
            ? 'お見事！見事なブラフと観察眼で手札を出し切りました！'
            : `${winner.name}が最初にすべての手札を出し切りました。`}
        </p>

        {/* Remaining Cards Leaderboard */}
        <div className="w-full bg-slate-800/60 rounded-2xl p-3 border border-slate-700/80 mb-5 text-left">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>最終順位 / 残り枚数</span>
          </div>

          <div className="space-y-1.5">
            {sortedPlayers.map((p, idx) => {
              const isWin = p.id === winner.id;
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs sm:text-sm ${
                    isWin
                      ? 'bg-amber-500/20 border border-amber-400/40 text-amber-200 font-bold'
                      : 'bg-black/30 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400 font-bold">#{idx + 1}</span>
                    <span className="text-base">{p.avatar}</span>
                    <span>{p.name}</span>
                  </div>
                  <span className="font-mono tabular-nums font-bold">
                    {p.cards.length === 0 ? '上がり！' : `${p.cards.length} 枚`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Match Statistics */}
        <div className="w-full grid grid-cols-2 gap-2 text-xs mb-6 text-slate-300">
          <div className="bg-slate-800/40 p-2.5 rounded-xl border border-white/5">
            <div className="text-slate-400 text-[11px]">総ターン数</div>
            <div className="text-base font-bold text-amber-300 tabular-nums">
              {stats.turnsElapsed} 回
            </div>
          </div>
          <div className="bg-slate-800/40 p-2.5 rounded-xl border border-white/5">
            <div className="text-slate-400 text-[11px]">ダウト宣言回数</div>
            <div className="text-base font-bold text-amber-300 tabular-nums">
              {stats.doubtsCalled} 回 ({stats.doubtsSuccess}回成功)
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <button
            onClick={onPlayAgain}
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>もう一度プレイする</span>
          </button>

          <button
            onClick={onReturnToMenu}
            className="w-full sm:w-auto py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer text-xs whitespace-nowrap"
          >
            タイトルに戻る
          </button>
        </div>
      </div>
    </div>
  );
};
