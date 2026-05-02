import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <h1 className="text-4xl font-bold text-gray-900">Task Manager</h1>
      <p className="mt-4 text-lg text-gray-600">Collaborative task management made simple.</p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/login"
          className="rounded-md bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
        >
          Get Started
        </Link>
      </div>
    </main>
  );
}
