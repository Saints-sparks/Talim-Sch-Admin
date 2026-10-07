import React from "react";
import { RosterSkeleton } from "@/components/users/RosterSkeleton";

/**
 * The teacher roster's cards while the first page loads.
 *
 * @returns The skeleton.
 */
const TeachersSkeleton: React.FC = () => <RosterSkeleton label="Loading teachers" />;

export default TeachersSkeleton;
