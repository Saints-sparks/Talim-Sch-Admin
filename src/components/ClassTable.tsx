import type React from "react"
import { FiEdit, FiTrash, FiPlus } from "react-icons/fi"

interface ClassTableProps {
  classes: Array<{
    _id: string
    name: string
    classDescription?: string
    classCapacity?: number
    studentCount: number
  }>
  error: string | null
  onAdd: () => void
  onView: (classId: string) => void
  onEdit: (classId: string) => void
  onDelete: (classId: string) => void
  onRetry: () => void
}

const ClassTable: React.FC<ClassTableProps> = ({
  classes,
  error,
  onAdd,
  onView,
  onEdit,
  onDelete,
  onRetry,
}) => {
  return (
    <div className="px-8">
      <section className="bg-white shadow rounded-[20px] p-6">
        <div className="">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Classes</h3>
            <button
              className="flex items-center font-bold text-[#154473] hover:text-blue-500 transition duration-200"
              onClick={onAdd}
            >
              <FiPlus className="mr-2" /> Add Class
            </button>
          </div>

          {error ? (
            <div className="text-center py-12">
              <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md mx-auto">
                <div className="text-red-600 text-lg font-semibold mb-2">Error Loading Classes</div>
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={onRetry}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : classes.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md mx-auto">
                <div className="text-gray-400 text-6xl mb-4">📚</div>
                <div className="text-gray-600 text-lg font-semibold mb-2">No Classes Found</div>
                <p className="text-gray-500 mb-4">
                  Get started by creating your first class to organize your students and curriculum.
                </p>
                <button
                  onClick={onAdd}
                  className="px-4 py-2 bg-[#154473] text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Create First Class
                </button>
              </div>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4 text-gray-800">Class Name</th>
                  <th className="text-left py-2 px-4 text-gray-800">Capacity</th>
                  <th className="text-left py-2 px-4 text-gray-800">Students</th>
                  <th className="text-left py-2 px-4 text-gray-800">Description</th>
                  <th className="text-left py-2 px-4 text-gray-800">Actions</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((item) => (
                  <tr key={item._id} className="border-b hover:bg-gray-50 transition-colors duration-200">
                    <td className="py-2 px-4 text-gray-800">{item.name}</td>
                    <td className="py-2 px-4 text-gray-800">{item.classCapacity || "N/A"}</td>
                    <td className="py-2 px-4 text-gray-800">
                      <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded">
                        {item.studentCount}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-gray-800">{item.classDescription || "N/A"}</td>
                    <td className="py-2 px-4 flex justify-between">
                      <button
                        className="px-9 py-1 bg-[#0033661A] border-[#00336626] border text-[#003366] rounded hover:bg-blue-600 hover:text-white transition-colors"
                        onClick={() => onView(item._id)}
                      >
                        View
                      </button>
                      <div>
                        <button
                          className="ml-2 px-2 py-1 text-gray-500 hover:text-gray-700 transition-colors"
                          onClick={() => onEdit(item._id)}
                        >
                          <FiEdit className="text-xl" />
                        </button>
                        <button
                          className="ml-2 px-2 py-1 text-red-500 hover:text-red-700 transition-colors"
                          onClick={() => onDelete(item._id)}
                        >
                          <FiTrash className="text-xl" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  )
}

export default ClassTable
