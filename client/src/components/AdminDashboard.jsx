import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Layers, 
  BookOpen, 
  Award, 
  Plus, 
  TrendingUp, 
  CheckCircle, 
  Calendar,
  Clock,
  Sparkles,
  ShieldCheck,
  Megaphone,
  Trash2
} from 'lucide-react';
import { api } from '../api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [courses, setCourses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [showAddAnnounceModal, setShowAddAnnounceModal] = useState(false);

  // New Group Form State
  const [groupName, setGroupName] = useState('');
  const [courseId, setCourseId] = useState('');
  const [levelId, setLevelId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [days, setDays] = useState('Dushanba - Chorshanba - Juma');
  const [time, setTime] = useState('14:00 - 16:00');
  const [room, setRoom] = useState('IT Lab - 302');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [creating, setCreating] = useState(false);

  // New Announcement Form State
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annBadge, setAnnBadge] = useState('Muhim');

  const loadData = async () => {
    try {
      const [st, c, g, t, s, ann] = await Promise.all([
        api.getStats(),
        api.getCourses(),
        api.getGroups(),
        api.getUsers('teacher'),
        api.getUsers('student'),
        api.getAnnouncements()
      ]);
      setStats(st);
      setCourses(c);
      setGroups(g);
      setTeachers(t);
      setStudents(s);
      setAnnouncements(ann);

      if (c.length > 0) {
        setCourseId(c[0].id);
        if (c[0].levels?.length > 0) setLevelId(c[0].levels[0].id);
      }
      if (t.length > 0) setTeacherId(t[0].id);
    } catch (err) {
      console.error('Failed to load admin data', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCourseChange = (cId) => {
    setCourseId(cId);
    const found = courses.find(c => c.id === cId);
    if (found?.levels?.length > 0) {
      setLevelId(found.levels[0].id);
    } else {
      setLevelId('');
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName || !courseId || !levelId || !teacherId) {
      alert('Iltimos, barcha kerakli maydonlarni to\'ldiring');
      return;
    }

    try {
      setCreating(true);
      await api.createGroup({
        name: groupName,
        course_id: courseId,
        level_id: levelId,
        teacher_id: teacherId,
        days,
        time,
        room,
        student_ids: selectedStudents
      });

      alert('Yangi guruh muvaffaqiyatli yaratildi!');
      setShowAddGroupModal(false);
      setGroupName('');
      setSelectedStudents([]);
      loadData();
    } catch (err) {
      alert('Xatolik: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!annTitle || !annContent) return alert('Sarlavha va matn talab qilinadi');

    try {
      await api.createAnnouncement({
        author_id: 'admin_1',
        title: annTitle,
        content: annContent,
        badge: annBadge
      });
      alert('E\'lon barcha o\'quvchi va ustozlarga chiqarildi!');
      setShowAddAnnounceModal(false);
      setAnnTitle('');
      setAnnContent('');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteGroup = async (gId) => {
    if (!confirm('Guruhni o\'chirmoqchimisiz?')) return;
    try {
      await api.deleteGroup(gId);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const selectedCourseObj = courses.find(c => c.id === courseId);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
              Skyline Education Boshqaruv Paneli (Admin)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Guruhlar taqsimoti, yangi ustoz va o'quvchilarni biriktirish hamda umumiy monitoring
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddAnnounceModal(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2 cursor-pointer border border-slate-700"
          >
            <Megaphone className="w-4 h-4 text-amber-400" />
            E'lon Berish
          </button>
          <button
            onClick={() => setShowAddGroupModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-purple-600/30 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Yangi Guruh Ochish
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <p className="text-[11px] text-slate-400 font-medium">Jami O'quvchilar</p>
          <p className="text-xl font-extrabold text-slate-100">{stats?.studentsCount || 0}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <p className="text-[11px] text-slate-400 font-medium">O'qituvchilar</p>
          <p className="text-xl font-extrabold text-blue-400">{stats?.teachersCount || 0}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <p className="text-[11px] text-slate-400 font-medium">Faol Guruhlar</p>
          <p className="text-xl font-extrabold text-indigo-400">{stats?.groupsCount || 0}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <p className="text-[11px] text-slate-400 font-medium">Yuklangan Vazifalar</p>
          <p className="text-xl font-extrabold text-purple-400">{stats?.homeworksCount || 0}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <p className="text-[11px] text-slate-400 font-medium">Topshiriqlar</p>
          <p className="text-xl font-extrabold text-emerald-400">{stats?.submissionsCount || 0}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <p className="text-[11px] text-slate-400 font-medium">Tekshirishda</p>
          <p className="text-xl font-extrabold text-amber-400">{stats?.pendingCheckCount || 0}</p>
        </div>
      </div>

      {/* Center Announcements */}
      {announcements.length > 0 && (
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-amber-400" />
            Markaz E'lonlari va Bildirishnomalari
          </h3>
          <div className="space-y-2">
            {announcements.map(ann => (
              <div key={ann.id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                      {ann.badge}
                    </span>
                    <h4 className="text-xs font-bold text-slate-200">{ann.title}</h4>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{ann.content}</p>
                </div>
                <span className="text-[10px] text-slate-500 whitespace-nowrap">
                  {new Date(ann.created_at).toLocaleDateString('uz-UZ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Teachers & Students Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Teachers */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            O'qituvchilar Tarkibi ({teachers.length})
          </h3>

          <div className="space-y-2.5 max-h-72 overflow-y-auto">
            {teachers.map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-3">
                  <img src={t.avatar} alt={t.name} className="w-9 h-9 rounded-xl object-cover" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{t.name}</h4>
                    <p className="text-[10px] text-slate-400">{t.specialty}</p>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">{t.phone}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Students */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            Ro'yxatdagi O'quvchilar ({students.length})
          </h3>

          <div className="space-y-2.5 max-h-72 overflow-y-auto">
            {students.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-3">
                  <img src={s.avatar} alt={s.name} className="w-9 h-9 rounded-xl object-cover" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{s.name}</h4>
                    <p className="text-[10px] text-slate-400">{s.specialty}</p>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">{s.phone}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Add Announcement Modal */}
      {showAddAnnounceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100">Yangi E'lon Berish</h3>
              <button onClick={() => setShowAddAnnounceModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateAnnouncement} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">E'lon Sarlavhasi *</label>
                <input
                  type="text"
                  placeholder="Yangi haftalik sinov darslari"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">E'lon Matni *</label>
                <textarea
                  rows={3}
                  placeholder="E'lon tafsilotlari..."
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Badge Nomi</label>
                <input
                  type="text"
                  value={annBadge}
                  onChange={(e) => setAnnBadge(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                />
              </div>
              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddAnnounceModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl"
                >
                  Chiqarish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Group Modal */}
      {showAddGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100">Yangi Dars Guruhi Yaratish</h3>
              <button onClick={() => setShowAddGroupModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Guruh Nomi *</label>
                <input
                  type="text"
                  placeholder="Masalan: Frontend Bootcamp #3 (Kechki)"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Kurs *</label>
                  <select
                    value={courseId}
                    onChange={(e) => handleCourseChange(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                  >
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Daraja / Bosqich *</label>
                  <select
                    value={levelId}
                    onChange={(e) => setLevelId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                  >
                    {selectedCourseObj?.levels?.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">O'qituvchi *</label>
                  <select
                    value={teacherId}
                    onChange={(e) => setTeacherId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                  >
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.specialty})</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Dars Vaqti *</label>
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="14:00 - 16:00"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Hafta Kunlari *</label>
                  <input
                    type="text"
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    placeholder="Du - Chor - Juma"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Xona</label>
                  <input
                    type="text"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="IT Lab - 302"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  O'quvchilarni guruhga qo'shish ({selectedStudents.length} tanlandi)
                </label>
                <div className="max-h-36 overflow-y-auto space-y-1 p-2 bg-slate-950 rounded-xl border border-slate-800">
                  {students.map(s => {
                    const isChecked = selectedStudents.includes(s.id);
                    return (
                      <label key={s.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-900 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedStudents([...selectedStudents, s.id]);
                            else setSelectedStudents(selectedStudents.filter(id => id !== s.id));
                          }}
                          className="rounded text-indigo-600"
                        />
                        <span className="text-slate-300">{s.name} ({s.specialty})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddGroupModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl"
                >
                  {creating ? 'Yaratilmoqda...' : 'Guruhni Saqlash'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
