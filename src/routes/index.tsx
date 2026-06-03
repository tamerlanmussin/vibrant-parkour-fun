import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NEON PARKOUR — Parkour Runner" },
      { name: "description", content: "Прыгай по стенам, беги вперёд и не падай. Бесконечный паркур-раннер в стиле премиум-инженерии." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <main
      className="min-h-screen flex flex-col"
      style={{
        background: "linear-gradient(135deg, #1a2129 0%, #262e38 50%, #0d1117 100%)",
      }}
    >
      {/* Nav */}
      <nav className="w-full px-6 py-5 flex items-center justify-between">
        <span
          className="text-sm font-bold tracking-[0.2em] uppercase"
          style={{ color: "#e6e6e6" }}
        >
          NEON PARKOUR
        </span>
        <Link
          to="/auth"
          className="px-4 py-2 text-xs font-bold tracking-wider uppercase border transition-colors hover:bg-[#e6e6e6] hover:text-[#1a2129]"
          style={{ borderColor: "#e6e6e6", color: "#e6e6e6" }}
        >
          Войти
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="mb-2">
          <span
            className="inline-block px-3 py-1 text-[10px] font-bold tracking-[0.25em] uppercase border"
            style={{ color: "#6b6b6b", borderColor: "#e6e6e6" }}
          >
            Бесконечный раннер
          </span>
        </div>

        <h1
          className="text-5xl md:text-7xl font-black tracking-tighter mb-4 leading-[0.95]"
          style={{ color: "#ffffff" }}
        >
          NEON
          <br />
          <span style={{ color: "#1c69d4" }}>PARKOUR</span>
        </h1>

        <p
          className="text-sm md:text-base max-w-md mb-10 leading-relaxed"
          style={{ color: "#6b6b6b" }}
        >
          Прыгай по стенам, используй wall-jump и держи темп.
          <br />
          Бесконечные платформы. Никаких границ.
        </p>

        {/* Visual preview strip — static blocks showing game elements */}
        <div className="flex items-end gap-2 mb-10">
          <div className="w-3 h-12" style={{ background: "#1c69d4" }} />
          <div className="w-3 h-8" style={{ background: "#e22718" }} />
          <div className="w-4 h-6 border-2" style={{ borderColor: "#ffffff" }} />
          <div className="w-3 h-16" style={{ background: "#1c69d4" }} />
          <div className="w-3 h-4" style={{ background: "#e22718" }} />
          <div className="w-4 h-10" style={{ background: "#1c69d4" }} />
          <div className="w-3 h-20" style={{ background: "#e22718" }} />
          <div className="w-4 h-7 border-2" style={{ borderColor: "#ffffff" }} />
          <div className="w-3 h-14" style={{ background: "#1c69d4" }} />
        </div>

        <Link
          to="/play"
          className="inline-flex items-center gap-3 px-10 py-4 text-sm font-bold tracking-wider uppercase transition-opacity hover:opacity-80"
          style={{ background: "#1c69d4", color: "#ffffff" }}
        >
          Играть
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
          </svg>
        </Link>

        <p className="mt-4 text-xs" style={{ color: "#6b6b6b" }}>
          A / D — бег · Space — прыжок · Стена — wall-jump
        </p>
      </section>

      {/* Footer */}
      <footer className="w-full px-6 py-5 flex items-center justify-between text-[10px] tracking-wider uppercase" style={{ color: "#6b6b6b" }}>
        <span>© 2025</span>
        <span>Бесконечный раннер</span>
      </footer>
    </main>
  );
}
