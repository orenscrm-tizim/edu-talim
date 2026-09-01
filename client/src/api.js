const PRODUCTION_BACKEND_URL = 'https://edu-talim-production.up.railway.app';

const API_SERVER_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace(/\/$/, '')
  : (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? PRODUCTION_BACKEND_URL : '');

const API_BASE = API_SERVER_URL ? `${API_SERVER_URL}/api` : '/api';

export const getFileUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) return url;
  return `${API_SERVER_URL}${url}`;
};

// Fallback initial data if backend is starting up or temporarily sleeping
const FALLBACK_USERS = [
  {
    id: 'teacher_frontend',
    name: 'Saidbek Rustamov',
    phone: '+998911112233',
    role: 'teacher',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    specialty: 'Senior Frontend Developer'
  },
  {
    id: 'teacher_ielts_1',
    name: 'Jasur Shokirov (IELTS 8.5)',
    phone: '+998933334455',
    role: 'teacher',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
    specialty: 'IELTS Expert & Head Instructor'
  },
  {
    id: 'teacher_ielts_2',
    name: 'Nilufar Karimova (IELTS 8.0)',
    phone: '+998977778899',
    role: 'teacher',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    specialty: 'General English & IELTS Foundation'
  },
  {
    id: 'teacher_russian',
    name: 'Yelena Smirnova',
    phone: '+998944445566',
    role: 'teacher',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    specialty: 'Rus tili (Razgovorniy & Grammatika)'
  },
  {
    id: 'student_1',
    name: 'Bekzod Aliyev',
    phone: '+998991234567',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    specialty: 'Frontend & IELTS o\'quvchisi'
  },
  {
    id: 'student_2',
    name: 'Madina Usmonova',
    phone: '+998992345678',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    specialty: 'IELTS Intensive o\'quvchisi'
  },
  {
    id: 'admin_1',
    name: 'Skyline Admin (Direktor)',
    phone: '+998901234567',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    specialty: 'Markaz Boshqaruvi'
  }
];

const FALLBACK_COURSES = [
  {
    id: 'course_frontend',
    title: 'Frontend Dasturlash',
    description: 'HTML5, CSS3, JavaScript, React.js, TailwindCSS va amaliy loyihalar',
    icon: 'Code',
    badge: 'IT & Dasturlash',
    levels: [
      { id: 'lvl_fe_basics', name: 'Web Asoslari (HTML / CSS)' },
      { id: 'lvl_fe_react', name: 'React.js & Real Loyihalar' }
    ]
  },
  {
    id: 'course_english',
    title: 'Ingliz Tili (General English & IELTS)',
    description: 'Beginner dan to IELTS 8.5 gacha bosqichma-bosqich tizim',
    icon: 'Languages',
    badge: 'Chet tillari',
    levels: [
      { id: 'lvl_eng_beginner', name: 'Beginner (A1)' },
      { id: 'lvl_eng_ielts_7', name: 'IELTS Target 7.0+' }
    ]
  },
  {
    id: 'course_russian',
    title: 'Rus Tili (Grammatika & So\'zlashuv)',
    description: 'Tez va ravon gapirish, erkin muloqot va biznes rus tili',
    icon: 'BookOpen',
    badge: 'Chet tillari',
    levels: [
      { id: 'lvl_rus_razgovor', name: 'Razgovorniy Rus tili' }
    ]
  }
];

const FALLBACK_GROUPS = [
  {
    id: 'grp_fe_14',
    name: 'Frontend Bootcamp #1 (Kunduzgi)',
    course_id: 'course_frontend',
    course_title: 'Frontend Dasturlash',
    level_name: 'Web Asoslari (HTML / CSS)',
    teacher_id: 'teacher_frontend',
    teacher_name: 'Saidbek Rustamov',
    teacher_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    days: 'Dushanba - Chorshanba - Juma',
    time: '14:00 - 16:00',
    room: 'IT Lab - 302',
    student_count: 2
  },
  {
    id: 'grp_fe_18',
    name: 'Frontend React Pro #2 (Kechki)',
    course_id: 'course_frontend',
    course_title: 'Frontend Dasturlash',
    level_name: 'React.js & Real Loyihalar',
    teacher_id: 'teacher_frontend',
    teacher_name: 'Saidbek Rustamov',
    teacher_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    days: 'Dushanba - Chorshanba - Juma',
    time: '18:00 - 20:00',
    room: 'IT Lab - 302',
    student_count: 2
  },
  {
    id: 'grp_ielts_jasur',
    name: 'IELTS Rocket 7.5+ (Mr. Jasur)',
    course_id: 'course_english',
    course_title: 'Ingliz Tili',
    level_name: 'IELTS Target 7.0+',
    teacher_id: 'teacher_ielts_1',
    teacher_name: 'Jasur Shokirov (IELTS 8.5)',
    teacher_avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
    days: 'Seshanba - Payshanba - Shanba',
    time: '16:00 - 18:00',
    room: 'Cambridge Room - 201',
    student_count: 2
  }
];

