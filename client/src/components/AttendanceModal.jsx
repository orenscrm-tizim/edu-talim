import React, { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, AlertCircle, Calendar, Save, Users, Sparkles } from 'lucide-react';
import { api } from '../api';

export default function AttendanceModal({ isOpen, onClose, group }) {
  if (!isOpen || !group) return null;

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const groupDetails = await api.getGroupById(group.id);
        const studentList = groupDetails.students || [];
        setStudents(studentList);

        // Fetch existing attendance for this date
        const existingAtt = await api.getAttendance({ group_id: group.id, date });
        const existingMap = {};
        existingAtt.forEach(a => {
          existingMap[a.student_id] = { status: a.status, notes: a.notes || '' };
        });

        // Initialize default 'present' for any student without record
        const initialMap = {};
        studentList.forEach(s => {
          initialMap[s.id] = existingMap[s.id] || { status: 'present', notes: '' };
        });
        setAttendanceMap(initialMap);
      } catch (err) {
        console.error('Failed to load group attendance', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [group.id, date]);

  const updateStatus = (studentId, status) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  const updateNotes = (studentId, notes) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes
      }
    }));
  };

  const markAllPresent = () => {
    const updated = {};
    students.forEach(s => {
      updated[s.id] = { status: 'present', notes: attendanceMap[s.id]?.notes || '' };
    });
    setAttendanceMap(updated);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const records = Object.entries(attendanceMap).map(([studentId, data]) => ({
        student_id: studentId,
        status: data.status,
        notes: data.notes
      }));

      await api.saveAttendance({
        group_id: group.id,
        date,
        records
      });

      alert('Davomat muvaffaqiyatli saqlandi!');
      onClose();
    } catch (err) {
      alert('Xatolik: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Object.values(attendanceMap).filter(a => a.status === 'present').length;
  const absentCount = Object.values(attendanceMap).filter(a => a.status === 'absent').length;
  const excusedCount = Object.values(attendanceMap).filter(a => a.status === 'excused').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {group.name}
              </span>
              <span className="text-xs text-slate-400">
                {group.days} • {group.time}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-100 mt-1">Dars Davomati (Jurnal)</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Date Selector & Quick Filters */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span className="text-xs text-slate-300 font-semibold">Dars Sanasi:</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={markAllPresent}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition cursor-pointer"
            >
              ✓ Hamma Keldi
            </button>
          </div>
        </div>

        {/* Summary Badges */}
        <div className="px-6 py-2.5 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-around text-xs">
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Keldi: {presentCount}
          </span>
          <span className="text-rose-400 font-semibold flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> Kelmadi: {absentCount}
          </span>
          <span className="text-amber-400 font-semibold flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> Sababli: {excusedCount}
          </span>
        </div>

        {/* Student List Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto flex-1 space-y-3">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">O'quvchilar yuklanmoqda...</div>
          ) : students.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">Bu guruhda o'quvchilar yo'q</div>
          ) : (
            students.map((student) => {
              const current = attendanceMap[student.id] || { status: 'present', notes: '' };
              return (
                <div
                  key={student.id}
                  className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={student.avatar}
                      alt={student.name}
                      className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-800"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{student.name}</h4>
                      <p className="text-[10px] text-slate-400">{student.phone}</p>
                    </div>
                  </div>

                  {/* Status Toggle Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateStatus(student.id, 'present')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        current.status === 'present'
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
                      }`}
                    >
                      Keldi
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatus(student.id, 'absent')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        current.status === 'absent'
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
                      }`}
                    >
                      Kelmadi
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatus(student.id, 'excused')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        current.status === 'excused'
                          ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
                      }`}
                    >
                      Sababli
                    </button>
                  </div>
                </div>
              );
            })
          )}

          {/* Footer Save */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saqlanmoqda...' : 'Davomatni Saqlash'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
