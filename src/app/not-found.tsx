import Link from "next/link";
import { Compass, Home } from "lucide-react";

/** Rendered for unknown routes and by `notFound()` calls. */
export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
            <Compass className="h-10 w-10 text-[#003366] dark:text-blue-300" />
          </div>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-slate-100">Page not found</h1>
        <p className="mb-6 text-gray-500 dark:text-slate-400">The page you're looking for doesn't exist or has moved.</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#003366] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#002244]"
        >
          <Home className="h-4 w-4" />
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
