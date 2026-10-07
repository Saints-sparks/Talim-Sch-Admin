"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ShieldOff, ArrowLeft, Home } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { StatusScreen } from "@/components/tl/StatusScreen";
import { ghostButton, primaryButton } from "@/components/tl/styles";

/**
 * Shown in place of a page the signed-in admin may not open (the route
 * guard renders it; `/access-denied` serves it directly). A sub-admin is told
 * their permissions are limited.
 *
 * @returns The screen.
 */
export default function AccessDeniedPage() {
  const router = useRouter();
  const { isSubAdmin } = useAuth();

  return (
    <StatusScreen
      tone="danger"
      icon={<ShieldOff />}
      eyebrowText="Error 403"
      title="Access Denied"
      description={
        <>
          <p>You don&apos;t have permission to view this page.</p>
          {isSubAdmin && (
            <p className="mt-2 text-sm">
              Your account has limited permissions. Contact your school administrator if you believe
              this is a mistake.
            </p>
          )}
        </>
      }
      actions={
        <>
          <button type="button" onClick={() => router.back()} className={`${ghostButton} flex-1`}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Go Back
          </button>
          <button
            type="button"
            onClick={() => router.replace("/dashboard")}
            className={`${primaryButton} flex-1`}
          >
            <Home className="h-4 w-4" aria-hidden />
            Go to Dashboard
          </button>
        </>
      }
    />
  );
}
