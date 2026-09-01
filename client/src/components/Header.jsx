import React, { useState } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  MessageSquare, 
  Users, 
  PlusCircle, 
  Layers, 
  Sparkles,
  ChevronDown,
  Menu,
  X,
  Video,
  Trophy
} from 'lucide-react';

export default function Header({ 
  currentUser, 
  allUsers, 
  onSwitchUser, 
  activeTab, 
  setActiveTab,
  unreadCount = 0,
  onOpenCreateHw
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full text-xs font-semibold">Admin</span>;
      case 'teacher':
        return <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full text-xs font-semibold">Ustoz</span>;
      case 'student':
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full text-xs font-semibold">O'quvchi</span>;
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  Skyline
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold tracking-wider uppercase border border-indigo-500/30">
                  Education
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">LMS & Vazifalar Portali</p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-900/70 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('homeworks')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'homeworks'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Vazifalar
            </button>

            <button
              onClick={() => setActiveTab('groups')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'groups'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Guruhlar
            </button>

            <button
              onClick={() => setActiveTab('materials')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'materials'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              Video & Materiallar
            </button>

            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'leaderboard'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              Reyting
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition relative cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Lichka (Chat)
              {unreadCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute top-1 right-1" />
              )}
            </button>

            {currentUser?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-purple-300 hover:bg-purple-500/10'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Admin
              </button>
            )}
          </nav>

          {/* Right Action: Role Switcher */}
          <div className="flex items-center gap-3">
            {currentUser?.role === 'teacher' && onOpenCreateHw && (
              <button
                onClick={onOpenCreateHw}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-md shadow-blue-500/20 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                Vazifa qo'shish
              </button>
            )}

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2.5 p-1.5 pl-2 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition cursor-pointer"
              >
                <img
                  src={currentUser?.avatar}
                  alt={currentUser?.name}
                  className="w-7 h-7 rounded-xl object-cover ring-1 ring-slate-700"
                />
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    {currentUser?.name}
                    {getRoleBadge(currentUser?.role)}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[130px]">
                    {currentUser?.specialty}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 mr-1" />
              </button>

              {/* Role switcher dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-72 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-slate-800 mb-1.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Foydalanuvchini Almashtirish
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Istalgan ustoz yoki o'quvchi nomidan sinab ko'ring
                    </p>
                  </div>
                  <div className="max-h-72 overflow-y-auto space-y-1">
                    {allUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          onSwitchUser(u);
                          setShowUserMenu(false);
                        }}
                        className={`w-full flex items-center gap-2.5 p-2 rounded-2xl text-left text-xs transition cursor-pointer ${
                          currentUser?.id === u.id
                            ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                            : 'hover:bg-slate-800/80 text-slate-300'
                        }`}
                      >
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-7 h-7 rounded-xl object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate flex items-center justify-between">
                            <span>{u.name}</span>
                            {getRoleBadge(u.role)}
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">{u.specialty}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 lg:hidden text-slate-300 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-slate-800 space-y-1">
            <button
              onClick={() => { setActiveTab('homeworks'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold ${
                activeTab === 'homeworks' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Vazifalar
            </button>
            <button
              onClick={() => { setActiveTab('groups'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold ${
                activeTab === 'groups' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              Guruhlar & Kurslar
            </button>
            <button
              onClick={() => { setActiveTab('materials'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold ${
                activeTab === 'materials' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-900'
              }`}
            >
              <Video className="w-4 h-4" />
              Video & Materiallar
            </button>
            <button
              onClick={() => { setActiveTab('leaderboard'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold ${
                activeTab === 'leaderboard' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-900'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              O'quvchilar Reytingi
            </button>
            <button
              onClick={() => { setActiveTab('chat'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold ${
                activeTab === 'chat' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-900'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Shaxsiy Chat (Lichka)
            </button>
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => { setActiveTab('admin'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold ${
                  activeTab === 'admin' ? 'bg-purple-600 text-white' : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <Users className="w-4 h-4" />
                Admin Paneli
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
