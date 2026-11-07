import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import authService from "../../services/authService";
import { ArrowRight, AlertCircle } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { login, completeGoogleLogin } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleError = params.get("googleError");
    if (googleError) {
      const messages = {
        google_auth_failed:
          "Google authentication was not completed. Please try again.",
        google_email_not_verified:
          "Your Google account requires a verified email address.",
        google_oauth_not_configured:
          "Google sign-in is currently unavailable on the server.",
      };
      setError(
        messages[googleError] || "Google sign-in failed. Please try again.",
      );
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    if (params.get("google") !== "success") return;
    window.history.replaceState({}, "", window.location.pathname);
    setLoading(true);
    completeGoogleLogin()
      .then((result) => {
        if (result.success) {
          navigate("/user");
        } else {
          setError(result.error);
        }
      })
      .finally(() => setLoading(false));
  }, [completeGoogleLogin, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        navigate("/user");
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Invalid credentials. Please verify your email and password.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="card-base max-w-sm w-full p-8 shadow-elevated">
        <div className="text-center mb-6">
          <div className="w-8 h-8 rounded-[6px] bg-stone-900 text-white flex items-center justify-center text-xs font-semibold mx-auto mb-3">
            SS
          </div>
          <h1 className="font-serif text-2xl text-ink-primary font-normal">
            Sign in to your account
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            Access your bookings and guest benefits
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-control bg-red-50 border border-red-200/80 flex items-start gap-2.5 text-xs text-red-800">
            <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="email"
              className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1"
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="input-base"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="password"
                className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted"
              >
                Password
              </label>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="input-base"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full !py-2.5 text-xs font-mono uppercase tracking-wider mt-2"
          >
            {loading ? "Authenticating..." : "Sign in"}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-stone-200" />
          </div>
          <div className="relative flex justify-center text-[11px] font-mono text-ink-muted uppercase">
            <span className="bg-white px-2">or</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => authService.startGoogleLogin()}
          disabled={loading}
          className="btn-secondary w-full !py-2.5 text-xs font-mono tracking-wider flex items-center justify-center gap-2"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <p className="mt-6 text-center text-xs text-ink-muted">
          New guest?{" "}
          <Link
            to="/register"
            className="text-ink-primary font-medium hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
