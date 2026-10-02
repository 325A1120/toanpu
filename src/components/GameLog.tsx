import React, { useEffect, useRef } from 'react';
import { GameLogEntry } from '../types/game';
import { AlertCircle, CheckCircle, Flame, History, Info, ShieldAlert, Trophy } from 'lucide-react';

interface GameLogProps {
  entries: GameLogEntry[];
}

export const GameLog: React.FC<GameLogProps> = ({ entries }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  const getEntryIcon = (type: GameLogEntry['type']) => {
    switch (type) {
      case 'play':
        return <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />;
      case 'doubt_call':
        return <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />;
      case 'doubt_success':
        return <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />;
      case 'doubt_failed':
        return <AlertCircle className="w-3.5 h-3.5 text-amber-300 shrink-0 mt-0.5" />;
      case 'win':
        return <Trophy className="w-3.5 h-3.5 text-yellow-300 shrink-0 mt-0.5" />;
      default:
        return <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />;
    }
  };

  return (
    <div className="w-full flex flex-col bg-slate-950/70 backdrop-blur-md rounded-2xl border border-slate-800 p-3 shadow-lg h-36 sm:h-44">
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-xs font-bold text-slate-300">
        <div className="flex items-center gap-1.5">
          <History className="w-3.5 h-3.5 text-amber-400" />
          <span>対戦履歴 (ログ)</span>
        </div>
        <span className="text-[10px] text-slate-400 font-normal">
          {entries.length} 件
        </span>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-1.5 py-1.5 pr-1 text-[11px] sm:text-xs scrollbar-thin"
      >
        {entries.length === 0 ? (
          <div className="text-slate-400 text-center py-4">ゲームが開始されるとログが表示されます</div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className={`flex items-start gap-1.5 p-1.5 rounded-lg border leading-tight transition-colors ${
                entry.type === 'doubt_call'
                  ? 'bg-amber-950/30 border-amber-500/30 text-amber-200'
                  : entry.type === 'doubt_success'
                  ? 'bg-rose-950/30 border-rose-500/30 text-rose-200'
                  : entry.type === 'doubt_failed'
                  ? 'bg-blue-950/30 border-blue-500/30 text-blue-200'
                  : entry.type === 'win'
                  ? 'bg-yellow-950/40 border-yellow-400/40 text-yellow-100 font-bold'
                  : 'bg-slate-900/50 border-slate-800 text-slate-300'
              }`}
            >
              {getEntryIcon(entry.type)}
              <span className="flex-1">{entry.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
