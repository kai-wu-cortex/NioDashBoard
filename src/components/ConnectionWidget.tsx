import React from 'react';
import { Wifi } from 'lucide-react';
import { ConnectionData } from '../types';

const ConnectionWidget: React.FC<ConnectionData> = ({
  cdcConnected = true,
  adcConnected = true,
  accountId = '412125065'
}) => {
  return (
    <div className="w-[296px] h-[152px] bg-white rounded-none p-[6px_10px_6px_10px] flex flex-col justify-between gap-[2px]">
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <span className="text-[#000000] text-[14px] font-[600] font-jetbrains">连接状态</span>
        <Wifi size={20} className="text-[#000000]" />
      </div>

      {/* CDC Connection */}
      <div className="flex items-center justify-between w-full">
        <span className="text-[#444444] text-[14px] font-[500] font-jetbrains">CDC连接</span>
        <div className="px-[8px] py-[4px] rounded-[4px] bg-[#e8e8e8]">
          <span className="text-[#000000] text-[16px] font-[600] font-jetbrains">
            {cdcConnected ? 'Yes' : 'No'}
          </span>
        </div>
      </div>

      {/* ADC Connection */}
      <div className="flex items-center justify-between w-full">
        <span className="text-[#444444] text-[14px] font-[500] font-jetbrains">ADC连接</span>
        <div className="px-[8px] py-[4px] rounded-[4px] bg-[#e8e8e8]">
          <span className="text-[#000000] text-[16px] font-[600] font-jetbrains">
            {adcConnected ? 'Yes' : 'No'}
          </span>
        </div>
      </div>

      {/* Account ID */}
      <div className="flex items-center justify-between w-full">
        <span className="text-[#444444] text-[14px] font-[500] font-jetbrains">账户ID</span>
        <span className="text-[#000000] text-[16px] font-[600] font-jetbrains">{accountId}</span>
      </div>
    </div>
  );
};

export default ConnectionWidget;