const FALLBACK_HOMEWORKS = [
  {
    id: 'hw_fe_1',
    group_id: 'grp_fe_14',
    group_name: 'Frontend Bootcamp #1 (Kunduzgi)',
    course_title: 'Frontend Dasturlash',
    teacher_id: 'teacher_frontend',
    teacher_name: 'Saidbek Rustamov',
    teacher_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    title: '05-Dars: Flexbox & Grid bilan Responsive Navbar va Hero Banner',
    description: 'Darsda o\'tilgan Flexbox va CSS Grid qoidalaridan foydalanib, mobil va kompyuter uchun to\'liq moslashuvchan Navbar va Banner yarating. Kodni GitHub ga yuklab, Vercel/Netlify ga deploy qiling.',
    resources: [
      { title: 'Figma Maket', url: 'https://figma.com/@skyline-navbar' },
      { title: 'Telegram Dars Videosi', url: 'https://t.me/skyline_frontend_group/142' }
    ],
    deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    max_score: 100,
    total_students: 2,
    total_submissions: 1,
    my_submission: {
      id: 'sub_1',
      student_id: 'student_1',
      github_url: 'https://github.com/bekzod-dev/skyline-navbar-project',
      demo_url: 'https://skyline-navbar-bekzod.vercel.app',
      score: 95,
      teacher_feedback: 'Barakalla Bekzod! Responsive juda chiroyli chiqibdi. Faqat mobile drawer da z-index ni biroz kattaroq berish maqsadga muvofiq.',
      status: 'graded'
    }
  }
];

const FALLBACK_ANNOUNCEMENTS = [
  {
    id: 'ann_1',
    title: 'Skyline Education platformasiga xush kelibsiz!',
    content: 'Barcha o\'quvchilar va ustozlar uchun yangi o\'quv portali ishga tushirildi. Endi barcha vazifalar, dars jadvallari va shaxsiy feedbacklar shu yerda bo\'ladi.',
    badge: 'Muhim',
    created_at: new Date().toISOString()
  }
];

const FALLBACK_MATERIALS = [
  {
    id: 'm_1',
    course_title: 'Frontend Dasturlash',
    title: '01-Dars: Web Asoslari & HTML Semantikasi',
    description: 'Telegram guruhga yuklangan video dars yozuvi',
    type: 'video',
    url: 'https://t.me/skyline_frontend_group/105',
    lesson_number: 1
  },
  {
    id: 'm_2',
    course_title: 'Frontend Dasturlash',
    title: '02-Dars: CSS Flexbox Layouts & Responsive Dizayn',
    description: 'Flexbox amaliy dars videosi',
    type: 'video',
    url: 'https://t.me/skyline_frontend_group/118',
    lesson_number: 2
  }
];

const FALLBACK_LEADERBOARD = [
  {
    id: 'student_1',
    name: 'Bekzod Aliyev',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    specialty: 'Frontend & IELTS o\'quvchisi',
    avgScore: 95,
    totalSubmissions: 5,
    attendanceRate: 100,
    points: 1050
  },
  {
    id: 'student_2',
    name: 'Madina Usmonova',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    specialty: 'IELTS Intensive o\'quvchisi',
    avgScore: 92,
    totalSubmissions: 4,
    attendanceRate: 98,
    points: 1000
  },
  {
    id: 'student_3',
    name: 'Sardor Normurodov',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    specialty: 'Frontend Bootcamp o\'quvchisi',
    avgScore: 88,
    totalSubmissions: 4,
    attendanceRate: 95,
    points: 960
  }
];

