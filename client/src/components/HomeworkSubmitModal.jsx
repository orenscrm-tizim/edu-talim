import React, { useState } from 'react';
import { X, Send, Globe, UploadCloud, FileText, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import GithubIcon from './GithubIcon';
import confetti from 'canvas-confetti';
import AudioRecorder from './AudioRecorder';
import { api } from '../api';

export default function HomeworkSubmitModal({ isOpen, onClose, homework, student, onSubmitted }) {
  if (!isOpen || !homework) return null;

  const existingSub = homework.my_submission;

  const [githubUrl, setGithubUrl] = useState(existingSub?.github_url || '');
  const [demoUrl, setDemoUrl] = useState(existingSub?.demo_url || '');
  const [audioUrl, setAudioUrl] = useState(existingSub?.audio_url || '');
  const [textNotes, setTextNotes] = useState(existingSub?.text_notes || '');
  const [fileUrls, setFileUrls] = useState(existingSub?.file_urls || []);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingFile(true);
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.uploadFile(formData);
      if (res.url) {
        setFileUrls([...fileUrls, { name: file.name, url: res.url, size: file.size }]);
      }
    } catch (err) {
      alert('Fayl yuklashda xatolik: ' + err.message);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!githubUrl && !demoUrl && !audioUrl && !fileUrls.length && !textNotes) {
      alert('Iltimos, kamida bitta javob turini (GitHub, Demo, Audio yoki fayl) kiriting');
      return;
    }

    try {
      setLoading(true);
      await api.submitHomework({
        homework_id: homework.id,
        student_id: student.id,
        github_url: githubUrl,
        demo_url: demoUrl,
        audio_url: audioUrl,
        file_urls: fileUrls,
        text_notes: textNotes
      });

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      alert('Topshiriq muvaffaqiyatli topshirildi! Ustoz tekshirgach natijasi chiqadi.');
      onSubmitted();
      onClose();
    } catch (err) {
      alert('Xatolik: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const isDeadlinePassed = new Date(homework.deadline) < new Date();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {homework.group_name}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Muddat: {new Date(homework.deadline).toLocaleString('uz-UZ', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-100 mt-1">{homework.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          
          {/* Homework Description box */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 space-y-2">
            <p className="font-semibold text-slate-200">Vazifa Talabi:</p>
            <p className="whitespace-pre-line leading-relaxed text-slate-300">{homework.description}</p>
            {homework.resources?.length > 0 && (
              <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-2">
                {homework.resources.map((res, i) => (
                  <a
                    key={i}
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-[11px] font-medium border border-indigo-500/30 transition"
                  >
                    <Globe className="w-3 h-3" />
                    {res.title}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* GitHub Repo URL (especially for Frontend) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <GithubIcon className="w-3.5 h-3.5 text-slate-400" />
              GitHub Kod Repozitoriyasi Linki (Frontend darsi uchun)
            </label>
            <input
              type="url"
              placeholder="https://github.com/username/project-name"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:border-indigo-500 focus:outline-none transition placeholder:text-slate-600"
            />
          </div>

          {/* Live Demo URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              Jonli Sayt Havolasi (Vercel / Netlify / Demo)
            </label>
            <input
              type="url"
              placeholder="https://my-project.vercel.app"
              value={demoUrl}
              onChange={(e) => setDemoUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:border-indigo-500 focus:outline-none transition placeholder:text-slate-600"
            />
          </div>

          {/* Audio Recording (for IELTS / Russian speaking) */}
          <AudioRecorder
            currentAudioUrl={audioUrl}
            onAudioUploaded={(url) => setAudioUrl(url)}
          />

          {/* File Upload / Screenshot */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <UploadCloud className="w-3.5 h-3.5 text-blue-400" />
              Fayl yoki Skrinshot Yuklash (PDF, Rasm, Zip)
            </label>
            <div className="flex items-center gap-3">
              <label className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer border border-slate-700 transition flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-indigo-400" />
                {uploadingFile ? 'Yuklanmoqda...' : 'Faylni tanlash'}
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              {fileUrls.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {fileUrls.map((f, idx) => (
                    <span key={idx} className="text-xs px-2.5 py-1 rounded bg-slate-950 text-slate-300 border border-slate-800 flex items-center gap-1">
                      <FileText className="w-3 h-3 text-indigo-400" />
                      {f.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Ustozga Izoh yoki Savollar (Ixtiyoriy)
            </label>
            <textarea
              rows={2}
              placeholder="Ustoz, bu qismida biroz qiynaldim, tekshirib bera olasizmi..."
              value={textNotes}
              onChange={(e) => setTextNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:border-indigo-500 focus:outline-none transition placeholder:text-slate-600"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            {isDeadlinePassed ? (
              <span className="text-xs text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> Topshirish muddati o'tgan (Kechikkan topshirish)
              </span>
            ) : (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Vaqtida topshirilmoqda
              </span>
            )}

            <div className="flex items-center gap-2">
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
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                {loading ? 'Yuborilmoqda...' : existingSub ? 'Qayta topshirish' : 'Vazifani topshirish'}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
