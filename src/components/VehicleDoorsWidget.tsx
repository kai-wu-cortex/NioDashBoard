import React from 'react';

interface VehicleDoorsWidgetProps {
  frontLeft: number;   // 1.0 = closed, 0.0 = open
  frontRight: number;
  rearLeft: number;
  rearRight: number;
  engineHood: number;  // 前备箱/引擎盖
  tailgate: number;    // 后备箱
  chargePort: number;  // 充电口
}

const VehicleDoorsWidget: React.FC<VehicleDoorsWidgetProps> = ({
  frontLeft,
  frontRight,
  rearLeft,
  rearRight,
  engineHood,
  tailgate,
  chargePort,
}) => {
  const doors = [
    { id: 'frontLeft', name: 'FL', status: frontLeft },
    { id: 'frontRight', name: 'FR', status: frontRight },
    { id: 'rearLeft', name: 'RL', status: rearLeft },
    { id: 'rearRight', name: 'RR', status: rearRight },
    { id: 'engineHood', name: 'FT', status: engineHood },
    { id: 'tailgate', name: 'RT', status: tailgate },
    { id: 'chargePort', name: 'CP', status: chargePort },
    { id: 'empty1', name: '', status: 1 },
    { id: 'empty2', name: '', status: 1 },
    { id: 'empty3', name: '', status: 1 },
    { id: 'empty4', name: '', status: 1 },
    { id: 'empty5', name: '', status: 1 },
  ];

  // isOpen = status 0.0
  const openCount = doors.filter(d => d.name && d.status === 0.0).length;
  const closedCount = doors.filter(d => d.name && d.status === 1.0).length;

  // 1.0 = closed → white background, border, black bold text
  // 0.0 = open → black background, white text
  const getClassName = (door: {name: string, status: number}) => {
    if (!door.name) return 'w-[62px] h-[29px] rounded-[8px] flex items-center justify-center box-border bg-[#F5F5F5]';
    if (door.status === 1.0) {
      return 'w-[62px] h-[29px] rounded-[8px] flex items-center justify-center box-border border-2 border-black bg-white';
    } else {
      return 'w-[62px] h-[29px] rounded-[8px] flex items-center justify-center box-border bg-black text-white';
    }
  };

  const getTextClassName = (door: {name: string, status: number}) => {
    if (door.status === 1.0) {
      return 'text-[#000000] text-[12px] font-[700] font-jetbrains';
    } else {
      return 'text-[#FFFFFF] text-[12px] font-[500] font-jetbrains';
    }
  };

  return (
    <div className="w-[296px] h-[152px] bg-white rounded-none p-[6px_10px_6px_10px] flex flex-col justify-between gap-[2px]">
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <span className="text-[#000000] text-[16px] font-[600] font-jetbrains">车门</span>
        <div className="flex items-center gap-1 px-[10px] py-[4px] rounded-full bg-black">
          <span className="text-white text-[11px] font-[500] font-jetbrains">
            {openCount} 打开 · {closedCount} 关闭
          </span>
        </div>
      </div>

      {/* Door Grid */}
      <div className="flex flex-col justify-between gap-[4px] flex-1">
        {/* Row 1 */}
        <div className="flex justify-between gap-2">
          {doors.slice(0, 4).map((door) => (
            <div
              key={door.id}
              className={getClassName(door)}
            >
              {door.name && (
                <span className={getTextClassName(door)}>
                  {door.name}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Row 2 */}
        <div className="flex justify-between gap-2">
          {doors.slice(4, 8).map((door) => (
            <div
              key={door.id}
              className={getClassName(door)}
            >
              {door.name && (
                <span className={getTextClassName(door)}>
                  {door.name}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Row 3 */}
        <div className="flex justify-between gap-2">
          {doors.slice(8, 12).map((door) => (
            <div
              key={door.id}
              className={getClassName(door)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default VehicleDoorsWidget;
