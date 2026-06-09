import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Neon Parkour - Вход" },
      {
        name: "description",
        content: "Вход и регистрация через Supabase Auth для Neon Parkour.",
      },
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
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUser(data.session?.user ?? null);
      setSessionLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        if (username.trim().length < 2 || username.trim().length > 24) {
          throw new Error("Никнейм должен быть от 2 до 24 символов.");
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
            data: { username: username.trim() },
          },
        });

        if (error) throw error;

        if (data.session) {
          navigate({ to: "/play" });
        } else {
          setMessage("Аккаунт создан. Проверь email, если подтверждение включено в Supabase.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/play" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Что-то пошло не так.");
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth`,
        },
      });

      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось войти через Google.");
      setLoading(false);
    }
  }

  async function signOut() {
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось выйти.");
    } finally {
      setLoading(false);
    }
  }

  const title = user ? "АККАУНТ" : mode === "signup" ? "РЕГИСТРАЦИЯ" : "ВХОД";

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "radial-gradient(circle at 50% 0%, #1a0535 0%, #05010f 70%)" }}
    >
      <section
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
          {title}
        </h1>
        <p className="text-center text-sm mb-6" style={{ color: "#9c8bff" }}>
          Сохраняй рекорды и попадай в топ
        </p>

        {sessionLoading ? (
          <p className="text-center font-mono" style={{ color: "#22e6ff" }}>
            ...
          </p>
        ) : user ? (
          <div className="flex flex-col gap-4">
            <div
              className="rounded-lg p-4 text-sm font-mono"
              style={{ border: "1px solid #22e6ff", color: "#22e6ff" }}
            >
              <div className="mb-1" style={{ color: "#9c8bff" }}>
                Вы вошли как
              </div>
              <div className="break-all">{user.email ?? "пользователь Supabase"}</div>
            </div>

            {error && <StatusMessage kind="error" text={error} />}

            <Link
              to="/play"
              className="px-6 py-3 text-center font-bold rounded-lg transition-transform hover:scale-105"
              style={{ background: "#fffb00", color: "#1a0535", boxShadow: "0 0 30px #fffb00" }}
            >
              ИГРАТЬ
            </Link>
            <button
              type="button"
              onClick={signOut}
              disabled={loading}
              className="px-6 py-3 font-bold rounded-lg transition-opacity disabled:opacity-50"
              style={{ border: "1px solid #e22718", color: "#e22718" }}
            >
              ВЫЙТИ
            </button>
          </div>
        ) : (
          <>
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
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-4 py-3 rounded-lg bg-transparent font-mono"
                style={{ border: "1px solid #22e6ff", color: "#22e6ff" }}
              />
              <input
                type="password"
                placeholder="Пароль, минимум 6 символов"
                required
                minLength={6}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="px-4 py-3 rounded-lg bg-transparent font-mono"
                style={{ border: "1px solid #22e6ff", color: "#22e6ff" }}
              />

              {error && <StatusMessage kind="error" text={error} />}
              {message && <StatusMessage kind="success" text={message} />}

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 font-bold rounded-lg transition-transform hover:scale-105 disabled:opacity-50"
                style={{ background: "#fffb00", color: "#1a0535", boxShadow: "0 0 30px #fffb00" }}
              >
                {loading ? "..." : mode === "signup" ? "СОЗДАТЬ АККАУНТ" : "ВОЙТИ"}
              </button>
            </form>

            <div className="flex items-center gap-3 my-5">
              <div className="h-px flex-1" style={{ background: "#3a246b" }} />
              <span className="text-xs font-mono" style={{ color: "#9c8bff" }}>
                ИЛИ
              </span>
              <div className="h-px flex-1" style={{ background: "#3a246b" }} />
            </div>

            <button
              type="button"
              onClick={signInWithGoogle}
              disabled={loading}
              className="w-full px-6 py-3 font-bold rounded-lg transition-transform hover:scale-105 disabled:opacity-50"
              style={{ background: "#ffffff", color: "#1a0535" }}
            >
              ВОЙТИ ЧЕРЕЗ GOOGLE
            </button>

            <div className="text-center mt-4 text-sm" style={{ color: "#9c8bff" }}>
              {mode === "signup" ? "Уже есть аккаунт? " : "Нет аккаунта? "}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "signup" ? "login" : "signup");
                  setError(null);
                  setMessage(null);
                }}
                className="underline"
                style={{ color: "#22e6ff" }}
              >
                {mode === "signup" ? "Войти" : "Зарегистрироваться"}
              </button>
            </div>
          </>
        )}

        <div className="text-center mt-4">
          <Link to="/" className="text-xs" style={{ color: "#9c8bff" }}>
            ← К игре
          </Link>
        </div>
      </section>
    </main>
  );
}

function StatusMessage({ kind, text }: { kind: "error" | "success"; text: string }) {
  const isError = kind === "error";

  return (
    <div
      className="text-sm font-mono p-2 rounded"
      style={{
        color: isError ? "#ff2bd6" : "#22e6ff",
        background: isError ? "rgba(255,43,214,0.1)" : "rgba(34,230,255,0.1)",
      }}
    >
      {text}
    </div>
  );
}
