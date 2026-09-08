"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  LayoutDashboard, FileText, PlusCircle, Mail, Megaphone, MessageSquare, 
  HelpCircle, Bot, User, Settings, LogOut, Bell, Flag, ChevronRight, 
  CheckCircle2, Clock, XCircle, FilePlus, Sparkles, Lightbulb, Loader2,
  UploadCloud, Send, Download, Search, Heart, MessageCircle, ShieldAlert
} from "lucide-react";
import { jsPDF } from "jspdf";
import ReactMarkdown from "react-markdown";

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [doubts, setDoubts] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [aiMessage, setAiMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // Faculty Selection State
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState<string[]>([]);
  const [facultySearch, setFacultySearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Settings State
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true
  });

  // Search States
  const [requestSearch, setRequestSearch] = useState("");
  const [announcementSearch, setAnnouncementSearch] = useState("");
  const [doubtSearch, setDoubtSearch] = useState("");
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  
  // Q&A and Announcements detail states
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any | null>(null);
  
  // Tab State
  const [activeTab, setActiveTab] = useState("Dashboard");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newReqTitle, setNewReqTitle] = useState("");
  const [newReqReason, setNewReqReason] = useState("");
  const [newReqFile, setNewReqFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/");
      return;
    }
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== "Student") {
      router.push("/");
      return;
    }
    setUser(parsedUser);

    const savedSettings = localStorage.getItem("settings_student");
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {}
    }

    fetchData(parsedUser.id);
  }, [router]);

  const fetchData = async (studentId: string) => {
    const [reqRes, annRes, msgRes, doubtRes, userRes] = await Promise.all([
      fetch(`/api/requests?studentId=${studentId}`),
      fetch('/api/announcements'),
      fetch('/api/messages?type=message'),
      fetch('/api/messages?type=doubt'),
      fetch('/api/users')
    ]);
    if (reqRes.ok) setRequests(await reqRes.json());
    if (annRes.ok) setAnnouncements(await annRes.json());
    if (msgRes.ok) setMessages(await msgRes.json());
    if (doubtRes.ok) setDoubts(await doubtRes.json());
    if (userRes.ok) {
      const users = await userRes.json();
      setFacultyList(users.filter((u: any) => u.role === 'Faculty'));
    }
  };

  const handleSendMessageUniversal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: messageInput.trim(),
        authorId: user.id,
        authorName: user.name,
        authorRole: user.role,
        type: activeTab === "Doubts & Q&A" ? 'doubt' : 'message',
        likes: 0,
        likedBy: [],
        answers: 0,
        comments: [],
        tags: ["Academic"]
      })
    });
    if (res.ok) {
      const newMsg = await res.json();
      if (activeTab === "Doubts & Q&A") {
        setDoubts(prev => [newMsg, ...prev]);
      } else {
        setMessages(prev => [newMsg, ...prev]);
      }
      setMessageInput("");
    }
  };

  const handleToggleLike = async (id: string) => {
    try {
      const res = await fetch('/api/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'toggleLike', userId: user?.id })
      });
      if (res.ok) {
        const updated = await res.json();
        setDoubts(prev => prev.map(d => d.id === id ? { ...d, likes: updated.likes, likedBy: updated.likedBy } : d));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (id: string, text: string) => {
    if (!text || !text.trim()) return;
    try {
      const res = await fetch('/api/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          action: 'addComment',
          userId: user?.id,
          comment: {
            text: text.trim(),
            authorId: user?.id,
            authorName: user?.name,
            authorRole: user?.role
          }
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setDoubts(prev => prev.map(d => d.id === id ? { ...d, comments: updated.comments, answers: updated.answers } : d));
        setReplyInputs(prev => ({ ...prev, [id]: "" }));
        setExpandedComments(prev => ({ ...prev, [id]: true }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAiChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiMessage.trim() || isAiLoading) return;

    const userMsg = { role: 'user', content: aiMessage };
    const currentHistory = [...chatHistory];
    setChatHistory(prev => [...prev, userMsg]);
    setAiMessage("");
    setIsAiLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMsg.content,
          history: currentHistory,
          studentId: user?.id
        })
      });
      const data = await res.json();
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.response || "Sorry, I couldn't generate a response." }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now. Please try again." }]);
    } finally {
      setIsAiLoading(false);
    }
  };




  const handleDownloadPDF = (req: any) => {
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.setTextColor(30, 42, 90);
    doc.text("CAMPUS CONNECT", 105, 20, { align: 'center' });
    
    doc.setFontSize(16);
    doc.text("PERMISSION APPROVAL LETTER", 105, 30, { align: 'center' });
    
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 35, 190, 35);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Request ID: ${req.id}`, 20, 50);
    doc.text(`Date: ${req.submittedOn}`, 20, 60);
    doc.text(`Status: ${req.status}`, 20, 70);
    
    doc.setFont("helvetica", "bold");
    doc.text("Student Details:", 20, 90);
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${user.name}`, 30, 100);
    doc.text(`Student ID: ${user.id ? user.id.toUpperCase() : '2023CS0192'} (${user.details || 'CSE'})`, 30, 110);
    
    doc.setFont("helvetica", "bold");
    doc.text("Permission Details:", 20, 130);
    doc.setFont("helvetica", "normal");
    doc.text(`Topic: ${req.title}`, 30, 140);
    
    const splitReason = doc.splitTextToSize(`Reason: ${req.reason}`, 150);
    doc.text(splitReason, 30, 150);
    
    doc.setFont("helvetica", "bold");
    doc.text("Authorization:", 20, 180);
    doc.setFont("helvetica", "normal");
    doc.text(`Authorized by: ${req.targetFaculty?.join(", ") || "Campus Administration"}`, 30, 190);
    
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("This is an electronically generated approval letter.", 105, 250, { align: 'center' });
    
    doc.save(`Approval_${req.title.replace(/\s+/g, '_')}.pdf`);
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFaculty.length === 0) {
      alert("Please select at least one faculty member.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: user.id,
          studentName: user.name,
          title: newReqTitle,
          reason: newReqReason,
          targetFaculty: selectedFaculty,
          hasAttachment: !!newReqFile,
          status: 'Pending',
          submittedOn: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        })
      });
      
      if (res.ok) {
        const newReq = await res.json();
        setRequests(prev => [newReq, ...prev]);
        setIsModalOpen(false);
        setActiveTab("My Permissions");
        setNewReqTitle("");
        setNewReqReason("");
        setNewReqFile(null);
        setSelectedFaculty([]);
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.message || "Failed to submit request"}`);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while submitting. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  const totalReq = requests.length;
  const pendingReq = requests.filter(r => r.status === "Pending").length;
  const approvedReq = requests.filter(r => r.status === "Approved").length;
  const rejectedReq = requests.filter(r => r.status === "Rejected").length;

  const renderContent = () => {
    switch (activeTab) {
      case "Dashboard":
        return (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-panel bg-white p-6 rounded-[2rem] relative overflow-hidden flex flex-col justify-center">
                  <div className="absolute right-[-10%] bottom-[-10%] w-40 h-40 bg-gradient-to-tl from-[#EAF4FF] to-transparent rounded-full blur-2xl"></div>
                  <div className="w-12 h-12 bg-[#EDE9FE] rounded-2xl flex items-center justify-center mb-4 relative z-10">
                    <FilePlus className="w-6 h-6 text-[#7C6CFF]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#1E2A5A] mb-2 relative z-10">Apply for Permission</h3>
                  <p className="text-sm text-[#6B7280] mb-6 relative z-10 leading-relaxed">
                    Need permission for an event, workshop, or any other activity? Send a request to your HOD/Faculty.
                  </p>
                  <button onClick={() => setIsModalOpen(true)} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#5B8CFF] to-[#7C6CFF] text-white font-bold shadow-[0_8px_20px_rgba(91,140,255,0.3)] hover:shadow-[0_12px_25px_rgba(91,140,255,0.4)] transform hover:-translate-y-0.5 transition-all relative z-10">
                    + New Permission Request
                  </button>
                </div>

                <div className="glass-panel bg-white p-6 rounded-[2rem] border border-orange-100 relative overflow-hidden flex flex-col justify-center">
                  <div className="absolute right-[-10%] top-[-10%] w-40 h-40 bg-orange-50 rounded-full blur-2xl"></div>
                  <div className="flex items-center gap-3 mb-4 relative z-10">
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-orange-500" />
                    </div>
                    <h3 className="text-lg font-bold text-[#1E2A5A]">AI Insights</h3>
                  </div>
                  <p className="text-sm text-[#6B7280] mb-4 relative z-10 leading-relaxed">
                    Our AI analyzes your requests and flags them based on urgency, deadlines, and importance.
                  </p>
                  <div className="mt-auto p-3 bg-red-50 rounded-xl border border-red-100 flex items-start gap-3 relative z-10">
                    <Flag className="w-5 h-5 text-red-500 mt-0.5" />
                    <p className="text-sm font-semibold text-red-700">{pendingReq} request(s) are pending approval and require attention.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard title="Total Requests" value={totalReq.toString()} icon={FileText} color="purple" />
                <StatCard title="Pending" value={pendingReq.toString()} icon={Clock} color="orange" />
                <StatCard title="Approved" value={approvedReq.toString()} icon={CheckCircle2} color="green" />
                <StatCard title="Rejected" value={rejectedReq.toString()} icon={XCircle} color="red" />
              </div>

              <div className="glass-panel bg-white rounded-[2rem] p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-[#1E2A5A]">Recent Permission Requests</h3>
                  <button onClick={() => setActiveTab("My Permissions")} className="text-sm font-semibold text-[#5B8CFF] hover:text-[#7C6CFF]">View All</button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="pb-3 text-sm font-semibold text-[#6B7280]">Event / Purpose</th>
                        <th className="pb-3 text-sm font-semibold text-[#6B7280]">Submitted On</th>
                        <th className="pb-3 text-sm font-semibold text-[#6B7280]">Status</th>
                        <th className="pb-3 text-sm font-semibold text-[#6B7280]">Priority (AI)</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {requests.slice(0, 4).map((req: any) => (
                        <TableRow 
                          key={req.id}
                          title={req.title} 
                          date={req.submittedOn} 
                          status={req.status} 
                          priority={req.priority || "Medium"} 
                          onViewLetter={() => setActiveTab("My Letters")}
                        />
                      ))}
                      {requests.length === 0 && (
                        <tr><td colSpan={4} className="py-8 text-center text-gray-500">No requests found. Create one above!</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="space-y-6 flex flex-col">
              <div className="glass-panel bg-white p-6 rounded-[2rem]">
                <h3 className="text-lg font-bold text-[#1E2A5A] mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <QuickAction icon={PlusCircle} label="New Request" color="blue" onClick={() => setIsModalOpen(true)} />
                  <QuickAction icon={Mail} label="My Letters" color="purple" onClick={() => setActiveTab("My Letters")} />
                  <QuickAction icon={Megaphone} label="Announcements" color="green" onClick={() => setActiveTab("Announcements")} />
                </div>
              </div>

              <div className="glass-panel bg-white p-6 rounded-[2rem]">
                <h3 className="text-lg font-bold text-[#1E2A5A] mb-4">Recent Announcements</h3>
                <div className="space-y-3">
                  {announcements.slice(0,3).map((a:any) => (
                    <EventItem key={a.id} title={a.title} date={a.date} badge={a.type || "Update"} />
                  ))}
                  {announcements.length === 0 && <p className="text-xs text-gray-500">No announcements yet.</p>}
                </div>
                <button onClick={() => setActiveTab("Announcements")} className="w-full mt-4 py-2 text-sm font-semibold text-[#5B8CFF] hover:bg-[#EAF4FF] rounded-lg transition-colors">
                  View All Announcements
                </button>
              </div>

            </div>
          </div>
        );

      case "My Permissions":
        const filteredRequests = requests.filter((req: any) =>
          req.title?.toLowerCase().includes(requestSearch.toLowerCase()) ||
          req.reason?.toLowerCase().includes(requestSearch.toLowerCase()) ||
          req.status?.toLowerCase().includes(requestSearch.toLowerCase())
        );
        return (
          <div className="glass-panel bg-white rounded-[2rem] p-8 min-h-[70vh]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#1E2A5A]">My Permission Requests</h2>
                <p className="text-[#6B7280] text-sm mt-1">Track the status of all your submitted permissions.</p>
              </div>
              <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 rounded-xl bg-[#5B8CFF] text-white font-semibold flex items-center gap-2 hover:bg-[#4A7BEE] self-start">
                <PlusCircle className="w-4 h-4" /> New Request
              </button>
            </div>

            <div className="flex items-center gap-3 mb-6 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
              <Search className="w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                value={requestSearch}
                onChange={(e) => setRequestSearch(e.target.value)}
                placeholder="Search permissions by event, purpose, reason, or status..." 
                className="bg-transparent outline-none flex-1 text-sm text-[#1E2A5A]"
              />
              {requestSearch && <button onClick={() => setRequestSearch("")} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>}
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="py-4 px-4 text-sm font-semibold text-[#6B7280] rounded-tl-xl">Event / Purpose</th>
                    <th className="py-4 px-4 text-sm font-semibold text-[#6B7280]">Reason</th>
                    <th className="py-4 px-4 text-sm font-semibold text-[#6B7280]">Submitted On</th>
                    <th className="py-4 px-4 text-sm font-semibold text-[#6B7280]">Status</th>
                    <th className="py-4 px-4 text-sm font-semibold text-[#6B7280] rounded-tr-xl">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredRequests.map((req: any) => (
                    <tr key={req.id} className="border-b border-gray-50 hover:bg-[#F7F8FF] transition-colors">
                      <td className="py-4 px-4 font-semibold text-[#1E2A5A]">{req.title}</td>
                      <td className="py-4 px-4 text-[#6B7280] max-w-xs truncate">{req.reason}</td>
                      <td className="py-4 px-4 text-[#6B7280]">{req.submittedOn}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                          req.status === 'Approved' ? 'bg-green-100 text-green-700' :
                          req.status === 'Pending' ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {req.status === 'Approved' ? (
                          <button onClick={() => setActiveTab("My Letters")} className="text-[#5B8CFF] hover:text-[#7C6CFF] font-semibold text-sm flex items-center gap-1">
                            <FileText className="w-4 h-4" /> Letter
                          </button>
                        ) : (
                          <span className="text-gray-400 text-sm italic">Waiting...</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredRequests.length === 0 && (
                    <tr><td colSpan={5} className="py-12 text-center text-gray-500">No requests match your search.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "My Letters":
        const approvedRequests = requests.filter(r => r.status === "Approved");
        return (
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2rem] shadow-sm flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#1E2A5A]">My Approval Letters</h2>
                <p className="text-[#6B7280] text-sm mt-1">Download and print your approved permission letters.</p>
              </div>
              <div className="p-3 bg-[#EAF4FF] rounded-full text-[#5B8CFF]">
                <Mail className="w-6 h-6" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {approvedRequests.map(req => (
                <div key={req.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-green-400"></div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2 bg-green-50 rounded-lg text-green-600">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-gray-400">{req.submittedOn}</span>
                  </div>
                  <h3 className="font-bold text-[#1E2A5A] mb-1">{req.title}</h3>
                  <p className="text-xs text-gray-500 mb-6 line-clamp-2">{req.reason}</p>
                  <button 
                    onClick={() => handleDownloadPDF(req)}
                    className="w-full py-2 bg-gray-50 hover:bg-[#5B8CFF] hover:text-white text-[#1E2A5A] rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Download PDF
                  </button>
                </div>
              ))}
              {approvedRequests.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-2xl">
                  You don't have any approved letters yet.
                </div>
              )}
            </div>
          </div>
        );

      case "Announcements":
        const filteredAnnouncements = announcements.filter((a: any) =>
          a.title?.toLowerCase().includes(announcementSearch.toLowerCase()) ||
          a.content?.toLowerCase().includes(announcementSearch.toLowerCase()) ||
          a.type?.toLowerCase().includes(announcementSearch.toLowerCase())
        );
        return (
          <div className="glass-panel bg-white rounded-[2rem] p-8 min-h-[70vh]">
            <h2 className="text-2xl font-bold text-[#1E2A5A] mb-1">Campus Announcements</h2>
            <p className="text-[#6B7280] text-sm mb-6">Stay updated with the latest college news and events.</p>
            
            <div className="flex items-center gap-3 mb-6 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
              <Search className="w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                value={announcementSearch}
                onChange={(e) => setAnnouncementSearch(e.target.value)}
                placeholder="Search announcements by title, content or category..." 
                className="bg-transparent outline-none flex-1 text-sm text-[#1E2A5A]"
              />
              {announcementSearch && <button onClick={() => setAnnouncementSearch("")} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>}
            </div>

            <div className="space-y-4">
              {filteredAnnouncements.map((a:any) => (
                <div 
                  key={a.id} 
                  onClick={() => setSelectedAnnouncement(a)}
                  className="p-5 border border-gray-100 rounded-2xl hover:border-[#5B8CFF]/30 hover:bg-[#F7F8FF] transition-all flex gap-5 cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-full bg-[#EAF4FF] flex items-center justify-center shrink-0 text-[#5B8CFF] group-hover:scale-110 transition-transform">
                    <Megaphone className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-[#1E2A5A] text-lg">{a.title}</h3>
                      <span className="px-2 py-0.5 bg-[#EDE9FE] text-[#7C6CFF] text-[10px] font-bold rounded uppercase tracking-wider">
                        {a.type || "Update"}
                      </span>
                    </div>
                    <p className="text-sm text-[#6B7280] mb-2">{a.content}</p>
                    <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Posted on {a.date}
                    </span>
                  </div>
                </div>
              ))}
              {filteredAnnouncements.length === 0 && (
                <div className="py-12 text-center text-gray-500">No announcements match your search.</div>
              )}
            </div>
          </div>
        );

      case "Profile":
        return (
          <div className="glass-panel bg-white rounded-[2rem] p-8 min-h-[70vh] max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-[#1E2A5A] mb-8">My Profile</h2>
            <div className="flex flex-col md:flex-row gap-10">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <img src={user.avatar} alt="Profile" className="w-32 h-32 rounded-full border-4 border-[#EAF4FF] object-cover" />
                </div>
                <h3 className="mt-4 text-xl font-bold text-[#1E2A5A]">{user.name}</h3>
                <p className="text-sm text-[#6B7280]">{user.role}</p>
                <span className="mt-2 px-3 py-1 bg-[#EDE9FE] text-[#7C6CFF] text-xs font-bold rounded-lg">{user.details}</span>
              </div>
              
              <div className="flex-1 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <label className="text-xs font-bold text-[#5B8CFF] uppercase tracking-wider block mb-1">Full Name</label>
                    <p className="text-lg font-bold text-[#1E2A5A]">{user.name}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <label className="text-xs font-bold text-[#5B8CFF] uppercase tracking-wider block mb-1">Email Address</label>
                    <p className="text-lg font-bold text-[#1E2A5A]">{user.email}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <label className="text-xs font-bold text-[#5B8CFF] uppercase tracking-wider block mb-1">Student ID / Roll No</label>
                    <p className="text-lg font-bold text-[#1E2A5A]">{user.id}</p>
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-3">
                  <ShieldAlert className="w-5 h-5 text-[#5B8CFF]" />
                  <p className="text-sm text-[#5B8CFF] font-medium">Profile details and picture are managed by the administration and cannot be changed here.</p>
                </div>
              </div>
            </div>
          </div>
        );

      case "Settings":
        const handleSaveSettings = () => {
          localStorage.setItem("settings_student", JSON.stringify(settings));
          alert("Settings saved successfully!");
        };

        return (
          <div className="glass-panel bg-white rounded-[2rem] p-8 min-h-[70vh] max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-[#1E2A5A] mb-8">Account Settings</h2>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-bold text-[#1E2A5A] mb-4 flex items-center gap-2"><Bell className="w-5 h-5 text-[#5B8CFF]" /> Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                    <div>
                      <p className="font-semibold text-[#1E2A5A]">Email Notifications</p>
                      <p className="text-xs text-gray-500">Receive emails for permission approvals.</p>
                    </div>
                    <button 
                      onClick={() => setSettings(prev => ({...prev, emailNotifications: !prev.emailNotifications}))}
                      className={`w-11 h-6 rounded-full relative transition-colors duration-200 ${settings.emailNotifications ? 'bg-[#5B8CFF]' : 'bg-gray-200'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-all duration-200 ${settings.emailNotifications ? 'right-1' : 'left-1'}`}></div>
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                    <div>
                      <p className="font-semibold text-[#1E2A5A]">Push Notifications</p>
                      <p className="text-xs text-gray-500">Receive alerts on your device for announcements.</p>
                    </div>
                    <button 
                      onClick={() => setSettings(prev => ({...prev, pushNotifications: !prev.pushNotifications}))}
                      className={`w-11 h-6 rounded-full relative transition-colors duration-200 ${settings.pushNotifications ? 'bg-[#5B8CFF]' : 'bg-gray-200'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-all duration-200 ${settings.pushNotifications ? 'right-1' : 'left-1'}`}></div>
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="pt-6">
                <button 
                  onClick={handleSaveSettings}
                  className="w-full py-4 bg-[#1E2A5A] text-white font-bold rounded-2xl shadow-lg hover:bg-[#2A3B7D] transition-all"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        );

      case "Doubts & Q&A":
        const filteredDoubts = doubts.filter((item: any) =>
          item.text?.toLowerCase().includes(doubtSearch.toLowerCase()) ||
          item.authorName?.toLowerCase().includes(doubtSearch.toLowerCase()) ||
          item.tags?.some((t: string) => t.toLowerCase().includes(doubtSearch.toLowerCase()))
        );

        return (
          <div className="glass-panel bg-white rounded-[2rem] p-8 min-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#1E2A5A]">Campus Q&A Forum</h2>
                <p className="text-[#6B7280] text-sm mt-1">Ask questions and share knowledge with everyone.</p>
              </div>
              <div className="p-3 bg-[#EDE9FE] rounded-full text-[#7C6CFF]">
                <HelpCircle className="w-6 h-6" />
              </div>
            </div>

            <div className="flex items-center gap-3 mb-6 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
              <Search className="w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                value={doubtSearch}
                onChange={(e) => setDoubtSearch(e.target.value)}
                placeholder="Search doubts by question, author, or tags..." 
                className="bg-transparent outline-none flex-1 text-sm text-[#1E2A5A]"
              />
              {doubtSearch && <button onClick={() => setDoubtSearch("")} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>}
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2">
              {filteredDoubts.map((item: any) => {
                const commentCount = item.comments?.length || item.answers || 0;
                const isLiked = item.likedBy?.includes(user?.id) || (item.likes && item.likes > 0);
                const isExpanded = expandedComments[item.id];

                return (
                  <div key={item.id} className="p-6 border border-gray-100 rounded-3xl hover:shadow-lg hover:border-[#5B8CFF]/30 transition-all bg-white relative group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#F7F8FF] flex items-center justify-center text-[#5B8CFF] font-bold border border-[#EAF4FF]">
                          {item.authorName?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#1E2A5A]">{item.authorName}</p>
                          <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{item.authorRole} • {new Date(item.timestamp || Date.now()).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {item.tags?.map((t: string) => (
                          <span key={t} className="px-2 py-1 bg-[#EAF4FF] text-[#5B8CFF] text-[9px] font-black rounded-lg uppercase tracking-tighter">{t}</span>
                        ))}
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-[#1E2A5A] text-lg mb-3 leading-tight">{item.text}</h3>
                    
                    <div className="flex items-center gap-6 pt-4 border-t border-gray-50">
                      <button 
                        onClick={() => handleToggleLike(item.id)}
                        className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors group/btn"
                      >
                        <div className="p-2 rounded-full group-hover/btn:bg-red-50 transition-colors">
                          <Heart className={`w-4 h-4 ${isLiked ? 'text-red-500 fill-red-500' : ''}`} />
                        </div>
                        <span className={`text-xs font-bold ${isLiked ? 'text-red-500' : ''}`}>{item.likes || 0} Likes</span>
                      </button>
                      <button 
                        onClick={() => setExpandedComments(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                        className="flex items-center gap-2 text-gray-400 hover:text-[#5B8CFF] transition-colors group/btn"
                      >
                        <div className="p-2 rounded-full group-hover/btn:bg-blue-50 transition-colors">
                          <MessageCircle className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold">{commentCount} Answers</span>
                      </button>
                    </div>

                    {/* Expandable Comments / Replies Section */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        {item.comments && item.comments.length > 0 ? (
                          <div className="space-y-3 mb-4 pl-3 border-l-2 border-[#EAF4FF]">
                            {item.comments.map((c: any) => (
                              <div key={c.id} className="bg-gray-50/80 p-3.5 rounded-2xl">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-bold text-[#1E2A5A]">{c.authorName} <span className="text-gray-400 text-[10px] font-normal">({c.authorRole})</span></span>
                                  <span className="text-[10px] text-gray-400">{new Date(c.timestamp || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                                </div>
                                <p className="text-xs text-gray-700 leading-relaxed">{c.text}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 mb-3 italic">No replies yet. Be the first to reply!</p>
                        )}

                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={replyInputs[item.id] || ""}
                            onChange={(e) => setReplyInputs(prev => ({ ...prev, [item.id]: e.target.value }))}
                            placeholder="Write an answer or reply..."
                            className="flex-1 px-4 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#5B8CFF]"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddComment(item.id, replyInputs[item.id]);
                              }
                            }}
                          />
                          <button 
                            type="button" 
                            onClick={() => handleAddComment(item.id, replyInputs[item.id])}
                            className="px-5 py-2.5 bg-[#5B8CFF] hover:bg-[#4A7BEE] text-white text-xs font-bold rounded-xl transition-colors"
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredDoubts.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
                  <HelpCircle className="w-16 h-16 opacity-10 mb-4" />
                  <p className="font-bold">No academic doubts match your query.</p>
                  <p className="text-sm">Be the first to ask a question!</p>
                </div>
              )}
            </div>

            <form onSubmit={handleSendMessageUniversal} className="relative mt-auto">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Lightbulb className="w-5 h-5 text-[#5B8CFF] opacity-50" />
              </div>
              <input 
                type="text" value={messageInput} onChange={e => setMessageInput(e.target.value)}
                placeholder="Ask a doubt or share knowledge..."
                className="w-full pl-12 pr-28 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:border-[#5B8CFF] focus:bg-white outline-none transition-all shadow-inner"
              />
              <button type="submit" className="absolute right-2 top-2 bottom-2 px-6 bg-gradient-to-r from-[#5B8CFF] to-[#7C6CFF] text-white rounded-xl font-bold shadow-md hover:shadow-lg hover:opacity-90 transition-all">
                Ask Now
              </button>
            </form>
          </div>
        );

      case "Get Help":
        return (
          <div className="glass-panel bg-white rounded-[2rem] p-8 min-h-[70vh] flex flex-col">
             <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-gradient-to-tr from-[#5B8CFF] to-[#7C6CFF] rounded-2xl flex items-center justify-center text-white shadow-lg">
                <Bot className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#1E2A5A]">AI Campus Assistant</h2>
                <p className="text-xs text-gray-500 flex items-center gap-1"><Sparkles className="w-3 h-3 text-[#7C6CFF]" /> Specialized for CampusConnect</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2">
               {chatHistory.length === 0 && (
                 <div className="h-full flex flex-col items-center justify-center text-center p-10">
                   <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center text-[#5B8CFF] mb-6 animate-pulse">
                     <Bot className="w-10 h-10" />
                   </div>
                   <h3 className="text-xl font-bold text-[#1E2A5A]">Hello! I'm your AI Tutor</h3>
                   <p className="text-sm text-gray-500 max-w-sm mt-2">I can help you with permission letters, academic concepts, or campus policies. Try asking me something!</p>
                   
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-10 w-full max-w-md">
                     <button onClick={() => setAiMessage("Help me write a professional leave letter.")} className="p-4 bg-white border border-gray-100 rounded-2xl text-left hover:border-[#5B8CFF]/50 hover:bg-blue-50/30 transition-all group">
                       <p className="text-[10px] font-bold text-[#5B8CFF] mb-1">DRAFTING</p>
                       <p className="text-xs text-[#1E2A5A] font-semibold">Write a leave letter</p>
                     </button>
                     <button onClick={() => setAiMessage("Explain what is Big O notation simply.")} className="p-4 bg-white border border-gray-100 rounded-2xl text-left hover:border-[#5B8CFF]/50 hover:bg-blue-50/30 transition-all group">
                       <p className="text-[10px] font-bold text-[#5B8CFF] mb-1">ACADEMICS</p>
                       <p className="text-xs text-[#1E2A5A] font-semibold">Explain Big O Notation</p>
                     </button>
                   </div>
                 </div>
               )}
               {chatHistory.map((chat, idx) => (
                 <div key={idx} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[85%] p-4 rounded-2xl ${
                     chat.role === 'user' 
                       ? 'bg-[#1E2A5A] text-white rounded-tr-none' 
                       : 'bg-white border border-blue-100 text-[#1E2A5A] rounded-tl-none shadow-sm'
                   }`}>
                     <div className="flex items-center gap-2 mb-1">
                       {chat.role === 'assistant' && <Bot className="w-3 h-3 text-[#5B8CFF]" />}
                       <span className="text-[10px] font-bold uppercase opacity-60">{chat.role === 'user' ? 'You' : 'Campus AI'}</span>
                     </div>
                     {chat.role === 'assistant' ? (
                       <div className="text-sm leading-relaxed space-y-2 [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>ul]:space-y-1 [&>ol]:space-y-1 [&>blockquote]:border-l-2 [&>blockquote]:border-[#5B8CFF] [&>blockquote]:pl-3 [&>blockquote]:italic [&_strong]:font-bold [&_em]:italic">
                         <ReactMarkdown>{chat.content}</ReactMarkdown>
                       </div>
                     ) : (
                       <p className="text-sm leading-relaxed whitespace-pre-wrap">{chat.content}</p>
                     )}
                   </div>
                 </div>
               ))}
               {isAiLoading && (
                 <div className="flex justify-start">
                   <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                     <Loader2 className="w-4 h-4 animate-spin text-[#5B8CFF]" />
                     <span className="text-xs font-medium text-gray-500">AI is thinking...</span>
                   </div>
                 </div>
               )}
            </div>

            <form onSubmit={handleAiChat} className="relative">
              <input 
                type="text" value={aiMessage} onChange={e => setAiMessage(e.target.value)}
                placeholder="Ask your AI assistant anything..."
                className="w-full pl-6 pr-16 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-[#5B8CFF] focus:bg-white outline-none transition-all"
              />
              <button type="submit" disabled={isAiLoading} className="absolute right-2 top-2 bottom-2 px-4 bg-gradient-to-tr from-[#5B8CFF] to-[#7C6CFF] text-white rounded-xl hover:opacity-90 transition-all flex items-center justify-center shadow-md">
                {isAiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </form>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FF] font-sans flex relative">
      

      {/* Announcement Detail Modal */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#EAF4FF] flex items-center justify-center text-[#5B8CFF]">
                  <Megaphone className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#1E2A5A]">{selectedAnnouncement.title}</h2>
                  <p className="text-sm text-[#6B7280]">Posted on {selectedAnnouncement.date}</p>
                </div>
              </div>
              <button onClick={() => setSelectedAnnouncement(null)} className="text-gray-400 hover:text-red-500 transition-colors"><XCircle className="w-6 h-6" /></button>
            </div>
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-6">
              <p className="text-[#1E2A5A] leading-relaxed whitespace-pre-wrap">{selectedAnnouncement.content}</p>
            </div>
            <div className="flex justify-between items-center">
              <span className="px-3 py-1 bg-[#EDE9FE] text-[#7C6CFF] text-xs font-bold rounded-lg uppercase tracking-wider">
                {selectedAnnouncement.type || "Official Update"}
              </span>
              <button onClick={() => setSelectedAnnouncement(null)} className="px-6 py-2.5 rounded-xl bg-[#1E2A5A] text-white font-semibold hover:bg-[#2A3B7D] transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-bold text-[#1E2A5A]">New Request</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors"><XCircle className="w-6 h-6" /></button>
            </div>
            <p className="text-sm text-[#6B7280] mb-6">Submit a permission request to your faculty.</p>
            
            <form onSubmit={handleCreateRequest} className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-[#1E2A5A]">Event / Purpose</label>
                <input 
                  type="text" required value={newReqTitle} onChange={e => setNewReqTitle(e.target.value)}
                  placeholder="e.g., Hackathon Leave"
                  className="w-full mt-1.5 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#5B8CFF] focus:bg-white transition-colors outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#1E2A5A]">Reason / Details</label>
                <textarea 
                  required value={newReqReason} onChange={e => setNewReqReason(e.target.value)}
                  placeholder="Explain why you need this permission..." rows={3}
                  className="w-full mt-1.5 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#5B8CFF] focus:bg-white transition-colors outline-none resize-none"
                ></textarea>
              </div>

              {/* Faculty Selection */}
              <div className="relative z-50">
                <label className="text-sm font-semibold text-[#1E2A5A]">Select Faculty (Tagging)</label>
                <div className="relative mt-1.5">
                  <div 
                    className="w-full px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 focus-within:border-[#5B8CFF] focus-within:bg-white transition-colors cursor-text min-h-[48px] flex flex-wrap gap-2 items-center relative z-20"
                    onClick={() => setIsDropdownOpen(true)}
                  >
                    {selectedFaculty.map(id => {
                      const fac = facultyList.find(f => f.id === id);
                      return (
                        <span key={id} className="flex items-center gap-1 bg-[#EAF4FF] text-[#5B8CFF] text-xs font-bold px-2 py-1 rounded-md">
                          {fac?.name || id}
                          <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedFaculty(prev => prev.filter(fid => fid !== id)); }} className="hover:text-red-500"><XCircle className="w-3 h-3" /></button>
                        </span>
                      );
                    })}
                    <input 
                      type="text" 
                      placeholder={selectedFaculty.length === 0 ? "Search and select faculty..." : ""}
                      value={facultySearch}
                      onChange={e => { setFacultySearch(e.target.value); setIsDropdownOpen(true); }}
                      onFocus={() => setIsDropdownOpen(true)}
                      className="bg-transparent outline-none flex-1 min-w-[140px] text-sm py-1"
                    />
                  </div>
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] rounded-xl z-50 max-h-48 overflow-y-auto">
                      {facultyList.filter(f => (f.name.toLowerCase().includes(facultySearch.toLowerCase()) || (f.details && f.details.toLowerCase().includes(facultySearch.toLowerCase()))) && !selectedFaculty.includes(f.id)).length === 0 ? (
                        <div className="p-4 text-sm text-gray-500 text-center">No faculty found.</div>
                      ) : (
                        facultyList.filter(f => (f.name.toLowerCase().includes(facultySearch.toLowerCase()) || (f.details && f.details.toLowerCase().includes(facultySearch.toLowerCase()))) && !selectedFaculty.includes(f.id)).map(f => (
                          <div 
                            key={f.id} 
                            onClick={() => { setSelectedFaculty(prev => [...prev, f.id]); setFacultySearch(""); setIsDropdownOpen(false); }}
                            className="p-3 hover:bg-[#F7F8FF] cursor-pointer flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0"
                          >
                            <img src={f.avatar} alt={f.name} className="w-8 h-8 rounded-full border border-gray-200" />
                            <div>
                              <p className="text-sm font-bold text-[#1E2A5A]">{f.name}</p>
                              <p className="text-xs text-gray-500">{f.details}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {/* Overlay to close dropdown */}
                {isDropdownOpen && <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setIsDropdownOpen(false); }}></div>}
              </div>
              
              {/* File Upload Section */}
              <div>
                <label className="text-sm font-semibold text-[#1E2A5A]">Supporting Document (Optional)</label>
                <div className="mt-1.5 flex items-center justify-center w-full">
                  <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-all ${newReqFile ? 'border-[#5B8CFF] bg-[#EAF4FF]' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'}`}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {newReqFile ? (
                        <>
                          <FileText className="w-8 h-8 mb-2 text-[#5B8CFF]" />
                          <p className="mb-1 text-sm font-bold text-[#1E2A5A]">{newReqFile.name}</p>
                          <p className="text-xs text-[#5B8CFF]">Click to change file</p>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-8 h-8 mb-2 text-gray-400" />
                          <p className="mb-1 text-sm text-gray-500"><span className="font-semibold text-[#5B8CFF]">Click to upload</span> or drag and drop</p>
                          <p className="text-xs text-gray-400">PDF, PNG, JPG (MAX. 5MB)</p>
                        </>
                      )}
                    </div>
                    <input type="file" className="hidden" onChange={(e) => {
                      if(e.target.files && e.target.files[0]) setNewReqFile(e.target.files[0]);
                    }} />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl font-semibold text-[#6B7280] hover:bg-gray-100 transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#5B8CFF] to-[#7C6CFF] text-white font-bold hover:shadow-lg hover:opacity-90 transition-all flex items-center gap-2">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LEFT SIDEBAR */}
      <aside className="w-64 bg-white border-r border-[#EAF4FF] flex flex-col hidden lg:flex sticky top-0 h-screen overflow-y-auto hide-scrollbar">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#5B8CFF] to-[#7C6CFF] flex items-center justify-center">
              <span className="text-white font-bold text-sm">CC</span>
            </div>
            <span className="text-xl font-bold text-[#1E2A5A]">CampusConnect</span>
          </div>
          <span className="text-xs font-semibold text-[#5B8CFF] tracking-wider uppercase ml-10">Student Portal</span>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          <NavItem icon={LayoutDashboard} label="Dashboard" active={activeTab === "Dashboard"} onClick={() => setActiveTab("Dashboard")} />
          <NavItem icon={FileText} label="My Permissions" active={activeTab === "My Permissions"} onClick={() => setActiveTab("My Permissions")} />
          <NavItem icon={PlusCircle} label="Create Request" onClick={() => setIsModalOpen(true)} />
          <NavItem icon={Mail} label="My Letters" active={activeTab === "My Letters"} onClick={() => setActiveTab("My Letters")} />
          <NavItem icon={Megaphone} label="Announcements" active={activeTab === "Announcements"} onClick={() => setActiveTab("Announcements")} />
          <NavItem icon={HelpCircle} label="Doubts & Q&A" active={activeTab === "Doubts & Q&A"} onClick={() => setActiveTab("Doubts & Q&A")} />
          <NavItem icon={Bot} label="Get Help" active={activeTab === "Get Help"} onClick={() => setActiveTab("Get Help")} />
          
          <div className="pt-6 pb-2">
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Account</p>
          </div>
          <NavItem icon={User} label="Profile" active={activeTab === "Profile"} onClick={() => setActiveTab("Profile")} />
          <NavItem icon={Settings} label="Settings" active={activeTab === "Settings"} onClick={() => setActiveTab("Settings")} />
        </nav>

        <div className="p-4 mt-auto">
          <button 
            onClick={() => { localStorage.removeItem("user"); router.push("/"); }}
            className="flex items-center gap-3 w-full px-4 py-3 mt-4 text-[#EF4444] hover:bg-red-50 rounded-xl transition-colors font-medium text-sm"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* TOP HEADER */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-[#EAF4FF] flex items-center justify-between px-8 sticky top-0 z-30">
          <div>
            <h1 className="text-2xl font-bold text-[#1E2A5A]">
              {activeTab === "Dashboard" ? `Welcome back, ${user.name} 👋` : activeTab}
            </h1>
            <p className="text-sm text-[#6B7280]">
              {activeTab === "Dashboard" ? "Here's what's happening with your requests and activities." : "Student Portal Workspace"}
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            <button onClick={() => setActiveTab("Announcements")} className="relative p-2 rounded-full bg-[#F7F8FF] text-[#1E2A5A] hover:bg-[#EAF4FF] transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EF4444] rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-gray-100 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setActiveTab("Profile")}>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-[#1E2A5A]">{user.name}</p>
                <p className="text-xs text-[#6B7280]">{user.details}</p>
              </div>
              <img src={user.avatar} alt="Profile" className="w-10 h-10 rounded-full border-2 border-[#EAF4FF] object-cover" />
            </div>
          </div>
        </header>

        {/* DYNAMIC CONTENT AREA */}
        <div className="flex-1 p-8 overflow-y-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

// Subcomponents

function NavItem({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <a href="#" onClick={(e) => { e.preventDefault(); if(onClick) onClick(); }} className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
      active 
        ? "bg-[#EDE9FE] text-[#7C6CFF] font-semibold" 
        : "text-[#6B7280] hover:bg-gray-50 hover:text-[#1E2A5A] font-medium"
    }`}>
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${active ? "text-[#7C6CFF]" : "text-gray-400"}`} />
        <span className="text-sm">{label}</span>
      </div>
      {active && <ChevronRight className="w-4 h-4 text-[#7C6CFF]" />}
    </a>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string, value: string, icon: any, color: 'purple' | 'orange' | 'green' | 'red' }) {
  const colors = {
    purple: "bg-[#EDE9FE] text-[#7C6CFF]",
    orange: "bg-orange-100 text-orange-500",
    green: "bg-green-100 text-green-500",
    red: "bg-red-100 text-red-500",
  };
  
  return (
    <div className="glass-panel bg-white p-5 rounded-2xl flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex shrink-0 items-center justify-center ${colors[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-0.5">{title}</p>
        <p className="text-2xl font-bold text-[#1E2A5A]">{value}</p>
      </div>
    </div>
  );
}

function TableRow({ title, date, status, priority, onViewLetter }: { title: string, date: string, status: string, priority: string, onViewLetter?: () => void }) {
  const getStatusColor = (s: string) => {
    if (s === "Approved") return "bg-green-100 text-green-700";
    if (s === "Pending") return "bg-orange-100 text-orange-700";
    return "bg-red-100 text-red-700";
  };

  const getPriorityIcon = (p: string) => {
    if (p === "High") return <Flag className="w-4 h-4 text-red-500" />;
    if (p === "Medium") return <Flag className="w-4 h-4 text-orange-500" />;
    return <Flag className="w-4 h-4 text-green-500" />;
  };

  return (
    <tr className="border-b border-gray-50 hover:bg-[#F7F8FF] transition-colors group">
      <td className="py-4 font-semibold text-[#1E2A5A]">{title}</td>
      <td className="py-4 text-[#6B7280]">{date}</td>
      <td className="py-4">
        <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${getStatusColor(status)}`}>
          {status}
        </span>
      </td>
      <td className="py-4">
        <div className="flex items-center gap-1.5">
          {getPriorityIcon(priority)}
          <span className="text-[#6B7280] font-medium">{priority}</span>
        </div>
      </td>
    </tr>
  );
}

function QuickAction({ icon: Icon, label, color, onClick }: { icon: any, label: string, color: 'blue' | 'purple' | 'green' | 'orange', onClick?: () => void }) {
  const colors = {
    blue: "bg-[#EAF4FF] text-[#5B8CFF]",
    purple: "bg-[#EDE9FE] text-[#7C6CFF]",
    green: "bg-green-50 text-green-500",
    orange: "bg-orange-50 text-orange-500",
  };
  return (
    <button onClick={onClick} className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 hover:border-[#EAF4FF] hover:bg-[#F7F8FF] transition-all group">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-transform group-hover:scale-110 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-xs font-semibold text-[#1E2A5A]">{label}</span>
    </button>
  );
}

function EventItem({ title, date, badge }: { title: string, date: string, badge: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-[#F7F8FF] transition-colors">
      <div>
        <h4 className="text-sm font-bold text-[#1E2A5A] line-clamp-1">{title}</h4>
        <p className="text-xs text-[#6B7280] mt-0.5">{date}</p>
      </div>
      <span className="px-2 py-1 bg-[#EDE9FE] text-[#7C6CFF] text-[10px] font-bold rounded uppercase tracking-wider shrink-0 ml-2">
        {badge}
      </span>
    </div>
  );
}
