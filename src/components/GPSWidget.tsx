import React from 'react';
import { Navigation } from 'lucide-react';
import { GPSData } from '../types';

const GPSWidget: React.FC<GPSData> = ({
  longitude = 113.8420,
  latitude = 22.7261,
  address = '广东省深圳市宝安区停车场'
}) => {
  return (
    <div className="w-[296px] h-[152px] bg-white rounded-none p-[6px_10px_6px_10px] flex flex-col justify-between gap-[8px]">
      {/* Header */}
      <div className="flex items-center justify-between w-full rounded-[6px] bg-[#F8F8F8] px-[10px] py-[5px]">
        <span className="text-[#000000] text-[16px] font-[600] font-jetbrains">GPS位置</span>
        <Navigation size={20} className="text-[#000000]" />
      </div>

      {/* Coords */}
      <div className="flex flex-col justify-between gap-[8px] w-full flex-1">
        {/* Longitude */}
        <div className="flex items-center justify-between w-full rounded-[6px] bg-[#F5F5F5] px-[12px] py-[8px]">
          <span className="text-[#333333] text-[14px] font-[500] font-jetbrains">经度</span>
          <span className="text-[#000000] text-[17px] font-[700] font-jetbrains">{longitude.toFixed(4)}</span>
        </div>

        {/* Latitude */}
        <div className="flex items-center justify-between w-full rounded-[6px] bg-[#F5F5F5] px-[12px] py-[8px]">
          <span className="text-[#333333] text-[14px] font-[500] font-jetbrains">纬度</span>
          <span className="text-[#000000] text-[17px] font-[700] font-jetbrains">{latitude.toFixed(4)}</span>
        </div>
      </div>
    </div>
  );
};

export default GPSWidget;
