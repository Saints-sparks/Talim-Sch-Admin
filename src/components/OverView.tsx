import React from "react";

const Overview = () => {
  const data = [
    {
      title: "Total class",
      count: 152,
      percentage: "25%",
      tooltip: "25+",
      bgColor: "bg-blue-100",
      textColor: "text-blue-600",
      percentageColor: "text-blue-500",
    },
    {
      title: "Total students",
      count: 301,
      percentage: "30%",
      tooltip: "70+",
      bgColor: "bg-green-100",
      textColor: "text-green-600",
      percentageColor: "text-green-500",
    },
    {
      title: "Total courses",
      count: 465,
      percentage: "50%",
      tooltip: "80+",
      bgColor: "bg-yellow-100",
      textColor: "text-yellow-600",
      percentageColor: "text-yellow-500",
    },
  ];

  return (
    <div className="p-6  space-y-4">
      <h2 className="text-lg font-bold text-gray-800">Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-[1092px] h-[236px]">
        {data.map((item, index) => (
          <div
            key={index}
            className={`p-4  flex flex-col w-[350px] h-[236px] gap-4 rounded-lg shadow-md bg-white`}
          >
            {/* Title */}
            <h3 className="text-sm font-medium text-gray-600">{item.title}</h3>

            {/* Main Content */}
            <div className="flex items-center justify-between mt-4">
              {/* Count */}
              <div>
                <p className={`text-2xl font-bold ${item.textColor}`}>
                  {item.count}
                </p>
                {/* Percentage */}
                <div className="flex items-center mt-2 h-[30px] w-[74px] bg-[#ADBECE] rounded-full px-3">
                  <span
                    className={`flex items-center justify-center w-5 h-5 rounded-full text-white ${item.textColor} text-sm mr-2`}
                  >
                    ↑
                  </span>
                  <span
                    className={`text-[16px] font-medium text-[#003366]`}
                  >
                    {item.percentage}
                  </span>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="relative flex items-end justify-center w-12 h-20 space-x-1">
                <div className="w-3 h-10 bg-gray-200 rounded-md"></div>
                <div
                  className={`w-3 bg-gray-400 rounded-md`}
                  style={{ height: "70%" }}
                >
                  {/* Tooltip */}
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded-md shadow-md">
                    {item.tooltip}
                  </div>
                </div>
                <div className="w-3 h-8 bg-gray-200 rounded-md"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Overview;
