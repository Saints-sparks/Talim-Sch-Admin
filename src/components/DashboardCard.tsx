import React from "react";
import { FiChevronRight } from "react-icons/fi";
import { ChevronRight } from "./Icons";

interface DashboardCardProps {
  id: number;
  icon: React.ComponentType<any> | React.ReactElement;
  count: number;
  label: string;
  onNavigate: (id: number) => void;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  id,
  icon,
  count,
  label,
  onNavigate,
}) => {
  return (
    <div className="h-[168px] px-6 rounded-xl border border-[#F2F2F2] flex flex-col justify-between  bg-white transition-shadow duration-300">
      <div className="flex items-start gap-5 mt-6">
        <div className="border border-[#F1F1F1] rounded-[10px] p-3 ">
          {React.isValidElement(icon)
            ? icon
            : React.createElement(icon as React.ComponentType<any>)}
        </div>
        <div className="flex flex-col">
          <p className="text-[23px] leading-[120%] font-medium">
            {count.toLocaleString()}
          </p>
          <p className="text-[#B3B3B3] text-[13px] font-medium">{label}</p>
        </div>
      </div>

      <div className="pt-4 border-b border-[#EBEBEB] -mx-6"></div>
      <div className="mt-3 mb-5 text-[#808080] font-medium leading-[120%] text-[15px] flex justify-between items-center">
        <span>See more</span> <ChevronRight />
      </div>
    </div>
  );
};

export default DashboardCard;
