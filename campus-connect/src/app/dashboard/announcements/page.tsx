"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Megaphone, ArrowLeft, UploadCloud, Calendar as CalIcon, Send, Sparkles, 
  BarChart2, FileText, CheckCircle2, Clock, Users, Loader2
} from "lucide-react";

export default function AnnouncementsDashboard() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("Update");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/");
      return;
    }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    const res = await fetch('/api/announcements');
    if (res.ok) {
      setAnnouncements(await res.json());
    }
  };

  const handleSend = async () => {
    if (!title.trim() || !content.trim()) return alert("Please fill in title and content");
    
    setIsSubmitting(true);
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    
    const res = await fetch('/api/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        content,
        type,
        authorName: userData.name || "Admin"
      })
    });
    
    if (res.ok) {
      const newAnn = await res.json();
      setAnnouncements([newAnn, ...announcements]);
      setTitle("");
      setContent("");
      alert("Announcement Broadcasted Successfully!");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#F7F8FF] font-sans">
      {/* HEADER */}
      <header className="h-20 bg-white/80 backdrop-blur-md border-b border-[#EAF4FF] flex items-center px-8 sticky top-0 z-30">
        <button onClick={() => router.back()} className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-[#1E2A5A]" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-[#1E2A5A] flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-[#7C6CFF]" /> Announcements Management
          </h1>
          <p className="text-xs text-[#6B7280]">Create and broadcast campus-wide updates instantly.</p>
        </div>
      </header>

      <main className="p-8 max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* LEFT COMPOSER (Wider) */}
        <div className="xl:col-span-2 space-y-6">
          <div className="glass-panel bg-white p-8 rounded-[2rem] shadow-sm">
            <h3 className="text-lg font-bold text-[#1E2A5A] mb-6">Create New Announcement</h3>
            
            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-[#1E2A5A] ml-1">Announcement Title</label>
                <input 
                  type="text" 
                  value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., CodeFest 2024 Final Call" 
                  className="w-full mt-1.5 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#5B8CFF] focus:ring-4 focus:ring-[#5B8CFF]/10 outline-none text-[#1E2A5A]" 
                />
              </div>
              
              <div>
                <label className="text-sm font-semibold text-[#1E2A5A] ml-1">Description / Content</label>
                <textarea 
                  rows={4} 
                  value={content} onChange={e => setContent(e.target.value)}
                  placeholder="Type the announcement details here..." 
                  className="w-full mt-1.5 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#5B8CFF] focus:ring-4 focus:ring-[#5B8CFF]/10 outline-none text-[#1E2A5A] resize-none"
                ></textarea>
              </div>

              {/* Drag and Drop */}
              <div className="border-2 border-dashed border-[#5B8CFF]/30 bg-[#EAF4FF]/30 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-[#EAF4FF]/50 transition-colors cursor-pointer">
                <UploadCloud className="w-10 h-10 text-[#5B8CFF] mb-3" />
                <h4 className="text-sm font-bold text-[#1E2A5A]">Drag & Drop attachments here</h4>
                <p className="text-xs text-[#6B7280] mt-1">or click to browse from your computer (PDF, Images, DOCX)</p>
              </div>

              {/* Targets */}
              <div>
                <label className="text-sm font-semibold text-[#1E2A5A] ml-1 mb-2 block">Target Audience & Category</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {['Event', 'Workshop', 'Seminar', 'Update'].map(tag => (
                    <button 
                      key={tag}
                      onClick={() => setType(tag)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${type === tag ? 'bg-[#5B8CFF] text-white border-[#5B8CFF]' : 'border-gray-200 text-[#6B7280] hover:border-[#5B8CFF] hover:text-[#5B8CFF] bg-white'}`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Settings */}
              <div className="flex items-center justify-between border-t border-gray-100 pt-5 mt-5">
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-[#1E2A5A] hover:bg-gray-50">
                    <CalIcon className="w-4 h-4 text-[#6B7280]" /> Schedule
                  </button>
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-100 bg-red-50 text-sm font-semibold text-red-600 cursor-pointer hover:bg-red-100">
                    High Priority
                  </div>
                </div>
                
                <button 
                  onClick={handleSend}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#5B8CFF] to-[#7C6CFF] text-white font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Send Now</>}
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="space-y-6">
          
          {/* AI Insights Card */}
          <div className="glass-panel bg-gradient-to-br from-[#1E2A5A] to-[#2A3B7D] p-6 rounded-[2rem] text-white relative overflow-hidden">
             <div className="absolute right-[-20%] top-[-20%] w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
             <Sparkles className="w-6 h-6 text-yellow-300 mb-3 relative z-10" />
             <h3 className="text-lg font-bold mb-1 relative z-10">AI Suggestion</h3>
             <p className="text-xs text-gray-300 mb-4 relative z-10 leading-relaxed">Based on past engagement, sending this announcement at <strong>5:00 PM</strong> will result in 40% higher student open rates.</p>
             <button className="w-full py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur text-white font-semibold text-xs transition-colors relative z-10 border border-white/10">
               Apply AI Schedule
             </button>
          </div>

          {/* Analytics */}
          <div className="glass-panel bg-white p-6 rounded-[2rem]">
            <h3 className="text-sm font-bold text-[#1E2A5A] mb-4 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#5B8CFF]" /> Engagement Analytics
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                  <Users className="w-4 h-4" /> Total Reach
                </div>
                <span className="font-bold text-[#1E2A5A]">{announcements.length * 450}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                  <CheckCircle2 className="w-4 h-4 text-green-500" /> Read Rate
                </div>
                <span className="font-bold text-green-600">86%</span>
              </div>
            </div>
          </div>

          {/* Recent Announcements */}
          <div className="glass-panel bg-white p-6 rounded-[2rem]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#1E2A5A]">Recent Broadcasts</h3>
            </div>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {announcements.map(ann => (
                <div key={ann.id} className="p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                  <h4 className="text-xs font-bold text-[#1E2A5A] mb-1 line-clamp-1">{ann.title}</h4>
                  <div className="flex items-center justify-between text-[10px] text-[#6B7280]">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {ann.date}</span>
                    <span className="font-bold text-[#7C6CFF]">{ann.type}</span>
                  </div>
                </div>
              ))}
              {announcements.length === 0 && <p className="text-xs text-gray-500">No broadcasts yet.</p>}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
