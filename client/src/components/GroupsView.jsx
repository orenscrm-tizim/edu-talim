import React, { useState, useEffect } from 'react';
import { Layers, Calendar, Clock, Users, BookOpen, Code, Languages, Sparkles } from 'lucide-react';
import { api } from '../api';

export default function GroupsView({ onSelectGroup }) {
  const [courses, setCourses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [c, g] = await Promise.all([
          api.getCourses(),
          api.getGroups()
        ]);
        setCourses(c);
        setGroups(g);
      } catch (err) {
        console.error('Failed to load courses/groups', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredGroups = selectedCourse === 'all'
    ? groups
    : groups.filter(g => g.course_id === selectedCourse);

  const getCourseIcon = (iconName) => {
    switch (iconName) {
      case 'Code':
        return <Code className="w-5 h-5 text-indigo-400" />;
      case 'Languages':
        return <Languages className="w-5 h-5 text-emerald-400" />;
      default:
        return <BookOpen className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          Skyline Education Kurslari va Dars Guruhlari
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Barcha yo'nalishlar, darajalar, ustozlar va dars jadvallari
        </p>
      </div>

      {/* Courses Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {courses.map((course) => {
          const isSelected = selectedCourse === course.id;
          return (
            <div
              key={course.id}
              onClick={() => setSelectedCourse(selectedCourse === course.id ? 'all' : course.id)}
              className={`p-5 rounded-2xl border transition cursor-pointer relative overflow-hidden ${
                isSelected
                  ? 'bg-indigo-600/20 border-indigo-500/50 shadow-xl shadow-indigo-600/10'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  {getCourseIcon(course.icon)}
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-950 text-slate-400 border border-slate-800">
                  {course.badge}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-100">{course.title}</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{course.description}</p>
              
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-indigo-400 font-semibold">
                <span>{course.levels?.length || 0} ta daraja / bosqich</span>
                <span>{isSelected ? 'Tanlandi ✓' : 'Guruhlarni saralash →'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between pt-2">
        <h3 className="text-sm font-bold text-slate-200">
          Faol Dars Guruhlari ({filteredGroups.length})
        </h3>
        {selectedCourse !== 'all' && (
          <button
            onClick={() => setSelectedCourse('all')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
          >
            Barcha kurslarni ko'rsatish
          </button>
        )}
      </div>

      {/* Groups List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGroups.map((grp) => (
          <div
            key={grp.id}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition space-y-3.5 shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
                  {grp.course_title}
                </span>
                <span className="text-[11px] bg-slate-950 px-2 py-0.5 rounded text-slate-400 border border-slate-800">
                  {grp.room || 'Xona 302'}
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-100 mt-2">{grp.name}</h4>
              <p className="text-xs text-slate-400">{grp.level_name}</p>
            </div>

            {/* Teacher Details */}
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <img
                src={grp.teacher_avatar}
                alt={grp.teacher_name}
                className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-700"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-200 truncate">{grp.teacher_name}</p>
                <p className="text-[10px] text-slate-400">Asosiy O'qituvchi</p>
              </div>
            </div>

            {/* Schedule */}
            <div className="pt-2 border-t border-slate-800 space-y-1 text-xs text-slate-400">
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
                <span className="flex items-center gap-1 text-slate-400">
                  <Users className="w-3.5 h-3.5" />
                  {grp.student_count || 0} o'quvchi
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
