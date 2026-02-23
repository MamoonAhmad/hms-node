import { useState } from "react";
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
} from "lucide-react";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Failed to login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-linear-to-br from-emerald-600 via-teal-600 to-cyan-700">
        {/* Animated background patterns */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-32 right-16 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          />
          <div
            className="absolute top-1/2 left-1/3 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-4 mb-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-xl">
              <span className="text-3xl font-bold">H</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">HMS</h1>
              <p className="text-white/80 text-sm">
                Hospital Management System
              </p>
            </div>
          </div>

          <h2 className="text-4xl font-bold leading-tight mb-6">
            Streamline Your
            <br />
            <span className="text-emerald-200">Healthcare Operations</span>
          </h2>

          <p className="text-lg text-white/80 mb-12 max-w-md">
            A modern platform for managing patients, appointments, and
            healthcare workflows with ease.
          </p>

          {/* Feature highlights */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                <Heart className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Patient Management</h3>
                <p className="text-sm text-white/70">
                  Comprehensive patient records
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Appointment Scheduling</h3>
                <p className="text-sm text-white/70">Smart scheduling system</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                <Stethoscope className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Insurance Integration</h3>
                <p className="text-sm text-white/70">
                  Seamless provider management
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative circles */}
        <div className="absolute -bottom-32 -left-32 w-96 h-96 border border-white/10 rounded-full" />
        <div className="absolute -bottom-48 -left-48 w-[500px] h-[500px] border border-white/5 rounded-full" />
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600">
              <span className="text-xl font-bold text-white">H</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">HMS</h1>
              <p className="text-sm text-muted-foreground">
                Hospital Management System
              </p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Welcome back
            </h2>
            <p className="text-muted-foreground">
              Enter your credentials to access your account
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/50 p-4 text-red-700 dark:text-red-400">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="root@localhost"
                required
                autoComplete="email"
                className="h-12 bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="h-12 bg-background"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Protected healthcare management system.
            <br />
            Authorized personnel only.
          </p>
        </div>
      </div>
    </div>
  );
}
