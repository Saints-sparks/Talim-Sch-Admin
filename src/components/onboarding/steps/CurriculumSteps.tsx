/**
 * Setup steps 5 and 6 — the first subject and the first course inside it.
 */
"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "@/components/CustomToast";
import { Field, PrimaryBtn, inputCls } from "@/components/onboarding/OnboardingAtoms";
import { StepCard } from "@/components/onboarding/steps/StepCard";
import { useClasses, useCourses, useInvalidateReference, useSubjects } from "@/hooks/queries/reference";
import { useSchoolId } from "@/hooks/useSchoolId";
import { createCourse, createSubject } from "@/app/services/subjects.service";
import { teacherService, teacherUserId, type Teacher } from "@/app/services/teacher.service";
import { queryKeys, staleTimes } from "@/lib/queryKeys";
import { getErrorMessage } from "@/lib/apiError";

/**
 * The name to show a teacher by, however the API populated their account.
 *
 * Never returns "undefined undefined": an account with no name at all falls
 * back to its email, then to a neutral label.
 *
 * @param teacher - The teacher account.
 * @returns A display name.
 */
export function teacherLabel(teacher: Teacher): string {
  const account = typeof teacher.userId === "object" ? teacher.userId : null;
  const first = account?.firstName ?? teacher.firstName ?? "";
  const last = account?.lastName ?? teacher.lastName ?? "";
  const name = `${first} ${last}`.trim();
  return name || account?.email || teacher.email || "Unnamed teacher";
}

// ─── 5. Create Subject ────────────────────────────────────────────────────────

/**
 * @param props.onComplete - Marks the step done and moves the checklist on.
 * @returns The create-subject step.
 */
export function CreateSubjectStep({ onComplete }: { onComplete: () => void }) {
  const invalidate = useInvalidateReference();
  const [form, setForm] = useState({ name: "", code: "" });

  const mutation = useMutation({
    mutationFn: createSubject,
    onSuccess: () => {
      invalidate.subjects();
      toast.success("Subject created!");
      onComplete();
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to create the subject.")),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Give the subject a name, e.g. Mathematics.");
      return;
    }
    if (!form.code.trim()) {
      toast.error("Give the subject a code, e.g. MATH101.");
      return;
    }
    mutation.mutate({ name: form.name.trim(), code: form.code.trim() });
  };

  return (
    <StepCard stepId="create-subject">
      <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
        <Field label="Subject name" hint="e.g. Mathematics">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Mathematics"
            className={inputCls}
            required
          />
        </Field>
        <Field label="Subject code" hint="e.g. MATH101">
          <input
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            placeholder="MATH101"
            className={inputCls}
            required
          />
        </Field>
        <PrimaryBtn loading={mutation.isPending}>
          <CheckCircle2 className="h-4 w-4" /> Create Subject
        </PrimaryBtn>
      </form>
    </StepCard>
  );
}

// ─── 6. Create Course ─────────────────────────────────────────────────────────

/** The course form's fields, matching `CreateCourseDto`. */
interface CourseForm {
  title: string;
  description: string;
  courseCode: string;
  subjectId: string;
  classId: string;
  teacherId: string;
}

/**
 * @param props.onComplete - Marks the step done and moves the checklist on.
 * @returns The create-course step.
 */
