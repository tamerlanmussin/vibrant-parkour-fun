import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Neon Parkour — Вход" },
      { name: "description", content: "Зарегистрируйся, чтобы сохранять рекорды в Neon Parkour." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        if (username.trim().length < 2 || username.length > 24) {
          throw new Error("Никнейм 2–24 символа");
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { username: username.trim() },
          },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Что-то пошло не так");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "radial-gradient(circle at 50% 0%, #1a0535 0%, #05010f 70%)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-8"
        style={{
          background: "rgba(10,4,32,0.85)",
          border: "1px solid #ff2bd6",
          boxShadow: "0 0 60px rgba(255,43,214,0.4)",
        }}
      >
        <h1
          className="text-3xl font-black text-center mb-1"
          style={{ color: "#fffb00", textShadow: "0 0 20px #ff2bd6" }}
        >
          {mode === "signup" ? "РЕГИСТРАЦИЯ" : "ВХОД"}
        </h1>
        <p className="text-center text-sm mb-6" style={{ color: "#9c8bff" }}>
          Сохраняй рекорды и попадай в топ
        </p>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Никнейм"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="px-4 py-3 rounded-lg bg-transparent font-mono"
              style={{ border: "1px solid #22e6ff", color: "#22e6ff" }}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="px-4 py-3 rounded-lg bg-transparent font-mono"
            style={{ border: "1px solid #22e6ff", color: "#22e6ff" }}
          />
          <input
            type="password"
            placeholder="Пароль (мин. 6 символов)"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="px-4 py-3 rounded-lg bg-transparent font-mono"
            style={{ border: "1px solid #22e6ff", color: "#22e6ff" }}
          />

          {error && (
            <div className="text-sm font-mono p-2 rounded" style={{ color: "#ff2bd6", background: "rgba(255,43,214,0.1)" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 font-bold rounded-lg transition-transform hover:scale-105 disabled:opacity-50"
            style={{ background: "#fffb00", color: "#1a0535", boxShadow: "0 0 30px #fffb00" }}
          >
            {loading ? "..." : mode === "signup" ? "СОЗДАТЬ АККАУНТ" : "ВОЙТИ"}
          </button>
        </form>

        <div className="text-center mt-4 text-sm" style={{ color: "#9c8bff" }}>
          {mode === "signup" ? "Уже есть аккаунт? " : "Нет аккаунта? "}
          <button
            onClick={() => {
              setMode(mode === "signup" ? "login" : "signup");
              setError(null);
            }}
            className="underline"
            style={{ color: "#22e6ff" }}
          >
            {mode === "signup" ? "Войти" : "Зарегистрироваться"}
          </button>
        </div>

        <div className="text-center mt-2">
          <Link to="/" className="text-xs" style={{ color: "#9c8bff" }}>
            ← К игре
          </Link>
        </div>
      </div>
    </main>
  );
}
