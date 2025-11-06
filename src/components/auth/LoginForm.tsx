// src/renderer/components/LoginForm.tsx (updated)
import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { signInUser } from "../../lib/auth";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate(); // Initialize the hook

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await signInUser(email, password);
      // Redirect to the home page or dashboard after successful login
      navigate("/");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    }
  };

  // ... (rest of the component structure remains the same)
  return (
    <form
      onSubmit={handleLogin}
      style={{
        display: "flex",
        flexDirection: "column",
        maxWidth: "300px",
        gap: "10px",
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "5px",
      }}
    >
      <h2 className="bg-red-200">Login</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">Log In</button>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
};

export default LoginForm;
