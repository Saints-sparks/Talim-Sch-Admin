"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tooltip } from "@/components/ui/Tooltip";
import { useAuth } from "@/context/AuthContext";
import { resolvePostLoginRoute } from "@/lib/postLoginRoute";
import ModernLoader from "@/components/ModernLoader";
import { classifyLoginError, type LoginError } from "@/components/auth/signInError";
import { deletionNoticeFromSearch } from "@/lib/authPolicy";
import {
  SignInCheckbox,
  SignInErrorBanner,
  SignInField,
  SignInFooter,
  SignInHeading,
  SignInLogoHeader,
  SignInOptionsRow,
  SignInPasswordField,
  SignInPrimaryButton,
  SignInShell,
  signInLinkClass,
} from "@/components/auth/signin-ui";

/** The banner's id, which the fields name in `aria-describedby`. */
const BANNER_ID = "signin-alert";

/**
 * `/`, the School Admin sign-in, in the shared Talim sign-in look
 * (`components/auth/signin-ui`, see Talim-Teachers `docs/signin-ui.md`): the
 * form column with the tree logo and the "Admin" pill, and the navy panel
 * with the illustration.
 *
 * The behaviour is this app's own and unchanged: `login(email, password,
 * keepSignedIn)` from the auth context, then `resolvePostLoginRoute` on the
 * stored user (a temporary password goes to `/set-password` first); a refused
 * role, wrong credentials and anything else each get their own banner; the
 * "Talim" loader covers the page while signing in. After a deletion request
 * (`/?deletionScheduledFor=<ISO>`) it says when the account will be deleted;
 * the "deletion cancelled" toast on the next sign-in comes from `login`.
 *
 * @returns The page.
 */
export default function SignIn() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<LoginError | null>(null);
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [deletionNotice, setDeletionNotice] = useState<string | null>(null);

  // Read after mount from `window.location` (no `useSearchParams`, so the page needs no Suspense boundary).
  useEffect(() => {
    setDeletionNotice(deletionNoticeFromSearch(window.location.search));
  }, []);

  /**
   * Signs in and routes on, or shows why it failed.
   *
   * @param e - The form's submit event.
   */
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError(null);
    setLoading(true);

    try {
      const success = await login(email, password, keepSignedIn);
      if (success) {
        // The introspected user decides: temporary password → set it first.
        const userRaw = localStorage.getItem("user") ?? sessionStorage.getItem("user");
        const userData = userRaw ? JSON.parse(userRaw) : {};
        router.push(resolvePostLoginRoute(userData));
      }
    } catch (err) {
      setLoginError(classifyLoginError(err));
    } finally {
      setLoading(false);
    }
  };

  const wrongCredentials = loginError?.kind === "invalid_credentials";
  const describedBy = loginError ? [BANNER_ID] : undefined;

  return (
    <>
      <ModernLoader visible={loading} />
      <SignInShell
        illustration={
          <Image
            src="/img/Education-rafiki 1.svg"
            alt=""
            fill
            priority
            className="object-contain"
          />
        }
        panelTitle="School Admin Portal"
        panelText="Manage your school, staff, students, and curriculum from one place."
      >
        <SignInLogoHeader
          appName="Admin"
          logo={
            <Image
              src="/img/treelogo.svg"
              alt=""
              width={40}
              height={40}
              className="h-10 w-10"
              priority
            />
          }
        />
        <SignInHeading title="Welcome back" subtitle="Sign in to the School Administrator portal" />

        {deletionNotice ? (
          <SignInErrorBanner tone="neutral" title="Account deletion scheduled" className="mt-6">
            {deletionNotice}
          </SignInErrorBanner>
        ) : null}

        {loginError?.kind === "access_denied" ? (
          <SignInErrorBanner
            id={BANNER_ID}
            tone="danger"
            icon="shield"
            title="Access denied"
            className="mt-6"
          >
            {loginError.message}
          </SignInErrorBanner>
        ) : null}
        {wrongCredentials ? (
          <SignInErrorBanner id={BANNER_ID} tone="warning" className="mt-6">
            Incorrect email or password. Please double-check your credentials and try again.
          </SignInErrorBanner>
        ) : null}
        {loginError?.kind === "unknown" ? (
          <SignInErrorBanner id={BANNER_ID} tone="neutral" className="mt-6">
            {loginError.message}
          </SignInErrorBanner>
        ) : null}

        <form className="mt-8 space-y-5" onSubmit={handleFormSubmit} aria-label="Sign in">
          <SignInField
            id="email"
            type="email"
            label="Email address"
            placeholder="you@school.com"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            invalid={wrongCredentials}
            describedBy={describedBy}
          />
          <SignInPasswordField
            id="password"
            label="Password"
            placeholder="••••••••"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            invalid={wrongCredentials}
            describedBy={describedBy}
          />
          <SignInOptionsRow>
            <Tooltip content="Stays signed in for 30 days. Uncheck on shared devices." side="right">
              <span>
                <SignInCheckbox
                  label="Keep me signed in"
                  name="keepSignedIn"
                  checked={keepSignedIn}
                  onChange={(e) => setKeepSignedIn(e.target.checked)}
                />
              </span>
            </Tooltip>
            <a href="/forgot-password" className={signInLinkClass}>
              Forgot password?
            </a>
          </SignInOptionsRow>
          <SignInPrimaryButton loading={loading} loadingText="Signing in…">
            Sign in
          </SignInPrimaryButton>
        </form>

        <SignInFooter supportEmail="support@mytalim.com" />
      </SignInShell>
    </>
  );
}
