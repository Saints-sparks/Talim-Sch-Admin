/** @jest-environment jsdom */
import React from "react";
import { render, screen } from "@/test-utils/render";
import { ClassCard } from "@/components/classes/ClassCard";
import type { ClassDetail } from "@/components/classes/class.model";

const base: ClassDetail = {
  _id: "class-1",
  name: "Grade 1A",
  gradeLevel: "Grade 1",
  classCapacity: "30",
  courses: [],
  students: [],
};

describe("ClassCard enrolment", () => {
  it("shows the enrolled count the list route sends, not the empty embedded list", () => {
    render(<ClassCard classItem={{ ...base, studentCount: 2 }} onOpen={jest.fn()} onEdit={jest.fn()} />);

    expect(screen.getByText("2/30")).toBeInTheDocument();
  });

  it("falls back to the embedded students when the count is absent", () => {
    render(
      <ClassCard
        classItem={{ ...base, students: [{ _id: "s1" }, { _id: "s2" }, { _id: "s3" }] }}
        onOpen={jest.fn()}
        onEdit={jest.fn()}
      />,
    );

    expect(screen.getByText("3/30")).toBeInTheDocument();
  });

  it("shows 0 for a class with no students", () => {
    render(<ClassCard classItem={{ ...base, studentCount: 0 }} onOpen={jest.fn()} onEdit={jest.fn()} />);

    expect(screen.getByText("0/30")).toBeInTheDocument();
  });
});
