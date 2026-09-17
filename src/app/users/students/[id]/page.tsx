"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { StudentProfileSkeleton } from "@/components/users/students/StudentProfileSkeleton";

/**
 * `/users/students/[id]` — kept as a redirect to the canonical profile.
 *
 * This route used to hold a second, older copy of the student profile with its
 * own inline editor. That editor sent `{ userId: { … } }` where the backend's
 * `UpdateStudentDto` expects `userInfo`, so every save it made was rejected,
 * and nothing in the app linked to it. The profile now lives only at
 * `/view` and the editor only at `/edit`; this keeps the old URL working.
 */
export default function StudentProfileRedirect() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;

  useEffect(() => {
    if (studentId) router.replace(`/users/students/${studentId}/view`);
  }, [router, studentId]);

  return <StudentProfileSkeleton />;
}
