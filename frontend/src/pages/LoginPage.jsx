import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  Loader2,
  Heart,
  Activity,
  Stethoscope,
  Shield,
} from "lucide-react";

const FEATURES = [
  {
    icon: Heart,
    title: "Patient Management",
    description: "Comprehensive electronic health records",
  },
  {
    icon: Activity,
    title: "Appointment Scheduling",
    description: "Intelligent provider scheduling",
  },
  {
    icon: Stethoscope,
    title: "Clinical Workflows",
    description: "End-to-end encounter management",
  },
];

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isAuthLoading, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || "Failed to login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 overflow-hidden lg:flex lg:flex-col lg:justify-between theme-hero-gradient">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative z-10 p-12">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
              <span className="text-lg font-bold text-white">H</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">HMS</h1>
              <p className="text-xs text-white/50">Hospital Management System</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 px-12 pb-16">
          <h2 className="mb-3 text-3xl font-bold leading-tight text-white">
            Healthcare operations,
            <br />
            simplified.
          </h2>
          <p className="mb-10 max-w-sm text-sm leading-relaxed text-white/60">
            A secure clinical platform for managing patients, appointments,
            billing, and care workflows across your facility.
          </p>

          <div className="space-y-5">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/10">
                  <Icon className="h-4 w-4 text-white/80" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{title}</h3>
                  <p className="text-xs text-white/50">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Login form */}
      <div className="flex flex-1 items-center justify-center bg-background p-6 sm:p-10">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <span className="text-lg font-bold text-white">H</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">HMS</h1>
                <p className="text-xs text-muted-foreground">
                  Hospital Management System
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-8 shadow-[var(--shadow-elevation-md)]">
            <div className="mb-7">
              <h2 className="text-xl font-bold text-foreground">Sign in</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your credentials to access the platform
              </p>
            </div>

            {error && (
              <div className="mb-5 flex items-center gap-2.5 rounded-md border status-soft-danger p-3">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="root@localhost"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            <span>Authorized personnel only · HIPAA-compliant platform</span>
          </div>
        </div>
      </div>
    </div>
  );
}
