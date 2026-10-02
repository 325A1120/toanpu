import React from 'react';
import { Card, DoubtResolution, PlayedCardsRecord, Player, Rank } from '../types/game';
import { RANK_LABELS, RANK_NAMES } from '../utils/cards';
import { PlayingCard } from './PlayingCard';
import { AlertCircle, CheckCircle2, Flame, ShieldAlert, Sparkles } from 'lucide-react';

interface TableCenterProps {
  currentRank: Rank;
  pile: Card[];
  lastPlay: PlayedCardsRecord | null;
  doubtResult: DoubtResolution | null;
  isDoubtWindowOpen: boolean;
  canPlayerDoubt: boolean;
  doubtTimeRemaining: number; // 0 to 100 percentage
  onCallDoubt: () => void;
  onPassDoubt: () => void;
  activePlayer: Player;
}

export const TableCenter: React.FC<TableCenterProps> = ({
  currentRank,
  pile,
  lastPlay,
  doubtResult,
  isDoubtWindowOpen,
  canPlayerDoubt,
  doubtTimeRemaining,
  onCallDoubt,
  onPassDoubt,
  activePlayer,
}) => {
  const allRanks: Rank[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl px-2 py-3 select-none">
      {/* Rank Cycle Bar */}
      <div className="w-full flex items-center justify-between bg-black/40 backdrop-blur-md rounded-xl p-2 px-3 border border-emerald-500/20 mb-3 shadow-inner">
        <div className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>順番:</span>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto py-1 px-1 scrollbar-none">
          {allRanks.map((r) => {
            const isCurrent = r === currentRank;
            return (
              <span
                key={r}
                className={`text-xs font-bold px-2 py-0.5 rounded transition-all duration-300 tabular-nums ${
                  isCurrent
                    ? 'bg-amber-400 text-slate-950 scale-110 shadow-[0_0_12px_rgba(251,191,36,0.8)] ring-1 ring-amber-200'
                    : 'text-slate-300/60 bg-white/5'
                }`}
              >
                {RANK_LABELS[r]}
              </span>
            );
          })}
        </div>
      </div>

      {/* Main Table Felt Stage */}
      <div className="relative w-full rounded-2xl bg-gradient-to-b from-emerald-900/60 to-emerald-950/80 border-2 border-emerald-600/30 p-4 sm:p-6 shadow-2xl flex flex-col items-center justify-center min-h-[220px]">
        {/* Subtle decorative inner ring */}
        <div className="absolute inset-2 border border-emerald-400/10 rounded-xl pointer-events-none" />

        {/* Current Call Target Banner */}
        <div className="mb-4 text-center">
          <div className="text-[11px] uppercase tracking-wider text-emerald-300/80 font-medium">
            現在の指定数字
          </div>
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-amber-300 drop-shadow-[0_2px_10px_rgba(251,191,36,0.3)]">
              {RANK_NAMES[currentRank]}
            </span>
          </div>
        </div>

        {/* Center Discard Pile & Active Cards */}
        <div className="relative flex items-center justify-center w-full min-h-[120px] my-1">
          {/* Background stack representing previously placed cards */}
          {pile.length > 0 && (
            <div className="relative flex items-center justify-center mr-4 sm:mr-8">
              {/* Stack depth visual illusion */}
              {pile.slice(0, Math.min(pile.length, 5)).map((_, i) => (
                <div
                  key={i}
                  className="absolute"
                  style={{
                    transform: `translate(${i * 2 - 4}px, ${-i * 2 + 4}px) rotate(${
                      (i % 3 === 0 ? -1 : 1) * (i * 3)
                    }deg)`,
                  }}
                >
                  <PlayingCard faceDown size="md" disabled />
                </div>
              ))}
              <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none bg-black/60 backdrop-blur-sm rounded-lg px-2.5 py-1 border border-white/20 shadow-lg">
                <span className="text-[10px] text-emerald-200">場札の合計</span>
                <span className="text-sm font-black text-amber-300 tabular-nums">
                  {pile.length} 枚
                </span>
              </div>
            </div>
          )}

          {/* If there's an active played cards record */}
          {lastPlay && (
            <div className="flex flex-col items-center z-20">
              <div className="text-xs text-amber-200/90 font-medium mb-1.5 flex items-center gap-1.5 bg-black/50 px-3 py-1 rounded-full border border-amber-400/30">
                <span className="font-bold text-white">{lastPlay.playerName}</span>
                <span>が</span>
                <span className="font-extrabold text-amber-300">
                  「{RANK_LABELS[lastPlay.claimedRank]}」
                </span>
                <span>を</span>
                <span className="font-extrabold text-amber-300">{lastPlay.cards.length}枚</span>
                <span>出しました</span>
              </div>

              {/* Reveal phase: show actual cards if doubt was called */}
              {doubtResult ? (
                <div className="flex items-center gap-2 animate-bounce-short">
                  {doubtResult.revealedCards.map((card, idx) => (
                    <div
                      key={card.id}
                      className="animate-in fade-in zoom-in duration-300"
                      style={{ animationDelay: `${idx * 150}ms` }}
                    >
                      <PlayingCard
                        card={card}
                        size="md"
                        highlight={card.rank === doubtResult.claimedRank}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                /* Still face down */
                <div className="flex items-center -space-x-4 sm:-space-x-6">
                  {lastPlay.cards.map((c, i) => (
                    <div
                      key={c.id}
                      style={{
                        transform: `rotate(${(i - (lastPlay.cards.length - 1) / 2) * 6}deg)`,
                      }}
                      className="transition-transform"
                    >
                      <PlayingCard faceDown size="md" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Empty pile state */}
          {pile.length === 0 && !lastPlay && (
            <div className="flex flex-col items-center justify-center text-emerald-300/40 border-2 border-dashed border-emerald-500/20 rounded-xl p-6">
              <span className="text-sm font-medium">場札はありません</span>
              <span className="text-xs mt-1">手番のプレイヤーがカードを出します</span>
            </div>
          )}
        </div>

        {/* Doubt Resolution Verdict Banner */}
        {doubtResult && (
          <div
            className={`w-full mt-4 p-3 rounded-xl border flex flex-col items-center text-center animate-in zoom-in-95 duration-200 ${
              doubtResult.wasLie
                ? 'bg-rose-950/80 border-rose-500/60 text-rose-100 shadow-[0_0_20px_rgba(244,63,94,0.3)]'
                : 'bg-emerald-950/80 border-emerald-500/60 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
            }`}
          >
            <div className="flex items-center gap-2 text-base font-extrabold mb-1">
              {doubtResult.wasLie ? (
                <>
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                  <span className="text-rose-300">【ダウト成功！】 嘘でした！</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-emerald-300">【ダウト失敗！】 真実でした！</span>
                </>
              )}
            </div>
            <div className="space-y-1 text-xs text-slate-200 mt-1">
              <p>
                <strong className="text-amber-300">{doubtResult.penalizedPlayerName}</strong> は場札{' '}
                <strong className="text-amber-300">{doubtResult.pileCount}枚</strong>{' '}
                を手札に引き取りました（
                <span className="font-mono text-amber-200">
                  {doubtResult.penalizedPlayerBeforeCount}枚 → {doubtResult.penalizedPlayerAfterCount}枚
                </span>
                <span className="text-rose-400 font-bold ml-1">+{doubtResult.pileCount}枚</span>
                ）
              </p>

              {/* If honest play, show that honest player successfully reduced cards */}
              {!doubtResult.wasLie && doubtResult.honestPlayerName && (
                <p className="text-emerald-300 font-medium">
                  {doubtResult.honestPlayerName} は真実を出したため、出したカードは手札から正常に減りました（残り{' '}
                  <strong className="text-white font-mono">{doubtResult.honestPlayerCount}枚</strong>
                  <span className="text-emerald-400 font-bold ml-1">-{doubtResult.revealedCards.length}枚</span>）
                </p>
              )}

              {/* If doubt bonus applied */}
              {doubtResult.wasLie && doubtResult.doubtBonusPlayerName && (
                <p className="text-amber-300 font-medium flex items-center justify-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  <span>
                    ダウト成功ボーナス！<strong>{doubtResult.doubtBonusPlayerName}</strong> の手札が1枚減りました！（残り{' '}
                    <strong className="text-white font-mono">{doubtResult.doubtBonusPlayerAfterCount}枚</strong>
                    <span className="text-emerald-400 font-bold ml-1">-1枚</span>）
                  </span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Interactive Doubt Opportunity for the Human Player */}
        {isDoubtWindowOpen && canPlayerDoubt && !doubtResult && (
          <div className="w-full mt-3 p-3 bg-black/70 backdrop-blur-md rounded-xl border border-amber-500/40 flex flex-col items-center gap-2.5 animate-in fade-in duration-150">
            {/* Timer Countdown Bar */}
            <div className="w-full flex items-center justify-between text-[11px] text-amber-200 px-1">
              <span className="font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                ダウト判定タイム
              </span>
              <span className="tabular-nums font-mono text-amber-300">
                {Math.ceil(doubtTimeRemaining / 20)}秒
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-400 h-full transition-all duration-100 ease-linear"
                style={{ width: `${doubtTimeRemaining}%` }}
              />
            </div>

            {/* Decision Buttons */}
            <div className="flex items-center gap-3 w-full justify-center">
              <button
                onClick={onCallDoubt}
                className="group relative flex-1 max-w-[200px] py-2.5 px-4 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-extrabold text-sm sm:text-base rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.5)] active:scale-95 transition-all flex items-center justify-center gap-2 border border-rose-300/40 cursor-pointer"
              >
                <Flame className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>ダウト！</span>
              </button>

              <button
                onClick={onPassDoubt}
                className="flex-1 max-w-[140px] py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm rounded-xl border border-slate-600 active:scale-95 transition-all cursor-pointer"
              >
                スルー (見送る)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
