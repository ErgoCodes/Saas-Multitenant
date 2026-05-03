import Link from 'next/link';
import { Button, Input, Label } from '@task-manager/ui';

interface RegisterFormProps {
  name: string;
  setName: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  error: string;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function RegisterForm({
  name,
  setName,
  email,
  setEmail,
  password,
  setPassword,
  error,
  loading,
  onSubmit,
}: RegisterFormProps) {
  return (
    <div className="flex min-h-screen">
      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Link
            href="/"
            className="mb-10 inline-flex items-center gap-1 font-heading text-xl font-bold tracking-tight text-foreground"
          >
            <span className="text-primary">task</span>flow
          </Link>

          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Create your account
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Start organizing your work in minutes.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Label htmlFor="name" className="mb-1.5 block">Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
            />

            <Label htmlFor="email" className="mb-1.5 block">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
            />

            <Label htmlFor="password" className="mb-1.5 block">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              required
            />

            <Button type="submit" loading={loading} className="w-full">
              Create Account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:text-primary/90">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <div className="relative hidden flex-1 lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-foreground/90 via-foreground/80 to-foreground" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-accent-500/10 via-transparent to-transparent" />
        <div className="relative flex h-full items-center justify-center p-12">
          <div className="max-w-md text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="mt-6 font-heading text-2xl font-bold text-white">
              Get started in seconds
            </h2>
            <p className="mt-3 leading-relaxed text-white/70">
              Create boards, organize tasks, and collaborate with your team in real time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
