import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { AlertCircle } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    age: "",
    gender: "male",
    role: "user",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      await register(formData);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Registration failed. Please check the details and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="card-base max-w-md w-full p-8 shadow-elevated">
        <div className="text-center mb-6">
          <div className="w-8 h-8 rounded-[6px] bg-stone-900 text-white flex items-center justify-center text-xs font-semibold mx-auto mb-3">
            SS
          </div>
          <h1 className="font-serif text-2xl text-ink-primary font-normal">
            Create guest profile
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            Register to manage boutique reservations and verified itineraries
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
              htmlFor="fullName"
              className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1"
            >
              Full name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              required
              className="input-base"
              placeholder="Eleanor Vance"
              value={formData.fullName}
              onChange={handleChange}
            />
          </div>

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
              placeholder="eleanor@example.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              className="input-base"
              placeholder="Minimum 8 characters"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="age"
                className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1"
              >
                Age
              </label>
              <input
                id="age"
                name="age"
                type="number"
                required
                min="18"
                className="input-base tabular-nums"
                placeholder="28"
                value={formData.age}
                onChange={handleChange}
              />
            </div>

            <div>
              <label
                htmlFor="gender"
                className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1"
              >
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                required
                className="input-base bg-white"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full !py-2.5 text-xs font-mono uppercase tracking-wider mt-2"
          >
            {loading ? "Creating profile..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-ink-muted">
          Already registered?{" "}
          <Link
            to="/login"
            className="text-ink-primary font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
