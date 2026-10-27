import Link from 'next/link';

export default function HeroSection() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#090D16] text-slate-100">
      {/* Refined ambient glow layers */}
      <div className="pointer-events-none absolute -top-40 right-0 h-[600px] w-[600px] rounded-full bg-indigo-500/10 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-40 left-0 h-[600px] w-[600px] rounded-full bg-violet-600/10 blur-[140px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/20 via-transparent to-transparent" />

      {/* Navigation */}
      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link href="/" className="font-heading text-xl font-bold tracking-tight text-white">
          <span className="text-indigo-400">task</span>flow
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-colors duration-150 hover:text-white"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-500/20 transition-[background-color,transform,box-shadow] duration-150 ease-out hover:bg-indigo-500 hover:shadow-md hover:shadow-indigo-500/30 active:scale-[0.97]"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero content */}
      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-88px)] max-w-6xl flex-col items-center justify-center px-6 py-12 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-1.5 text-xs sm:text-sm font-medium text-slate-300 shadow-inner backdrop-blur-md">
          <span className="flex h-2 w-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
          Now in beta — start organizing today
        </div>

        <h1 className="mt-8 font-heading text-5xl font-bold leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-7xl">
          Organize your work
          <br />
          <span className="bg-gradient-to-r from-indigo-300 via-indigo-100 to-purple-300 bg-clip-text text-transparent">
            ship with clarity
          </span>
        </h1>

        <p className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-slate-400">
          Collaborative task management that cuts through the noise. Boards, lists, and cards designed for how your team actually works.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/register"
            className="rounded-xl bg-indigo-600 px-8 py-3.5 font-heading font-semibold text-white shadow-[0_0_30px_-5px_rgba(99,102,241,0.45)] transition-[transform,background-color,box-shadow] duration-150 ease-out hover:bg-indigo-500 hover:shadow-[0_0_35px_-3px_rgba(99,102,241,0.65)] active:scale-[0.97]"
          >
            Start Free
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-white/15 bg-white/[0.04] px-8 py-3.5 font-heading font-medium text-slate-200 backdrop-blur-sm transition-[border-color,background-color,color,transform] duration-150 ease-out hover:border-white/30 hover:bg-white/[0.08] hover:text-white active:scale-[0.97]"
          >
            Sign In
          </Link>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-slate-400">
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            No credit card
          </span>
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Real-time sync
          </span>
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Team collaboration
          </span>
        </div>
      </main>
    </div>
  );
}
