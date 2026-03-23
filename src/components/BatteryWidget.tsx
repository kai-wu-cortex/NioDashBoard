import React from 'react';
import { Battery } from 'lucide-react';
import { BatteryData } from '../types';

const BatteryWidget: React.FC<BatteryData> = ({
  isCharging = false,
  soc = 67,
  range = 388,
  totalMileage = 78485
}) => {
  return (
    <div className="w-[296px] h-[152px] bg-white rounded-none p-[6px_10px_6px_10px] flex flex-col justify-between gap-[2px]">
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <Battery size={20} className="text-[#111111]" />
          <span className="text-[#111111] text-[16px] font-[600] font-jetbrains">电池</span>
        </div>
        <div className="flex items-center gap-1 px-[10px] py-[4px] rounded-full bg-[#E8E8E8]">
          <span className="text-[#444444] text-[11px] font-[600] font-jetbrains">
            {isCharging ? '充电中' : '未充电'}
          </span>
        </div>
      </div>

      {/* SOC Row */}
      <div className="flex items-center justify-between w-full">
        <span className="text-[#444444] text-[14px] font-[500] font-jetbrains">电池电量</span>
        <div className="flex items-center gap-2">
          <div className="w-[120px] h-[24px] border-2 border-[#000000] rounded-[4px] p-[3px] bg-[#EEEEEE]">
            <div
              className="h-full bg-[#000000] rounded-[2px]"
              style={{ width: `${soc}%` }}
            />
          </div>
          <span className="text-[#000000] text-[18px] font-[700] font-jetbrains">{soc}%</span>
        </div>
      </div>

      {/* Range Row */}
      <div className="flex items-center justify-between w-full">
        <span className="text-[#444444] text-[14px] font-[500] font-jetbrains">剩余续航</span>
        <span className="text-[#111111] text-[17px] font-[700] font-jetbrains">{range} km</span>
      </div>

      {/* Total Mileage Row */}
      <div className="flex items-center justify-between w-full">
        <span className="text-[#444444] text-[14px] font-[500] font-jetbrains">总里程</span>
        <span className="text-[#111111] text-[17px] font-[700] font-jetbrains">
          {totalMileage.toLocaleString()} km
        </span>
      </div>
    </div>
  );
};

export default BatteryWidget;
