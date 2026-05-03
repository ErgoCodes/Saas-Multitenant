import Link from 'next/link';

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-surface-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-900/40 via-surface-950 to-surface-950" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-accent-500/[0.08] via-transparent to-transparent" />

      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link href="/" className="font-heading text-xl font-bold tracking-tight text-white">
          <span className="text-brand-400">task</span>flow
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-surface-300 transition-colors hover:text-white"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-500 active:scale-[0.97]"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl flex-col items-center justify-center px-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-surface-700/50 bg-surface-800/50 px-4 py-1.5 text-sm text-surface-400 backdrop-blur-sm animate-fade-in">
          <span className="flex h-2 w-2 rounded-full bg-success-400" />
          Now in beta — start organizing today
        </div>

        <h1 className="mt-8 font-heading text-5xl font-bold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
          Organize your work
          <br />
          <span className="bg-gradient-to-r from-brand-400 to-accent-400 bg-clip-text text-transparent">
            ship with clarity
          </span>
        </h1>

        <p className="mt-6 max-w-xl text-lg leading-relaxed text-surface-400">
          Collaborative task management that cuts through the noise. Boards, lists, and cards designed for how your team actually works.
        </p>

        <div className="mt-10 flex items-center gap-4">
          <Link
            href="/register"
            className="rounded-xl bg-brand-600 px-8 py-3.5 font-heading font-semibold text-white shadow-lg shadow-brand-600/25 transition-all hover:bg-brand-500 hover:shadow-xl hover:shadow-brand-600/30 active:scale-[0.97]"
          >
            Start Free
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-surface-700 px-8 py-3.5 font-heading font-medium text-surface-300 transition-all hover:border-surface-500 hover:text-white active:scale-[0.97]"
          >
            Sign In
          </Link>
        </div>

        <div className="mt-16 flex items-center gap-8 text-sm text-surface-500">
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            No credit card
          </span>
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Real-time sync
          </span>
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Team collaboration
          </span>
        </div>
      </main>
    </div>
  );
}
