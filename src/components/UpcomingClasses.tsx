import React from "react";
import { useRouter } from "next/navigation"; // Import useRouter hook
import { CardHeader, card, pill, primaryButton, selectControl } from "@/components/tl";

/** Props for {@link ClassCard}. */
type ClassCardProps = {
  subject: string;
  title: string;
  duration: string;
  time: string;
  students: number;
  isActive?: boolean;
};

/**
 * One upcoming class: subject, length, title, start time and head count. The
 * class on now wears the navy "now" card.
 *
 * @param props - See {@link ClassCardProps}.
 * @param props.subject - The subject.
 * @param props.title - The lesson's title.
 * @param props.duration - How long it runs.
 * @param props.time - When it starts (or the countdown when on now).
 * @param props.students - How many attend.
 * @param props.isActive - Whether it is on now.
 * @returns The card.
 */
const ClassCard: React.FC<ClassCardProps> = ({
  subject,
  title,
  duration,
  time,
  students,
  isActive = false,
}) => {
  return (
    <div
      className={
        isActive
          ? "flex flex-col gap-4 rounded-[22px] bg-tl-now p-[clamp(18px,2.4vw,24px)] text-white"
          : `${card} flex flex-col gap-4`
      }
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`text-xs font-extrabold uppercase tracking-[0.07em] ${isActive ? "text-white" : "text-tl-faint"}`}
        >
          {subject}
        </span>
        <span
          className={`${pill} ${isActive ? "bg-white/15 text-white" : "bg-tl-track text-tl-muted"}`}
        >
          {duration}
        </span>
      </div>
      <h3 className={`text-lg font-extrabold ${isActive ? "text-white" : "text-tl-ink"}`}>
        {title}
      </h3>
      <div className="flex items-center justify-between gap-2">
        <p className={`text-sm ${isActive ? "text-white" : "text-tl-muted"}`}>
          Class {isActive ? "in" : "by"} {time}
        </p>
        <span className={`text-sm font-bold ${isActive ? "text-white" : "text-tl-muted"}`}>
          +{students}
        </span>
      </div>
    </div>
  );
};

/**
 * A static "Upcoming Classes" strip (sample data). Not mounted by any page;
 * kept for reference.
 *
 * @returns The strip.
 */
const UpcomingClasses: React.FC = () => {
  const router = useRouter(); // Initialize the router

  // Handle the click event to navigate to create class page
  const handleCreateClass = () => {
    router.push("/managetrack/curriculum/classes/create"); // Navigate to the create class page
  };

  const classes = [
    {
      subject: "MATHS",
      title: "Understanding Differentiation and Its Practical Applications",
      duration: "2 hours",
      time: "00:59:05",
      students: 25,
      isActive: true,
    },
    {
      subject: "MATHS",
      title: "Understanding Differentiation and Its Practical Applications",
      duration: "2 hours",
      time: "2:00pm",
      students: 25,
    },
    {
      subject: "MATHS",
      title: "Understanding Differentiation and Its Practical Applications",
      duration: "2 hours",
      time: "4:00pm",
      students: 25,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <CardHeader
        title="Upcoming Classes"
        subtitle="You have 5 classes left today"
        actions={
          <>
            <button type="button" onClick={handleCreateClass} className={primaryButton}>
              + Create Class
            </button>
            <select aria-label="Day" className={selectControl}>
              <option>Today</option>
              <option>Tomorrow</option>
            </select>
          </>
        }
      />

      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr))]">
        {classes.map((classItem, index) => (
          <ClassCard key={index} {...classItem} />
        ))}
      </div>
    </div>
  );
};

export default UpcomingClasses;
