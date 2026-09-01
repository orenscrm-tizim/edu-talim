import React, { useState } from 'react';
import { X, CheckCircle, AlertTriangle, Globe, Volume2, FileText, Send, User, Award } from 'lucide-react';
import GithubIcon from './GithubIcon';
import { api, getFileUrl } from '../api';

export default function HomeworkGradeModal({ isOpen, onClose, submission, homework, onGraded }) {
  if (!isOpen || !submission) return null;

  const [score, setScore] = useState(submission.score || 90);
  const [feedback, setFeedback] = useState(submission.teacher_feedback || '');
  const [status, setStatus] = useState(submission.status === 'need_work' ? 'need_work' : 'graded');
  const [loading, setLoading] = useState(false);

  const handleGrade = async (e) => {
    e.preventDefault();
    if (!submission.submission_id && !submission.id) {
      alert('Topshiriq identifikatori mavjud emas');
      return;
    }

    try {
      setLoading(true);
      const subId = submission.submission_id || submission.id;
      await api.gradeSubmission(subId, {
        score: Number(score),
        teacher_feedback: feedback,
        status: status
      });

      alert('Topshiriq baholandi va o\'quvchiga shaxsiy xabarnoma yuborildi!');
      onGraded();
      onClose();
    } catch (err) {
      alert('Xatolik: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <img
              src={submission.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
              alt={submission.student_name}
              className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-700"
            />
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                {submission.student_name}
                <span className="text-xs font-normal text-slate-400">({submission.phone})</span>
              </h3>
              <p className="text-xs text-indigo-400 font-medium">{homework?.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleGrade} className="p-6 space-y-4 overflow-y-auto flex-1">
          
          {/* Submission Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              O'quvchi Topshirgan Materiallar
            </h4>

            {/* GitHub URL */}
            {submission.github_url && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <GithubIcon className="w-4 h-4 text-slate-300" />
                  <span className="text-xs text-slate-300 font-mono truncate max-w-xs sm:max-w-md">
                    {submission.github_url}
                  </span>
                </div>
                <a
                  href={submission.github_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-indigo-300 rounded-lg transition"
                >
                  Kodni ko'rish
                </a>
              </div>
            )}

            {/* Live Demo URL */}
            {submission.demo_url && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-slate-300 font-mono truncate max-w-xs sm:max-w-md">
                    {submission.demo_url}
                  </span>
                </div>
                <a
                  href={submission.demo_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-xs font-semibold text-emerald-300 rounded-lg transition"
                >
                  Saytni ochish
                </a>
              </div>
            )}

            {/* Audio Recording */}
            {submission.audio_url && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-rose-400" />
                  Ovozli Topshiriq (Speaking / Talaffuz):
                </span>
                <audio controls src={getFileUrl(submission.audio_url)} className="w-full h-9 rounded-lg" />
              </div>
            )}

            {/* Uploaded Files */}
            {submission.file_urls?.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs font-medium text-slate-400 block mb-2">Biriktirilgan fayllar:</span>
                <div className="flex flex-wrap gap-2">
                  {submission.file_urls.map((f, i) => (
                    <a
                      key={i}
                      href={getFileUrl(f.url)}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs text-indigo-300 border border-slate-700 flex items-center gap-1.5 transition"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      {f.name}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Student text notes */}
            {submission.text_notes && (
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">O'quvchi izohi:</span>
                <p className="text-xs text-slate-300 italic">"{submission.text_notes}"</p>
              </div>
            )}

            {!submission.github_url && !submission.demo_url && !submission.audio_url && !submission.file_urls?.length && !submission.text_notes && (
              <div className="p-4 rounded-xl bg-slate-950 text-center text-xs text-slate-500">
                Bu o'quvchi hali topshiriq yuklamagan
              </div>
            )}
          </div>

          {/* Teacher Grading Section */}
          <div className="pt-4 border-t border-slate-800 space-y-4">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              Ustoz Xulosasi va Baholash
            </h4>

            {/* Score & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Ball (Maksimal {homework?.max_score || 100} balldan)
                </label>
                <input
                  type="number"
                  min="0"
                  max={homework?.max_score || 100}
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm font-bold focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Topshiriq Holati
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="graded">✅ Qabul qilindi (Baholandi)</option>
                  <option value="need_work">⚠️ Qayta ishlash kerak (Xatolar bor)</option>
                </select>
              </div>
            </div>

            {/* Feedback / Comments */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Ustoz Izohi & Xatolar Tahlili (Feedback)
              </label>
              <textarea
                rows={3}
                placeholder="Zo'r bajarilgan, lekin mobil menyuda animatsiyani to'g'rilash kerak..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-indigo-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Ushbu fikringiz o'quvchiga to'g'ridan-to'g'ri shaxsiy xabar (Lichka) orqali ham yetkaziladi.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
            >
              Yopish
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              {loading ? 'Saqlanmoqda...' : 'Bahoni Tasdiqlash'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
