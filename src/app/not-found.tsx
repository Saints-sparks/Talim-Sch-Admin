import Link from "next/link";
import { Compass, Home } from "lucide-react";
import { StatusScreen } from "@/components/tl/StatusScreen";
import { primaryButton } from "@/components/tl/styles";

/**
 * Rendered for unknown routes and by `notFound()` calls.
 *
 * @returns The not-found screen.
 */
export default function NotFound() {
  return (
    <StatusScreen
      icon={<Compass />}
      eyebrowText="Error 404"
      title="Page not found"
      description="The page you're looking for doesn't exist or has moved."
      actions={
        <Link href="/dashboard" className={`${primaryButton} flex-1`}>
          <Home className="h-4 w-4" aria-hidden />
          Go to Dashboard
        </Link>
      }
    />
  );
}
