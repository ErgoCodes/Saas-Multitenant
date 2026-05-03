import Link from 'next/link';

export default function HeroSection() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-foreground/90 via-foreground to-foreground" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-primary/[0.08] via-transparent to-transparent" />

      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link href="/" className="font-heading text-xl font-bold tracking-tight text-white">
          <span className="text-primary/70">task</span>flow
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-white"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.97]"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl flex-col items-center justify-center px-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground/70 backdrop-blur-sm animate-fade-in">
          <span className="flex h-2 w-2 rounded-full bg-primary/60" />
          Now in beta — start organizing today
        </div>

        <h1 className="mt-8 font-heading text-5xl font-bold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
          Organize your work
          <br />
          <span className="bg-gradient-to-r from-primary/70 to-accent-foreground bg-clip-text text-transparent">
            ship with clarity
          </span>
        </h1>

        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground/70">
          Collaborative task management that cuts through the noise. Boards, lists, and cards designed for how your team actually works.
        </p>

        <div className="mt-10 flex items-center gap-4">
          <Link
            href="/register"
            className="rounded-xl bg-primary px-8 py-3.5 font-heading font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.97]"
          >
            Start Free
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-border px-8 py-3.5 font-heading font-medium text-muted-foreground transition-all hover:border-border hover:text-white active:scale-[0.97]"
          >
            Sign In
          </Link>
        </div>

        <div className="mt-16 flex items-center gap-8 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 text-primary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            No credit card
          </span>
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 text-primary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Real-time sync
          </span>
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 text-primary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Team collaboration
          </span>
        </div>
      </main>
    </div>
  );
}
