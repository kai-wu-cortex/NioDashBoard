import React from 'react';
import { Thermometer } from 'lucide-react';
import { TemperatureData } from '../types';

const TemperatureWidget: React.FC<TemperatureData> = ({
  inside = 23.0,
  outside = 26.0,
  acOn = true
}) => {
  return (
    <div className="w-[296px] h-[152px] bg-white rounded-none p-[6px_10px_6px_10px] flex flex-col justify-between gap-[2px]">
      {/* Header */}
      <div className="flex items-center justify-between w-full gap-2">
        <span className="text-[#000000] text-[14px] font-[600] font-jetbrains">温度</span>
        <Thermometer size={20} className="text-[#000000]" />
      </div>

      {/* Inside Temperature */}
      <div className="flex items-center justify-between w-full">
        <span className="text-[#444444] text-[14px] font-[500] font-jetbrains">车内温度</span>
        <span className="text-[#000000] text-[17px] font-[700] font-jetbrains">{inside.toFixed(1)}°C</span>
      </div>

      {/* Outside Temperature */}
      <div className="flex items-center justify-between w-full">
        <span className="text-[#444444] text-[14px] font-[500] font-jetbrains">车外温度</span>
        <span className="text-[#000000] text-[17px] font-[700] font-jetbrains">{outside.toFixed(1)}°C</span>
      </div>

      {/* AC Status */}
      <div className="flex items-center justify-between w-full">
        <span className="text-[#444444] text-[14px] font-[500] font-jetbrains">空调状态</span>
        <span className="text-[#000000] text-[15px] font-[600] font-jetbrains">
          {acOn ? 'ON' : 'OFF'}
        </span>
      </div>
    </div>
  );
};

export default TemperatureWidget;