export function CreateCourseStep({ onComplete }: { onComplete: () => void }) {
  const schoolId = useSchoolId();
  const classes = useClasses();
  const subjects = useSubjects();
  const courses = useCourses();
  const invalidate = useInvalidateReference();

  const teachers = useQuery({
    queryKey: queryKeys.teachers.list(schoolId ?? "none", { scope: "all" }),
    queryFn: () => teacherService.getAllTeachers(),
    enabled: Boolean(schoolId),
    staleTime: staleTimes.list,
  });

  const [form, setForm] = useState<CourseForm>({
    title: "",
    description: "",
    courseCode: "",
    subjectId: "",
    classId: "",
    teacherId: "",
  });

  const loading = classes.isLoading || subjects.isLoading || courses.isLoading || teachers.isLoading;

  // A school that already created a course has done this step.
  useEffect(() => {
    if (!courses.isLoading && (courses.data?.length ?? 0) > 0) onComplete();
  }, [courses.isLoading, courses.data, onComplete]);

  const mutation = useMutation({
    mutationFn: createCourse,
    onSuccess: () => {
      invalidate.courses();
      invalidate.subjects();
      toast.success("Course created!");
      onComplete();
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to create the course.")),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subjectId) return toast.error("Choose a subject.");
    if (!form.classId) return toast.error("Choose a class.");
    if (!form.teacherId) return toast.error("Assign a teacher.");
    if (!form.title.trim()) return toast.error("Give the course a title.");
    if (!form.courseCode.trim()) return toast.error("Give the course a code.");
    if (!form.description.trim()) return toast.error("Add a short description.");

    mutation.mutate({
      title: form.title.trim(),
      description: form.description.trim(),
      courseCode: form.courseCode.trim(),
      subjectId: form.subjectId,
      classId: form.classId,
      teacherId: form.teacherId,
    });
  };

  const failedToLoad = classes.isError || subjects.isError || teachers.isError;

  return (
    <StepCard stepId="create-course">
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5 text-sm text-blue-800 leading-relaxed dark:bg-blue-900/20 dark:border-blue-900/40 dark:text-blue-200">
        <p className="font-semibold mb-1">Subjects vs. Courses</p>
        <p>
          A <span className="font-medium">Subject</span> is a broad academic area — e.g.{" "}
          <span className="font-medium">Mathematics</span>. A{" "}
          <span className="font-medium">Course</span> is how that subject is delivered to a specific
          class by a specific teacher.
        </p>
        <p className="mt-1.5">
          For example, Mathematics can have separate courses for{" "}
          <span className="font-medium">Grade 7A</span> and{" "}
          <span className="font-medium">Grade 9B</span> — each with their own assessments, timetable
          slots, and grading.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-gray-500 dark:text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading classes, subjects and teachers…
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
          {failedToLoad && (
            <p role="alert" className="text-xs text-amber-600 dark:text-amber-400">
              Some setup data could not be loaded.{" "}
              <button
                type="button"
                className="font-semibold underline"
                onClick={() => {
                  if (classes.isError) void classes.refetch();
                  if (subjects.isError) void subjects.refetch();
                  if (teachers.isError) void teachers.refetch();
                }}
              >
                Try again
              </button>
            </p>
          )}
          <Field label="Subject">
            <select
              value={form.subjectId}
              onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
              className={inputCls}
              required
            >
              <option value="">Select subject…</option>
              {(subjects.data ?? []).map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
            {(subjects.data?.length ?? 0) === 0 && !subjects.isError && (
              <p className="text-xs text-amber-600 mt-1 dark:text-amber-400">
                No subjects yet — complete the &ldquo;Create First Subject&rdquo; step first.
              </p>
            )}
          </Field>
          <Field label="Assign to class">
            <select
              value={form.classId}
              onChange={(e) => setForm({ ...form, classId: e.target.value })}
              className={inputCls}
              required
            >
              <option value="">Select class…</option>
              {(classes.data ?? []).map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Assign teacher">
            <select
              value={form.teacherId}
              onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
              className={inputCls}
              required
            >
              <option value="">Select teacher…</option>
              {(teachers.data ?? []).map((t) => (
                <option key={t._id} value={teacherUserId(t)}>
                  {teacherLabel(t)}
                </option>
              ))}
            </select>
            {(teachers.data?.length ?? 0) === 0 && !teachers.isError && (
              <p className="text-xs text-amber-600 mt-1 dark:text-amber-400">
                No teachers found — complete the &ldquo;Add First Teacher&rdquo; step first.
              </p>
            )}
          </Field>
          <Field label="Course title" hint="e.g. Mathematics – Grade 7A">
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Mathematics – Grade 7A"
              className={inputCls}
              required
            />
          </Field>
          <Field label="Course code" hint="e.g. MATH-G7A">
            <input
              value={form.courseCode}
              onChange={(e) => setForm({ ...form, courseCode: e.target.value.toUpperCase() })}
              placeholder="MATH-G7A"
              className={inputCls}
              required
            />
          </Field>
          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              placeholder="Brief description of what this course covers…"
              className={`${inputCls} h-auto`}
              required
            />
          </Field>
          <PrimaryBtn loading={mutation.isPending}>
            <CheckCircle2 className="h-4 w-4" /> Create Course
          </PrimaryBtn>
        </form>
      )}
    </StepCard>
  );
}
