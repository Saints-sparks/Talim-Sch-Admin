import React from "react";
import { RosterSkeleton } from "@/components/users/RosterSkeleton";

/**
 * The student roster's cards while the first page loads.
 *
 * @returns The skeleton.
 */
const StudentsSkeleton: React.FC = () => <RosterSkeleton label="Loading students" />;

export default StudentsSkeleton;
