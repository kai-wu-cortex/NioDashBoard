import React from 'react';
import { DoorOpen } from 'lucide-react';

interface DoorsWindowsWidgetProps {
  driverDoor: boolean;
  passengerDoor: boolean;
  rearLeftDoor: boolean;
  rearRightDoor: boolean;
  frontTrunk: boolean;
  isLocked: boolean;
}

const DoorsWindowsWidget: React.FC<DoorsWindowsWidgetProps> = (props) => {
  const items = [
    { key: 'driverDoor', label: '左前门', value: props.driverDoor },
    { key: 'passengerDoor', label: '右前门', value: props.passengerDoor },
    { key: 'rearLeftDoor', label: '左后门', value: props.rearLeftDoor },
    { key: 'rearRightDoor', label: '右后门', value: props.rearRightDoor },
    { key: 'frontTrunk', label: '后备箱', value: props.frontTrunk },
  ];

  return (
    <div className="w-[296px] h-[152px] bg-white rounded-none p-[6px_10px_6px_10px] flex flex-col justify-between gap-[2px]">
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <span className="text-[#000000] text-[16px] font-[600] font-jetbrains">门窗状态</span>
        <div className={`flex items-center gap-1 px-[10px] py-[4px] rounded-full ${
          props.isLocked ? 'bg-green-600' : 'bg-black'
        }`}>
          <div className="w-2 h-2 rounded-full bg-white" />
          <span className="text-white text-[11px] font-[600] font-jetbrains">
            {props.isLocked ? '已锁定' : '未锁定'}
          </span>
        </div>
        <DoorOpen size={20} className="text-[#000000]" />
      </div>

      {/* Content with toggles */}
      <div className="flex flex-col justify-between gap-[2px] flex-1">
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <span className="text-[#444444] text-[13px] font-[500] font-jetbrains">{item.label}</span>
            </div>
            <div
              className={`w-[34px] h-[16px] rounded-[12px] flex items-center px-[1px] ${
                item.value ? 'bg-black justify-end' : 'bg-[#E5E5E5] justify-start'
              }`}
            >
              <div className="w-[14px] h-[14px] rounded-full bg-white" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DoorsWindowsWidget;
