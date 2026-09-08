"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  LayoutDashboard, Users, FileText, Megaphone, MessageSquare, 
  HelpCircle, Bot, Settings, LogOut, Bell, Flag,
  Check, X, ChevronRight, BarChart3, PlusCircle, Lightbulb, UserCog, Clock, Search, ShieldAlert,
  UploadCloud, Send, Heart, PieChart, TrendingUp, Activity, MessageCircle, Loader2
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [requests, setRequests] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [facultyRequests, setFacultyRequests] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [doubts, setDoubts] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

  // Settings State
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    aiModeration: true,
    enforce2FA: true
  });

  // Global Announcement Form State
  const [newAnnTitle, setNewAnnTitle] = useState("");
  const [newAnnContent, setNewAnnContent] = useState("");
  const [newAnnType, setNewAnnType] = useState("Global");
  const [isSubmittingAnn, setIsSubmittingAnn] = useState(false);

  // User Management State
  const [userSearch, setUserSearch] = useState("");
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserId, setNewUserId] = useState("");
  const [newUserAvatar, setNewUserAvatar] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("Student");
  const [newUserDept, setNewUserDept] = useState("");
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  // Search states for other tabs
  const [requestSearch, setRequestSearch] = useState("");
  const [announcementSearch, setAnnouncementSearch] = useState("");
  const [doubtSearch, setDoubtSearch] = useState("");



  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/");
      return;
    }
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== "Admin") {
      router.push("/");
      return;
    }
    setUser(parsedUser);

    const savedSettings = localStorage.getItem("settings_admin");
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {}
    }

    fetchData();
    
    // Polling to keep data fresh (every 30 seconds)
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [router]);

  const fetchData = async () => {
    const [reqRes, facReqRes, userRes, annRes, doubtRes] = await Promise.all([
      fetch('/api/requests'),
      fetch('/api/facultyRequests'),
      fetch('/api/users'),
      fetch('/api/announcements'),
      fetch('/api/messages?type=doubt')
    ]);
    if (reqRes.ok) setRequests(await reqRes.json());
    if (facReqRes.ok) setFacultyRequests(await facReqRes.json());
    if (userRes.ok) setUsersList(await userRes.json());
    if (annRes.ok) setAnnouncements(await annRes.json());
    if (doubtRes.ok) setDoubts(await doubtRes.json());
  };

  const handleDeleteDoubt = async (id: string) => {
    if (!confirm("Are_you_sure_you_want_to_delete_this_post?".replace(/_/g, ' '))) return;
    try {
      const res = await fetch(`/api/messages?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDoubts(prev => prev.filter(d => d.id !== id));
      } else {
        alert("Failed to delete the post.");
      }
    } catch (err) {
      alert("Error deleting post.");
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail || !newUserPassword) {
      alert("Please fill in all required user fields.");
      return;
    }
    setIsSubmittingUser(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newUserId.trim() || undefined,
          avatar: newUserAvatar.trim() || undefined,
          name: newUserName.trim(),
          email: newUserEmail.trim(),
          password: newUserPassword,
          role: newUserRole,
          details: newUserDept.trim() || `${newUserRole} Member`
        })
      });
      if (res.ok) {
        const created = await res.json();
        setUsersList(prev => [...prev, created]);
        setIsAddUserModalOpen(false);
        setNewUserName("");
        setNewUserEmail("");
        setNewUserPassword("");
        setNewUserDept("");
        setNewUserId("");
        setNewUserAvatar("");
        alert("New user created successfully!");
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.error || "Failed to create user"}`);
      }
    } catch (err) {
      alert("An error occurred while creating the user.");
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const updateRequest = async (id: string, status: string) => {
    const prevRequests = requests;
    const prevFacultyRequests = facultyRequests;
    setRequests(reqs => reqs.map(r => r.id === id ? { ...r, status } : r));
    setFacultyRequests(reqs => reqs.map(r => r.id === id ? { ...r, status } : r));
    
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
      setRequests(prevRequests);
      setFacultyRequests(prevFacultyRequests);
    }
  };

  if (!user) return null;

  const studentRequests = requests;
  const allPending = [
    ...requests.filter(r => r.status === "Pending"),
    ...facultyRequests.filter(r => r.status === "Pending")
  ].sort((a, b) => (b.priority === 'High' ? 1 : -1) - (a.priority === 'High' ? 1 : -1));

  const flaggedReq = allPending.filter(r => r.priority === "High");
  const approvedCount = requests.filter(r => r.status === "Approved").length + facultyRequests.filter(r => r.status === "Approved").length;
  const rejectedCount = requests.filter(r => r.status === "Rejected").length + facultyRequests.filter(r => r.status === "Rejected").length;

  const renderContent = () => {
    switch (activeTab) {
      case "Dashboard":
        return (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <StatCard title="Total Students" value={usersList.filter(u => u.role === "Student").length.toString()} icon={Users} color="purple" onClick={() => setActiveTab("Manage Users")} />
              <StatCard title="Total Faculty" value={usersList.filter(u => u.role === "Faculty").length.toString()} icon={UserCog} color="blue" onClick={() => setActiveTab("Manage Users")} />
              <StatCard title="Global Pending" value={allPending.length.toString()} icon={Clock} color="orange" onClick={() => setActiveTab("All Requests")} />
              <StatCard title="Total Approved" value={approvedCount.toString()} icon={Check} color="green" />
              <StatCard title="Total Rejected" value={rejectedCount.toString()} icon={X} color="red" />
              <StatCard title="AI Escalated" value={flaggedReq.length.toString()} icon={ShieldAlert} color="red-solid" onClick={() => setActiveTab("Flagged by AI")} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 space-y-6">
                {/* AI Escalated */}
                <div className="glass-panel bg-white p-6 rounded-[2rem] border border-red-100 relative overflow-hidden">
                  <div className="absolute right-[-10%] top-[-10%] w-64 h-64 bg-red-50 rounded-full blur-3xl"></div>
                  <div className="relative z-10 flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-[#1E2A5A] flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-red-500" /> AI Escalated Requests
                      </h3>
                      <p className="text-sm text-[#6B7280]">Requests escalated to admin level.</p>
                    </div>
                    <button onClick={() => setActiveTab("Flagged by AI")} className="text-sm font-semibold text-[#5B8CFF] hover:text-[#7C6CFF]">View All →</button>
                  </div>
                  
                  <div className="overflow-x-auto relative z-10">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="pb-3 text-sm font-semibold text-[#6B7280]">Person / Role</th>
                          <th className="pb-3 text-sm font-semibold text-[#6B7280]">Event / Purpose</th>
                          <th className="pb-3 text-sm font-semibold text-[#6B7280]">Reason</th>
                          <th className="pb-3 text-sm font-semibold text-[#6B7280] text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {allPending.slice(0, 6).map((req) => (
                          <FlaggedTableRow 
                            key={req.id}
                            dept={`${req.studentName || req.name} (${req.studentId ? 'Student' : 'Faculty'})`} 
                            event={req.title || req.type} 
                            reason={req.reason || "General Request"}
                            priority={req.priority} date={req.submittedOn || req.date} 
                            onClick={() => setSelectedRequest(req)}
                            onAccept={(e: any) => { e.stopPropagation(); updateRequest(req.id, "Approved"); }}
                            onReject={(e: any) => { e.stopPropagation(); updateRequest(req.id, "Rejected"); }}
                          />
                        ))}
                        {allPending.length === 0 && (
                          <tr><td colSpan={4} className="py-12 text-center text-gray-400 font-medium">No pending requests to review.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* All Requests Split view preview */}
                <div className="glass-panel bg-white rounded-[2rem] p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-[#1E2A5A]">Recent Campus Requests</h3>
                    <button onClick={() => setActiveTab("All Requests")} className="px-3 py-1.5 rounded-lg bg-[#F7F8FF] text-sm font-semibold text-[#1E2A5A] hover:bg-[#EAF4FF] transition-colors border border-gray-200">
                      View Full Tables
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-bold text-[#1E2A5A] mb-3 border-b border-gray-200 pb-2 flex items-center gap-2"><Users className="w-4 h-4 text-[#5B8CFF]"/> Student Requests</h4>
                      <div className="space-y-3">
                        {studentRequests.slice(0,3).map(r => (
                          <div key={r.id} className="text-sm flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                            <span className="font-semibold text-gray-700">{r.studentName}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${r.status === 'Approved' ? 'bg-green-100 text-green-600' : r.status === 'Pending' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'}`}>{r.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-bold text-[#1E2A5A] mb-3 border-b border-gray-200 pb-2 flex items-center gap-2"><UserCog className="w-4 h-4 text-purple-500"/> Faculty Requests</h4>
                      <div className="space-y-3">
                        {facultyRequests.map(r => (
                          <div key={r.id} className="text-sm flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                            <span className="font-semibold text-gray-700">{r.name}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${r.status === 'Approved' ? 'bg-green-100 text-green-600' : r.status === 'Pending' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'}`}>{r.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6 flex flex-col">
                <div className="glass-panel bg-white p-6 rounded-[2rem] text-center flex flex-col items-center cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab("Announcements")}>
                  <div className="w-14 h-14 bg-[#EDE9FE] rounded-full flex items-center justify-center mb-4">
                    <Megaphone className="w-7 h-7 text-[#7C6CFF]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#1E2A5A] mb-2">Global Announcements</h3>
                  <p className="text-sm text-[#6B7280] mb-6 leading-relaxed">
                    Broadcast important alerts across the entire campus network.
                  </p>
                  <button onClick={() => setActiveTab("Announcements")} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#5B8CFF] to-[#7C6CFF] text-white font-bold shadow-[0_8px_20px_rgba(91,140,255,0.3)] hover:shadow-[0_12px_25px_rgba(91,140,255,0.4)] transform hover:-translate-y-0.5 transition-all">
                    Open Announcements UI
                  </button>
                </div>

                <div className="glass-panel bg-gradient-to-br from-[#1E2A5A] to-[#2A3B7D] p-6 rounded-[2rem] text-white mt-auto relative overflow-hidden">
                  <div className="absolute right-[-20%] top-[-20%] w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                  <Bot className="w-8 h-8 text-[#C4B5FD] mb-3 relative z-10" />
                  <h3 className="text-lg font-bold mb-1 relative z-10">Admin AI Bot</h3>
                  <p className="text-sm text-[#C4B5FD] mb-4 relative z-10">Ask AI to generate compliance reports or audit logs instantly.</p>
                  <button 
                    onClick={() => setActiveTab("Flagged by AI")}
                    className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur text-white font-semibold text-sm transition-colors relative z-10 border border-white/10"
                  >
                    Open AI Dashboard
                  </button>
                </div>
              </div>
            </div>
          </>
        );

      case "Manage Users":
        const filteredUsers = usersList.filter((u: any) => 
          !userSearch ||
          (u.name && u.name.toLowerCase().includes(userSearch.toLowerCase())) || 
          (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase())) || 
          (u.id && u.id.toLowerCase().includes(userSearch.toLowerCase())) || 
          (u.role && u.role.toLowerCase().includes(userSearch.toLowerCase())) ||
          (u.details && u.details.toLowerCase().includes(userSearch.toLowerCase()))
        );
        return (
          <div className="glass-panel bg-white rounded-[2rem] p-8 min-h-[70vh]">
            <h2 className="text-2xl font-bold text-[#1E2A5A] mb-1">Manage Users</h2>
            <p className="text-[#6B7280] text-sm mb-6">View and control access for all students, faculty, and staff.</p>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                <Search className="w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search users by name, email, ID, role, or department..." 
                  className="bg-transparent outline-none flex-1 text-sm text-[#1E2A5A]" 
                />
                {userSearch && (
                  <button onClick={() => setUserSearch("")} className="text-xs text-gray-400 hover:text-gray-600">
                    Clear
                  </button>
                )}
              </div>
              <button 
                onClick={() => setIsAddUserModalOpen(true)}
                className="px-6 py-3 bg-[#5B8CFF] text-white rounded-xl font-bold shadow hover:bg-[#4A7BEE] transition-colors whitespace-nowrap self-start sm:self-auto"
              >
                + Add New User
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="py-4 px-4 font-semibold text-[#6B7280] text-sm">User</th>
                    <th className="py-4 px-4 font-semibold text-[#6B7280] text-sm">User ID / Roll No</th>
                    <th className="py-4 px-4 font-semibold text-[#6B7280] text-sm">Role</th>
                    <th className="py-4 px-4 font-semibold text-[#6B7280] text-sm">Department / Details</th>
                    <th className="py-4 px-4 font-semibold text-[#6B7280] text-sm">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u: any) => (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-[#F7F8FF] transition-colors">
                      <td className="py-4 px-4 font-semibold text-[#1E2A5A]">
                        <div className="flex items-center gap-3">
                          <img 
                            src={u.avatar || `https://i.pravatar.cc/150?u=${encodeURIComponent(u.name)}`} 
                            alt={u.name} 
                            className="w-9 h-9 rounded-full object-cover border border-gray-200"
                            onError={(e: any) => { e.target.src = `https://i.pravatar.cc/150?u=${encodeURIComponent(u.name)}`; }}
                          />
                          <div>
                            <p className="font-bold text-[#1E2A5A] text-sm">{u.name}</p>
                            <p className="text-xs text-gray-500 font-normal">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-mono text-xs font-semibold px-2.5 py-1 bg-gray-100 rounded-lg text-gray-700">
                          {u.id}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 text-xs rounded-lg font-bold uppercase tracking-wider ${
                          u.role === 'Student' ? 'bg-purple-100 text-purple-700' : 
                          u.role === 'Faculty' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-600 text-sm">{u.details}</td>
                      <td className="py-4 px-4"><span className="text-green-500 font-bold text-xs flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Active</span></td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr><td colSpan={5} className="py-8 text-center text-gray-500 font-medium">No users matched your search.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "All Requests":
        const filteredFacultyReq = facultyRequests.filter(r => 
          !requestSearch ||
          r.name?.toLowerCase().includes(requestSearch.toLowerCase()) ||
          r.type?.toLowerCase().includes(requestSearch.toLowerCase()) ||
          r.dept?.toLowerCase().includes(requestSearch.toLowerCase()) ||
          r.status?.toLowerCase().includes(requestSearch.toLowerCase())
        );
        const filteredStudentReq = studentRequests.filter(r => 
          !requestSearch ||
          r.studentName?.toLowerCase().includes(requestSearch.toLowerCase()) ||
          r.title?.toLowerCase().includes(requestSearch.toLowerCase()) ||
          r.status?.toLowerCase().includes(requestSearch.toLowerCase())
        );

        return (
          <div className="glass-panel bg-white rounded-[2rem] p-8 min-h-[70vh]">
            <h2 className="text-2xl font-bold text-[#1E2A5A] mb-1">Campus Request Logs</h2>
            <p className="text-[#6B7280] text-sm mb-6">Audit and override any permission requests.</p>
            
            <div className="flex items-center gap-3 mb-6 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
              <Search className="w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                value={requestSearch}
                onChange={(e) => setRequestSearch(e.target.value)}
                placeholder="Search requests by requester name, title/type, department, or status..." 
                className="bg-transparent outline-none flex-1 text-sm text-[#1E2A5A]"
              />
              {requestSearch && (
                <button onClick={() => setRequestSearch("")} className="text-xs text-gray-400 hover:text-gray-600">
                  Clear
                </button>
              )}
            </div>

            <h3 className="text-lg font-bold text-[#1E2A5A] mb-4 border-l-4 border-purple-500 pl-3">Faculty Requests</h3>
            <div className="overflow-x-auto mb-10">
              <table className="w-full text-left border-collapse bg-gray-50 rounded-xl overflow-hidden">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-4 px-4 text-sm font-semibold text-[#6B7280]">Faculty Name</th>
                    <th className="py-4 px-4 text-sm font-semibold text-[#6B7280]">Request Type</th>
                    <th className="py-4 px-4 text-sm font-semibold text-[#6B7280]">Status</th>
                    <th className="py-4 px-4 text-sm font-semibold text-[#6B7280] text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredFacultyReq.map(r => (
                    <StandardTableRow 
                      key={r.id} 
                      name={r.name} type={r.type} date={r.date} dept={r.dept} status={r.status} 
                      onClick={() => setSelectedRequest(r)}
                      onAccept={(e: any) => { e.stopPropagation(); updateRequest(r.id, "Approved"); }}
                      onReject={(e: any) => { e.stopPropagation(); updateRequest(r.id, "Rejected"); }}
                    />
                  ))}
                  {filteredFacultyReq.length === 0 && (
                    <tr><td colSpan={4} className="py-6 text-center text-gray-400 font-medium">No faculty requests found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-bold text-[#1E2A5A] mb-4 border-l-4 border-[#5B8CFF] pl-3">Student Requests</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse bg-gray-50 rounded-xl overflow-hidden">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-4 px-4 text-sm font-semibold text-[#6B7280]">Student Name</th>
                    <th className="py-4 px-4 text-sm font-semibold text-[#6B7280]">Event / Purpose</th>
                    <th className="py-4 px-4 text-sm font-semibold text-[#6B7280]">Status</th>
                    <th className="py-4 px-4 text-sm font-semibold text-[#6B7280] text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredStudentReq.map(r => (
                    <StandardTableRow 
                      key={r.id} 
                      name={r.studentName} type={r.title} date={r.submittedOn} dept="CSE" status={r.status} 
                      onClick={() => setSelectedRequest(r)}
                      onAccept={(e: any) => { e.stopPropagation(); updateRequest(r.id, "Approved"); }}
                      onReject={(e: any) => { e.stopPropagation(); updateRequest(r.id, "Rejected"); }}
                    />
                  ))}
                  {filteredStudentReq.length === 0 && (
                    <tr><td colSpan={4} className="py-6 text-center text-gray-400 font-medium">No student requests found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "Flagged by AI":
        return (
          <div className="glass-panel bg-white rounded-[2rem] p-8 min-h-[70vh] border border-red-100">
            <h2 className="text-2xl font-bold text-[#1E2A5A] mb-1 flex items-center gap-2"><ShieldAlert className="text-red-500 w-6 h-6"/> AI Escalations</h2>
            <p className="text-[#6B7280] text-sm mb-8">Requests that violate policies, require high budget, or present security risks.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-red-50/50">
                    <th className="py-4 px-4 text-sm font-semibold text-[#6B7280]">Requester</th>
                    <th className="py-4 px-4 text-sm font-semibold text-[#6B7280]">Purpose</th>
                    <th className="py-4 px-4 text-sm font-semibold text-[#6B7280]">AI Alert Reason</th>
                    <th className="py-4 px-4 text-sm font-semibold text-[#6B7280] text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {flaggedReq.map((req) => (
                    <FlaggedTableRow 
                      key={req.id}
                      dept={req.studentName} event={req.title} reason={req.reason}
                      priority={req.priority} date={req.submittedOn} 
                      onClick={() => setSelectedRequest(req)}
                      onAccept={(e: any) => { e.stopPropagation(); updateRequest(req.id, "Approved"); }}
                      onReject={(e: any) => { e.stopPropagation(); updateRequest(req.id, "Rejected"); }}
                    />
                  ))}
                  {flaggedReq.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-gray-500 font-medium">No active escalations! 🎉</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "Announcements":
        return (
          <div className="glass-panel bg-white rounded-[2rem] p-8 min-h-[70vh]">
             <h2 className="text-2xl font-bold text-[#1E2A5A] mb-8">Global Announcements Control</h2>
             
             <div className="max-w-3xl mx-auto bg-gray-50/50 p-8 rounded-3xl border border-gray-100 mb-12">
               <div className="flex items-center gap-4 mb-6">
                 <div className="w-12 h-12 bg-[#EAF4FF] rounded-xl flex items-center justify-center text-[#5B8CFF]">
                   <Megaphone className="w-6 h-6" />
                 </div>
                 <div>
                   <h3 className="text-xl font-bold text-[#1E2A5A]">Create Global Announcement</h3>
                   <p className="text-sm text-gray-500">This will be broadcasted to all students and faculty.</p>
                 </div>
               </div>

               <form onSubmit={async (e) => {
                 e.preventDefault();
                 setIsSubmittingAnn(true);
                 const res = await fetch('/api/announcements', {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ 
                     title: newAnnTitle, 
                     content: newAnnContent, 
                     type: newAnnType, 
                     authorName: 'System Admin', 
                     targetYears: ['All Years'], 
                     targetBranches: ['All Branches'] 
                   })
                 });
                 if (res.ok) {
                   setNewAnnTitle("");
                   setNewAnnContent("");
                   fetchData();
                   alert("Global Announcement Broadcasted!");
                 }
                 setIsSubmittingAnn(false);
               }} className="space-y-4">
                 <div>
                   <label className="text-sm font-semibold text-[#1E2A5A] block mb-1">Alert Title</label>
                   <input 
                     type="text" required value={newAnnTitle} onChange={e => setNewAnnTitle(e.target.value)}
                     placeholder="e.g., Campus Closed for Holiday"
                     className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-[#5B8CFF] outline-none"
                   />
                 </div>
                 <div>
                   <label className="text-sm font-semibold text-[#1E2A5A] block mb-1">Message Body</label>
                   <textarea 
                     required value={newAnnContent} onChange={e => setNewAnnContent(e.target.value)}
                     placeholder="Type the full announcement content here..." rows={4}
                     className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-[#5B8CFF] outline-none resize-none"
                   ></textarea>
                 </div>
                 <div className="flex justify-end">
                   <button 
                     type="submit" 
                     disabled={isSubmittingAnn}
                     className="px-8 py-3 bg-gradient-to-r from-[#5B8CFF] to-[#7C6CFF] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                   >
                     {isSubmittingAnn ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4"/> Broadcast to Campus</>}
                   </button>
                 </div>
               </form>
             </div>

             <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h3 className="text-xl font-bold text-[#1E2A5A]">Recent Broadcasts</h3>
                  <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 w-full sm:w-80">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      value={announcementSearch}
                      onChange={(e) => setAnnouncementSearch(e.target.value)}
                      placeholder="Search broadcasts..." 
                      className="bg-transparent outline-none flex-1 text-sm text-[#1E2A5A]" 
                    />
                    {announcementSearch && (
                      <button onClick={() => setAnnouncementSearch("")} className="text-xs text-gray-400 hover:text-gray-600">
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  {announcements
                    .filter((a: any) => 
                      !announcementSearch ||
                      a.title?.toLowerCase().includes(announcementSearch.toLowerCase()) ||
                      a.content?.toLowerCase().includes(announcementSearch.toLowerCase()) ||
                      a.type?.toLowerCase().includes(announcementSearch.toLowerCase())
                    )
                    .map((a:any) => (
                      <div key={a.id} className="p-5 bg-white border border-gray-100 rounded-2xl flex gap-5">
                        <div className="w-12 h-12 rounded-full bg-[#EAF4FF] flex items-center justify-center shrink-0 text-[#5B8CFF]">
                          <Megaphone className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-[#1E2A5A]">{a.title}</h4>
                          <p className="text-sm text-[#6B7280] mt-1">{a.content}</p>
                          <div className="flex items-center gap-3 mt-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            <span>{a.date}</span>
                            <span>•</span>
                            <span className="text-[#5B8CFF]">{a.type || 'Global'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  {announcements.length === 0 && <p className="text-center py-8 text-gray-500">No broadcasts found.</p>}
                </div>
              </div>
          </div>
        );

      case "Global Doubts & Q&A":
        const filteredDoubts = doubts.filter((item: any) =>
          !doubtSearch ||
          item.text?.toLowerCase().includes(doubtSearch.toLowerCase()) ||
          item.authorName?.toLowerCase().includes(doubtSearch.toLowerCase()) ||
          item.tags?.some((t: string) => t.toLowerCase().includes(doubtSearch.toLowerCase()))
        );

        return (
          <div className="glass-panel bg-white rounded-[2rem] p-8 min-h-[70vh]">
            <h2 className="text-2xl font-bold text-[#1E2A5A] mb-1">Global Q&A Moderation</h2>
            <p className="text-[#6B7280] text-sm mb-6">Review and moderate all campus-wide academic doubts.</p>
            
            <div className="flex items-center gap-3 mb-6 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
              <Search className="w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                value={doubtSearch}
                onChange={(e) => setDoubtSearch(e.target.value)}
                placeholder="Search forum questions by topic, text, or author..." 
                className="bg-transparent outline-none flex-1 text-sm text-[#1E2A5A]"
              />
              {doubtSearch && (
                <button onClick={() => setDoubtSearch("")} className="text-xs text-gray-400 hover:text-gray-600">
                  Clear
                </button>
              )}
            </div>

            <div className="space-y-6">
              {filteredDoubts.map((item: any) => {
                const commentCount = item.comments?.length || item.answers || 0;
                return (
                  <div key={item.id} className="p-6 border border-gray-100 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[#7C6CFF]"></div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-2">
                        {item.tags?.map((t: string) => <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded font-bold uppercase">{t}</span>)}
                      </div>
                      <button 
                        onClick={() => handleDeleteDoubt(item.id)}
                        className="text-xs font-bold text-red-500 hover:bg-red-50 px-2.5 py-1 rounded-lg transition-colors border border-red-100"
                      >
                        Delete Post
                      </button>
                    </div>
                    <h3 className="font-bold text-[#1E2A5A] text-lg mb-2">{item.text}</h3>
                    <div className="flex items-center justify-between text-sm text-gray-500 mt-4">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4" /> {commentCount} Answers</span>
                        <span className="flex items-center gap-1"><Heart className="w-4 h-4 text-red-400" /> {item.likes || 0} Likes</span>
                      </div>
                      <span className="font-semibold">Asked by {item.authorName}</span>
                    </div>
                  </div>
                );
              })}
              {filteredDoubts.length === 0 && (
                <p className="text-center py-8 text-gray-500 font-medium">No doubts matched your search.</p>
              )}
            </div>
          </div>
        );


      case "System Analytics":
        const studentsCount = usersList.filter((u: any) => u.role === 'Student').length;
        const facultyCount = usersList.filter((u: any) => u.role === 'Faculty').length;
        const adminCount = usersList.filter((u: any) => u.role === 'Admin').length;
        const totalRequestsCount = requests.length + facultyRequests.length;
        const totalAnswersCount = doubts.reduce((acc: number, d: any) => acc + (d.comments?.length || d.answers || 0), 0);

        const requestStatusData = [
          { name: 'Approved', count: approvedCount, fill: '#10B981' },
          { name: 'Pending', count: allPending.length, fill: '#F59E0B' },
          { name: 'Rejected', count: rejectedCount, fill: '#EF4444' },
          { name: 'AI Flagged', count: flaggedReq.length, fill: '#8B5CF6' }
        ];

        const userRolesData = [
          { name: 'Students', count: studentsCount, fill: '#7C6CFF' },
          { name: 'Faculty', count: facultyCount, fill: '#5B8CFF' },
          { name: 'Admins', count: adminCount, fill: '#1E2A5A' }
        ];

        const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthlyActivityData = MONTHS.map(month => {
          const count = [...requests, ...facultyRequests].filter(r => {
            const dateStr = (r.submittedOn || r.date || "").toLowerCase();
            return dateStr.includes(month.toLowerCase());
          }).length;
          return { name: month, count };
        });

        return (
          <div className="glass-panel bg-white rounded-[2rem] p-8 min-h-[70vh]">
            <h2 className="text-2xl font-bold text-[#1E2A5A] mb-2 flex items-center gap-3">
              <Activity className="text-[#5B8CFF] w-7 h-7" /> System Analytics Dashboard
            </h2>
            <p className="text-[#6B7280] text-sm mb-8">Live statistics computed from real database records.</p>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <div className="p-6 border border-gray-100 rounded-[2rem] bg-gradient-to-b from-white to-gray-50 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-[#EDE9FE] text-[#7C6CFF] flex items-center justify-center mb-4">
                  <Users className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Total Registered Users</p>
                <p className="text-3xl font-black text-[#1E2A5A] mt-1">{usersList.length}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {studentsCount} Students • {facultyCount} Faculty • {adminCount} Admins
                </p>
              </div>

              <div className="p-6 border border-gray-100 rounded-[2rem] bg-gradient-to-b from-white to-gray-50 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-[#EAF4FF] text-[#5B8CFF] flex items-center justify-center mb-4">
                  <PieChart className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Total Permission Requests</p>
                <p className="text-3xl font-black text-[#1E2A5A] mt-1">{totalRequestsCount}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {approvedCount} Approved • {allPending.length} Pending • {rejectedCount} Rejected
                </p>
              </div>

              <div className="p-6 border border-gray-100 rounded-[2rem] bg-gradient-to-b from-white to-gray-50 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-4">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">AI Flagged Escalations</p>
                <p className="text-3xl font-black text-red-600 mt-1">{flaggedReq.length}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {flaggedReq.length > 0 ? "High-priority items requiring action" : "No pending high-priority items"}
                </p>
              </div>

              <div className="p-6 border border-gray-100 rounded-[2rem] bg-gradient-to-b from-white to-gray-50 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                  <Megaphone className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Campus Communications</p>
                <p className="text-3xl font-black text-[#1E2A5A] mt-1">{announcements.length}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {announcements.length} Announcements • {doubts.length} Doubts ({totalAnswersCount} Replies)
                </p>
              </div>
            </div>

            {/* Real Data Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Requests by Status */}
              <div className="p-8 border border-gray-100 rounded-[2rem] bg-white shadow-sm">
                <h3 className="text-lg font-bold text-[#1E2A5A] mb-1">Permission Requests Breakdown</h3>
                <p className="text-xs text-gray-500 mb-6">Real volume of requests categorized by current status</p>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={requestStatusData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} allowDecimals={false} />
                      <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'}} />
                      <Bar dataKey="count" radius={[10, 10, 0, 0]}>
                        {requestStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* User Roles Breakdown */}
              <div className="p-8 border border-gray-100 rounded-[2rem] bg-white shadow-sm">
                <h3 className="text-lg font-bold text-[#1E2A5A] mb-1">User Distribution by Role</h3>
                <p className="text-xs text-gray-500 mb-6">Actual count of registered members in database</p>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={userRolesData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} allowDecimals={false} />
                      <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'}} />
                      <Bar dataKey="count" radius={[10, 10, 0, 0]}>
                        {userRolesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Monthly Activity Chart */}
            <div className="p-8 border border-gray-100 rounded-[2rem] bg-white shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-[#1E2A5A]">Monthly Campus Request Flow</h3>
                  <p className="text-xs text-gray-500">Distribution of requests received across the calendar year</p>
                </div>
                <span className="text-xs font-bold text-[#5B8CFF] bg-[#EAF4FF] px-3 py-1 rounded-lg">
                  {totalRequestsCount} Total Requests
                </span>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyActivityData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} allowDecimals={false} />
                    <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'}} />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {monthlyActivityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.count > 0 ? '#5B8CFF' : '#E5E7EB'} />
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
            <h2 className="text-2xl font-bold text-[#1E2A5A] mb-8">Administrator Profile</h2>
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
                    <label className="text-xs font-bold text-[#5B8CFF] uppercase tracking-wider block mb-1">Admin Name</label>
                    <p className="text-lg font-bold text-[#1E2A5A]">{user.name}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <label className="text-xs font-bold text-[#5B8CFF] uppercase tracking-wider block mb-1">System Email</label>
                    <p className="text-lg font-bold text-[#1E2A5A]">{user.email}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <label className="text-xs font-bold text-[#5B8CFF] uppercase tracking-wider block mb-1">Access Level</label>
                    <p className="text-lg font-bold text-[#1E2A5A]">Root / SuperAdmin</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "Global Settings":
        return (
          <div className="glass-panel bg-white rounded-[2rem] p-8 min-h-[70vh] max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-[#1E2A5A] mb-8">Global Platform Settings</h2>
            <div className="space-y-6">
              <div className="p-6 border border-gray-100 rounded-2xl bg-white shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-[#1E2A5A] text-lg">Maintenance Mode</h3>
                  <p className="text-sm text-gray-500 mt-1">Lock all students and faculty out of the portal during upgrades.</p>
                </div>
                <button 
                  onClick={() => setSettings(prev => ({...prev, maintenanceMode: !prev.maintenanceMode}))}
                  className={`w-14 h-7 rounded-full relative transition-colors duration-200 ${settings.maintenanceMode ? 'bg-[#EF4444]' : 'bg-gray-200'}`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full absolute top-0.5 shadow-sm transition-all duration-200 ${settings.maintenanceMode ? 'right-0.5' : 'left-0.5'}`}></div>
                </button>
              </div>
              <div className="p-6 border border-gray-100 rounded-2xl bg-white shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-[#1E2A5A] text-lg">AI Auto-Moderation</h3>
                  <p className="text-sm text-gray-500 mt-1">Automatically delete toxic or inappropriate messages from Universal Chat.</p>
                </div>
                <button 
                  onClick={() => setSettings(prev => ({...prev, aiModeration: !prev.aiModeration}))}
                  className={`w-14 h-7 rounded-full relative transition-colors duration-200 ${settings.aiModeration ? 'bg-green-500' : 'bg-gray-200'}`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full absolute top-0.5 shadow-sm transition-all duration-200 ${settings.aiModeration ? 'right-0.5' : 'left-0.5'}`}></div>
                </button>
              </div>
              <div className="p-6 border border-gray-100 rounded-2xl bg-white shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-[#1E2A5A] text-lg">Enforce 2FA</h3>
                  <p className="text-sm text-gray-500 mt-1">Require Two-Factor Authentication for all Admin and Faculty logins.</p>
                </div>
                <button 
                  onClick={() => setSettings(prev => ({...prev, enforce2FA: !prev.enforce2FA}))}
                  className={`w-14 h-7 rounded-full relative transition-colors duration-200 ${settings.enforce2FA ? 'bg-[#5B8CFF]' : 'bg-gray-200'}`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full absolute top-0.5 shadow-sm transition-all duration-200 ${settings.enforce2FA ? 'right-0.5' : 'left-0.5'}`}></div>
                </button>
              </div>

              <div className="pt-10">
                <button 
                  onClick={() => {
                    localStorage.setItem("settings_admin", JSON.stringify(settings));
                    alert("Platform Configuration Saved Successfully!");
                  }}
                  className="w-full py-4 bg-[#1E2A5A] text-white font-bold rounded-2xl shadow-xl hover:bg-[#2A3B7D] transition-all"
                >
                  Save System Configuration
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
          <span className="text-xs font-semibold text-[#5B8CFF] tracking-wider uppercase ml-10">Admin Portal</span>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          <NavItem icon={LayoutDashboard} label="Dashboard" active={activeTab === "Dashboard"} onClick={() => setActiveTab("Dashboard")} />
          <NavItem icon={UserCog} label="Manage Users" active={activeTab === "Manage Users"} onClick={() => setActiveTab("Manage Users")} />
          <NavItem icon={FileText} label="All Requests" active={activeTab === "All Requests"} onClick={() => setActiveTab("All Requests")} />
          <NavItem icon={ShieldAlert} label="Flagged by AI" active={activeTab === "Flagged by AI"} onClick={() => setActiveTab("Flagged by AI")} />
          <NavItem icon={Megaphone} label="Announcements" active={activeTab === "Announcements"} onClick={() => setActiveTab("Announcements")} />
          <NavItem icon={HelpCircle} label="Global Doubts & Q&A" active={activeTab === "Global Doubts & Q&A"} onClick={() => setActiveTab("Global Doubts & Q&A")} />
          <NavItem icon={BarChart3} label="System Analytics" active={activeTab === "System Analytics"} onClick={() => setActiveTab("System Analytics")} />
          
          <div className="pt-6 pb-2">
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Account</p>
          </div>
          <NavItem icon={LayoutDashboard} label="Profile" active={activeTab === "Profile"} onClick={() => setActiveTab("Profile")} />
          <div className="pt-2 pb-2">
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">System</p>
          </div>
          <NavItem icon={Settings} label="Global Settings" active={activeTab === "Global Settings"} onClick={() => setActiveTab("Global Settings")} />
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
            <h1 className="text-2xl font-bold text-[#1E2A5A]">{activeTab === "Dashboard" ? `Welcome back, ${user.name} 👋` : activeTab}</h1>
            <p className="text-sm text-[#6B7280]">
              {activeTab === "Dashboard" ? "Here's an overview of campus-wide activities and requests." : "Administrator Console"}
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
        
        {/* BOTTOM INFO BAR */}
        <div className="bg-white border-t border-[#EAF4FF] px-8 py-3 flex items-center justify-center gap-2 z-30">
          <Lightbulb className="w-4 h-4 text-orange-400" />
          <p className="text-xs text-[#6B7280] font-medium">
            <span className="text-[#1E2A5A] font-bold">💡 Tip:</span> Use System Analytics to monitor server load during exam periods.
          </p>
        </div>
      </main>

      {/* Request Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden relative">
            <div className="absolute right-[-10%] top-[-10%] w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50"></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-[#EAF4FF] rounded-2xl flex items-center justify-center text-[#5B8CFF]">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-[#1E2A5A] tracking-tight">{selectedRequest.title || selectedRequest.type}</h2>
                    <p className="text-sm text-[#6B7280] font-medium mt-1 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Submitted by <span className="text-[#1E2A5A] font-bold">{selectedRequest.studentName || selectedRequest.name}</span>
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelectedRequest(null)} className="p-2 bg-gray-50 text-gray-400 hover:text-red-500 rounded-full transition-colors"><X className="w-6 h-6" /></button>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                  <h4 className="text-xs font-black text-[#5B8CFF] uppercase tracking-widest mb-3">Permission Description / Reason</h4>
                  <p className="text-[#1E2A5A] leading-relaxed font-medium">{selectedRequest.reason || "No detailed description provided."}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Status</p>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase ${
                      selectedRequest.status === 'Approved' ? 'bg-green-100 text-green-700' :
                      selectedRequest.status === 'Pending' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                    }`}>{selectedRequest.status}</span>
                  </div>
                  <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Date</p>
                    <p className="text-sm font-bold text-[#1E2A5A]">{selectedRequest.submittedOn || selectedRequest.date}</p>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-gray-100">
                  {selectedRequest.status === 'Pending' ? (
                    <>
                      <button 
                        onClick={() => { updateRequest(selectedRequest.id, "Approved"); setSelectedRequest(null); }}
                        className="flex-1 py-4 bg-green-500 text-white font-black rounded-2xl shadow-lg shadow-green-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                      >
                        <Check className="w-5 h-5" /> Approve Request
                      </button>
                      <button 
                        onClick={() => { updateRequest(selectedRequest.id, "Rejected"); setSelectedRequest(null); }}
                        className="flex-1 py-4 bg-red-50 text-red-500 font-black rounded-2xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        <X className="w-5 h-5" /> Reject
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => setSelectedRequest(null)}
                      className="w-full py-4 bg-[#1E2A5A] text-white font-black rounded-2xl hover:bg-[#2A3B7D] transition-all"
                    >
                      Close Details
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-[#1E2A5A]">Add New User</h2>
              <button onClick={() => setIsAddUserModalOpen(false)} className="p-2 text-gray-400 hover:text-red-500 rounded-full transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <p className="text-sm text-[#6B7280] mb-6">Create credentials and profile for a student or faculty member.</p>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#1E2A5A] uppercase tracking-wider block mb-1">Full Name</label>
                <input 
                  type="text" required value={newUserName} onChange={e => setNewUserName(e.target.value)}
                  placeholder="e.g. Jane Doe" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#5B8CFF]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#1E2A5A] uppercase tracking-wider block mb-1">Email</label>
                <input 
                  type="email" required value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)}
                  placeholder="e.g. user@college.edu" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#5B8CFF]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#1E2A5A] uppercase tracking-wider block mb-1">Password</label>
                <input 
                  type="password" required value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)}
                  placeholder="••••••••" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#5B8CFF]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#1E2A5A] uppercase tracking-wider block mb-1">Role</label>
                  <select 
                    value={newUserRole} onChange={e => setNewUserRole(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#5B8CFF]"
                  >
                    <option value="Student">Student</option>
                    <option value="Faculty">Faculty</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#1E2A5A] uppercase tracking-wider block mb-1">Department / Info</label>
                  <input 
                    type="text" value={newUserDept} onChange={e => setNewUserDept(e.target.value)}
                    placeholder="e.g. CSE - 2nd Year" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#5B8CFF]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#1E2A5A] uppercase tracking-wider block mb-1">User ID / Roll No (Optional)</label>
                  <input 
                    type="text" value={newUserId} onChange={e => setNewUserId(e.target.value)}
                    placeholder="e.g. 2023CS0192 or FAC_081" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#5B8CFF]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#1E2A5A] uppercase tracking-wider block mb-1">Profile Pic URL / String (Optional)</label>
                  <input 
                    type="text" value={newUserAvatar} onChange={e => setNewUserAvatar(e.target.value)}
                    placeholder="https://... or avatar name" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#5B8CFF]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsAddUserModalOpen(false)} className="px-6 py-2.5 rounded-xl font-semibold text-gray-500 hover:bg-gray-100">Cancel</button>
                <button type="submit" disabled={isSubmittingUser} className="px-6 py-2.5 rounded-xl bg-[#5B8CFF] text-white font-bold hover:bg-[#4A7BEE] flex items-center gap-2">
                  {isSubmittingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save User"}
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

function FlaggedTableRow({ dept, event, reason, priority, date, onAccept, onReject, onClick }: any) {
  return (
    <tr onClick={onClick} className="border-b border-gray-50 hover:bg-red-50/30 transition-colors group cursor-pointer">
      <td className="py-4 px-4 font-semibold text-[#1E2A5A]">{dept}</td>
      <td className="py-4 px-4 text-[#1E2A5A]">{event}</td>
      <td className="py-4 px-4 text-red-500 font-medium text-xs max-w-[200px] truncate">{reason}</td>
      <td className="py-4 px-4 text-right">
        <div className="flex items-center justify-end gap-2">
          {onAccept && (
            <button onClick={onAccept} className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors border border-green-100">
              <Check className="w-4 h-4" />
            </button>
          )}
          {onReject && (
            <button onClick={onReject} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors border border-red-100">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function StandardTableRow({ name, type, date, dept, status, onAccept, onReject, onClick }: any) {
  const getStatusColor = (s: string) => {
    if (s === "Approved") return "bg-green-100 text-green-700";
    if (s === "Pending") return "bg-orange-100 text-orange-700";
    return "bg-red-100 text-red-700";
  };

  return (
    <tr onClick={onClick} className="border-b border-gray-50 hover:bg-[#F7F8FF] transition-colors group cursor-pointer">
      <td className="py-4 px-4 font-semibold text-[#1E2A5A]">{name}</td>
      <td className="py-4 px-4 text-[#1E2A5A]">{type}</td>
      <td className="py-4 px-4 text-[#6B7280]">{date}</td>
      <td className="py-4 px-4">
        <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${getStatusColor(status)}`}>
          {status}
        </span>
      </td>
      <td className="py-4 px-4 text-right">
        <div className="flex items-center justify-end gap-2">
          {status === 'Pending' && onAccept && (
            <button onClick={onAccept} className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors border border-green-100">
              <Check className="w-4 h-4" />
            </button>
          )}
          {status === 'Pending' && onReject && (
            <button onClick={onReject} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors border border-red-100">
              <X className="w-4 h-4" />
            </button>
          )}
          {status !== 'Pending' && <span className="text-xs font-semibold text-gray-400 italic">No Action Needed</span>}
        </div>
      </td>
    </tr>
  );
}
