import React, { useState, useEffect } from 'react';
import { Trophy, Award, Medal, Star, CheckCircle, TrendingUp, Sparkles, Flame } from 'lucide-react';
import { api } from '../api';

export default function LeaderboardView() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getLeaderboard().then(data => {
      setLeaderboard(data);
      setLoading(false);
    });
  }, []);

  const getRankBadge = (index) => {
    switch (index) {
      case 0:
        return <span className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-lg shadow-amber-500/30">1</span>;
      case 1:
        return <span className="w-7 h-7 rounded-full bg-slate-300 text-slate-950 font-black text-xs flex items-center justify-center shadow-lg shadow-slate-300/30">2</span>;
      case 2:
        return <span className="w-7 h-7 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center shadow-lg shadow-amber-700/30">3</span>;
      default:
        return <span className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 font-bold text-xs flex items-center justify-center">{index + 1}</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold">
          <Trophy className="w-3.5 h-3.5" />
          Skyline Top O'quvchilar Reytingi
        </div>
        <h2 className="text-2xl font-black text-slate-100">O'quvchilar Liderlar Jadvali</h2>
        <p className="text-xs text-slate-400">
          Uyga vazifalar bahosi, topshirilgan topshiriqlar soni va dars davomati asosidagi umumiy reyting
        </p>
      </div>

      {/* Top 3 Podium Cards */}
      {leaderboard.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          
          {/* Rank 2 */}
          <div className="order-2 md:order-1 p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col items-center text-center space-y-3 relative">
            <div className="absolute -top-3 px-3 py-0.5 rounded-full bg-slate-300 text-slate-900 text-[10px] font-black uppercase">
              2-O'rin
            </div>
            <img
              src={leaderboard[1]?.avatar}
              alt={leaderboard[1]?.name}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-slate-400 mt-2"
            />
            <div>
              <h4 className="text-sm font-bold text-slate-100">{leaderboard[1]?.name}</h4>
              <p className="text-xs text-slate-400">{leaderboard[1]?.specialty}</p>
            </div>
            <div className="flex items-center gap-3 pt-2 border-t border-slate-800 text-xs">
              <span className="text-amber-400 font-bold">{leaderboard[1]?.avgScore} ball</span>
              <span className="text-slate-500">•</span>
              <span className="text-emerald-400 font-bold">{leaderboard[1]?.totalSubmissions} vazifa</span>
            </div>
          </div>

          {/* Rank 1 (Champion) */}
          <div className="order-1 md:order-2 p-6 rounded-3xl bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-900 border-2 border-amber-500/50 flex flex-col items-center text-center space-y-3 relative shadow-2xl shadow-amber-500/10">
            <div className="absolute -top-3.5 px-4 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 text-xs font-black uppercase flex items-center gap-1 shadow-lg">
              <Crown className="w-3.5 h-3.5 fill-slate-950" /> Chempion
            </div>
            <img
              src={leaderboard[0]?.avatar}
              alt={leaderboard[0]?.name}
              className="w-20 h-20 rounded-2xl object-cover ring-4 ring-amber-400 mt-2 shadow-xl shadow-amber-500/25"
            />
            <div>
              <h3 className="text-base font-black text-slate-100">{leaderboard[0]?.name}</h3>
              <p className="text-xs text-amber-300/80 font-medium">{leaderboard[0]?.specialty}</p>
            </div>
            <div className="flex items-center gap-4 pt-2 border-t border-slate-800 text-xs">
              <span className="text-amber-400 font-extrabold text-sm">{leaderboard[0]?.avgScore} ball</span>
              <span className="text-slate-500">•</span>
              <span className="text-emerald-400 font-extrabold text-sm">{leaderboard[0]?.totalSubmissions} vazifa</span>
              <span className="text-slate-500">•</span>
              <span className="text-indigo-400 font-extrabold text-sm">{leaderboard[0]?.attendanceRate}% davomat</span>
            </div>
          </div>

          {/* Rank 3 */}
          <div className="order-3 p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col items-center text-center space-y-3 relative">
            <div className="absolute -top-3 px-3 py-0.5 rounded-full bg-amber-700 text-white text-[10px] font-black uppercase">
              3-O'rin
            </div>
            <img
              src={leaderboard[2]?.avatar}
              alt={leaderboard[2]?.name}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-amber-700 mt-2"
            />
            <div>
              <h4 className="text-sm font-bold text-slate-100">{leaderboard[2]?.name}</h4>
              <p className="text-xs text-slate-400">{leaderboard[2]?.specialty}</p>
            </div>
            <div className="flex items-center gap-3 pt-2 border-t border-slate-800 text-xs">
              <span className="text-amber-400 font-bold">{leaderboard[2]?.avgScore} ball</span>
              <span className="text-slate-500">•</span>
              <span className="text-emerald-400 font-bold">{leaderboard[2]?.totalSubmissions} vazifa</span>
            </div>
          </div>

        </div>
      )}

      {/* Full Leaderboard Table */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Medal className="w-4 h-4 text-indigo-400" />
          Barcha O'quvchilar Ro'yxati
        </h3>

        <div className="space-y-2">
          {leaderboard.map((student, index) => (
            <div
              key={student.id}
              className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                {getRankBadge(index)}
                <img
                  src={student.avatar}
                  alt={student.name}
                  className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-800"
                />
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-200 truncate">{student.name}</h4>
                  <p className="text-[10px] text-slate-400 truncate">{student.specialty}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] text-slate-500 uppercase">Topshirdi</p>
                  <p className="text-slate-300">{student.totalSubmissions} ta</p>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] text-slate-500 uppercase">Davomat</p>
                  <p className="text-indigo-400">{student.attendanceRate}%</p>
                </div>
                <div className="text-right min-w-[70px]">
                  <p className="text-[10px] text-slate-500 uppercase">O'rtacha Ball</p>
                  <p className="text-amber-400 font-extrabold text-sm">{student.avgScore} ball</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

function Crown({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5v-2z" />
    </svg>
  );
}
