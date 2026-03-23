import React from 'react';
import { Car } from 'lucide-react';
import { VehicleInfoData } from '../types';

const VehicleInfoWidget: React.FC<VehicleInfoData> = ({
  totalMileage = 78485,
  vehicleId = 'c367...08b43',
  status = 'Ready'
}) => {
  const statusColor = status === 'Ready' ? '#32D583' : '#E85A4F';

  return (
    <div className="w-[296px] h-[152px] bg-white rounded-none p-[6px_10px_6px_10px] flex flex-col justify-between gap-[2px]">
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <span className="text-[#000000] text-[16px] font-[600] font-jetbrains">车辆信息</span>
        <Car size={20} className="text-[#000000]" />
      </div>

      {/* Total Mileage */}
      <div className="flex items-center justify-between w-full">
        <span className="text-[#444444] text-[14px] font-[500] font-jetbrains">总里程</span>
        <span className="text-[#000000] text-[17px] font-[700] font-jetbrains">
          {totalMileage.toLocaleString()} km
        </span>
      </div>

      {/* Vehicle ID */}
      <div className="flex items-center justify-between w-full">
        <span className="text-[#444444] text-[14px] font-[500] font-jetbrains">车辆编号</span>
        <span className="text-[#000000] text-[14px] font-[600] font-jetbrains">{vehicleId}</span>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between w-full">
        <span className="text-[#444444] text-[14px] font-[500] font-jetbrains">车辆状态</span>
        <span className="text-[15px] font-[600] font-jetbrains" style={{ color: statusColor }}>
          {status}
        </span>
      </div>

      {/* Status Dots */}
      <div className="flex justify-between px-[30px] w-full pb-[4px]">
        <div className="w-[14px] h-[14px] rounded-full bg-[#32D583]" />
        <div className="w-[14px] h-[14px] rounded-full bg-[#FFB547]" />
        <div className="w-[14px] h-[14px] rounded-full bg-[#E85A4F]" />
        <div className="w-[14px] h-[14px] rounded-full bg-[#6B6B70]" />
      </div>
    </div>
  );
};

export default VehicleInfoWidget;
