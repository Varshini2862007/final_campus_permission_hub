"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Bot, Calendar, CheckCircle, GraduationCap, Users, LayoutDashboard, Lock, Mail, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState("Student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const rolePlaceholders: Record<string, string> = {
    Student: "student@college.edu",
    Faculty: "faculty@college.edu",
    Admin: "admin@college.edu",
  };

  const roles = [
    { name: "Student", icon: GraduationCap },
    { name: "Faculty", icon: Users },
    { name: "Admin", icon: LayoutDashboard },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        setIsLoading(false);
        return;
      }

      // Save user to local storage for demo purposes
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect based on role
      if (role === "Student") router.push("/dashboard/student");
      else if (role === "Faculty") router.push("/dashboard/faculty");
      else if (role === "Admin") router.push("/dashboard/admin");
      
    } catch (err) {
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F7F8FF] p-4 md:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-7xl h-full min-h-[90vh] flex flex-col lg:flex-row rounded-[2rem] overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] bg-white">
        
        {/* Left Side - Branding & Info */}
        <div className="w-full lg:w-1/2 relative bg-gradient-to-br from-[#EDE9FE] via-[#EAF4FF] to-[#EDE9FE] p-10 lg:p-14 flex flex-col justify-between overflow-hidden">
          {/* Abstract background shapes */}
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#C4B5FD] opacity-20 blur-3xl"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#5B8CFF] opacity-10 blur-3xl"></div>

          {/* Header */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#5B8CFF] to-[#7C6CFF] flex items-center justify-center shadow-lg">
                <GraduationCap className="text-white w-6 h-6" />
              </div>
              <span className="text-2xl font-bold text-[#1E2A5A] tracking-tight">CampusConnect</span>
            </div>

            <h1 className="text-4xl lg:text-5xl font-extrabold text-[#1E2A5A] leading-[1.15] mb-6 tracking-tight">
              Smart Campus, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5B8CFF] to-[#7C6CFF]">
                Stronger Community
              </span>
            </h1>
            <p className="text-[#6B7280] text-lg max-w-md leading-relaxed">
              Seamlessly manage permissions, stay updated with smart announcements, resolve doubts, and leverage AI-powered learning.
            </p>
          </div>

          {/* Illustration Center */}
          <div className="relative z-10 flex-1 flex items-center justify-center my-10">
            <div className="relative w-full max-w-md aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/40 group">
              {/* Fallback to external image for stunning flat-style placeholder */}
              <img 
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1000&auto=format&fit=crop" 
                alt="Students collaborating" 
                className="object-cover w-full h-full transform transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1E2A5A]/40 to-transparent"></div>
              
              {/* Floating Icons */}
              <div className="absolute top-4 left-4 bg-white/90 p-2.5 rounded-xl shadow-lg backdrop-blur-md animate-bounce" style={{ animationDuration: '3s' }}>
                <Bell className="w-5 h-5 text-[#5B8CFF]" />
              </div>
              <div className="absolute bottom-4 right-4 bg-white/90 p-2.5 rounded-xl shadow-lg backdrop-blur-md animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
                <Bot className="w-5 h-5 text-[#7C6CFF]" />
              </div>
              <div className="absolute top-1/2 -right-4 bg-white/90 p-2.5 rounded-xl shadow-lg backdrop-blur-md animate-pulse">
                <CheckCircle className="w-5 h-5 text-[#22C55E]" />
              </div>
            </div>
          </div>

          {/* Bottom Features */}
          <div className="relative z-10 grid grid-cols-3 gap-4">
            <div className="glass-panel rounded-2xl p-4 flex flex-col items-center text-center transition-transform hover:-translate-y-1">
              <div className="w-10 h-10 rounded-full bg-[#EAF4FF] flex items-center justify-center mb-3">
                <CheckCircle className="w-5 h-5 text-[#5B8CFF]" />
              </div>
              <span className="text-sm font-semibold text-[#1E2A5A]">Easy Permissions</span>
            </div>
            <div className="glass-panel rounded-2xl p-4 flex flex-col items-center text-center transition-transform hover:-translate-y-1">
              <div className="w-10 h-10 rounded-full bg-[#EDE9FE] flex items-center justify-center mb-3">
                <Bell className="w-5 h-5 text-[#7C6CFF]" />
              </div>
              <span className="text-sm font-semibold text-[#1E2A5A]">Smart Updates</span>
            </div>
            <div className="glass-panel rounded-2xl p-4 flex flex-col items-center text-center transition-transform hover:-translate-y-1">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center mb-3">
                <Bot className="w-5 h-5 text-orange-500" />
              </div>
              <span className="text-sm font-semibold text-[#1E2A5A]">AI Assistance</span>
            </div>
          </div>
        </div>

        {/* Right Side - Login */}
        <div className="w-full lg:w-1/2 bg-white p-8 lg:p-14 flex items-center justify-center relative">
          <div className="w-full max-w-md">
            
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-[#1E2A5A] mb-2 tracking-tight">Welcome Back!</h2>
              <p className="text-[#6B7280]">Login to your account to continue</p>
            </div>

            {/* Role Selection */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {roles.map((r) => {
                const Icon = r.icon;
                const isSelected = role === r.name;
                return (
                  <button
                    key={r.name}
                    onClick={() => {
                      setRole(r.name);
                    }}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-300 border-2 ${
                      isSelected 
                        ? "border-[#5B8CFF] bg-[#EAF4FF] shadow-[0_0_20px_rgba(91,140,255,0.2)]" 
                        : "border-gray-100 bg-gray-50 hover:bg-gray-100 text-[#6B7280]"
                    }`}
                  >
                    <Icon className={`w-6 h-6 mb-2 ${isSelected ? "text-[#5B8CFF]" : "text-[#6B7280]"}`} />
                    <span className={`text-sm font-semibold ${isSelected ? "text-[#5B8CFF]" : "text-[#6B7280]"}`}>
                      {r.name}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Login Form */}
            <form className="space-y-5" onSubmit={handleLogin}>
              
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-semibold text-[#1E2A5A] ml-1">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input 
                    type="text" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder={rolePlaceholders[role] || "student@college.edu"}
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#5B8CFF] focus:ring-4 focus:ring-[#5B8CFF]/10 transition-all outline-none text-[#1E2A5A] placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-[#1E2A5A] ml-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#5B8CFF] focus:ring-4 focus:ring-[#5B8CFF]/10 transition-all outline-none text-[#1E2A5A] placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end pt-1">
                <button 
                  type="button"
                  onClick={() => alert("please contact your operator")}
                  className="text-sm font-semibold text-[#5B8CFF] hover:text-[#7C6CFF] transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-4 mt-4 rounded-xl bg-gradient-to-r from-[#5B8CFF] to-[#7C6CFF] text-white font-bold text-lg shadow-[0_10px_25px_rgba(91,140,255,0.4)] hover:shadow-[0_15px_35px_rgba(91,140,255,0.5)] transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Upcoming Opportunities Card */}
            <div className="mt-10 p-4 rounded-2xl bg-gradient-to-br from-[#EAF4FF] to-white border border-[#EAF4FF] shadow-sm flex items-start gap-4">
              <div className="p-3 rounded-xl bg-[#5B8CFF]/10">
                <Calendar className="w-6 h-6 text-[#5B8CFF]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#1E2A5A] mb-1">Upcoming Opportunities</h4>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  CodeFest 2024 Hackathon registrations close in 2 days. Don't miss out!
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
