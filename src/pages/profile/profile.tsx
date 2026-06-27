import { useState } from "react";
import { supabaseAdmin } from "../../lib/adminSupabase";
import { useAuth } from "../../hooks/useAuth";

interface FoundUser {
  id: string;
  email: string;
  created_at: string;
}

type Step = "search" | "reset";
const ProfilePage = () => {
  const [step, setStep] = useState<Step>("search");
  const [searchEmail, setSearchEmail] = useState("");
  const [searching, setSearching] = useState(false);
  const [foundUser, setFoundUser] = useState<FoundUser | null>(null);
  const [searchError, setSearchError] = useState("");
  const { user } = useAuth();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState("");

  const getPasswordStrength = (
    pw: string,
  ): { score: number; label: string; color: string } => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const map = [
      { label: "", color: "" },
      { label: "Weak", color: "#E24B4A" },
      { label: "Fair", color: "#EF9F27" },
      { label: "Good", color: "#639922" },
      { label: "Strong", color: "#1D9E75" },
    ];
    return { score, ...map[score] };
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!";
    const pw = Array.from(
      { length: 12 },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join("");
    setNewPassword(pw);
    setConfirmPassword(pw);
  };

  const handleSearch = async () => {
    if (!searchEmail.trim()) return;
    setSearching(true);
    setSearchError("");
    setFoundUser(null);

    try {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      if (error) {
        console.error(error);
        throw error;
      }

      const match = data.users.find(
        (u) => u.email?.toLowerCase() === searchEmail.trim().toLowerCase(),
      );

      if (!match) {
        console.error("no user");
        setSearchError("No user found with that email.");
        return;
      }

      setFoundUser({
        id: match.id,
        email: match.email!,
        created_at: match.created_at,
      });
    } catch (err: unknown) {
      setSearchError(err instanceof Error ? err.message : "Search failed.");
    } finally {
      setSearching(false);
    }
  };

  const handleReset = async () => {
    if (!foundUser) return;
    setResetError("");
    setResetSuccess(false);

    if (newPassword.length < 8) {
      setResetError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match.");
      return;
    }

    setResetting(true);
    try {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(
        foundUser.id,
        {
          password: newPassword,
        },
      );
      if (error) throw error;
      setResetSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setResetError(err instanceof Error ? err.message : "Reset failed.");
    } finally {
      setResetting(false);
    }
  };

  const handleBack = () => {
    setStep("search");
    setFoundUser(null);
    setSearchEmail("");
    setSearchError("");
    setNewPassword("");
    setConfirmPassword("");
    setResetSuccess(false);
    setResetError("");
  };

  const strength = getPasswordStrength(newPassword);
  const initials = foundUser?.email?.substring(0, 2).toUpperCase() ?? "";

  if (user?.role === "Admin" || user?.role === "Manager")
    return (
      <div className="max-w-lg mx-auto p-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">
          Reset user password
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Admin tool — changes take effect immediately.
        </p>

        {/* ── Step: Search ── */}
        {step === "search" && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                User email
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="user@engroup.ly"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
                <button
                  onClick={handleSearch}
                  disabled={searching || !searchEmail.trim()}
                  className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {searching ? "Searching…" : "Search"}
                </button>
              </div>
            </div>

            {searchError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                {searchError}
              </div>
            )}

            {foundUser && (
              <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm flex-shrink-0">
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {foundUser.email}
                    </p>
                    <p className="text-xs text-gray-400">
                      Joined{" "}
                      {new Date(foundUser.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setStep("reset")}
                  className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Reset password →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Step: Reset ── */}
        {step === "reset" && foundUser && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
            {/* User info */}
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm flex-shrink-0">
                {initials}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {foundUser.email}
                </p>
                <p className="text-xs text-gray-400 font-mono">
                  {foundUser.id}
                </p>
              </div>
            </div>

            {/* New password */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-sm text-gray-600">New password</label>
                <button
                  onClick={generatePassword}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Generate random
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm pr-16 focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
                <button
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {newPassword && (
                <div className="space-y-1 pt-1">
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(strength.score / 4) * 100}%`,
                        backgroundColor: strength.color,
                      }}
                    />
                  </div>
                  <p className="text-xs" style={{ color: strength.color }}>
                    {strength.label}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-1">
              <label className="text-sm text-gray-600">Confirm password</label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
            </div>

            {/* Alerts */}
            {resetError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                {resetError}
              </div>
            )}
            {resetSuccess && (
              <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                ✓ Password reset successfully. Notify the user via phone.
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleBack}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleReset}
                disabled={resetting || !newPassword || !confirmPassword}
                className="flex-1 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {resetting ? "Resetting…" : "Reset password"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  return <div>ProfilePage</div>;
};
export default ProfilePage;
