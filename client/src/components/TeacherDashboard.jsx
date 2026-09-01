import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Layers, 
  Users, 
  Clock, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  MessageSquare, 
  ChevronRight, 
  Award,
  BookOpen,
  Filter,
  ExternalLink,
  ClipboardCheck,
  Trash2
} from 'lucide-react';
import AttendanceModal from './AttendanceModal';
import { api } from '../api';

export default function TeacherDashboard({ 
  teacher, 
  onOpenCreateHw, 
  onGradeSubmission,
  onOpenChatWithStudent 
}) {
  const [groups, setGroups] = useState([]);
  const [homeworks, setHomeworks] = useState([]);
  const [selectedHw, setSelectedHw] = useState(null);
  const [selectedHwDetails, setSelectedHwDetails] = useState(null);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('all');
  const [attendanceGroup, setAttendanceGroup] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [grps, hws, ann] = await Promise.all([
        api.getGroups({ teacher_id: teacher.id }),
        api.getHomeworks({ teacher_id: teacher.id }),
        api.getAnnouncements()
      ]);
      setGroups(grps);
      setHomeworks(hws);
      setAnnouncements(ann);

      if (hws.length > 0 && !selectedHw) {
        setSelectedHw(hws[0]);
      }
    } catch (err) {
      console.error('Failed to load teacher data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [teacher.id]);

  useEffect(() => {
    if (selectedHw) {
      api.getHomeworkById(selectedHw.id).then(setSelectedHwDetails);
    }
  }, [selectedHw]);

  const handleDeleteHomework = async (hwId, e) => {
    e.stopPropagation();
    if (!confirm('Vazifani o\'chirmoqchimisiz?')) return;
    try {
      await api.deleteHomework(hwId);
      loadData();
      if (selectedHw?.id === hwId) setSelectedHw(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredHomeworks = selectedGroupFilter === 'all'
    ? homeworks
    : homeworks.filter(h => h.group_id === selectedGroupFilter);

  const totalSubmissions = homeworks.reduce((acc, h) => acc + (h.total_submissions || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Announcements Marquee / Alert */}
      {announcements.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-center gap-3 text-xs">
          <span className="px-2 py-0.5 rounded bg-indigo-500 text-white font-bold text-[10px] uppercase tracking-wider">
            {announcements[0].badge || 'E\'lon'}
          </span>
          <span className="text-indigo-200 font-semibold">{announcements[0].title}:</span>
          <span className="text-slate-300 truncate flex-1">{announcements[0].content}</span>
        </div>
      )}

      {/* Teacher Welcome & Overview Stats */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-slate-900 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <img
              src={teacher.avatar}
              alt={teacher.name}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-500/20"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-100">{teacher.name}</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
                  O'qituvchi
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">{teacher.specialty}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenCreateHw}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white text-xs sm:text-sm font-bold transition shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Yangi Vazifa Yuklash
            </button>
          </div>
        </div>

        {/* Quick Teacher Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/60">
            <p className="text-[11px] text-slate-400 font-medium">Mening Guruhlarim</p>
            <p className="text-xl font-bold text-slate-100 mt-1">{groups.length} ta guruh</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/60">
            <p className="text-[11px] text-slate-400 font-medium">Jami Vazifalar</p>
            <p className="text-xl font-bold text-indigo-400 mt-1">{homeworks.length} ta</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/60">
            <p className="text-[11px] text-slate-400 font-medium">Topshirilgan Javoblar</p>
            <p className="text-xl font-bold text-emerald-400 mt-1">{totalSubmissions} ta</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/60">
            <p className="text-[11px] text-slate-400 font-medium">Dars Jadvali</p>
            <p className="text-xl font-bold text-sky-400 mt-1">Reja bo'yicha</p>
          </div>
        </div>
      </div>

      {/* Teacher's Groups Grid with Attendance button */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            Biriktirilgan Dars Guruhlaringiz (Jadval, Xonalar va Davomat)
          </h2>
          <span className="text-xs text-slate-500">
            Bitta yo'nalishdagi turli vaqtdagi darslar alohida ajratilgan
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((grp) => (
            <div
              key={grp.id}
              className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition space-y-3 relative shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
                    {grp.course_title}
                  </span>
                  <h3 className="text-sm font-bold text-slate-100 mt-1.5">{grp.name}</h3>
                  <p className="text-xs text-slate-400">{grp.level_name}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-400">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    {grp.days}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-indigo-300 font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    {grp.time}
                  </span>
                  <span className="text-[11px] bg-slate-950 px-2 py-0.5 rounded text-slate-400">
                    {grp.room || 'Xona 302'}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/60">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  {grp.student_count} o'quvchi
                </span>
                
                {/* Take Attendance Button */}
                <button
                  onClick={() => setAttendanceGroup(grp)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  Davomat
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Homeworks & Submissions Management Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        
        {/* Left column: Homeworks List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              Berilgan Vazifalar
            </h3>

            <select
              value={selectedGroupFilter}
              onChange={(e) => setSelectedGroupFilter(e.target.value)}
              className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">Barcha guruhlar</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredHomeworks.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-slate-800 text-xs text-slate-500">
                Hozircha vazifalar yuklanmagan
              </div>
            ) : (
              filteredHomeworks.map((hw) => {
                const isSelected = selectedHw?.id === hw.id;
                return (
                  <div
                    key={hw.id}
                    onClick={() => setSelectedHw(hw)}
                    className={`p-4 rounded-2xl text-left transition cursor-pointer border relative group ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500/40 shadow-lg shadow-indigo-600/10'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-950 text-indigo-300 border border-slate-800">
                        {hw.group_name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-amber-400/90 flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3" />
                          {new Date(hw.deadline).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short' })}
                        </span>
                        <button
                          onClick={(e) => handleDeleteHomework(hw.id, e)}
                          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition"
                          title="O'chirish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-slate-100 mt-2 line-clamp-2">
                      {hw.title}
                    </h4>

                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400">
                      <span>Topshirildi: <strong className="text-emerald-400">{hw.total_submissions}</strong> / {hw.total_students}</span>
                      <span className="text-indigo-400 font-semibold flex items-center gap-1">
                        Tekshirish <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: Selected Homework Submissions Stream */}
        <div className="lg:col-span-7">
          {selectedHwDetails ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl">
              
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {selectedHwDetails.group_name}
                  </span>
                  <span className="text-xs text-slate-400">
                    Maksimal ball: <strong className="text-slate-200">{selectedHwDetails.max_score}</strong>
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-100 mt-2">{selectedHwDetails.title}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
                  {selectedHwDetails.description}
                </p>
              </div>

              {/* Student Submissions List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  O'quvchilar Topshiriqlari ({selectedHwDetails.submissions?.length || 0})
                </h4>

                <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                  {selectedHwDetails.submissions?.map((sub) => {
                    const hasSubmitted = !!sub.submission_id;
                    const isGraded = sub.status === 'graded';

                    return (
                      <div
                        key={sub.student_id}
                        className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={sub.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                            alt={sub.student_name}
                            className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-800"
                          />
                          <div>
                            <h5 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                              {sub.student_name}
                              {hasSubmitted ? (
                                isGraded ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                                    {sub.score} ball
                                  </span>
                                ) : (
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30 animate-pulse">
                                    Tekshirish kerak
                                  </span>
                                )
                              ) : (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-500 font-medium">
                                  Hali topshirmadi
                                </span>
                              )}
                            </h5>
                            <p className="text-[10px] text-slate-400">{sub.phone}</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onOpenChatWithStudent(sub.student_id)}
                            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-indigo-400 border border-slate-800 transition cursor-pointer"
                            title="Lichkaga yozish"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>

                          {hasSubmitted ? (
                            <button
                              onClick={() => onGradeSubmission(sub, selectedHwDetails)}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                isGraded
                                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-indigo-600/30'
                              }`}
                            >
                              <Award className="w-3.5 h-3.5" />
                              {isGraded ? 'Qayta baholash' : 'Tekshirish & Ball'}
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-600 px-3 py-1.5">Topshirilmagan</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-12 bg-slate-900/40 rounded-3xl border border-slate-800 text-slate-500 text-xs">
              Chap tarafdan istalgan vazifani tanlang
            </div>
          )}
        </div>

      </div>

      {/* Attendance Modal */}
      <AttendanceModal
        isOpen={!!attendanceGroup}
        onClose={() => setAttendanceGroup(null)}
        group={attendanceGroup}
      />

    </div>
  );
}
