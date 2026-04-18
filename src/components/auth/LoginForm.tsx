// src/components/auth/LoginForm.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import LoadingSpinner from "../ui/LoadingSpinner";

type FormErrors = {
  email?: string;
  password?: string;
};

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  function formatLoginInput(input: string): string {
    const trimmed = input.trim();

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);

    if (isEmail) {
      return trimmed.toLowerCase();
    }

    const phone = trimmed.replace(/\D/g, "");
    return `${phone}@engroup.ly`;
  }

  function validate() {
    const next: FormErrors = {};

    if (!email) next.email = "أدخل البريد الإلكتروني أو رقم الهاتف";
    if (!password) next.password = "أدخل كلمة المرور";

    setError(next);

    return Object.keys(next).length === 0;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const isValid = validate();
    if (!isValid) {
      setLoading(false);
      return;
    }

    const formattedEmail = formatLoginInput(email);

    try {
      await login(formattedEmail, password);
      navigate("/");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";

      setError({ password: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md bg-background shadow-lg rounded-lg p-6 space-y-6"
      >
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">
            تسجيل الدخول إلى EGC
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            أدخل تفاصيل حسابك للمتابعة.
          </p>
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            البريد الإلكتروني
          </label>
          <input
            type="text"
            value={email}
            placeholder="you@engroup.ly او 0921111111"
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-4 py-2 border rounded-md"
          />
          {error.email && <p className="text-sm text-red-500">{error.email}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            كلمة المرور
          </label>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border rounded-md"
            />

            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute inset-y-0 left-2 flex items-center px-2"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>

          {error.password && (
            <p className="text-sm text-red-500">{error.password}</p>
          )}
        </div>

        <div>
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-md disabled:opacity-60"
            disabled={loading}
          >
            {loading ? <LoadingSpinner size="sm" /> : "تسجيل الدخول"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
