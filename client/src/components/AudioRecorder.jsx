import React, { useState, useRef } from 'react';
import { Mic, Square, Play, Pause, Trash2, CheckCircle2 } from 'lucide-react';
import { api } from '../api';

export default function AudioRecorder({ onAudioUploaded, currentAudioUrl }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(currentAudioUrl || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploading, setUploading] = useState(false);

  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioElementRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Mikrofonga ruxsat berilmadi yoki xatolik yuz berdi: ' + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);
    setRecordingTime(0);
    if (onAudioUploaded) onAudioUploaded(null);
  };

  const togglePlayback = () => {
    if (!audioElementRef.current) return;
    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current.play();
      setIsPlaying(true);
    }
  };

  const uploadAudio = async () => {
    if (!audioBlob) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', audioBlob, `speaking_${Date.now()}.webm`);
      const res = await api.uploadFile(formData);
      if (res.url) {
        if (onAudioUploaded) onAudioUploaded(res.url);
        alert('Ovozli javob muvaffaqiyatli saqlandi!');
      }
    } catch (err) {
      alert('Yuklashda xatolik: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Mic className="w-3.5 h-3.5 text-rose-400" />
          Ovozli Javob (Speaking / Talaffuz)
        </span>
        {isRecording && (
          <span className="flex items-center gap-2 text-xs font-medium text-rose-400 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Yozilmoqda: {formatTime(recordingTime)}
          </span>
        )}
      </div>

      {!audioUrl && !isRecording && (
        <button
          type="button"
          onClick={startRecording}
          className="w-full py-3 px-4 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 flex items-center justify-center gap-2 text-sm font-medium transition cursor-pointer"
        >
          <Mic className="w-4 h-4 text-rose-400" />
          Ovoz yozishni boshlash
        </button>
      )}

      {isRecording && (
        <button
          type="button"
          onClick={stopRecording}
          className="w-full py-3 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center gap-2 text-sm font-medium transition shadow-lg shadow-rose-600/30 cursor-pointer"
        >
          <Square className="w-4 h-4 fill-white" />
          Yozishni to'xtatish ({formatTime(recordingTime)})
        </button>
      )}

      {audioUrl && !isRecording && (
        <div className="space-y-3">
          <audio
            ref={audioElementRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
          <div className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={togglePlayback}
              className="p-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center justify-center cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <span className="text-xs text-slate-400 font-mono">
              Yozib olingan audio ({formatTime(recordingTime || 30)})
            </span>
            <button
              type="button"
              onClick={resetRecording}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
              title="O'chirish va qayta yozish"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {audioBlob && (
            <button
              type="button"
              disabled={uploading}
              onClick={uploadAudio}
              className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              {uploading ? 'Yuklanmoqda...' : 'Audioni tasdiqlash'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
