import React from "react";
import { FiChevronRight } from "react-icons/fi";
import Image from "next/image";

interface DashboardCardProps {
  id: number;
  icon: string | React.ComponentType<any>;
  count: number;
  label: string;
  details?: React.ReactNode;
  onNavigate: (id: number) => void;
  bgColor?: string;
  iconBg?: string;
  iconColor?: string;
  textColor?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  id,
  icon,
  count,
  label,
  details,
  onNavigate,
  bgColor = "bg-white",
  iconBg = "bg-gray-100",
  iconColor = "text-gray-700",
  textColor = "text-gray-900",
}) => {
  return (
    <div
      className={`${bgColor} p-6 shadow rounded-2xl flex flex-col border border-gray-100 hover:shadow-lg transition-shadow duration-300`}
    >
      <div className="flex items-center gap-5 pt-5">
        <div className={`${iconBg} rounded-[10px] p-3 ${iconColor}`}>
          {typeof icon === "string" ? (
            <Image
              src={icon}
              alt="icon"
              width={28}
              height={28}
              className={iconColor}
            />
          ) : (
            React.createElement(icon, { size: 28, className: iconColor })
          )}
        </div>
        <div className="flex flex-col">
          <p className={`text-[30px] font-medium ${textColor}`}>
            {count.toLocaleString()}
          </p>
          <p className="text-gray-600 text-[16px] font-medium">{label}</p>
        </div>
      </div>

      <div className="pt-4 border-b border-gray-200"></div>

      {details && (
        <>
          <div
            onClick={() => onNavigate(id)}
            className="flex items-center justify-between mt-4 cursor-pointer "
          >
            <span
              className={`font-bold ${textColor} hover:opacity-70 transition-opacity duration-200`}
            >
              See more
            </span>
            <FiChevronRight className={`text-xl ${textColor}`} />
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardCard;
