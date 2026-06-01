import React, { useState } from "react";
import { Lock, Mail, Phone, Eye, EyeOff, Truck, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface LoginPageProps {
  onLogin: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Simulate slight network delay for premium loader experience
    setTimeout(() => {
      const cleanIdentifier = identifier.trim();
      const cleanPassword = password.trim();

      const isValidUser =
        cleanIdentifier === "amsfairoze@gmail.com" || cleanIdentifier === "9842798626";
      const isValidPassword = cleanPassword === "Fairoze@1517";

      if (isValidUser && isValidPassword) {
        localStorage.setItem("ams_auth", "true");
        localStorage.setItem("ams_user_email", "amsfairoze@gmail.com");
        localStorage.setItem("ams_user_phone", "9842798626");
        toast.success("Welcome back, Fairoze! Authentication successful.");
        onLogin();
      } else {
        setError("Invalid credentials. Please verify email/phone and password.");
        toast.error("Authentication failed. Invalid credentials.");
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#070b19] px-4 font-sans text-foreground">
      {/* Decorative animated mesh gradients in the background */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-[#1e40af]/20 blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-[#f97316]/10 blur-[120px] animate-pulse" style={{ animationDuration: '6s' }} />
      <div className="absolute top-[30%] right-[20%] h-[300px] w-[300px] rounded-full bg-[#14b8a6]/10 blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />

      {/* Futuristic grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-[0.2]" />

      <div className="relative w-full max-w-[450px] animate-fade-in">
        {/* Glowing border ring effect around the card */}
        <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-[#1e40af] via-[#38bdf8] to-[#f97316] opacity-30 blur-md transition duration-1000 group-hover:opacity-100" />
        
        {/* Main card body with glassmorphism */}
        <div className="relative rounded-2xl border border-white/10 bg-[#0f172a]/80 p-8 shadow-2xl backdrop-blur-xl md:p-10">
          
          {/* Logo / Header Section */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1e40af] to-[#38bdf8] shadow-lg shadow-[#1e40af]/30 mb-4 animate-bounce-slow">
              <Truck className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
              AMS <span className="text-[#38bdf8]">TRANSPORTS</span>
            </h1>
            <p className="mt-1.5 text-xs uppercase tracking-[0.2em] text-[#f97316] font-semibold">
              Fleet Command Centre
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Display error if invalid credentials */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive-foreground animate-shake">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Email/Phone Input Field */}
            <div className="space-y-1.5">
              <Label htmlFor="identifier" className="text-xs font-semibold text-muted-foreground">
                Email Address or Phone Number
              </Label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground/75">
                  <Mail className="h-4 w-4" />
                </div>
                <Input
                  id="identifier"
                  type="text"
                  required
                  placeholder="Email/Phone"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="h-11 pl-10 bg-muted/30 border-white/10 text-white placeholder-muted-foreground/60 focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]/50 rounded-xl transition-all font-medium text-sm"
                />
              </div>
            </div>

            {/* Password Input Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-muted-foreground">
                  Secure Password
                </Label>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground/75">
                  <Lock className="h-4 w-4" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pl-10 pr-10 bg-muted/30 border-white/10 text-white placeholder-muted-foreground/60 focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]/50 rounded-xl transition-all font-medium text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground/75 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me / Security Badge */}
            <div className="flex items-center justify-between text-xs py-1">
              <div className="flex items-center gap-2 text-muted-foreground font-medium">
                <ShieldCheck className="h-4 w-4 text-[#14b8a6]" />
                <span>Authorized Session Only</span>
              </div>
            </div>

            {/* Login Submission Button */}
            <Button
              type="submit"
              disabled={loading}
              className="relative w-full h-11 bg-gradient-to-r from-[#1e40af] to-[#38bdf8] hover:from-[#1d4ed8] hover:to-[#0284c7] text-white font-semibold rounded-xl shadow-lg shadow-[#1e40af]/20 transition-all active:scale-[0.98] duration-150 flex items-center justify-center overflow-hidden"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Verifying Session...</span>
                </div>
              ) : (
                <span>Access Command Centre</span>
              )}
            </Button>
          </form>
          
          <div className="mt-8 text-center text-[10px] text-muted-foreground/60 font-semibold tracking-wider uppercase">
            AMS TRANSPORTS LOGISTICS GROUP &copy; {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </div>
  );
}