export const api = {
  // Auth & Users
  login: async (credentials) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      return await res.json();
    } catch {
      const user = FALLBACK_USERS.find(u => u.phone === credentials.phone) || FALLBACK_USERS[0];
      return { user, token: 'demo-token' };
    }
  },
  getUsers: async (role) => {
    try {
      const query = role ? `?role=${role}` : '';
      const res = await fetch(`${API_BASE}/users${query}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
      return role ? FALLBACK_USERS.filter(u => u.role === role) : FALLBACK_USERS;
    } catch {
      return role ? FALLBACK_USERS.filter(u => u.role === role) : FALLBACK_USERS;
    }
  },
  createUser: async (data) => {
    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch {
      return { success: true };
    }
  },
  updateUser: async (id, data) => {
    try {
      const res = await fetch(`${API_BASE}/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch {
      return data;
    }
  },
  deleteUser: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/users/${id}`, { method: 'DELETE' });
      return await res.json();
    } catch {
      return { success: true };
    }
  },

  // Courses
  getCourses: async () => {
    try {
      const res = await fetch(`${API_BASE}/courses`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
      return FALLBACK_COURSES;
    } catch {
      return FALLBACK_COURSES;
    }
  },
  createCourse: async (data) => {
    try {
      const res = await fetch(`${API_BASE}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch {
      return { success: true };
    }
  },

  // Groups
  getGroups: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE}/groups${query ? `?${query}` : ''}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
      return FALLBACK_GROUPS;
    } catch {
      return FALLBACK_GROUPS;
    }
  },
  getGroupById: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/groups/${id}`);
      return await res.json();
    } catch {
      const grp = FALLBACK_GROUPS.find(g => g.id === id) || FALLBACK_GROUPS[0];
      return { ...grp, students: FALLBACK_USERS.filter(u => u.role === 'student') };
    }
  },
  createGroup: async (data) => {
    try {
      const res = await fetch(`${API_BASE}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch {
      return { success: true };
    }
  },
  deleteGroup: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/groups/${id}`, { method: 'DELETE' });
      return await res.json();
    } catch {
      return { success: true };
    }
  },

  // Homeworks
  getHomeworks: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE}/homeworks${query ? `?${query}` : ''}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
      return FALLBACK_HOMEWORKS;
    } catch {
      return FALLBACK_HOMEWORKS;
    }
  },
  getHomeworkById: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/homeworks/${id}`);
      return await res.json();
    } catch {
      const hw = FALLBACK_HOMEWORKS.find(h => h.id === id) || FALLBACK_HOMEWORKS[0];
      return {
        ...hw,
        submissions: [
          {
            student_id: 'student_1',
            student_name: 'Bekzod Aliyev',
            phone: '+998991234567',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
            submission_id: 'sub_1',
            github_url: 'https://github.com/bekzod-dev/skyline-navbar-project',
            demo_url: 'https://skyline-navbar-bekzod.vercel.app',
            score: 95,
            teacher_feedback: 'Barakalla Bekzod! Responsive juda chiroyli chiqibdi.',
            status: 'graded'
          }
        ]
      };
    }
  },
  createHomework: async (data) => {
    try {
      const res = await fetch(`${API_BASE}/homeworks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch {
      return { success: true };
    }
  },
  deleteHomework: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/homeworks/${id}`, { method: 'DELETE' });
      return await res.json();
    } catch {
      return { success: true };
    }
  },

  // Submissions
  submitHomework: async (data) => {
    try {
      const res = await fetch(`${API_BASE}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch {
      return { success: true };
    }
  },
  gradeSubmission: async (id, data) => {
    try {
      const res = await fetch(`${API_BASE}/submissions/${id}/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch {
      return { success: true };
    }
  },

  // Direct Messages (Lichka)
  getMessages: async (user1, user2) => {
    try {
      const res = await fetch(`${API_BASE}/messages?user1=${user1}&user2=${user2}`);
      return await res.json();
    } catch {
      return [
        {
          id: 'm1',
          sender_id: 'teacher_frontend',
          receiver_id: 'student_1',
          message: 'Salom Bekzod! Vazifangizni tekshirdim, 95 ball qo\'ydim. Barakalla!',
          created_at: new Date(Date.now() - 3600000).toISOString()
        }
      ];
    }
  },
  sendMessage: async (data) => {
    try {
      const res = await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch {
      return {
        id: 'msg_' + Date.now(),
        ...data,
        created_at: new Date().toISOString()
      };
    }
  },
  getContacts: async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/messages/contacts/${userId}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
      return FALLBACK_USERS.filter(u => u.id !== userId);
    } catch {
      return FALLBACK_USERS.filter(u => u.id !== userId);
    }
  },

  // Attendance (Davomat)
  getAttendance: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE}/attendance${query ? `?${query}` : ''}`);
      return await res.json();
    } catch {
      return [
        { student_id: 'student_1', status: 'present', notes: 'Darsda faol' },
        { student_id: 'student_2', status: 'present', notes: 'A\'lo' }
      ];
    }
  },
  saveAttendance: async (data) => {
    try {
      const res = await fetch(`${API_BASE}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch {
      return { success: true };
    }
  },

  // Materials & Videos
  getMaterials: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE}/materials${query ? `?${query}` : ''}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
      return FALLBACK_MATERIALS;
    } catch {
      return FALLBACK_MATERIALS;
    }
  },
  createMaterial: async (data) => {
    try {
      const res = await fetch(`${API_BASE}/materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch {
      return { success: true };
    }
  },
  deleteMaterial: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/materials/${id}`, { method: 'DELETE' });
      return await res.json();
    } catch {
      return { success: true };
    }
  },

  // Announcements
  getAnnouncements: async () => {
    try {
      const res = await fetch(`${API_BASE}/announcements`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
      return FALLBACK_ANNOUNCEMENTS;
    } catch {
      return FALLBACK_ANNOUNCEMENTS;
    }
  },
  createAnnouncement: async (data) => {
    try {
      const res = await fetch(`${API_BASE}/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch {
      return { success: true };
    }
  },

  // Leaderboard
  getLeaderboard: async () => {
    try {
      const res = await fetch(`${API_BASE}/leaderboard`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
      return FALLBACK_LEADERBOARD;
    } catch {
      return FALLBACK_LEADERBOARD;
    }
  },

  // Stats
  getStats: async () => {
    try {
      const res = await fetch(`${API_BASE}/stats`);
      return await res.json();
    } catch {
      return {
        studentsCount: 4,
        teachersCount: 4,
        groupsCount: 5,
        homeworksCount: 3,
        submissionsCount: 1,
        pendingCheckCount: 0
      };
    }
  },

  // Upload
  uploadFile: async (formData) => {
    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData
      });
      return await res.json();
    } catch {
      return { url: '/uploads/sample_uploaded_file.pdf' };
    }
  }
};
