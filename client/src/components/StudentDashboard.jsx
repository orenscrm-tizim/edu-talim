import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  MessageSquare, 
  Send, 
  Award, 
  ExternalLink,
  Globe,
  Sparkles,
  ChevronRight,
  Video,
  FileText
} from 'lucide-react';
import GithubIcon from './GithubIcon';
import { api } from '../api';

export default function StudentDashboard({ 
  student, 
  onSubmitHomework, 
  onOpenChatWithTeacher,
  onNavigateToMaterials 
}) {
  const [groups, setGroups] = useState([]);
  const [homeworks, setHomeworks] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [grps, hws, ann, att] = await Promise.all([
        api.getGroups({ student_id: student.id }),
        api.getHomeworks({ student_id: student.id }),
        api.getAnnouncements(),
        api.getAttendance({ student_id: student.id })
      ]);
      setGroups(grps);
      setHomeworks(hws);
      setAnnouncements(ann);
      setAttendanceRecords(att);
    } catch (err) {
      console.error('Failed to load student data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [student.id]);

  const filteredHomeworks = homeworks.filter(hw => {
    const sub = hw.my_submission;
    if (filterStatus === 'pending') return !sub;
    if (filterStatus === 'submitted') return sub && sub.status === 'submitted';
    if (filterStatus === 'graded') return sub && sub.status === 'graded';
    return true;
  });

  const gradedCount = homeworks.filter(h => h.my_submission?.status === 'graded').length;
  const pendingCount = homeworks.filter(h => !h.my_submission).length;
  
  const gradedScores = homeworks
    .filter(h => h.my_submission?.status === 'graded' && typeof h.my_submission?.score === 'number')
    .map(h => h.my_submission.score);
  const avgScore = gradedScores.length > 0
    ? Math.round(gradedScores.reduce((a, b) => a + b, 0) / gradedScores.length)
    : 0;

  const totalAtt = attendanceRecords.length;
  const presentAtt = attendanceRecords.filter(a => a.status === 'present').length;
  const attendanceRate = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 100;

  return (
    <div className="space-y-6">
      
      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-center gap-3 text-xs shadow-lg">
          <span className="px-2 py-0.5 rounded bg-indigo-500 text-white font-bold text-[10px] uppercase tracking-wider">
            {announcements[0].badge || 'E\'lon'}
          </span>
          <span className="text-indigo-200 font-semibold">{announcements[0].title}:</span>
          <span className="text-slate-300 truncate flex-1">{announcements[0].content}</span>
        </div>
      )}

      {/* Student Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/30 border border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <img
              src={student.avatar}
              alt={student.name}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/20"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-100">{student.name}</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  O'quvchi
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">{student.specialty}</p>
            </div>
          </div>

          {/* Student Score & Attendance */}
          <div className="flex items-center gap-3">
            {avgScore > 0 && (
              <div className="flex items-center gap-3 bg-slate-950/80 px-5 py-3 rounded-2xl border border-slate-800">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">O'rtacha Ball</p>
                  <p className="text-xl font-extrabold text-amber-400">{avgScore} / 100</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Student Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/60">
            <p className="text-[11px] text-slate-400 font-medium">Yozilgan Darslarim</p>
            <p className="text-xl font-bold text-slate-100 mt-1">{groups.length} ta guruh</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/60">
            <p className="text-[11px] text-slate-400 font-medium">Bajarilishi Kerak</p>
            <p className="text-xl font-bold text-amber-400 mt-1">{pendingCount} ta</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/60">
            <p className="text-[11px] text-slate-400 font-medium">Baholangan Vazifalar</p>
            <p className="text-xl font-bold text-emerald-400 mt-1">{gradedCount} ta</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/60">
            <p className="text-[11px] text-slate-400 font-medium">Davomatim</p>
            <p className="text-xl font-bold text-indigo-400 mt-1">{attendanceRate}%</p>
          </div>
        </div>
      </div>

      {/* Enrolled Courses & Groups */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          Mening Dars Guruhlari va Ustozlarim
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((grp) => (
            <div
              key={grp.id}
              className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition space-y-3 shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                    {grp.course_title}
                  </span>
                  <h3 className="text-sm font-bold text-slate-100 mt-1.5">{grp.name}</h3>
                  <p className="text-xs text-slate-400">{grp.level_name}</p>
                </div>
              </div>

              {/* Teacher snippet */}
              <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <img
                    src={grp.teacher_avatar}
                    alt={grp.teacher_name}
                    className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-700"
                  />
                  <div>
                    <p className="text-xs font-semibold text-slate-200">{grp.teacher_name}</p>
                    <p className="text-[10px] text-slate-400">Ustoz</p>
                  </div>
                </div>
                <button
                  onClick={() => onOpenChatWithTeacher(grp.teacher_id)}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-indigo-400 text-xs flex items-center gap-1 border border-slate-700 transition cursor-pointer"
                  title="Ustozga shaxsiy xabar yozish"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Lichka</span>
                </button>
              </div>

              {/* Schedule */}
              <div className="space-y-1 text-xs text-slate-400">
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
                    {grp.room || 'Xona 102'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Homeworks List for Student */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              Uyga Vazifalarim
            </h3>
            <p className="text-xs text-slate-400">Vazifalarni o'z vaqtida bajaring va ustoz bahosini oling</p>
          </div>

          {/* Status filter tabs */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filterStatus === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Barchasi ({homeworks.length})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filterStatus === 'pending' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Bajarilmagan ({pendingCount})
            </button>
            <button
              onClick={() => setFilterStatus('graded')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filterStatus === 'graded' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Baholangan ({gradedCount})
            </button>
          </div>
        </div>

        {/* Homework Feed */}
        <div className="space-y-3.5">
          {filteredHomeworks.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/50 rounded-3xl border border-slate-800 text-xs text-slate-500">
              Bu bo'limda vazifalar mavjud emas
            </div>
          ) : (
            filteredHomeworks.map((hw) => {
              const sub = hw.my_submission;
              const isGraded = sub?.status === 'graded';
              const isSubmitted = sub && !isGraded;

              return (
                <div
                  key={hw.id}
                  className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition shadow-xl space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {hw.group_name}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          Topshirish muddati: {new Date(hw.deadline).toLocaleString('uz-UZ', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-100">{hw.title}</h4>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {isGraded ? (
                        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-bold text-emerald-300">
                            Baholandi: {sub.score} / {hw.max_score} ball
                          </span>
                        </div>
                      ) : isSubmitted ? (
                        <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 px-3 py-1.5 rounded-xl">
                          <Clock className="w-4 h-4 text-blue-400 animate-spin" />
                          <span className="text-xs font-bold text-blue-300">
                            Topshirildi (Tekshirish kutilmoqda)
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl">
                          <AlertCircle className="w-4 h-4 text-amber-400" />
                          <span className="text-xs font-bold text-amber-300">
                            Bajarilishi kerak
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                    <p className="whitespace-pre-line">{hw.description}</p>
                    {hw.resources?.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-800 flex flex-wrap gap-2">
                        {hw.resources.map((res, i) => (
                          <a
                            key={i}
                            href={res.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-medium border border-indigo-500/20 transition"
                          >
                            <Globe className="w-3.5 h-3.5" />
                            {res.title}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* If graded: Show Teacher Feedback */}
                  {isGraded && (
                    <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                        <Award className="w-4 h-4" />
                        Ustoz Bahosi va Xulosasi:
                      </div>
                      <p className="text-xs text-slate-300 italic">
                        "{sub.teacher_feedback || "Topshiriq juda yaxshi qabul qilindi!"}"
                      </p>
                    </div>
                  )}

                  {/* Submission Bottom Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2">
                      <img
                        src={hw.teacher_avatar}
                        alt={hw.teacher_name}
                        className="w-6 h-6 rounded-md object-cover"
                      />
                      <span className="text-xs text-slate-400">Ustoz: <strong className="text-slate-300">{hw.teacher_name}</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenChatWithTeacher(hw.teacher_id)}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                        Ustozga savol berish (Lichka)
                      </button>

                      <button
                        onClick={() => onSubmitHomework(hw)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg cursor-pointer ${
                          isGraded
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                            : isSubmitted
                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                            : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30'
                        }`}
                      >
                        <Send className="w-3.5 h-3.5" />
                        {isGraded ? 'Topshiriqni ko\'rish / Yangilash' : isSubmitted ? 'Javobni tahrirlash' : 'Vazifani topshirish'}
                      </button>
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
