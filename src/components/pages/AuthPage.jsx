import { useState } from "react";
import { Globe, Zap, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { signIn } from "next-auth/react";

export default function AuthPage({ setPage }) {
  const [mode, setMode] = useState("login");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (mode === "register") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            name: `${firstName} ${lastName}`.trim(), 
            email, 
            password 
          }),
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.message || "Registration failed");
        }
        
        // Auto sign in after registration
        const signInRes = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });
        
        if (signInRes?.error) {
          throw new Error(signInRes.error);
        }
        
        setPage("home");
      } else if (mode === "login") {
        const res = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (res?.error) {
          throw new Error(res.error);
        }
        
        setPage("home");
      } else {
        // Mock forgot password
        await new Promise(r => setTimeout(r, 1000));
        setMode("login");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img
          src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=900&h=1200&fit=crop&auto=format"
          alt="Fashion"
          className="w-full h-full object-cover bg-muted"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background/80" />
        <div className="absolute bottom-16 left-12">
          <div className="flex items-center gap-1 mb-4">
            <span className="font-display text-3xl text-white">DRAPE</span>
            <span className="font-mono text-[11px] text-accent ml-1">®</span>
          </div>
          <p className="text-white/70 max-w-xs text-sm leading-relaxed">
            Premium fashion from the valleys of Nepal to the streets of London.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Logo mobile */}
          <div className="lg:hidden flex items-center justify-center gap-0 mb-8">
            <span className="font-display text-2xl">DRAPE</span>
            <span className="font-mono text-[9px] text-accent ml-0.5">®</span>
          </div>

          <h2 className="font-display text-3xl font-light mb-2">
            {mode === "login" ? "Welcome back" : mode === "register" ? "Create account" : "Reset password"}
          </h2>
          <p className="text-muted-foreground text-sm mb-8">
            {mode === "login" ? "Sign in to your DRAPE account" :
             mode === "register" ? "Join the DRAPE community" :
             "We'll send you a reset link"}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded">
              {error}
            </div>
          )}

          {/* Social login */}
          {mode !== "forgot" && (
            <div className="flex flex-col gap-3 mb-6">
              <button 
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 border border-border py-3 text-sm text-foreground hover:border-foreground/30 transition-colors disabled:opacity-50"
              >
                <Globe size={15} className="text-muted-foreground" />
                Continue with Google
              </button>
              <button disabled className="w-full flex items-center justify-center gap-3 border border-border py-3 text-sm text-foreground opacity-50 cursor-not-allowed transition-colors">
                <Zap size={15} className="text-muted-foreground" />
                Continue with Apple
              </button>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="font-mono text-[10px] text-muted-foreground">OR</span>
                <div className="flex-1 h-px bg-border" />
              </div>
            </div>
          )}

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === "register" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground block mb-2">First Name</label>
                  <input 
                    required 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-muted border border-border px-4 py-3 text-sm text-foreground outline-none focus:border-accent/50" 
                    placeholder="John" 
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground block mb-2">Last Name</label>
                  <input 
                    required 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-muted border border-border px-4 py-3 text-sm text-foreground outline-none focus:border-accent/50" 
                    placeholder="Doe" 
                  />
                </div>
              </div>
            )}
            <div>
              <label className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground block mb-2">Email</label>
              <input 
                required 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-muted border border-border px-4 py-3 text-sm text-foreground outline-none focus:border-accent/50" 
                placeholder="you@example.com" 
              />
            </div>
            {mode !== "forgot" && (
              <div>
                <div className="flex justify-between mb-2">
                  <label className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Password</label>
                  {mode === "login" && (
                    <button type="button" onClick={() => setMode("forgot")} className="font-mono text-[10px] text-accent hover:underline">Forgot?</button>
                  )}
                </div>
                <input 
                  required 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-muted border border-border px-4 py-3 text-sm text-foreground outline-none focus:border-accent/50" 
                  placeholder="••••••••" 
                />
              </div>
            )}
            {mode === "register" && (
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground block mb-2">Country</label>
                <select className="w-full bg-muted border border-border px-4 py-3 text-sm text-foreground outline-none focus:border-accent/50">
                  <option>United Kingdom</option>
                  <option>Nepal</option>
                  <option>Other</option>
                </select>
              </div>
            )}

            <Button variant="default" size="lg" className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : mode === "login" ? (
                <>Sign In <ArrowRight size={16} /></>
              ) : mode === "register" ? (
                <>Create Account <ArrowRight size={16} /></>
              ) : (
                <>Send Reset Link <ArrowRight size={16} /></>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {mode === "login" ? (
              <>Don&apos;t have an account? <button onClick={() => {setMode("register"); setError("");}} className="text-accent hover:underline">Sign up</button></>
            ) : mode === "register" ? (
              <>Already have an account? <button onClick={() => {setMode("login"); setError("");}} className="text-accent hover:underline">Sign in</button></>
            ) : (
              <><button onClick={() => {setMode("login"); setError("");}} className="text-accent hover:underline">Back to sign in</button></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
