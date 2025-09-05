"use client";

import React, { useState, useEffect } from "react";
import { FiUpload, FiEdit2, FiSave } from "react-icons/fi";
import { studentService, updateStudent } from "@/app/services/student.service";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

interface ProfileData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  profileImage: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  relationship: string;
  parentAddress: string;
  studentId: string;
  className: string;
  enrollmentDate: string;
  subjects: string[];
  attendance: string;
  [key: string]: string | string[]; // Index signature for dynamic field access
}

const StudentProfile = () => {
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const student = await studentService.getStudentById(studentId);
        console.log("API Response:", student);

        if (!student) {
          throw new Error("No student data found");
        }

        // Map the response to your frontend structure
        const profileData: ProfileData = {
          // Personal Details
          firstName: student.userId?.firstName || "",
          lastName: student.userId?.lastName || "",
          phoneNumber: student.userId?.phoneNumber || "",
          email: student.userId?.email || "",
          dateOfBirth: student.userId?.dateOfBirth || "Not specified",
          gender: student.userId?.gender || "Not specified",
          profileImage: student.userId?.userAvatar || "",

          // Parent/Guardian Information
          parentName: student.parentContact?.fullName || "",
          parentPhone: student.parentContact?.phoneNumber || "",
          parentEmail: student.parentContact?.email || "",
          relationship: student.parentContact?.relationship || "",
          parentAddress: "Not specified",

          // Academic Information
          studentId: student._id || "",
          className: student.classId?.name || "",
          enrollmentDate:
            student.enrollmentDate || new Date().toISOString().split("T")[0],
          subjects: student.assignedSubjects || [
            "Mathematics",
            "English",
            "Science",
          ],
          attendance: student.attendance || "Present",
        };

        setProfileData(profileData);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch student data";
        setError(errorMessage);
        console.error("Error fetching student data:", err);
        toast.error("Error loading student data", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        if (errorMessage.includes("not found")) {
          router.push("/students");
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (studentId) {
      fetchStudentData();
    }
  }, [studentId, router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    if (!profileData) return;
    const { name, value } = e.target;
    setProfileData((prev) => {
      if (!prev) return null;
      return { ...prev, [name]: value };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!profileData || !e.target.files || !e.target.files[0]) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (!event.target?.result) return;
      const result = event.target.result as string;
      setProfileData((prev) => {
        if (!prev) return null;
        return { ...prev, profileImage: result };
      });
    };
    reader.readAsDataURL(e.target.files[0]);
  };

  const handleSave = async () => {
    if (!profileData) return;

    try {
      setIsLoading(true);

      const studentData: Partial<any> = {
        userId: {
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          phoneNumber: profileData.phoneNumber,
          email: profileData.email,
          dateOfBirth: profileData.dateOfBirth,
          gender: profileData.gender,
          userAvatar: profileData.profileImage,
        },
        parentContact: {
          fullName: profileData.parentName,
          phoneNumber: profileData.parentPhone,
          email: profileData.parentEmail,
          relationship: profileData.relationship,
        },
        enrollmentDate: profileData.enrollmentDate,
        assignedSubjects: profileData.subjects,
        attendance: profileData.attendance,
      };

      await updateStudent(studentId, studentData);

      toast.success("Profile updated successfully", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      setEditMode(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update profile";
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderTabContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      );
    }

    if (error)
      return <div className="text-center py-8 text-red-500">{error}</div>;
    if (!profileData)
      return <div className="text-center py-8">No student data found</div>;

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-2 sm:gap-0">
          <div></div>
          <button
            onClick={() => setEditMode(!editMode)}
            className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <FiEdit2 className="w-4 h-4" />{" "}
            {editMode ? "Cancel" : "Edit Profile"}
          </button>
        </div>

        {activeTab === "personal" && (
          <div className="space-y-6">
            {/* Profile Picture */}
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-700 mb-3">
                Profile Picture
              </h3>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mx-auto sm:mx-0">
                  {profileData.profileImage ? (
                    <img
                      src={profileData.profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-400 text-lg sm:text-xl">
                      {profileData.firstName?.charAt(0)}
                      {profileData.lastName?.charAt(0)}
                    </span>
                  )}
                </div>
                {editMode && (
                  <div className="flex justify-center sm:justify-start">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                      <div className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 text-sm sm:text-base">
                        <FiUpload className="w-4 h-4" />
                        <span className="hidden sm:inline">Upload Photo</span>
                        <span className="sm:hidden">Upload</span>
                      </div>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Personal Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
              {[
                {
                  label: "First Name",
                  name: "firstName",
                  type: "text",
                  placeholder: "Enter first name",
                },
                {
                  label: "Last Name",
                  name: "lastName",
                  type: "text",
                  placeholder: "Enter last name",
                },
                {
                  label: "Phone Number",
                  name: "phoneNumber",
                  type: "tel",
                  placeholder: "e.g +2345255364",
                },
                {
                  label: "Email Address",
                  name: "email",
                  type: "email",
                  placeholder: "e.g 123@gmail.com",
                },
                {
                  label: "Date of Birth",
                  name: "dateOfBirth",
                  type: "text",
                  placeholder: "DD.MM.YYYY",
                },
                {
                  label: "Gender",
                  name: "gender",
                  type: "select",
                  options: ["Male", "Female", "Other"],
                },
              ].map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label}
                  </label>
                  {editMode ? (
                    field.type === "select" ? (
                      <select
                        name={field.name}
                        value={profileData?.[field.name] || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-3 sm:px-4 sm:py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black text-base"
                      >
                        {field.options?.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        name={field.name}
                        value={profileData?.[field.name] || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-3 sm:px-4 sm:py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black text-base"
                        placeholder={field.placeholder}
                      />
                    )
                  ) : (
                    <div className="px-3 py-3 sm:px-4 sm:py-2 bg-gray-50 rounded-md text-black text-base">
                      {profileData?.[field.name] || "Not specified"}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "parent" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {[
                { label: "Full Name", name: "parentName", type: "text" },
                { label: "Phone Number", name: "parentPhone", type: "tel" },
                { label: "Email Address", name: "parentEmail", type: "email" },
                { label: "Relationship", name: "relationship", type: "text" },
                {
                  label: "Address",
                  name: "parentAddress",
                  type: "text",
                  colSpan: "sm:col-span-2",
                },
              ].map((field) => (
                <div key={field.name} className={field.colSpan || ""}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label}
                  </label>
                  {editMode ? (
                    <input
                      type={field.type}
                      name={field.name}
                      value={profileData?.[field.name] || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-3 sm:px-4 sm:py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black text-base"
                    />
                  ) : (
                    <div className="px-3 py-3 sm:px-4 sm:py-2 bg-gray-50 rounded-md text-black text-base">
                      {profileData?.[field.name] || "Not specified"}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "academic" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {[
                { label: "Student ID", name: "studentId", type: "text" },
                { label: "Class Name", name: "className", type: "text" },
                {
                  label: "Enrollment Date",
                  name: "enrollmentDate",
                  type: "text",
                },
                {
                  label: "Subjects",
                  name: "subjects",
                  type: "text",
                  colSpan: "sm:col-span-2",
                },
                {
                  label: "Attendance",
                  name: "attendance",
                  type: "text",
                  colSpan: "sm:col-span-2",
                },
              ].map((field) => (
                <div key={field.name} className={field.colSpan || ""}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label}
                  </label>
                  {editMode ? (
                    <input
                      type={field.type}
                      name={field.name}
                      value={profileData?.[field.name] || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-3 sm:px-4 sm:py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black text-base"
                    />
                  ) : (
                    <div className="px-3 py-3 sm:px-4 sm:py-2 bg-gray-50 rounded-md text-black text-base">
                      {profileData?.[field.name] || "Not specified"}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {editMode && (
          <div className="flex justify-center sm:justify-end mt-6">
            <button
              onClick={handleSave}
              className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center justify-center gap-2 text-gray-700 font-medium"
            >
              <FiSave className="w-4 h-4" /> Save Changes
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white rounded-lg shadow-sm">
        {/* Horizontal Tabs */}
        {!isLoading && !error && profileData && (
          <div className="border-b border-gray-200 mb-4 sm:mb-6">
            <nav className="-mb-px flex flex-col sm:flex-row sm:space-x-8">
              {[
                { id: "personal", label: "Personal Details" },
                { id: "parent", label: "Parent/Guardian" },
                { id: "academic", label: "Academic Information" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-sm sm:text-base text-gray-700 w-full sm:w-auto text-center sm:text-left ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">
                    {tab.id === "personal"
                      ? "Personal"
                      : tab.id === "parent"
                      ? "Guardian"
                      : "Academic"}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        )}

        {/* Tab Content */}
        <div className="p-2 sm:p-4">{renderTabContent()}</div>

        {/* Footer */}
        {!isLoading && !error && profileData && (
          <div className="mt-6 sm:mt-10 pt-4 sm:pt-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Last Updated
                </h3>
                <p className="text-base sm:text-lg font-semibold text-gray-800">
                  {profileData.firstName} {profileData.lastName}
                </p>
              </div>
              <div className="text-xs sm:text-sm text-gray-500 font-mono">
                Student ID: {profileData.studentId}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentProfile;
