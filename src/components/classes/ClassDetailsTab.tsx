"use client";

/**
 * The "Class Details" tab: the class's own fields as tiles, and the three
 * counters derived from them as stat tiles.
 */
import React from "react";
import { BookOpen, GraduationCap, Info, User, Users } from "lucide-react";
import { CardHeader, StatGrid, StatTile, card } from "@/components/tl";
import { ClassInfoTile } from "@/components/classes/ClassInfoTile";
import { classTeacherName, type ClassDetail } from "@/components/classes/class.model";

/** Props for {@link ClassDetailsTab}. */
interface ClassDetailsTabProps {
  /** The class to describe. */
  classData: ClassDetail;
}

/**
 * Renders the details tab.
 *
 * @param props - See {@link ClassDetailsTabProps}.
 * @param props.classData - The class to describe.
 * @returns The tab body.
 */
export function ClassDetailsTab({ classData }: ClassDetailsTabProps) {
  const courseCount = classData.courses?.length ?? 0;
  const hasTeacher = classTeacherName(classData) !== "No teacher assigned";

  return (
    <div className="flex flex-col gap-[18px]">
      <StatGrid label="Class figures">
        <StatTile
          label="Total Courses"
          value={courseCount}
          icon={<BookOpen />}
          hint={courseCount === 1 ? "course assigned" : "courses assigned"}
        />
        <StatTile
          label="Class Capacity"
          value={classData.classCapacity || "0"}
          icon={<Users />}
          hint="students at most"
        />
        <StatTile
          label="Class Teacher"
          value={hasTeacher ? 1 : 0}
          icon={<User />}
          hint={hasTeacher ? classTeacherName(classData) : "None assigned yet"}
        />
      </StatGrid>

      <section className={card}>
        <CardHeader title={classData.name} subtitle="Class information and statistics" />
        <div className="mt-[18px] grid grid-cols-1 gap-3 md:grid-cols-2">
          <ClassInfoTile label="Class Name" icon={<GraduationCap />} value={classData.name} />
          <ClassInfoTile
            label="Grade Level"
            icon={<GraduationCap />}
            value={classData.gradeLevel || "Not set"}
          />
          <ClassInfoTile
            label="Total Courses"
            icon={<BookOpen />}
            value={`${courseCount} courses`}
          />
          <ClassInfoTile
            label="Class Capacity"
            icon={<Users />}
            value={classData.classCapacity || "Not set"}
          />
          <ClassInfoTile
            label="Class Teacher"
            icon={<User />}
            value={classTeacherName(classData)}
            tooltip="The form teacher responsible for this class. Assign one from the edit page."
          />
          <ClassInfoTile
            label="Class Description"
            icon={<Info />}
            value={
              <span className="font-medium text-tl-body">
                {classData.classDescription || "No description available"}
              </span>
            }
            className="md:col-span-2"
          />
        </div>
      </section>
    </div>
  );
}
