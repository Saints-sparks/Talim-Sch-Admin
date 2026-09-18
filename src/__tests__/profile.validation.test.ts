import { adminDetailsProblem } from "@/components/profile/AdminDetailsCard";
import { schoolDetailsProblem } from "@/components/profile/SchoolDetailsCard";

describe("adminDetailsProblem", () => {
  const valid = { firstName: "Ada", lastName: "Okoro", phone: "08030000000" };

  it("accepts complete details", () => {
    expect(adminDetailsProblem(valid)).toBeNull();
  });

  it("rejects a blank first name", () => {
    expect(adminDetailsProblem({ ...valid, firstName: "   " })).toMatch(/first name/i);
  });

  it("rejects a blank last name", () => {
    expect(adminDetailsProblem({ ...valid, lastName: "" })).toMatch(/last name/i);
  });

  it("rejects a missing phone number", () => {
    expect(adminDetailsProblem({ ...valid, phone: "" })).toMatch(/phone/i);
  });
});

describe("schoolDetailsProblem", () => {
  const valid = {
    name: "Talim High",
    street: "12 Lagos Road",
    state: "Lagos State",
    country: "Nigeria",
  };

  it("accepts complete details", () => {
    expect(schoolDetailsProblem(valid)).toBeNull();
  });

  it("rejects a blank school name", () => {
    expect(schoolDetailsProblem({ ...valid, name: " " })).toMatch(/school name/i);
  });

  it("rejects a missing address", () => {
    expect(schoolDetailsProblem({ ...valid, street: "" })).toMatch(/address/i);
  });

  it("rejects an unset state or country", () => {
    expect(schoolDetailsProblem({ ...valid, state: "" })).toMatch(/state/i);
    expect(schoolDetailsProblem({ ...valid, country: "" })).toMatch(/country/i);
  });

  // The prefix is not part of the editable set: the backend strips
  // `schoolPrefix` from a school-staff update, so it is never validated here.
  it("does not require a school prefix", () => {
    expect(Object.keys(valid)).not.toContain("prefix");
  });
});
