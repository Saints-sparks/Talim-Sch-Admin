/**
 * `/profile` — the signed-in administrator's account and their school.
 *
 * The page is a shell over two cards, each with its own state and mutations:
 * `AdminDetailsCard` (open to every admin role) and `SchoolDetailsCard`
 * (editable only with `manage:settings`, matching the backend). Both read one
 * cached profile request, shared with Settings → Admin Account. The Danger
 * zone (Delete account, v1.5) closes the page.
 */
"use client";

import { AdminDetailsCard } from "@/components/profile/AdminDetailsCard";
import { SchoolDetailsCard } from "@/components/profile/SchoolDetailsCard";
import { DeleteAccountCard } from "@/components/settings/DeleteAccountCard";
import { useProfileSnapshot } from "@/components/profile/useProfileData";
import { Page, PageHeader } from "@/components/tl/Page";
import { Banner, PageSkeleton } from "@/components/tl/states";
import { ghostButton } from "@/components/tl/styles";

/**
 * @returns The profile screen.
 */
export default function Profile() {
  const { admin, school, isLoading, isError, retry } = useProfileSnapshot();

  if (isLoading) {
    return <PageSkeleton label="Loading Profile" blocks={[320, 280]} />;
  }

  return (
    <Page guide="profile">
      <PageHeader title="Profile" subtitle="Your details and your school's, as Talim shows them." />

      <div className="flex max-w-4xl flex-col gap-[18px]">
        {isError && (
          <Banner
            tone="warning"
            role="alert"
            action={
              <button type="button" onClick={retry} className={ghostButton}>
                Try again
              </button>
            }
          >
            We couldn&apos;t load your profile. Some details may be out of date.
          </Banner>
        )}

        <AdminDetailsCard admin={admin} />
        <SchoolDetailsCard school={school} />
        <DeleteAccountCard />
      </div>
    </Page>
  );
}
