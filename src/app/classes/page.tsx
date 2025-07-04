"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { FiEdit, FiTrash } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { getClasses, createClass, Class } from "../services/student.service";
import { getSchoolId } from "../services/school.service";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ClassesSkeleton from "@/components/ClassesSkeleton";

export default function Classes() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: "",
        classDescription: "",
        classCapacity: "",
    });
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [classes, setClasses] = useState<Class[]>([]);

    const totalPages = Math.ceil(classes.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const displayedClasses = classes.slice(startIndex, endIndex);

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const [isModalOpen, setIsModalOpen] = useState(false);

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
        // Reset form when closing modal
        if (!isModalOpen) {
            setFormData({
                name: "",
                classDescription: "",
                classCapacity: "",
            });
        }
    };

    const navigateToAddSubject = () => {
        router.push("/add-subject");
    };

    const handleInputChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    useEffect(() => {
        const fetchClasses = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const schoolId = getSchoolId();
                if (!schoolId) {
                    throw new Error("School ID is required");
                }

                const classes = await getClasses();
                setClasses(classes);
            } catch (error) {
                console.error("Error fetching classes:", error);
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : "Failed to load classes. Please try again later.";
                setError(errorMessage);
                toast.error(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        fetchClasses();
    }, []);

    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsCreating(true);

            // Create class
            const classData = {
                name: formData.name,
                classCapacity: formData.classCapacity,
                classDescription: formData.classDescription,
            };

            await createClass(classData);

            toast.success("Class created successfully!");
            setIsModalOpen(false);
            setFormData({
                name: "",
                classDescription: "",
                classCapacity: "",
            });
            const classes = await getClasses();
            setClasses(classes);
        } catch (error) {
            console.error("Error creating class:", error);
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error("An unexpected error occurred. Please try again.");
            }
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <>
            {isLoading ? (
                <ClassesSkeleton />
            ) : (
                <div className="flex h-screen bg-gray-100">
                    <main className="flex-grow p-8 flex flex-col">
                        <Header />
                        <h1 className="font-semibold text-3xl py-5 px-5 text-gray-800">
                            Class Overview
                        </h1>

                        {/* Classes Table */}
                        <section className="bg-white shadow rounded p-6 flex-1 flex flex-col">
                            <div className="flex items-center gap-x-4 mb-4">
                                <h1 className="text-2xl font-semibold text-gray-800">Classes</h1>
                                <button
                                    className="font-bold text-[#154473] px-4 py-1 bg-gray-200 rounded"
                                    onClick={toggleModal}
                                >
                                    + Add
                                </button>
                            </div>

                            {error ? (
                                <div className="text-center py-12 flex-1 flex items-center justify-center">
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md mx-auto">
                                        <div className="text-red-600 text-lg font-semibold mb-2">
                                            Error Loading Classes
                                        </div>
                                        <p className="text-red-600 mb-4">{error}</p>
                                        <button
                                            onClick={() => window.location.reload()}
                                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                        >
                                            Try Again
                                        </button>
                                    </div>
                                </div>
                            ) : classes.length === 0 ? (
                                <div className="text-center py-12 flex-1 flex items-center justify-center">
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md mx-auto">
                                        <div className="text-gray-400 text-6xl mb-4">🏫</div>
                                        <div className="text-gray-600 text-lg font-semibold mb-2">
                                            No Classes Found
                                        </div>
                                        <p className="text-gray-500 mb-4">
                                            Get started by creating your first class to organize your
                                            students.
                                        </p>
                                        <button
                                            onClick={toggleModal}
                                            className="px-4 py-2 bg-[#154473] text-white rounded hover:bg-blue-700 transition-colors"
                                        >
                                            Create First Class
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col flex-1">
                                    <div className="flex-1">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="text-left py-2 px-4  text-gray-800">
                                                        Class Name
                                                    </th>
                                                    <th className="text-left py-2 px-4 text-gray-800">
                                                        Capacity
                                                    </th>
                                                    <th className="text-left py-2 px-4 text-gray-800">
                                                        Subjects Assigned
                                                    </th>
                                                    <th className="text-left py-2 px-4 text-gray-800">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {displayedClasses.map((item, index) => (
                                                    <tr key={index} className="border-b hover:bg-gray-50">
                                                        <td className="py-2 px-4 text-gray-800">{item.name}</td>
                                                        <td className="py-2 px-4 text-gray-800">
                                                            {item.classCapacity}
                                                        </td>
                                                        <td className="py-2 px-4 text-gray-800">
                                                            {item.classDescription}
                                                        </td>
                                                        <td className="py-2 px-4">
                                                            <button
                                                                onClick={() => router.push(`/classes/${item._id}`)}
                                                                className="px-3 py-1 bg-white text-[#154473] border border-[#154473] rounded hover:bg-gray-200"
                                                            >
                                                                View
                                                            </button>

                                                            <button
                                                                onClick={() =>
                                                                    router.push(`/classes/edit-class/${item._id}`)
                                                                }
                                                                className="ml-2 px-2 py-1 text-gray-500 hover:text-gray-700"
                                                                aria-label="Edit class"
                                                            >
                                                                <FiEdit className="text-xl" />
                                                            </button>

                                                            <button className="ml-2 px-2 py-1 text-red-500 hover:text-red-700">
                                                                <FiTrash className="text-xl" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination Controls - Now at the bottom */}
                                    <div className="flex justify-between items-center mt-4 pt-4 border-t">
                                        <span className="text-sm text-gray-600">
                                            Showing {startIndex + 1} to{" "}
                                            {Math.min(endIndex, classes.length)} of {classes.length}{" "}
                                            classes
                                        </span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handlePrevPage}
                                                disabled={currentPage === 1}
                                                className={`px-3 py-1 border rounded bg-[#154473] text-white transition-colors ${currentPage === 1
                                                        ? "opacity-50 cursor-not-allowed"
                                                        : "hover:bg-blue-700"
                                                    }`}
                                            >
                                                Previous
                                            </button>
                                            <span className="px-3 py-1 text-sm text-gray-600">
                                                Page {currentPage} of {totalPages}
                                            </span>
                                            <button
                                                onClick={handleNextPage}
                                                disabled={currentPage === totalPages}
                                                className={`px-3 py-1 border rounded bg-[#154473] text-white transition-colors ${currentPage === totalPages
                                                        ? "opacity-50 cursor-not-allowed"
                                                        : "hover:bg-blue-700"
                                                    }`}
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </section>
                    </main>
                </div>
            )}

            {/* Add Class Modal */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex justify-end"
                    onClick={toggleModal}
                >
                    <div
                        className="h-full w-full md:w-1/2 bg-white p-6 shadow-lg overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-semibold text-gray-800">
                                Add Class
                            </h3>
                            <button
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                                onClick={toggleModal}
                                disabled={isCreating}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleCreateClass}>
                            <div className="mb-4 flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-gray-700 font-semibold mb-2">
                                        Class Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="Enter class name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="flex-1">
                                    <label className="block text-gray-700 font-semibold mb-2">
                                        Class Capacity (Optional)
                                    </label>

                                    <select
                                        name="classCapacity"
                                        value={formData.classCapacity}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="" disabled selected>
                                            Choose your class capacity
                                        </option>
                                        <option value="10">10</option>
                                        <option value="20">20</option>
                                        <option value="30">30</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 font-semibold mb-2">
                                    Class Description (Optional)
                                </label>
                                <textarea
                                    name="classDescription"
                                    placeholder="Provide additional notes about the class."
                                    value={formData.classDescription}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={4}
                                ></textarea>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex justify-end gap-4 mt-6">
                                <button
                                    type="button"
                                    className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                                    onClick={toggleModal}
                                    disabled={isCreating}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-[#154473] text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
                                    disabled={isCreating}
                                >
                                    {isCreating ? (
                                        <>
                                            <svg
                                                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                ></circle>
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                ></path>
                                            </svg>
                                            Creating...
                                        </>
                                    ) : (
                                        "Create"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
