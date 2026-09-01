import React, { useState, useEffect } from 'react';
import { Video, FileText, Globe, Plus, Trash2, ExternalLink, Send, Sparkles, BookOpen } from 'lucide-react';
import { api } from '../api';

export default function MaterialsView({ currentUser }) {
  const [materials, setMaterials] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New material state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('video');
  const [url, setUrl] = useState('');
  const [courseId, setCourseId] = useState('');
  const [lessonNumber, setLessonNumber] = useState(1);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      const [mats, c] = await Promise.all([
        api.getMaterials(),
        api.getCourses()
      ]);
      setMaterials(mats);
      setCourses(c);
      if (c.length > 0 && !courseId) setCourseId(c[0].id);
    } catch (err) {
      console.error('Failed to load materials', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    if (!title || !url) return alert('Sarlavha va URL talab qilinadi');

    try {
      setLoading(true);
      await api.createMaterial({
        title,
        description,
        type,
        url,
        course_id: courseId,
        lesson_number: Number(lessonNumber)
      });
      setShowAddModal(false);
      setTitle('');
      setDescription('');
      setUrl('');
      loadData();
    } catch (err) {
      alert('Xatolik: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Materialni o\'chirmoqchimisiz?')) return;
    try {
      await api.deleteMaterial(id);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredMaterials = selectedCourse === 'all'
    ? materials
    : materials.filter(m => m.course_id === selectedCourse);

  const getTypeIcon = (t) => {
    switch (t) {
      case 'video':
        return <Video className="w-5 h-5 text-blue-400" />;
      case 'pdf':
        return <FileText className="w-5 h-5 text-rose-400" />;
      default:
        return <Globe className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Video className="w-5 h-5 text-indigo-400" />
            Dars Videolari va O'quv Materiallari
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Telegram guruhga yuklangan video darslar, konspektlar va PDF qo'llanmalar to'plami
          </p>
        </div>

        {(currentUser?.role === 'teacher' || currentUser?.role === 'admin') && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Yangi Video / Material Qo'shish
          </button>
        )}
      </div>

      {/* Course Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedCourse('all')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            selectedCourse === 'all'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          Barcha Kurslar ({materials.length})
        </button>
        {courses.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedCourse(c.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              selectedCourse === c.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {c.title}
          </button>
        ))}
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMaterials.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-slate-900/50 rounded-3xl border border-slate-800 text-xs text-slate-500">
            Hozircha materiallar yuklanmagan
          </div>
        ) : (
          filteredMaterials.map((mat) => (
            <div
              key={mat.id}
              className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition shadow-xl flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                      {getTypeIcon(mat.type)}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {mat.lesson_number ? `${mat.lesson_number}-Dars` : 'Qo\'llanma'}
                    </span>
                  </div>
                  {(currentUser?.role === 'teacher' || currentUser?.role === 'admin') && (
                    <button
                      onClick={() => handleDelete(mat.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 transition cursor-pointer"
                      title="O'chirish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-100">{mat.title}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{mat.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-medium">
                  {mat.course_title || 'Umumiy'}
                </span>
                <a
                  href={mat.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-bold border border-indigo-500/30 transition flex items-center gap-1.5 shadow-sm"
                >
                  Darsni Ochish
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Material Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100">Yangi Material Qo'shish</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMaterial} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Mavzu Nomi *</label>
                <input
                  type="text"
                  placeholder="03-Dars: CSS Grid va Amaliyot"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Kurs *</label>
                  <select
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                  >
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Dars Raqami</label>
                  <input
                    type="number"
                    min="1"
                    value={lessonNumber}
                    onChange={(e) => setLessonNumber(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Material Turi *</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                >
                  <option value="video">🎥 Telegram / YouTube Video</option>
                  <option value="pdf">📄 PDF Qo'llanma / Kitob</option>
                  <option value="link">🌐 Foydali Havola / Maqola</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">URL Havola (Telegram post yoki video link) *</label>
                <input
                  type="url"
                  placeholder="https://t.me/skyline_frontend_group/145"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Qisqacha Tavsif</label>
                <textarea
                  rows={2}
                  placeholder="Darsda o'tilgan asosiy mavzular..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl"
                >
                  {loading ? 'Saqlanmoqda...' : 'Materialni Joylash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
