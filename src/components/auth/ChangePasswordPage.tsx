import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock } from "lucide-react";
import { supabaseAdmin } from "../../lib/adminSupabase";
import { supabase } from "../../lib/supabaseClient";

export default function ChangePasswordPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Client-side validation
      if (password.length < 8) {
        setError("يجب أن تكون كلمة المرور 8 أحرف على الأقل");
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError("كلمتا المرور غير متطابقتين");
        setLoading(false);
        return;
      }

      // 1️⃣ Update Supabase auth password
      const { error: authError } = await supabaseAdmin.auth.updateUser({
        password,
      });
      if (authError) throw authError;

      // 2️⃣ Update profile flag
      const { data: auth } = await supabaseAdmin.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("No active session");

      const { error: profileError } = await supabase
        .from("users")
        .update({
          first_login: false,
          updated_at: new Date().toISOString(),
          change_password_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (profileError) throw profileError;

      // 3️⃣ Refresh user & redirect
      await refreshUser();
      navigate("/", { replace: true });
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء تغيير كلمة المرور");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md bg-background shadow-lg rounded-lg p-6 space-y-6"
        aria-label="Change password form"
      >
        {/* Header */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">
            تغيير كلمة المرور
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            هذه أول مرة تسجّل دخولك. يرجى تعيين كلمة مرور جديدة.
          </p>
        </div>

        {/* Password Field */}
        <div className="space-y-1">
          <label
            htmlFor="password"
            className="text-sm font-medium text-gray-700"
          >
            كلمة المرور الجديدة
          </label>

          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="mt-1 block w-full px-4 py-2 border border-gray-200 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:primary focus:border"
              autoComplete="new-password"
            />

            <button
              type="button"
              onClick={togglePasswordVisibility}
              aria-label={
                showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"
              }
              className="absolute inset-y-0 left-2 flex items-center px-2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-1">
            يجب أن تكون كلمة المرور 8 أحرف على الأقل
          </p>
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-1">
          <label
            htmlFor="confirmPassword"
            className="text-sm font-medium text-gray-700"
          >
            تأكيد كلمة المرور
          </label>

          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="mt-1 block w-full px-4 py-2 border border-gray-200 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:primary focus:border"
              autoComplete="new-password"
            />

            <button
              type="button"
              onClick={toggleConfirmPasswordVisibility}
              aria-label={
                showConfirmPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"
              }
              className="absolute inset-y-0 left-2 flex items-center px-2 text-gray-500 hover:text-gray-700"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>

          {confirmPassword && password !== confirmPassword && (
            <p className="text-xs text-error mt-1">
              كلمتا المرور غير متطابقتين
            </p>
          )}
        </div>

        {/* Error */}
        {error && <p className="text-sm text-error">{error}</p>}

        {/* Submit */}
        <div>
          <button
            type="submit"
            disabled={loading || password.length < 8}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-md disabled:opacity-60"
          >
            {loading ? (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                حفظ كلمة المرور
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
