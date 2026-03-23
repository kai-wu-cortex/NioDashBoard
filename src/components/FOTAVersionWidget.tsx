import React from 'react';
import { Package } from 'lucide-react';
import { SoftwareVersionData } from '../types';

const FOTAVersionWidget: React.FC<SoftwareVersionData> = ({
  currentVersion = 'v3.3.1',
  partNumber = 'V0081364 EZ',
  isUpToDate = true
}) => {
  // Extract only the x.x.x part at the end
  const versionMatch = currentVersion.match(/\d+\.\d+\.\d+$/);
  const displayVersion = versionMatch ? versionMatch[0] : currentVersion;

  return (
    <div className="w-[296px] h-[152px] bg-white rounded-none p-[6px_10px_6px_10px] flex flex-col justify-between gap-[2px]">
      {/* Header */}
      <div className="flex items-center gap-2 w-full">
        <Package size={20} className="text-[#000000]" />
        <span className="text-[#000000] text-[14px] font-[500] font-jetbrains">软件版本</span>
      </div>

      {/* Row 1 - Current Version */}
      <div className="flex items-center justify-between w-full">
        <span className="text-[#444444] text-[12px] font-[500] font-jetbrains">当前版本</span>
        <span className="text-[#000000] text-[16px] font-[700] font-jetbrains">{displayVersion}</span>
      </div>

      {/* Row 2 - Part Number */}
      <div className="flex items-center justify-between w-full">
        <span className="text-[#444444] text-[12px] font-[500] font-jetbrains">零件号</span>
        <span className="text-[#000000] text-[14px] font-[600] font-jetbrains">{partNumber}</span>
      </div>

      {/* Row 3 - Status */}
      <div className="flex items-center justify-between w-full">
        <span className="text-[#444444] text-[12px] font-[500] font-jetbrains">状态</span>
        <div className="px-[14px] py-[4px] rounded-full bg-black">
          <span className="text-white text-[12px] font-[600] font-jetbrains">
            {isUpToDate ? '已是最新' : '可更新'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default FOTAVersionWidget;
