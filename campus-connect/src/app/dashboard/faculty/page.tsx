"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  LayoutDashboard, Users, FileText, Megaphone, MessageSquare, 
  HelpCircle, Bot, Settings, LogOut, Bell, Flag, User,
  Check, X, ChevronRight, BarChart3, PlusCircle, Lightbulb, Loader2, Clock,
  UploadCloud, Send, Search, Heart, MessageCircle, PieChart, TrendingUp, ShieldAlert, FilePlus, XCircle, UserCog
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';

export default function FacultyDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [doubts, setDoubts] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [doubtInput, setDoubtInput] = useState("");
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [myAdminRequests, setMyAdminRequests] = useState<any[]>([]);

  // Settings State
  const [settings, setSettings] = useState({
    emailAlerts: true,
    pushNotifications: true
  });

  // Search States
  const [studentSearch, setStudentSearch] = useState("");
  const [requestSearch, setRequestSearch] = useState("");
  const [announcementSearch, setAnnouncementSearch] = useState("");
  const [doubtSearch, setDoubtSearch] = useState("");
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});

  // Create Announcement State
  const [newAnnTitle, setNewAnnTitle] = useState("");
  const [newAnnContent, setNewAnnContent] = useState("");
  const [newAnnType, setNewAnnType] = useState("Important");
  const [targetYears, setTargetYears] = useState<string[]>(["All Years"]);
  const [targetBranches, setTargetBranches] = useState<string[]>(["All Branches"]);
  const [newAnnFile, setNewAnnFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetAnnouncementForm = () => {
    setNewAnnTitle("");
    setNewAnnContent("");
    setNewAnnType("Important");
    setTargetYears(["All Years"]);
    setTargetBranches(["All Branches"]);
    setNewAnnFile(null);
  };

  // Faculty Request State
  const [isReqModalOpen, setIsReqModalOpen] = useState(false);
  const [newReqType, setNewReqType] = useState("Research Grant");
  const [newReqReason, setNewReqReason] = useState("");
  const [isSubmittingReq, setIsSubmittingReq] = useState(false);

  const toggleSelection = (state: string[], setState: any, value: string, allValue: string) => {
    if (value === allValue) {
      setState([allValue]);
      return;
    }
    let next = state.filter(item => item !== allValue);
    if (next.includes(value)) {
      next = next.filter(item => item !== value);
      if (next.length === 0) next = [allValue];
    } else {
      next.push(value);
    }
    setState(next);
  };

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/");
      return;
    }
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== "Faculty") {
      router.push("/");
      return;
    }
    setUser(parsedUser);

    const savedSettings = localStorage.getItem("settings_faculty");
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {}
    }

    fetchData(parsedUser);

    // Polling to keep data fresh (every 30 seconds)
    const interval = setInterval(() => fetchData(parsedUser), 30000);
    return () => clearInterval(interval);
  }, [router]);

  const [allStudents, setAllStudents] = useState<any[]>([]);

  const fetchData = async (currentUser?: any) => {
    const activeUser = currentUser || user;
    const facultyId = activeUser?.id;
    if (!facultyId) return;

    const [reqRes, annRes, msgRes, doubtRes, facReqRes, usersRes] = await Promise.all([
      fetch(`/api/requests?facultyId=${facultyId}`),
      fetch('/api/announcements'),
      fetch('/api/messages?type=message'),
      fetch('/api/messages?type=doubt'),
      fetch('/api/facultyRequests'),
      fetch('/api/users')
    ]);
    if (reqRes.ok) setRequests(await reqRes.json());
    if (annRes.ok) setAnnouncements(await annRes.json());
    if (msgRes.ok) setMessages(await msgRes.json());
    if (doubtRes.ok) setDoubts(await doubtRes.json());
    if (usersRes.ok) {
      const usersData = await usersRes.json();
      setAllStudents(usersData.filter((u: any) => u.role === 'Student'));
    }
    if (facReqRes.ok) {
      const allFacReq = await facReqRes.json();
      // Filter to only show requests from THIS faculty
      setMyAdminRequests(allFacReq.filter((r: any) => (activeUser?.name && r.name === activeUser.name) || r.facultyId === facultyId));
    }
  };

  const handleCreateFacultyRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReq(true);
    try {
      // Extract department from details string like "Proctor - CSE (3rd Year)"
      let deptName = "CSE";
      if (user?.details) {
        const match = user.details.match(/\b(CSE|ECE|EEE|MECH|CIVIL|IT|AIML|DS)\b/i);
        deptName = match ? match[0].toUpperCase() : (user.details.split('-')[1]?.trim().split(' ')[0] || "General");
      }

      const res = await fetch('/api/facultyRequests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user.name,
          dept: deptName,
          type: newReqType,
          reason: newReqReason
        })
      });
      if (res.ok) {
        setIsReqModalOpen(false);
        setNewReqReason("");
        alert("Request submitted to Admin successfully!");
        fetchData(user);
      }
    } catch (err) {
      alert("Failed to submit request.");
    } finally {
      setIsSubmittingReq(false);
    }
  };

  const handleSendMessageUniversal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: messageInput,
        authorId: user.id,
        authorName: user.name,
        authorRole: user.role,
        type: 'message'
      })
    });
    if (res.ok) {
      const newMsg = await res.json();
      setMessages([...messages, newMsg]);
      setMessageInput("");
    }
  };

  const handleAskDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doubtInput.trim()) return;
    
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: doubtInput.trim(),
        authorId: user.id,
        authorName: user.name,
        authorRole: user.role,
        type: 'doubt',
        likes: 0,
        likedBy: [],
        answers: 0,
        comments: [],
        tags: ["Faculty"]
      })
    });
    if (res.ok) {
      const newDoubt = await res.json();
      setDoubts(prev => [newDoubt, ...prev]);
      setDoubtInput("");
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

  const updateRequest = async (id: string, status: string) => {
    const previousRequests = requests;
    // Optimistic UI update
    setRequests(reqs => reqs.map(r => r.id === id ? { ...r, status } : r));
    
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) {
        throw new Error("Failed to update status on server");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update request status. Reverting changes.");
      setRequests(previousRequests);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await fetch('/api/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newAnnTitle,
        content: newAnnContent,
        type: newAnnType,
        targetYears,
        targetBranches,
        authorId: user.id,
        authorName: user.name
      })
    });
    if (res.ok) {
      const newAnn = await res.json();
      setAnnouncements([newAnn, ...announcements]);
      resetAnnouncementForm();
      setActiveTab("Announcements");
    }
    setIsSubmitting(false);
  };

  if (!user) return null;

  const pendingReq = requests.filter(r => r.status === "Pending").length;
  const approvedReq = requests.filter(r => r.status === "Approved").length;
  const rejectedReq = requests.filter(r => r.status === "Rejected").length;
  const flaggedReq = requests.filter(r => r.status === "Pending" && r.priority === "High");

  // Helper to extract department and year for section matching
  const extractDeptAndYear = (details: string = '') => {
    if (!details) return { dept: '', year: '' };
    const deptMatch = details.match(/\b(CSE|AIML|IT|DS|ECE|EEE|MECH|CIVIL|AIDS|CSBS)\b/i);
    const dept = deptMatch ? deptMatch[0].toUpperCase() : '';
    const yearMatch = details.match(/\b(1st|2nd|3rd|4th|[1-4])\s*(?:year)?\b/i);
    let year = '';
    if (yearMatch) {
      const yStr = yearMatch[1].toLowerCase();
      if (yStr.startsWith('1')) year = '1st Year';
      else if (yStr.startsWith('2')) year = '2nd Year';
      else if (yStr.startsWith('3')) year = '3rd Year';
      else if (yStr.startsWith('4')) year = '4th Year';
    }
    return { dept, year };
  };

  const facultySection = extractDeptAndYear(user?.details);
  const myStudents = allStudents.filter(s => {
    const sInfo = extractDeptAndYear(s.details);
    const deptMatches = facultySection.dept ? sInfo.dept === facultySection.dept : true;
    const yearMatches = facultySection.year ? sInfo.year === facultySection.year : true;
    return deptMatches && yearMatches;
  });

  // Dynamic Reports & Analytics calculations
  const totalReq = requests.length;
  const approvalRate = totalReq > 0 ? Math.round((approvedReq / totalReq) * 100) : 0;
  
  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dynamicMonthlyData = monthLabels.map((m, idx) => {
    const count = requests.filter(r => {
      const dateStr = r.submittedOn || r.createdAt || r.date;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return !isNaN(d.getTime()) && d.getMonth() === idx;
    }).length;
    return { name: m, requests: count };
  });

  const purposeCounts: Record<string, number> = {};
  requests.forEach(r => {
    const title = r.title || "General Request";
    purposeCounts[title] = (purposeCounts[title] || 0) + 1;
  });
  const topPurpose = Object.entries(purposeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";

  const renderContent = () => {
    switch (activeTab) {
      case "Dashboard":
        return (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <StatCard title="My Students" value={myStudents.length.toString()} icon={Users} color="purple" onClick={() => setActiveTab("My Students")} />
              <StatCard title="Total Requests" value={requests.length.toString()} icon={FileText} color="blue" onClick={() => setActiveTab("Permission Requests")} />
              <StatCard title="Pending" value={pendingReq.toString()} icon={Clock} color="orange" onClick={() => setActiveTab("Permission Requests")} />
              <StatCard title="Approved" value={approvedReq.toString()} icon={Check} color="green" />
              <StatCard title="Rejected" value={rejectedReq.toString()} icon={X} color="red" />
              <StatCard title="AI Flagged" value={flaggedReq.length.toString()} icon={Flag} color="red-solid" onClick={() => setActiveTab("Flagged by AI")} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 space-y-6">
                <div className="glass-panel bg-white p-6 rounded-[2rem] border border-red-100 relative overflow-hidden">
                  <div className="absolute right-[-10%] top-[-10%] w-64 h-64 bg-red-50 rounded-full blur-3xl"></div>
                  <div className="relative z-10 flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-[#1E2A5A] flex items-center gap-2">
                        <Flag className="w-5 h-5 text-red-500" /> AI Flagged Requests
                      </h3>
                      <p className="text-sm text-[#6B7280]">Requests that need your immediate attention.</p>
                    </div>
                    <button onClick={() => setActiveTab("Flagged by AI")} className="text-sm font-semibold text-[#5B8CFF] hover:underline">View All</button>
                  </div>
                  
                  <div className="overflow-x-auto relative z-10">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="pb-3 text-sm font-semibold text-[#6B7280]">Student</th>
                          <th className="pb-3 text-sm font-semibold text-[#6B7280]">Event / Purpose</th>
                          <th className="pb-3 text-sm font-semibold text-[#6B7280]">Reason</th>
                          <th className="pb-3 text-sm font-semibold text-[#6B7280] text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {flaggedReq.slice(0, 3).map((req) => (
                          <FlaggedTableRow 
                            key={req.id}
                            student={req.studentName} event={req.title} reason={req.reason}
                            priority={req.priority} date={req.submittedOn} 
                            onAccept={() => updateRequest(req.id, "Approved")}
                            onReject={() => updateRequest(req.id, "Rejected")}
                          />
                        ))}
                        {flaggedReq.length === 0 && (
                          <tr><td colSpan={4} className="py-6 text-center text-gray-500">No flagged requests! 🎉</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="glass-panel bg-white rounded-[2rem] p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-[#1E2A5A]">Recent Permission Requests</h3>
                    <button onClick={() => setActiveTab("Permission Requests")} className="px-3 py-1.5 rounded-lg bg-[#F7F8FF] text-sm font-semibold text-[#1E2A5A] hover:bg-[#EAF4FF] transition-colors border border-gray-200">
                      View All
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="pb-3 text-sm font-semibold text-[#6B7280]">Student</th>
                          <th className="pb-3 text-sm font-semibold text-[#6B7280]">Event / Purpose</th>
                          <th className="pb-3 text-sm font-semibold text-[#6B7280]">Status</th>
                          <th className="pb-3 text-sm font-semibold text-[#6B7280] text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {requests.filter(r => r.priority !== "High" || r.status !== "Pending").slice(0, 4).map(req => (
                          <StandardTableRow 
                            key={req.id}
                            student={req.studentName} event={req.title} date={req.submittedOn} 
                            priority={req.priority} status={req.status} 
                            onAccept={() => updateRequest(req.id, "Approved")}
                            onReject={() => updateRequest(req.id, "Rejected")}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="space-y-6 flex flex-col">
                <div className="glass-panel bg-white p-6 rounded-[2rem] text-center flex flex-col items-center">
                  <div className="w-14 h-14 bg-[#EAF4FF] rounded-full flex items-center justify-center mb-4">
                    <FilePlus className="w-7 h-7 text-[#5B8CFF]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#1E2A5A] mb-2">Admin Approval</h3>
                  <p className="text-sm text-[#6B7280] mb-6 leading-relaxed">
                    Need Admin approval for grants, events, or official permissions?
                  </p>
                  <button onClick={() => setIsReqModalOpen(true)} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#5B8CFF] to-[#7C6CFF] text-white font-bold shadow-[0_8px_20px_rgba(91,140,255,0.3)] hover:shadow-[0_12px_25px_rgba(91,140,255,0.4)] transform hover:-translate-y-0.5 transition-all">
                    + Create New Request
                  </button>
                </div>

                <div className="glass-panel bg-gradient-to-br from-[#1E2A5A] to-[#2A3B7D] p-6 rounded-[2rem] text-white mt-auto relative overflow-hidden">
                  <div className="absolute right-[-20%] top-[-20%] w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                  <Bot className="w-8 h-8 text-[#C4B5FD] mb-3 relative z-10" />
                  <h3 className="text-lg font-bold mb-1 relative z-10">AI Assistant</h3>
                  <p className="text-sm text-[#C4B5FD] mb-4 relative z-10">Ask AI to summarize requests, suggest priorities, or draft announcements.</p>
                  <button 
                    onClick={() => setActiveTab("Flagged by AI")}
                    className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur text-white font-semibold text-sm transition-colors relative z-10 border border-white/10"
                  >
                    Open AI Assistant
                  </button>
                </div>
              </div>
            </div>
          </>
        );
      
      case "My Students":
        const filteredMyStudents = myStudents.filter(s =>
          s.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
          s.id?.toLowerCase().includes(studentSearch.toLowerCase()) ||
          s.details?.toLowerCase().includes(studentSearch.toLowerCase())
        );

        return (
          <div className="glass-panel bg-white rounded-[2rem] p-8 min-h-[70vh]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#1E2A5A] mb-1">My Students</h2>
                <p className="text-[#6B7280] text-sm">
                  Students enrolled in your section: <span className="font-semibold text-[#5B8CFF]">{user.details}</span>
                </p>
              </div>
              <div className="px-4 py-2 bg-[#EAF4FF] text-[#5B8CFF] font-bold rounded-xl text-sm self-start">
                {filteredMyStudents.length} {filteredMyStudents.length === 1 ? 'Student' : 'Students'}
              </div>
            </div>

            <div className="flex items-center gap-3 mb-6 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
              <Search className="w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search students by name, ID or branch/year..." 
                className="bg-transparent outline-none flex-1 text-sm text-[#1E2A5A]"
              />
              {studentSearch && <button onClick={() => setStudentSearch("")} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>}
            </div>

            {filteredMyStudents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMyStudents.map((s) => {
                  const studentReqs = requests.filter(r => r.studentId === s.id || r.studentName === s.name);
                  return (
                    <div key={s.id} className="p-5 border border-gray-100 rounded-2xl hover:shadow-md transition-shadow flex items-center gap-4 bg-white">
                      <div className="w-14 h-14 rounded-full bg-[#EAF4FF] text-[#5B8CFF] flex items-center justify-center font-bold text-xl uppercase">
                        {s.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[#1E2A5A] truncate">{s.name}</h3>
                        <p className="text-xs text-gray-500 truncate">{s.id} • {s.details || "Student"}</p>
                        <p className="text-xs font-semibold text-[#5B8CFF] mt-1">
                          {studentReqs.length} Permission {studentReqs.length === 1 ? 'Request' : 'Requests'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center text-gray-500 border border-dashed border-gray-200 rounded-2xl">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="font-semibold text-gray-600">No students match your query.</p>
                <p className="text-xs text-gray-400 mt-1">Check the spelling or try searching another keyword.</p>
              </div>
            )}
          </div>
        );

      case "Permission Requests":
        const filteredRequests = requests.filter(r =>
          r.studentName?.toLowerCase().includes(requestSearch.toLowerCase()) ||
          r.title?.toLowerCase().includes(requestSearch.toLowerCase()) ||
          r.reason?.toLowerCase().includes(requestSearch.toLowerCase()) ||
          r.status?.toLowerCase().includes(requestSearch.toLowerCase())
        );

        return (
          <div className="glass-panel bg-white rounded-[2rem] p-8 min-h-[70vh]">
            <h2 className="text-2xl font-bold text-[#1E2A5A] mb-1">All Permission Requests</h2>
            <p className="text-[#6B7280] text-sm mb-6">Manage all student permission requests.</p>

            <div className="flex items-center gap-3 mb-6 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
              <Search className="w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                value={requestSearch}
                onChange={(e) => setRequestSearch(e.target.value)}
                placeholder="Search requests by student name, purpose, reason, or status..." 
                className="bg-transparent outline-none flex-1 text-sm text-[#1E2A5A]"
              />
              {requestSearch && <button onClick={() => setRequestSearch("")} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="py-4 px-4 text-sm font-semibold text-[#6B7280] rounded-tl-xl">Student</th>
                    <th className="py-4 px-4 text-sm font-semibold text-[#6B7280]">Event / Purpose</th>
                    <th className="py-4 px-4 text-sm font-semibold text-[#6B7280]">Date</th>
                    <th className="py-4 px-4 text-sm font-semibold text-[#6B7280]">Status</th>
                    <th className="py-4 px-4 text-sm font-semibold text-[#6B7280] text-right rounded-tr-xl">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredRequests.map(req => (
                    <StandardTableRow 
                      key={req.id}
                      student={req.studentName} event={req.title} date={req.submittedOn} 
                      priority={req.priority} status={req.status} 
                      onAccept={() => updateRequest(req.id, "Approved")}
                      onReject={() => updateRequest(req.id, "Rejected")}
                    />
                  ))}
                  {filteredRequests.length === 0 && (
                    <tr><td colSpan={5} className="py-12 text-center text-gray-500">No requests match your search.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "Flagged by AI":
        return (
          <div className="glass-panel bg-white rounded-[2rem] p-8 min-h-[70vh] border border-red-100 relative overflow-hidden">
             <div className="absolute right-[-10%] top-[-10%] w-64 h-64 bg-red-50 rounded-full blur-3xl z-0"></div>
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-[#1E2A5A] mb-1 flex items-center gap-2"><Flag className="text-red-500 w-6 h-6"/> AI Flagged Requests</h2>
              <p className="text-[#6B7280] text-sm mb-8">High priority requests automatically flagged by CampusConnect AI.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 bg-red-50/50">
                      <th className="py-4 px-4 text-sm font-semibold text-[#6B7280]">Student</th>
                      <th className="py-4 px-4 text-sm font-semibold text-[#6B7280]">Event / Purpose</th>
                      <th className="py-4 px-4 text-sm font-semibold text-[#6B7280]">Reason</th>
                      <th className="py-4 px-4 text-sm font-semibold text-[#6B7280] text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {flaggedReq.map((req) => (
                      <FlaggedTableRow 
                        key={req.id}
                        student={req.studentName} event={req.title} reason={req.reason}
                        priority={req.priority} date={req.submittedOn} 
                        onAccept={() => updateRequest(req.id, "Approved")}
                        onReject={() => updateRequest(req.id, "Rejected")}
                      />
                    ))}
                    {flaggedReq.length === 0 && (
                      <tr><td colSpan={4} className="py-12 text-center text-gray-500">No flagged requests!</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case "Announcements":
        const filteredAnnouncements = announcements.filter((a: any) =>
          !announcementSearch ||
          a.title?.toLowerCase().includes(announcementSearch.toLowerCase()) ||
          a.content?.toLowerCase().includes(announcementSearch.toLowerCase()) ||
          a.type?.toLowerCase().includes(announcementSearch.toLowerCase())
        );

        return (
          <div className="glass-panel bg-white rounded-[2rem] p-8 min-h-[70vh]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#1E2A5A]">Previous Announcements</h2>
                <p className="text-[#6B7280] text-sm mt-1">Review announcements broadcasted to students.</p>
              </div>
              <button 
                onClick={() => {
                  resetAnnouncementForm();
                  setActiveTab("Create Announcement");
                }} 
                className="px-4 py-2 rounded-xl bg-[#5B8CFF] text-white font-semibold flex items-center gap-2 hover:bg-[#4A7BEE] self-start sm:self-auto"
              >
                <PlusCircle className="w-4 h-4" /> Create New
              </button>
            </div>

            <div className="flex items-center gap-3 mb-6 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
              <Search className="w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                value={announcementSearch}
                onChange={(e) => setAnnouncementSearch(e.target.value)}
                placeholder="Search announcements by title, type, or content..." 
                className="bg-transparent outline-none flex-1 text-sm text-[#1E2A5A]"
              />
              {announcementSearch && (
                <button onClick={() => setAnnouncementSearch("")} className="text-xs text-gray-400 hover:text-gray-600">
                  Clear
                </button>
              )}
            </div>

            <div className="space-y-4">
              {filteredAnnouncements.map((a:any) => (
                <div key={a.id} className="p-5 border border-gray-100 rounded-2xl hover:border-[#5B8CFF]/30 hover:bg-[#F7F8FF] transition-all flex gap-5">
                  <div className="w-12 h-12 rounded-full bg-[#EAF4FF] flex items-center justify-center shrink-0 text-[#5B8CFF]">
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
                <div className="py-12 text-center text-gray-500 font-medium">
                  {announcementSearch ? "No announcements matched your search." : "No announcements created yet."}
                </div>
              )}
            </div>
          </div>
        );

      case "Create Announcement":
        const YEARS = ["All Years", "1st Year", "2nd Year", "3rd Year", "4th Year"];
        const BRANCHES = ["All Branches", "CSE", "IT", "ECE", "EEE", "MECH", "CIVIL"];
        
        return (
          <div className="glass-panel bg-white rounded-[2rem] p-8 min-h-[70vh] max-w-3xl mx-auto border-t-4 border-[#5B8CFF]">
            <h2 className="text-2xl font-bold text-[#1E2A5A] mb-1">Create New Announcement</h2>
            <p className="text-[#6B7280] text-sm mb-8">Broadcast an important message to specific students.</p>
            
            <form onSubmit={handleCreateAnnouncement} className="space-y-6">
              <div>
                <label className="text-sm font-semibold text-[#1E2A5A] block mb-1">Announcement Title</label>
                <input 
                  type="text" required value={newAnnTitle} onChange={e => setNewAnnTitle(e.target.value)}
                  placeholder="e.g., Mid-Term Exam Schedule"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#5B8CFF] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-semibold text-[#1E2A5A] block mb-2">Target Year(s)</label>
                  <div className="flex flex-wrap gap-2">
                    {YEARS.map(y => (
                      <button 
                        type="button" key={y} 
                        onClick={() => toggleSelection(targetYears, setTargetYears, y, "All Years")}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${
                          targetYears.includes(y) ? 'bg-[#5B8CFF] text-white border-[#5B8CFF]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-[#1E2A5A] block mb-2">Target Branch(es)</label>
                  <div className="flex flex-wrap gap-2">
                    {BRANCHES.map(b => (
                      <button 
                        type="button" key={b} 
                        onClick={() => toggleSelection(targetBranches, setTargetBranches, b, "All Branches")}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${
                          targetBranches.includes(b) ? 'bg-[#7C6CFF] text-white border-[#7C6CFF]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-[#1E2A5A] block mb-1">Category / Type</label>
                <select 
                  value={newAnnType} onChange={e => setNewAnnType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#5B8CFF] outline-none"
                >
                  <option value="Important">Important</option>
                  <option value="Exam">Exam</option>
                  <option value="Event">Event</option>
                  <option value="Update">General Update</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-[#1E2A5A] block mb-1">Detailed Message</label>
                <textarea 
                  required value={newAnnContent} onChange={e => setNewAnnContent(e.target.value)}
                  placeholder="Type your announcement details here..." rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#5B8CFF] outline-none resize-none"
                ></textarea>
              </div>

              {/* Media Upload */}
              <div>
                <label className="text-sm font-semibold text-[#1E2A5A] block mb-2">Attachments / Media (Optional)</label>
                <div className="flex items-center justify-center w-full">
                  <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${newAnnFile ? 'border-[#5B8CFF] bg-[#EAF4FF]' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {newAnnFile ? (
                        <>
                          <FileText className="w-8 h-8 mb-2 text-[#5B8CFF]" />
                          <p className="text-sm font-bold text-[#1E2A5A]">{newAnnFile.name}</p>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-8 h-8 mb-2 text-gray-400" />
                          <p className="text-sm text-gray-500 font-medium">Click to upload image or document</p>
                        </>
                      )}
                    </div>
                    <input type="file" className="hidden" onChange={(e) => { if(e.target.files?.[0]) setNewAnnFile(e.target.files[0]) }} />
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => {
                    resetAnnouncementForm();
                    setActiveTab("Announcements");
                  }} 
                  className="px-6 py-3 rounded-xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-8 py-3 rounded-xl bg-[#5B8CFF] text-white font-bold hover:bg-[#4A7BEE] flex items-center gap-2">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4"/> Broadcast</>}
                </button>
              </div>
            </form>
          </div>
        );


      case "Doubts & Q&A":
        const filteredDoubts = doubts.filter((item: any) =>
          !doubtSearch ||
          item.text?.toLowerCase().includes(doubtSearch.toLowerCase()) ||
          item.authorName?.toLowerCase().includes(doubtSearch.toLowerCase()) ||
          item.tags?.some((t: string) => t.toLowerCase().includes(doubtSearch.toLowerCase()))
        );

        return (
          <div className="glass-panel bg-white rounded-[2rem] p-8 min-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#1E2A5A]">Doubts & Q&A Forum</h2>
                <p className="text-[#6B7280] text-sm mt-1">Answer student queries and share guidance campus-wide.</p>
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
                placeholder="Search doubts by query, student name, or tags..." 
                className="bg-transparent outline-none flex-1 text-sm text-[#1E2A5A]"
              />
              {doubtSearch && (
                <button onClick={() => setDoubtSearch("")} className="text-xs text-gray-400 hover:text-gray-600">
                  Clear
                </button>
              )}
            </div>

            <form onSubmit={handleAskDoubt} className="mb-8 flex gap-3">
              <input 
                type="text" 
                value={doubtInput}
                onChange={(e) => setDoubtInput(e.target.value)}
                placeholder="Share knowledge or answer questions..." 
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#5B8CFF]" 
              />
              <button type="submit" className="px-6 py-3 rounded-xl bg-[#7C6CFF] text-white font-semibold flex items-center gap-2 hover:bg-[#6A5AEE]">
                <HelpCircle className="w-4 h-4" /> Post
              </button>
            </form>

            <div className="space-y-4 flex-1">
              {filteredDoubts.map((item: any) => {
                const commentCount = item.comments?.length || item.answers || 0;
                const isLiked = item.likedBy?.includes(user?.id) || (item.likes && item.likes > 0);
                const isExpanded = expandedComments[item.id];

                return (
                  <div key={item.id} className="p-6 border border-gray-100 rounded-3xl hover:shadow-lg hover:border-[#5B8CFF]/30 transition-all bg-white relative group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#F7F8FF] flex items-center justify-center text-[#5B8CFF] font-bold border border-[#EAF4FF]">
                          {item.authorName?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#1E2A5A]">{item.authorName}</p>
                          <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{item.authorRole || 'Student'} • {new Date(item.timestamp || Date.now()).toLocaleDateString()}</p>
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
                                  <span className="text-xs font-bold text-[#1E2A5A]">
                                    {c.authorName} <span className="text-gray-400 text-[10px] font-normal">({c.authorRole})</span>
                                  </span>
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
                            placeholder="Write an answer or faculty guidance..." 
                            value={replyInputs[item.id] || ""}
                            onChange={(e) => setReplyInputs(prev => ({ ...prev, [item.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddComment(item.id, replyInputs[item.id]);
                              }
                            }}
                            className="flex-1 px-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#5B8CFF]"
                          />
                          <button 
                            type="button"
                            onClick={() => handleAddComment(item.id, replyInputs[item.id])}
                            className="px-4 py-2 bg-[#5B8CFF] text-white text-xs font-bold rounded-xl hover:bg-[#4A7BEE] transition-colors"
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
                <p className="text-center py-8 text-gray-500 font-medium">No doubts posted yet.</p>
              )}
            </div>
          </div>
        );

      case "My Admin Requests":
        return (
          <div className="glass-panel bg-white rounded-[2rem] p-8 min-h-[70vh]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-[#1E2A5A]">My Admin Requests</h2>
                <p className="text-[#6B7280] text-sm mt-1">Track the status of requests you've sent to the Admin.</p>
              </div>
              <button onClick={() => setIsReqModalOpen(true)} className="px-4 py-2 rounded-xl bg-[#5B8CFF] text-white font-semibold flex items-center gap-2 hover:bg-[#4A7BEE]">
                <PlusCircle className="w-4 h-4" /> New Request
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="py-4 px-4 text-sm font-semibold text-[#6B7280] rounded-tl-xl">Request Type</th>
                    <th className="py-4 px-4 text-sm font-semibold text-[#6B7280]">Reason</th>
                    <th className="py-4 px-4 text-sm font-semibold text-[#6B7280]">Date</th>
                    <th className="py-4 px-4 text-sm font-semibold text-[#6B7280]">Status</th>
                    <th className="py-4 px-4 text-sm font-semibold text-[#6B7280] rounded-tr-xl">Priority</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {myAdminRequests.map(r => (
                    <tr key={r.id} className="border-b border-gray-50 hover:bg-[#F7F8FF] transition-colors">
                      <td className="py-4 px-4 font-semibold text-[#1E2A5A]">{r.type}</td>
                      <td className="py-4 px-4 text-[#6B7280] max-w-xs truncate">{r.reason}</td>
                      <td className="py-4 px-4 text-[#6B7280]">{r.date}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                          r.status === 'Approved' ? 'bg-green-100 text-green-700' :
                          r.status === 'Pending' ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-medium text-gray-500">{r.priority}</td>
                    </tr>
                  ))}
                  {myAdminRequests.length === 0 && (
                    <tr><td colSpan={5} className="py-12 text-center text-gray-500">No requests submitted to Admin yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "Reports & Analytics":
        return (
          <div className="glass-panel bg-white rounded-[2rem] p-8 min-h-[70vh]">
            <h2 className="text-2xl font-bold text-[#1E2A5A] mb-8 flex items-center gap-2"><BarChart3 /> Reports & Analytics</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="p-6 border border-gray-100 rounded-2xl bg-gray-50 flex flex-col items-center justify-center text-center">
                <PieChart className="w-12 h-12 text-[#7C6CFF] mb-3" />
                <h3 className="text-2xl font-black text-[#1E2A5A]">Approval Rate: {approvalRate}%</h3>
                <p className="text-xs text-gray-500 mt-2">
                  {approvedReq} of {totalReq} requests approved ({pendingReq} pending, {rejectedReq} rejected).
                </p>
              </div>
              <div className="p-6 border border-gray-100 rounded-2xl bg-gray-50 flex flex-col items-center justify-center text-center">
                <TrendingUp className="w-12 h-12 text-[#5B8CFF] mb-3" />
                <h3 className="text-2xl font-black text-[#1E2A5A]">{myStudents.length} Students</h3>
                <p className="text-xs text-gray-500 mt-2">
                  Assigned proctor section: <span className="font-semibold text-[#1E2A5A]">{user.details}</span>
                </p>
              </div>
              <div className="p-6 border border-gray-100 rounded-2xl bg-gray-50 flex flex-col items-center justify-center text-center">
                <ShieldAlert className="w-12 h-12 text-red-500 mb-3" />
                <h3 className="text-2xl font-black text-[#1E2A5A]">{flaggedReq.length} High Priority</h3>
                <p className="text-xs text-gray-500 mt-2">
                  {topPurpose !== "None" ? `Most requested: "${topPurpose}"` : "No pending high-priority items."}
                </p>
              </div>
            </div>

            <div className="p-8 border border-gray-100 rounded-[2rem] bg-white shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-[#1E2A5A]">Monthly Permission Requests</h3>
                  <p className="text-xs text-[#6B7280]">Actual volume of student permission requests received</p>
                </div>
                <span className="text-xs font-bold text-[#5B8CFF] bg-[#EAF4FF] px-3 py-1 rounded-lg">
                  {totalReq} Total {totalReq === 1 ? 'Request' : 'Requests'}
                </span>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dynamicMonthlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#9CA3AF', fontSize: 12}} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#9CA3AF', fontSize: 12}} 
                      allowDecimals={false}
                    />
                    <Tooltip 
                      cursor={{fill: '#F9FAFB'}}
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                    />
                    <Bar dataKey="requests" radius={[6, 6, 0, 0]}>
                      {dynamicMonthlyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.requests > 0 ? '#5B8CFF' : '#E5E7EB'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );

      case "Profile":
        return (
          <div className="glass-panel bg-white rounded-[2rem] p-8 min-h-[70vh] max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-[#1E2A5A] mb-8">Faculty Profile</h2>
            <div className="flex flex-col md:flex-row gap-10">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <img src={user.avatar} alt="Profile" className="w-32 h-32 rounded-full border-4 border-[#EAF4FF] object-cover" />
                  <button 
                    onClick={() => alert("Profile photo updates are managed by College Administration. Please submit a request to change your photo.")}
                    className="absolute bottom-0 right-0 p-2 bg-[#5B8CFF] text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                    title="Change Profile Picture"
                  >
                    <UploadCloud className="w-4 h-4" />
                  </button>
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
                    <label className="text-xs font-bold text-[#5B8CFF] uppercase tracking-wider block mb-1">Department</label>
                    <p className="text-lg font-bold text-[#1E2A5A]">{user.details}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <label className="text-xs font-bold text-[#5B8CFF] uppercase tracking-wider block mb-1">Employee ID</label>
                    <p className="text-lg font-bold text-[#1E2A5A]">{user.id || "FAC_2023_081"}</p>
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-3">
                  <ShieldAlert className="w-5 h-5 text-[#5B8CFF]" />
                  <p className="text-sm text-[#5B8CFF] font-medium">Profile details are managed by the administration and cannot be changed here.</p>
                </div>
              </div>
            </div>
          </div>
        );

      case "Settings":
        const handleSaveFacultySettings = () => {
          localStorage.setItem("settings_faculty", JSON.stringify(settings));
          alert("Faculty settings saved successfully!");
        };

        return (
          <div className="glass-panel bg-white rounded-[2rem] p-8 min-h-[70vh] max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-[#1E2A5A] mb-8">Faculty Settings</h2>
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-bold text-[#1E2A5A] mb-4 flex items-center gap-2"><Bell className="w-5 h-5 text-[#5B8CFF]" /> Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                    <div>
                      <p className="font-semibold text-[#1E2A5A]">Email Alerts for AI Flagged</p>
                      <p className="text-xs text-gray-500">Get notified instantly when AI flags a request.</p>
                    </div>
                    <button 
                      onClick={() => setSettings(prev => ({...prev, emailAlerts: !prev.emailAlerts}))}
                      className={`w-11 h-6 rounded-full relative transition-colors duration-200 ${settings.emailAlerts ? 'bg-[#5B8CFF]' : 'bg-gray-200'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-all duration-200 ${settings.emailAlerts ? 'right-1' : 'left-1'}`}></div>
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                    <div>
                      <p className="font-semibold text-[#1E2A5A]">Push Notifications</p>
                      <p className="text-xs text-gray-500">Receive dashboard alerts for new requests.</p>
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
                  onClick={handleSaveFacultySettings}
                  className="w-full py-4 bg-[#1E2A5A] text-white font-bold rounded-2xl shadow-lg hover:bg-[#2A3B7D] transition-all"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FF] font-sans flex">
      {/* LEFT SIDEBAR */}
      <aside className="w-64 bg-white border-r border-[#EAF4FF] flex flex-col hidden lg:flex sticky top-0 h-screen overflow-y-auto hide-scrollbar">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#5B8CFF] to-[#7C6CFF] flex items-center justify-center">
              <span className="text-white font-bold text-sm">CC</span>
            </div>
            <span className="text-xl font-bold text-[#1E2A5A]">CampusConnect</span>
          </div>
          <span className="text-xs font-semibold text-[#5B8CFF] tracking-wider uppercase ml-10">Faculty Portal</span>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          <NavItem icon={LayoutDashboard} label="Dashboard" active={activeTab === "Dashboard"} onClick={() => setActiveTab("Dashboard")} />
          <NavItem icon={Users} label="My Students" active={activeTab === "My Students"} onClick={() => setActiveTab("My Students")} />
          <NavItem icon={FileText} label="Permission Requests" active={activeTab === "Permission Requests"} onClick={() => setActiveTab("Permission Requests")} />
          <NavItem icon={Flag} label="Flagged by AI" active={activeTab === "Flagged by AI"} onClick={() => setActiveTab("Flagged by AI")} />
          <NavItem icon={Megaphone} label="Announcements" active={activeTab === "Announcements"} onClick={() => setActiveTab("Announcements")} />
          <NavItem icon={PlusCircle} label="Create Announcement" active={activeTab === "Create Announcement"} onClick={() => setActiveTab("Create Announcement")} />
          <NavItem icon={HelpCircle} label="Doubts & Q&A" active={activeTab === "Doubts & Q&A"} onClick={() => setActiveTab("Doubts & Q&A")} />
          <NavItem icon={UserCog} label="My Admin Requests" active={activeTab === "My Admin Requests"} onClick={() => setActiveTab("My Admin Requests")} />
          <NavItem icon={BarChart3} label="Reports & Analytics" active={activeTab === "Reports & Analytics"} onClick={() => setActiveTab("Reports & Analytics")} />
          
          <div className="pt-6 pb-2">
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Account</p>
          </div>
          <NavItem icon={User} label="Profile" active={activeTab === "Profile"} onClick={() => setActiveTab("Profile")} />
          <NavItem icon={Settings} label="Settings" active={activeTab === "Settings"} onClick={() => setActiveTab("Settings")} />
        </nav>

        <div className="p-4 mt-auto">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#EDE9FE] to-[#EAF4FF] border border-white shadow-sm relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/40 rounded-full blur-xl"></div>
            <h4 className="text-sm font-bold text-[#1E2A5A] mb-1 relative z-10">Make an Impact!</h4>
            <p className="text-xs text-[#6B7280] mb-3 relative z-10">Share important updates with your students.</p>
            <button onClick={() => setActiveTab("Create Announcement")} className="w-full py-2 rounded-xl bg-white text-[#5B8CFF] text-xs font-bold shadow-sm hover:shadow relative z-10 transition-shadow">
              Create Announcement
            </button>
          </div>
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
              {activeTab === "Dashboard" ? "Here's an overview of your students and permission requests." : "Faculty Portal Workspace"}
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            <button onClick={() => setActiveTab("Flagged by AI")} className="relative p-2 rounded-full bg-[#F7F8FF] text-[#1E2A5A] hover:bg-[#EAF4FF] transition-colors">
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

      {/* Admin Permission Request Modal */}
      {isReqModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 relative">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-bold text-[#1E2A5A]">Admin Permission Request</h2>
              <button onClick={() => setIsReqModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors"><XCircle className="w-6 h-6" /></button>
            </div>
            <p className="text-sm text-[#6B7280] mb-6">Submit a formal request to the Admin department.</p>
            
            <form onSubmit={handleCreateFacultyRequest} className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-[#1E2A5A]">Request Type</label>
                <select 
                  value={newReqType} onChange={e => setNewReqType(e.target.value)}
                  className="w-full mt-1.5 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#5B8CFF] focus:bg-white transition-colors outline-none appearance-none"
                >
                  <option>Research Grant</option>
                  <option>Lab Equipment Fund</option>
                  <option>Seminar Hall Booking</option>
                  <option>Official Leave</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-[#1E2A5A]">Reason / Details</label>
                <textarea 
                  required value={newReqReason} onChange={e => setNewReqReason(e.target.value)}
                  placeholder="Explain your request in detail..." rows={4}
                  className="w-full mt-1.5 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#5B8CFF] focus:bg-white transition-colors outline-none resize-none"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsReqModalOpen(false)} className="px-6 py-2.5 rounded-xl font-semibold text-[#6B7280] hover:bg-gray-100 transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmittingReq} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#5B8CFF] to-[#7C6CFF] text-white font-bold hover:shadow-lg hover:opacity-90 transition-all flex items-center gap-2">
                  {isSubmittingReq ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit to Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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

function StatCard({ title, value, icon: Icon, color, onClick }: { title: string, value: string, icon: any, color: 'purple' | 'orange' | 'green' | 'red' | 'blue' | 'red-solid', onClick?: () => void }) {
  const colors = {
    purple: "bg-[#EDE9FE] text-[#7C6CFF]",
    orange: "bg-orange-100 text-orange-500",
    green: "bg-green-100 text-green-500",
    red: "bg-red-100 text-red-500",
    blue: "bg-[#EAF4FF] text-[#5B8CFF]",
    "red-solid": "bg-red-50 text-red-600 border border-red-200"
  };
  
  return (
    <div onClick={onClick} className={`glass-panel bg-white p-5 rounded-2xl flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow ${color === 'red-solid' ? 'bg-red-50/50 border border-red-100' : ''}`}>
      <div className={`w-12 h-12 rounded-xl flex shrink-0 items-center justify-center ${colors[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${color === 'red-solid' ? 'text-red-500' : 'text-[#6B7280]'}`}>{title}</p>
        <p className="text-2xl font-bold text-[#1E2A5A]">{value}</p>
      </div>
    </div>
  );
}

function FlaggedTableRow({ student, event, reason, priority, date, onAccept, onReject }: any) {
  return (
    <tr className="border-b border-gray-50 hover:bg-red-50/30 transition-colors group">
      <td className="py-4 px-4 font-semibold text-[#1E2A5A]">{student}</td>
      <td className="py-4 px-4 text-[#1E2A5A]">{event}</td>
      <td className="py-4 px-4 text-red-500 font-medium text-xs max-w-[200px] truncate">{reason}</td>
      <td className="py-4 px-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <button onClick={onAccept} className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors border border-green-100">
            <Check className="w-4 h-4" />
          </button>
          <button onClick={onReject} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors border border-red-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function StandardTableRow({ student, event, date, priority, status, onAccept, onReject }: any) {
  const getStatusColor = (s: string) => {
    if (s === "Approved") return "bg-green-100 text-green-700";
    if (s === "Pending") return "bg-orange-100 text-orange-700";
    return "bg-red-100 text-red-700";
  };

  return (
    <tr className="border-b border-gray-50 hover:bg-[#F7F8FF] transition-colors group">
      <td className="py-4 px-4 font-semibold text-[#1E2A5A]">{student}</td>
      <td className="py-4 px-4 text-[#1E2A5A]">{event}</td>
      <td className="py-4 px-4 text-[#6B7280]">{date}</td>
      <td className="py-4 px-4">
        <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${getStatusColor(status)}`}>
          {status}
        </span>
      </td>
      <td className="py-4 px-4 text-right">
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {status === "Pending" && (
            <>
              <button onClick={onAccept} className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors border border-green-100">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={onReject} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors border border-red-100">
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
