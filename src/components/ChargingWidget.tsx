import React from 'react';
import { BatteryCharging } from 'lucide-react';

interface ChargingWidgetProps {
  chargingPower: number;
  chargingCurrent: number;
  chargingVoltage: number;
  chrgReq: number;
}

// Max power typically around 100kW for EV charging
const MAX_POWER = 100;

const ChargingWidget: React.FC<ChargingWidgetProps> = ({
  chargingPower = 0,
  chargingCurrent = 0,
  chargingVoltage = 0,
  chrgReq = 0,
}) => {
  const powerPercent = Math.min((chargingPower / MAX_POWER) * 100, 100);

  return (
    <div className="w-[296px] h-[152px] bg-white rounded-none p-[6px_10px_6px_10px] flex flex-col justify-between gap-[4px]">
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <BatteryCharging size={20} className="text-[#000000]" />
          <span className="text-[#000000] text-[16px] font-[600] font-jetbrains">充电信息</span>
        </div>
        <div className="w-[120px] h-[20px] border-2 border-[#000000] rounded-[4px] p-[2px] bg-[#EEEEEE]">
          <div
            className="h-full bg-[#000000] rounded-[2px]"
            style={{ width: `${powerPercent}%` }}
          />
        </div>
      </div>

      {/* Charging Power */}
      <div className="flex items-center justify-between w-full gap-4">
        <span className="text-[#444444] text-[14px] font-[500] font-jetbrains">充电功率</span>
        <span className="text-[#000000] text-[16px] font-[700] font-jetbrains">{chargingPower.toFixed(1)} kW</span>
      </div>

      {/* Current */}
      <div className="flex items-center justify-between w-full">
        <span className="text-[#444444] text-[14px] font-[500] font-jetbrains">电流</span>
        <span className="text-[#000000] text-[16px] font-[700] font-jetbrains">{chargingCurrent.toFixed(1)} A</span>
      </div>

      {/* Voltage */}
      <div className="flex items-center justify-between w-full">
        <span className="text-[#444444] text-[14px] font-[500] font-jetbrains">电压</span>
        <span className="text-[#000000] text-[16px] font-[700] font-jetbrains">{chargingVoltage.toFixed(0)} V</span>
      </div>

      {/* Charge Request */}
      <div className="flex items-center justify-between w-full">
        <span className="text-[#444444] text-[14px] font-[500] font-jetbrains">充电请求</span>
        <div className={`px-[10px] py-[4px] rounded-full ${chrgReq === 1 ? 'bg-black' : 'bg-[#E5E5E5]'}`}>
          <span className={`text-[12px] font-[600] font-jetbrains ${chrgReq === 1 ? 'text-white' : 'text-black'}`}>
            {chrgReq === 1 ? '请求中' : '空闲'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChargingWidget;
