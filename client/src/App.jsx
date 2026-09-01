import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';
import GroupsView from './components/GroupsView';
import MaterialsView from './components/MaterialsView';
import LeaderboardView from './components/LeaderboardView';
import DirectChat from './components/DirectChat';
import HomeworkCreateModal from './components/HomeworkCreateModal';
import HomeworkSubmitModal from './components/HomeworkSubmitModal';
import HomeworkGradeModal from './components/HomeworkGradeModal';
import { BookOpen, Layers, MessageSquare, Users, Video, Trophy } from 'lucide-react';
import { api } from './api';

export default function App() {
  const [allUsers, setAllUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('homeworks'); // homeworks, groups, materials, leaderboard, chat, admin
  const [unreadCount, setUnreadCount] = useState(0);

  // Modals state
  const [isCreateHwOpen, setIsCreateHwOpen] = useState(false);
  const [teacherGroups, setTeacherGroups] = useState([]);
  
  const [submitHwModalData, setSubmitHwModalData] = useState(null);
  const [gradeModalData, setGradeModalData] = useState(null);
  const [chatTargetUserId, setChatTargetUserId] = useState(null);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load initial users
  useEffect(() => {
    api.getUsers().then(users => {
      setAllUsers(users);
      // Default to Saidbek (Frontend teacher) or first user
      const defaultUser = users.find(u => u.id === 'teacher_frontend') || users[0];
      setCurrentUser(defaultUser);
    });
  }, []);

  // When teacher is active, load their groups for modal
  useEffect(() => {
    if (currentUser?.role === 'teacher') {
      api.getGroups({ teacher_id: currentUser.id }).then(setTeacherGroups);
    }
  }, [currentUser, refreshTrigger]);

  const handleOpenChat = (targetUserId) => {
    setChatTargetUserId(targetUserId);
    setActiveTab('chat');
  };

  const handleSwitchUser = (user) => {
    setCurrentUser(user);
    if (user.role === 'admin' && activeTab === 'homeworks') {
      setActiveTab('admin');
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex items-center gap-3 animate-pulse">
          <div className="w-8 h-8 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-600/40"></div>
          <span className="text-sm font-bold text-slate-200">Skyline Education yuklanmoqda...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-24 lg:pb-8">
      
      {/* Top Navigation Bar */}
      <Header
        currentUser={currentUser}
        allUsers={allUsers}
        onSwitchUser={handleSwitchUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unreadCount={unreadCount}
        onOpenCreateHw={currentUser.role === 'teacher' ? () => setIsCreateHwOpen(true) : null}
      />

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Homeworks Tab */}
        {activeTab === 'homeworks' && (
          currentUser.role === 'teacher' ? (
            <TeacherDashboard
              key={`${currentUser.id}-${refreshTrigger}`}
              teacher={currentUser}
              onOpenCreateHw={() => setIsCreateHwOpen(true)}
              onGradeSubmission={(sub, hw) => setGradeModalData({ submission: sub, homework: hw })}
              onOpenChatWithStudent={handleOpenChat}
            />
          ) : currentUser.role === 'student' ? (
            <StudentDashboard
              key={`${currentUser.id}-${refreshTrigger}`}
              student={currentUser}
              onSubmitHomework={(hw) => setSubmitHwModalData(hw)}
              onOpenChatWithTeacher={handleOpenChat}
              onNavigateToMaterials={() => setActiveTab('materials')}
            />
          ) : (
            <AdminDashboard />
          )
        )}

        {/* Groups & Courses Tab */}
        {activeTab === 'groups' && (
          <GroupsView />
        )}

        {/* Video Lectures & Telegram Materials Tab */}
        {activeTab === 'materials' && (
          <MaterialsView currentUser={currentUser} />
        )}

        {/* Leaderboard / Rating Tab */}
        {activeTab === 'leaderboard' && (
          <LeaderboardView />
        )}

        {/* 1-on-1 Direct Chat (Lichka) Tab */}
        {activeTab === 'chat' && (
          <DirectChat
            key={currentUser.id}
            currentUser={currentUser}
            selectedContactId={chatTargetUserId}
            onSelectContact={(id) => setChatTargetUserId(id)}
          />
        )}

        {/* Admin Dashboard Tab */}
        {activeTab === 'admin' && (
          <AdminDashboard />
        )}

      </main>

      {/* Mobile Floating Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 px-3 py-2 flex items-center justify-around">
        <button
          onClick={() => setActiveTab('homeworks')}
          className={`flex flex-col items-center gap-0.5 p-1 transition ${
            activeTab === 'homeworks' ? 'text-indigo-400 font-bold' : 'text-slate-500'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[9px]">Vazifalar</span>
        </button>

        <button
          onClick={() => setActiveTab('materials')}
          className={`flex flex-col items-center gap-0.5 p-1 transition ${
            activeTab === 'materials' ? 'text-indigo-400 font-bold' : 'text-slate-500'
          }`}
        >
          <Video className="w-5 h-5" />
          <span className="text-[9px]">Materiallar</span>
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex flex-col items-center gap-0.5 p-1 transition ${
            activeTab === 'leaderboard' ? 'text-indigo-400 font-bold' : 'text-slate-500'
          }`}
        >
          <Trophy className="w-5 h-5" />
          <span className="text-[9px]">Reyting</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`flex flex-col items-center gap-0.5 p-1 transition relative ${
            activeTab === 'chat' ? 'text-indigo-400 font-bold' : 'text-slate-500'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[9px]">Lichka</span>
          {unreadCount > 0 && (
            <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-rose-500" />
          )}
        </button>

        {currentUser.role === 'admin' && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex flex-col items-center gap-0.5 p-1 transition ${
              activeTab === 'admin' ? 'text-purple-400 font-bold' : 'text-slate-500'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[9px]">Admin</span>
          </button>
        )}
      </div>

      {/* Modals */}
      <HomeworkCreateModal
        isOpen={isCreateHwOpen}
        onClose={() => setIsCreateHwOpen(false)}
        teacher={currentUser}
        groups={teacherGroups}
        onCreated={() => setRefreshTrigger(prev => prev + 1)}
      />

      <HomeworkSubmitModal
        isOpen={!!submitHwModalData}
        onClose={() => setSubmitHwModalData(null)}
        homework={submitHwModalData}
        student={currentUser}
        onSubmitted={() => setRefreshTrigger(prev => prev + 1)}
      />

      <HomeworkGradeModal
        isOpen={!!gradeModalData}
        onClose={() => setGradeModalData(null)}
        submission={gradeModalData?.submission}
        homework={gradeModalData?.homework}
        onGraded={() => setRefreshTrigger(prev => prev + 1)}
      />

    </div>
  );
}
