import React, { useState } from 'react';
import { X, Plus, Trash2, Calendar, Link as LinkIcon, FileText, Send, Sparkles, Video } from 'lucide-react';
import { api } from '../api';

export default function HomeworkCreateModal({ isOpen, onClose, teacher, groups, onCreated }) {
  if (!isOpen) return null;

  const [groupId, setGroupId] = useState(groups[0]?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  );
  const [maxScore, setMaxScore] = useState(100);
  const [resources, setResources] = useState([
    { title: 'Telegram Dars Videosi', url: 'https://t.me/skyline_frontend_group' }
  ]);
  const [loading, setLoading] = useState(false);

  const addResource = () => {
    setResources([...resources, { title: '', url: '' }]);
  };

  const removeResource = (index) => {
    setResources(resources.filter((_, i) => i !== index));
  };

  const updateResource = (index, field, value) => {
    const updated = [...resources];
    updated[index][field] = value;
    setResources(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !groupId || !deadline) {
      alert('Iltimos, guruh, sarlavha va muddatni to\'ldiring');
      return;
    }

    try {
      setLoading(true);
      await api.createHomework({
        group_id: groupId,
        teacher_id: teacher.id,
        title,
        description,
        resources: resources.filter(r => r.title && r.url),
        deadline,
        max_score: Number(maxScore)
      });
      alert('Yangi vazifa muvaffaqiyatli yuklandi!');
      onCreated();
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
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Yangi Uyga Vazifa Qo'shish</h3>
              <p className="text-xs text-slate-400">Guruhni tanlang va topshiriq shartlarini kiriting</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          
          {/* Select Group */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Qaysi Guruhga Vazifa Yuklanadi? *
            </label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:border-indigo-500 focus:outline-none transition"
              required
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.days} • {g.time})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Bir kunda bir nechta darsingiz bo'lsa, aniq guruh va vaqtni tanlang
            </p>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Vazifa Mavzusi / Sarlavhasi *
            </label>
            <input
              type="text"
              placeholder="Masalan: 06-dars: JavaScript DOM amaliy loyiha"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:border-indigo-500 focus:outline-none transition placeholder:text-slate-600"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Topshiriq Shartlari & Yo'riqnoma *
            </label>
            <textarea
              rows={4}
              placeholder="Vazifa talablari, nimalar qilinishi kerak, qanday baholanadi..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:border-indigo-500 focus:outline-none transition placeholder:text-slate-600"
              required
            />
          </div>

          {/* Deadline & Max Score */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                Topshirish Muddati (Deadline) *
              </label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:border-indigo-500 focus:outline-none transition"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Maksimal Ball
              </label>
              <input
                type="number"
                min="10"
                max="100"
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:border-indigo-500 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Resources & Links */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-blue-400" />
                Biriktiriladigan Materiallar (Telegram, Figma, PDF havolalar)
              </label>
              <button
                type="button"
                onClick={addResource}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Havola qo'shish
              </button>
            </div>

            <div className="space-y-2">
              {resources.map((res, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Nomi (Masalan: Telegram Video / Figma)"
                    value={res.title}
                    onChange={(e) => updateResource(index, 'title', e.target.value)}
                    className="w-1/3 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                  <input
                    type="url"
                    placeholder="URL: https://t.me/... yoki https://figma.com/..."
                    value={res.url}
                    onChange={(e) => updateResource(index, 'url', e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                  {resources.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeResource(index)}
                      className="p-2 text-slate-500 hover:text-rose-400 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submit button */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              {loading ? 'Yuklanmoqda...' : 'Vazifani Joylash'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
