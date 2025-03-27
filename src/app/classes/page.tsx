'use client';

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { FiEdit, FiTrash } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { registerStudent, createStudentProfile, getClasses, createClass, Class } from '../services/student.service';
import { getSchoolId } from '../services/school.service';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Classes() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    classDescription: "",
    classCapacity: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [isLoading, setIsLoading] = useState(false);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  useEffect(() => {
    const fetchClasses = async () => {
      setIsLoading(true);
      try {
        const schoolId = getSchoolId();
        if (!schoolId) {
          toast.error('School ID is required');
          return;
        }
    
        const classes = await getClasses();
        setClasses(classes);
      } catch (error) {
        console.error('Error fetching classes:', error);
        toast.error('Failed to load classes. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchClasses();
  }, []);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Validate form data
    if (!formData.name) {
      toast.error('Class name is required');
      setIsLoading(false);
      return;
    }
  
    try {
      const schoolId = getSchoolId();
      if (!schoolId) {
        toast.error('School ID is required');
        setIsLoading(false);
        return;
      }
  
      const classData = {
        name: formData.name,
        classDescription: formData.classDescription,
        classCapacity: formData.classCapacity,
      };
  
      const response = await createClass(classData);
      
      if (!response.ok) {
        const errorData = await response;
        throw new Error(errorData.message || 'Failed to create class');

      }
  
      const data = await response.json();
      
      // Update local state with new class
      setClasses(prev => [...prev, data]);
      
      toast.success('Class created successfully!');
      toggleModal();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to create class. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <main className="flex-grow p-8">
        <Header />
        <h1 className="font-semibold text-3xl py-5 px-5 text-gray-800">Class Overview</h1>

        {/* Classes Table */}
        <section className="bg-white shadow rounded p-6">
          <div className="flex items-center gap-x-4 mb-4">
            <h1 className="text-2xl font-semibold text-gray-800">Classes</h1>
            <button
              className="font-bold text-[#154473] px-4 py-1 bg-gray-200 rounded"
              onClick={toggleModal}
            >
              + Add
            </button>
          </div>

          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4">Class Name</th>
                <th className="text-left py-2 px-4">Capacity</th>
                <th className="text-left py-2 px-4">Subjects Assigned</th>
                <th className="text-left py-2 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedClasses.map((item, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4">{item.name}</td>
                   <td className="py-2 px-4">{item.classCapacity}</td>
                  <td className="py-2 px-4">{item.classDescription}</td> 
                  <td className="py-2 px-4">
                  <a
                    href={`/classes/add-class`} // Replace with your actual URL
                    className="px-3 py-1 bg-white text-[#154473] border border-[#154473] rounded hover:bg-gray-200"
                  >
                    View
                  </a>

                         <button 
                          onClick={() => router.push(`/classes/edit-class/${item._id}`)}
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

          {/* Pagination Controls */}
          <div className="flex justify-between items-center mt-4">
            <button
              className={`px-3 py-1 border rounded ${
                currentPage === 1 ? "text-gray-300 cursor-not-allowed" : "text-blue-500 hover:bg-gray-100"
              }`}
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              &lt; Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              className={`px-3 py-1 border rounded ${
                currentPage === totalPages ? "text-gray-300 cursor-not-allowed" : "text-blue-500 hover:bg-gray-100"
              }`}
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              Next &gt;
            </button>
          </div>
        </section>
      </main>

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
              <h3 className="text-2xl font-semibold text-gray-800">Add Class</h3>
              <button
                className="text-gray-500 hover:text-gray-700 text-2xl"
                onClick={toggleModal}
                disabled={isLoading}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit}>
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
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#154473] text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}