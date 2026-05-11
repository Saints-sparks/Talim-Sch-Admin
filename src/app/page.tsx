"use client";

import Image from "next/legacy/image";
import { useState } from "react";
import { Eye, EyeOff, ShieldAlert, AlertCircle, Loader2 } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ModernLoader from "@/components/ModernLoader";
import treelogo from "../../public/img/treelogo.svg";
import loginImage from "../../public/img/Education-rafiki 1.svg";

type LoginError =
  | { kind: "access_denied"; message: string }
  | { kind: "invalid_credentials" }
  | { kind: "unknown"; message: string };

export default function SignIn() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<LoginError | null>(null);
  const [keepSignedIn, setKeepSignedIn] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError(null);
    setLoading(true);

    try {
      const success = await login(email, password, keepSignedIn);
      if (success) {
        // Server flag (from introspect) is authoritative; fall back to localStorage
        const userRaw = localStorage.getItem("user");
        const userData = userRaw ? JSON.parse(userRaw) : null;

        if (userData?.onboardingCompleted) {
          router.push("/dashboard");
        } else {
          // Check localStorage onboarding state as fallback
          const schoolId = typeof userData?.schoolId === "string"
            ? userData.schoolId
            : userData?.schoolId?._id ?? null;
          const onboardingRaw = schoolId ? localStorage.getItem(`onboarding_${schoolId}`) : null;
          const onboardingState = onboardingRaw ? JSON.parse(onboardingRaw) : null;
          router.push(onboardingState?.phase1Completed ? "/dashboard" : "/onboarding");
        }
      }
    } catch (err: any) {
      const msg: string = err.message || "";
      if (msg.toLowerCase().includes("access denied") || msg.toLowerCase().includes("registered as")) {
        setLoginError({ kind: "access_denied", message: msg });
      } else if (
        msg.toLowerCase().includes("incorrect") ||
        msg.toLowerCase().includes("invalid") ||
        msg.toLowerCase().includes("credentials")
      ) {
        setLoginError({ kind: "invalid_credentials" });
      } else {
        setLoginError({ kind: "unknown", message: msg || "An unexpected error occurred. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <ModernLoader visible={loading} />
      {/* ── Left panel — Form ── */}
      <div className="flex flex-col justify-center items-center px-8 py-12 sm:px-16 bg-white">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <Image
              src={treelogo}
              alt="Talim Logo"
              width={40}
              height={40}
              className="h-10 w-10"
            />
            <span className="text-xl font-bold text-[#030E18]">Talim</span>
            <span className="ml-0.5 rounded-full bg-[#EAF2FB] px-2.5 py-0.5 text-xs font-semibold text-[#003366]">
              School Admin
            </span>
          </div>

          <h1 className="text-2xl font-bold text-[#030E18]">Welcome back</h1>
          <p className="mt-1 text-sm text-[#6F6F6F]">
            Sign in to the School Administrator portal
          </p>

          {/* RBAC / Access denied banner */}
          {loginError?.kind === "access_denied" && (
            <div className="mt-6 rounded-xl border border-red-100 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                <div>
                  <p className="text-sm font-semibold text-red-700">Access denied</p>
                  <p className="mt-1 text-xs text-red-600 leading-relaxed">
                    {loginError.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Invalid credentials banner */}
          {loginError?.kind === "invalid_credentials" && (
            <div className="mt-6 rounded-xl border border-amber-100 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <p className="text-sm text-amber-700">
                  Incorrect email or password. Please double-check your credentials and try again.
                </p>
              </div>
            </div>
          )}

          {/* Unknown error banner */}
          {loginError?.kind === "unknown" && (
            <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-gray-500" />
                <p className="text-sm text-gray-600">{loginError.message}</p>
              </div>
            </div>
          )}

          <form className="mt-8 space-y-5" onSubmit={handleFormSubmit}>
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-[#030E18]">
                Email address
              </label>
              <input
                type="email"
                id="email"
                placeholder="you@school.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full h-10 px-3 border border-[#E5E7EB] bg-[#F9FAFB] rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003366]/30 focus:border-[#003366] transition-all"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-[#030E18]">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full h-10 px-3 pr-10 border border-[#E5E7EB] bg-[#F9FAFB] rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003366]/30 focus:border-[#003366] transition-all"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember me + Forgot */}
            <div className="flex items-center justify-between">
              <Tooltip content="Stays signed in for 30 days. Uncheck on shared devices." side="right">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={keepSignedIn}
                  onChange={(e) => setKeepSignedIn(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[#003366] focus:ring-[#003366]"
                />
                Keep me signed in
              </label>
              </Tooltip>
              <a
                href="/forgot-password"
                className="text-sm text-[#003366] hover:underline"
              >
                Forgot password?
              </a>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#003366] hover:bg-[#002244] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <p className="mt-10 text-center text-xs text-gray-400">
            © Talim {new Date().getFullYear()} ·{" "}
            <a href="mailto:help@talim.com" className="hover:underline text-[#003366]">
              help@talim.com
            </a>
          </p>
        </div>
      </div>

      {/* ── Right panel — Blue brand panel ── */}
      <div className="hidden lg:flex flex-col items-center justify-center bg-[#003366] p-12">
        <div className="relative w-full max-w-md aspect-square opacity-90">
          <Image
            src={loginImage}
            alt="School admin illustration"
            layout="fill"
            objectFit="contain"
          />
        </div>
        <div className="mt-8 text-center">
          <p className="text-xl font-bold text-white">School Admin Portal</p>
          <p className="mt-2 text-sm text-white/70 max-w-xs leading-relaxed">
            Manage your school, staff, students, and curriculum from one place.
          </p>
        </div>
        {/* Decorative dots */}
        <div className="mt-10 flex gap-2">
          <div className="h-2 w-8 rounded-full bg-white/60" />
          <div className="h-2 w-2 rounded-full bg-white/30" />
          <div className="h-2 w-2 rounded-full bg-white/30" />
        </div>
      </div>
    </div>
  );
}
