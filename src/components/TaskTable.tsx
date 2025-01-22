"use client";
import bg from "../../public/img/picstude.png";
import TaskRow from "./TaskRow";



// In TaskRow.tsx
interface TaskRowProps {
  name: string;
  student: string ; // To handle `bg` image type and string
  className: string;
  duration: string;
  status: string; // Change from '"In Progress" | "Pending" | "Completed"' to 'string'
  completed: number;
  total: number;
}

const TaskTable: React.FC = () => {
  const tasks = [
    {
      name: "Further Mathematics",
      student: bg,
      className: "Ss 2",
      duration: "16 hours",
      status: "In Progress", // Correct value
      completed: 5,
      total: 20,
    },
    {
      name: "Mathematics",
      student: "Ss 3",
      className: "Ss 3",
      duration: "14 hours",
      status: "Pending", // Correct value
      completed: 5,
      total: 20,
    },
    {
      name: "Statistics",
      student: "Ss 2",
      className: "Ss 2",
      duration: "6 hours",
      status: "Completed", // Correct value
      completed: 20,
      total: 20,
    },
    {
      name: "Mathematics",
      student: "Jss 1",
      className: "Jss 1",
      duration: "5 hours",
      status: "Completed", // Correct value
      completed: 20,
      total: 20,
    },
  ];
  

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Tasks</h2>
        <p className="text-sm text-gray-600">
          Keep track of your students' assignments and course activities.
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border-collapse ">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                Name
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                Student
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                Class
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                Duration
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                Status
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                Completion rate
              </th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <TaskRow
                key={task.name}
                {...{
                  ...task,
                  status: task.status as "In Progress" | "Pending" | "Completed", // Type assertion
                }}
              />
            ))}
          </tbody>

        </table>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <span>Row per page: 4</span>
        <span>Showing 1-4 of 40</span>
        <div className="flex space-x-2">
          <button className="px-2 py-1 border border-gray-300 rounded-md">
            &lt;
          </button>
          <button className="px-2 py-1 border border-gray-300 rounded-md">
            &gt;
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskTable;
