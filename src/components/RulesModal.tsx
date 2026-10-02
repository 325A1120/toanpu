import React from 'react';
import { X, BookOpen, AlertTriangle, Trophy, CheckCircle, ShieldCheck } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2.5 mb-4 border-b border-slate-700/80 pb-3">
          <BookOpen className="w-6 h-6 text-amber-400" />
          <h2 className="text-xl font-extrabold text-white">トランプ「ダウト」のルール</h2>
        </div>

        {/* Content */}
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          {/* Rule 1 */}
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
            <h3 className="font-bold text-amber-300 text-sm mb-1 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center text-xs font-mono">
                1
              </span>
              カードの配布
            </h3>
            <p>
              ジョーカーを除いた<strong>52枚のトランプ</strong>を全プレイヤーに均等に配ります（4人プレイなら各自13枚）。
            </p>
          </div>

          {/* Rule 2 */}
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
            <h3 className="font-bold text-amber-300 text-sm mb-1 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center text-xs font-mono">
                2
              </span>
              AからKの順番でカードを出す
            </h3>
            <p>
              親から順に、<strong>A → 2 → 3 → ... → K → A...</strong>の順番で指定された数字のカードを<strong>裏向き</strong>で出します。1回に出せる枚数は<strong>1枚〜最大4枚</strong>です。
            </p>
            <p className="mt-1 text-slate-400 text-[11px]">
              ※手札に指定の数字がなくても、別の数字のカードを裏向きで「嘘（ブラフ）」をついて出して構いません！
            </p>
          </div>

          {/* Rule 3 */}
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
            <h3 className="font-bold text-amber-300 text-sm mb-1 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center text-xs font-mono">
                3
              </span>
              ダウトのコール
            </h3>
            <p>
              カードが出された直後、他のプレイヤーは「嘘をついている！」と思ったら<strong>「ダウト！」</strong>を宣言できます。
            </p>
          </div>

          {/* Rule 4 */}
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
            <h3 className="font-bold text-amber-300 text-sm mb-1 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center text-xs font-mono">
                4
              </span>
              判定とペナルティ
            </h3>
            <div className="space-y-1.5 mt-2">
              <div className="flex items-start gap-2 bg-rose-950/40 p-2 rounded-lg border border-rose-500/30">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-rose-300">ダウト成功（嘘だった場合）：</strong>
                  <div className="text-slate-300 mt-0.5">
                    出されたカードの中に指定と違う数字が1枚でもあれば嘘！<strong>嘘をついた人</strong>が中央の場札を全て引き取ります（手札が増加）。
                    <p className="mt-1 text-amber-300 text-[11px] font-medium">
                      ★【成功ボーナス（設定ON時）】：見事ダウトを成功させたプレイヤーは、ご褒美として手札が1枚減ります！
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/30">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-emerald-300">ダウト失敗（本当だった場合）：</strong>
                  <div className="text-slate-300 mt-0.5">
                    出されたカードが全て指定の数字通りなら真実！<strong>カードを出した人の手札は正常に出されて減ったまま</strong>となり、<strong>ダウトを言った人</strong>が場札を全て引き取ります（手札が増加）。
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rule 5 */}
          <div className="bg-amber-950/30 p-3 rounded-xl border border-amber-500/30">
            <h3 className="font-bold text-amber-300 text-sm mb-1 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-400" />
              勝利条件
            </h3>
            <p className="text-slate-200">
              <strong>最初に手札がすべてなくなったプレイヤーの勝利</strong>です！
              <br />
              <span className="text-[11px] text-amber-200/80">
                ※最後のカードを出した時もダウトのチャンスがあります。ダウトされて嘘が見破られると場札を引き取ることになるので、最後まで油断禁物です！
              </span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-colors cursor-pointer"
          >
            理解した（閉じる）
          </button>
        </div>
      </div>
    </div>
  );
};
