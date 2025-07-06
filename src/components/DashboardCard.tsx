import type React from "react"
import { FiChevronRight, FiChevronDown } from "react-icons/fi"
import Image from "next/image"

interface DashboardCardProps {
  id: number
  icon: string
  count: number
  label: string
  details?: React.ReactNode
  isExpanded: boolean
  onToggle: (id: number) => void
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  id,
  icon,
  count,
  label,
  details,
  isExpanded,
  onToggle,
}) => {
  return (
    <div className="bg-white p-6 shadow rounded-2xl flex flex-col">
      <div className="flex items-center gap-5 pt-5">
        <div className="border-2 rounded-[10px] p-2 border-[#F1F1F1]">
          <Image src={icon} alt="icon" width={32} height={32} />
        </div>
        <div className="flex flex-col">
          <p className="text-[30px] font-medium text-[#030E18]">{count.toLocaleString()}</p>
          <p className="text-[#878787] text-[16px] font-medium">{label}</p>
        </div>
      </div>

      <div className="pt-4 border-b-2 border-[#F1F1F1]"></div>

      {details && (
        <>
          <div
            onClick={() => onToggle(id)}
            className="flex items-center justify-between mt-4 cursor-pointer text-gray-800"
          >
            <span className="font-bold text-[#606060] hover:text-blue-700 transition-colors duration-200">
              {isExpanded ? "See less" : "See more"}
            </span>
            {isExpanded ? (
              <FiChevronDown className="text-xl" />
            ) : (
              <FiChevronRight className="text-xl" />
            )}
          </div>

          {isExpanded && <div className="mt-4 text-gray-800">{details}</div>}
        </>
      )}
    </div>
  )
}

export default DashboardCard
