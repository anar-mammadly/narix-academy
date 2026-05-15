"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Xəta baş verdi"); return; }
      router.push(data.role === "TEACHER" ? "/admin" : "/dashboard");
    } catch {
      setError("Serverlə əlaqə yaradıla bilmədi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #eff6ff 0%, #f0f9ff 50%, #ecfdf5 100%)" }}>

      {/* Animated background blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-200 rounded-full opacity-30 blur-3xl float" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-cyan-200 rounded-full opacity-30 blur-3xl float" style={{animationDelay:"1.5s"}} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-100 rounded-full opacity-20 blur-3xl float" style={{animationDelay:"0.75s"}} />
      </div>

      <div className="relative w-full max-w-sm slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 mb-4 shadow-xl float">
            <GraduationCap size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Narix Academy</h1>
          <p className="text-muted text-sm mt-1">Manual QA üzrə professional platform</p>
        </div>

        {/* Card */}
        <div className="card p-7 shadow-xl border-0" style={{boxShadow:"0 20px 60px rgb(0 0 0 / 0.1), 0 1px 3px rgb(0 0 0 / 0.05)"}}>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Xoş gəldiniz 👋</h2>
          <p className="text-sm text-muted mb-6">Hesabınıza daxil olun</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">E-poçt</label>
              <input type="email" className="input" placeholder="siz@example.com"
                value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div>
              <label className="label">Şifrə</label>
              <div className="relative">
                <input type={showPass ? "text" : "password"} className="input pr-12"
                  placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600 scale-in flex items-center gap-2">
                <span className="shrink-0">⚠️</span> {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full btn-lg mt-2" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Giriş edilir...
                </span>
              ) : "Daxil ol →"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted mt-6">Narix Academy © 2026</p>
      </div>
    </div>
  );
}
