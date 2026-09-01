import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  MessageSquare, 
  Search, 
  User, 
  Paperclip, 
  CheckCheck, 
  Clock, 
  Sparkles, 
  Phone,
  ArrowLeft,
  Mic,
  Square,
  FileText,
  Image as ImageIcon,
  Volume2
} from 'lucide-react';
import { api, getFileUrl } from '../api';

export default function DirectChat({ currentUser, selectedContactId, onSelectContact }) {
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  // Quick Voice Note State in Chat
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const audioChunksRef = useRef([]);

  const messagesEndRef = useRef(null);

  const loadContacts = async () => {
    try {
      setLoadingContacts(true);
      const data = await api.getContacts(currentUser.id);
      setContacts(data);
      
      if (selectedContactId) {
        const found = data.find(c => c.id === selectedContactId);
        if (found) setActiveContact(found);
      } else if (!activeContact && data.length > 0) {
        setActiveContact(data[0]);
      }
    } catch (err) {
      console.error('Failed to load contacts', err);
    } finally {
      setLoadingContacts(false);
    }
  };

  useEffect(() => {
    loadContacts();
    const interval = setInterval(loadContacts, 8000);
    return () => clearInterval(interval);
  }, [currentUser.id, selectedContactId]);

  const loadMessages = async () => {
    if (!activeContact) return;
    try {
      const msgs = await api.getMessages(currentUser.id, activeContact.id);
      setMessages(msgs);
    } catch (err) {
      console.error('Failed to load messages', err);
    }
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [currentUser.id, activeContact?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim() || !activeContact) return;

    const text = newMessage;
    setNewMessage('');

    try {
      setSending(true);
      const sent = await api.sendMessage({
        sender_id: currentUser.id,
        receiver_id: activeContact.id,
        message: text
      });
      setMessages((prev) => [...prev, sent]);
      loadContacts();
    } catch (err) {
      alert('Xabar yuborilmadi: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeContact) return;

    try {
      setUploadingAttachment(true);
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await api.uploadFile(formData);

      if (uploadRes.url) {
        const isImage = file.type.startsWith('image/');
        const sent = await api.sendMessage({
          sender_id: currentUser.id,
          receiver_id: activeContact.id,
          message: isImage ? '📷 Rasm' : `📎 Fayl: ${file.name}`,
          attachment_url: uploadRes.url,
          attachment_type: isImage ? 'image' : 'file'
        });
        setMessages((prev) => [...prev, sent]);
        loadContacts();
      }
    } catch (err) {
      alert('Fayl yuklanmadi: ' + err.message);
    } finally {
      setUploadingAttachment(false);
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(t => t.stop());

        // Upload and send voice note
        const formData = new FormData();
        formData.append('file', blob, `voice_${Date.now()}.webm`);
        const res = await api.uploadFile(formData);

        if (res.url) {
          const sent = await api.sendMessage({
            sender_id: currentUser.id,
            receiver_id: activeContact.id,
            message: '🎙 Ovozli xabar',
            attachment_url: res.url,
            attachment_type: 'audio'
          });
          setMessages((prev) => [...prev, sent]);
          loadContacts();
        }
      };

      mediaRecorderRef.current.start();
      setIsRecordingAudio(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);
    } catch (err) {
      alert('Mikrofondan foydalanishda xatolik: ' + err.message);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
      clearInterval(timerRef.current);
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.specialty?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadge = (role) => {
    switch (role) {
      case 'teacher':
        return <span className="bg-blue-500/20 text-blue-300 text-[10px] px-1.5 py-0.5 rounded font-semibold">Ustoz</span>;
      case 'student':
        return <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded font-semibold">O'quvchi</span>;
      default:
        return <span className="bg-purple-500/20 text-purple-300 text-[10px] px-1.5 py-0.5 rounded font-semibold">Admin</span>;
    }
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] min-h-[550px] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl">
      
      {/* Contact List Sidebar */}
      <div className={`w-full md:w-80 border-r border-slate-800 flex flex-col bg-slate-950/60 ${activeContact ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              Shaxsiy Xabarlar (Lichka)
            </h3>
            <span className="text-[11px] font-medium text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
              {contacts.length} suhbat
            </span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Qidiruv..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:border-indigo-500 focus:outline-none placeholder:text-slate-600"
            />
          </div>
        </div>

        {/* Contacts Stream */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredContacts.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              Kontaktlar topilmadi
            </div>
          ) : (
            filteredContacts.map((contact) => {
              const isSelected = activeContact?.id === contact.id;
              return (
                <button
                  key={contact.id}
                  onClick={() => {
                    setActiveContact(contact);
                    if (onSelectContact) onSelectContact(contact.id);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600/20 border border-indigo-500/30'
                      : 'hover:bg-slate-900/80 border border-transparent'
                  }`}
                >
                  <div className="relative">
                    <img
                      src={contact.avatar}
                      alt={contact.name}
                      className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-800"
                    />
                    {contact.unread_count > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                        {contact.unread_count}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-semibold text-slate-200 truncate">
                        {contact.name}
                      </span>
                      {getRoleBadge(contact.role)}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      {contact.last_message || contact.specialty || 'Suhbatni boshlash...'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Panel */}
      <div className={`flex-1 flex flex-col bg-slate-900/40 ${!activeContact ? 'hidden md:flex' : 'flex'}`}>
        {activeContact ? (
          <>
            {/* Chat Header */}
            <div className="p-3.5 px-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveContact(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white md:hidden mr-1"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <img
                  src={activeContact.avatar}
                  alt={activeContact.name}
                  className="w-9 h-9 rounded-xl object-cover ring-1 ring-indigo-500/30"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-100">{activeContact.name}</h4>
                    {getRoleBadge(activeContact.role)}
                  </div>
                  <p className="text-[10px] text-slate-400">{activeContact.specialty || activeContact.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
                  <Phone className="w-3 h-3 text-indigo-400" />
                  {activeContact.phone}
                </span>
              </div>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                  <MessageSquare className="w-10 h-10 mb-2 opacity-30 text-indigo-400" />
                  <p className="text-xs font-semibold text-slate-400">Hozircha xabarlar yo'q</p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                    {activeContact.name} bilan shaxsiy muloqotni boshlash uchun quyidagi maydondan xabar yozing.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.sender_id === currentUser.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isMine && (
                        <img
                          src={msg.sender_avatar || activeContact.avatar}
                          alt=""
                          className="w-6 h-6 rounded-lg object-cover mb-1 ring-1 ring-slate-800"
                        />
                      )}
                      
                      <div
                        className={`max-w-xs sm:max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed space-y-1.5 ${
                          isMine
                            ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-br-none shadow-md shadow-indigo-600/20'
                            : 'bg-slate-800 border border-slate-700/80 text-slate-200 rounded-bl-none'
                        }`}
                      >
                        {msg.attachment_url && (
                          <div className="rounded-xl overflow-hidden mb-1">
                            {msg.attachment_type === 'image' ? (
                              <img src={getFileUrl(msg.attachment_url)} alt="" className="max-w-full rounded-lg max-h-48 object-cover" />
                            ) : msg.attachment_type === 'audio' ? (
                              <audio controls src={getFileUrl(msg.attachment_url)} className="w-full h-8" />
                            ) : (
                              <a
                                href={getFileUrl(msg.attachment_url)}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 p-2 bg-slate-950/60 rounded-lg text-[11px] underline"
                              >
                                <FileText className="w-4 h-4" /> Faylni ko'rish
                              </a>
                            )}
                          </div>
                        )}

                        <p className="whitespace-pre-line break-words">{msg.message}</p>
                        
                        <div
                          className={`flex items-center justify-end gap-1 text-[9px] ${
                            isMine ? 'text-indigo-200' : 'text-slate-400'
                          }`}
                        >
                          <span>
                            {new Date(msg.created_at).toLocaleTimeString('uz-UZ', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {isMine && <CheckCheck className="w-3 h-3 text-indigo-200" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Bar with File & Voice Note */}
            <div className="p-3 border-t border-slate-800 bg-slate-950/40 space-y-2">
              {isRecordingAudio ? (
                <div className="flex items-center justify-between p-2 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4">
                  <span className="flex items-center gap-2 text-xs font-semibold animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    Ovoz yozilmoqda: {recordingSeconds}s
                  </span>
                  <button
                    type="button"
                    onClick={stopVoiceRecording}
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Yuborish (To'xtatish)
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  
                  {/* File upload button */}
                  <label className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition cursor-pointer">
                    <Paperclip className="w-4 h-4" />
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  {/* Voice recording button */}
                  <button
                    type="button"
                    onClick={startVoiceRecording}
                    className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 transition cursor-pointer"
                    title="Ovozli xabar yozish"
                  >
                    <Mic className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    placeholder={`${activeContact.name}ga xabar yozing...`}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:border-indigo-500 focus:outline-none placeholder:text-slate-600"
                  />
                  
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="p-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-40 text-white rounded-xl transition shadow-md shadow-indigo-600/30 flex items-center justify-center cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <MessageSquare className="w-12 h-12 mb-3 text-indigo-400/30" />
            <h4 className="text-sm font-bold text-slate-300">Suhbatdoshni tanlang</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Chap tarafdagi ro'yxatdan istalgan o'quvchi yoki o'qituvchini tanlab, shaxsiy muloqot qilishingiz mumkin.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
