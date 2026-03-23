import React from 'react';
import { Fan, Circle, Flame } from 'lucide-react';

interface SeatHeatingWidgetProps {
  steeringWheel: number;
  frontLeft: number;
  frontRight: number;
  rearLeft: number;
  rearRight: number;
  frontLeftVent: number;
  frontRightVent: number;
  rearLeftVent: number;
  rearRightVent: number;
}

// 0 = closed → white background, border black, black bold text
// >0 = open → black background, white text
const getItemClassName = (value: number) => {
  if (value === 0) {
    return 'h-[29px] rounded-[8px] flex items-center justify-center box-border border-2 border-black bg-white';
  } else {
    return 'h-[29px] rounded-[8px] flex items-center justify-center box-border bg-black text-white';
  }
};

const getCellClassName = (value: number) => {
  if (value === 0) {
    return 'w-[62px] h-[29px] rounded-[8px] flex items-center justify-center box-border border-2 border-black bg-white';
  } else {
    return 'w-[62px] h-[29px] rounded-[8px] flex items-center justify-center box-border bg-black text-white';
  }
};

const getTextClassName = (value: number) => {
  if (value === 0) {
    return 'text-[#000000] text-[11px] font-[700] font-jetbrains';
  } else {
    return 'text-[#FFFFFF] text-[11px] font-[500] font-jetbrains';
  }
};

const SeatHeatingWidget: React.FC<SeatHeatingWidgetProps> = (props) => {
  // 3 rows grid layout
  // Row 1: steering wheel full width
  // Row 2: 4 heating cells
  // Row 3: 4 ventilation cells
  return (
    <div className="w-[296px] h-[152px] bg-white rounded-none p-[6px_10px_6px_10px] flex flex-col justify-between gap-[6px]">
      {/* Header */}
      <div className="flex items-center w-full">
        <span className="text-[#000000] text-[16px] font-[600] font-jetbrains">座椅加热通风</span>
      </div>

      {/* Row 1 - Steering Wheel full width */}
      <div className="flex justify-between gap-2 w-full">
        <div
          className={getItemClassName(props.steeringWheel) + ' w-full'}
        >
          <div className="flex items-center justify-center gap-2">
            <Circle size={16} className={props.steeringWheel > 0 ? 'text-white' : 'text-black'} />
            <span className={getTextClassName(props.steeringWheel)}>
              方向盘加热
            </span>
          </div>
        </div>
      </div>

      {/* Row 2 - Heating */}
      <div className="flex justify-between gap-2 w-full">
        <div
          className={getCellClassName(props.frontLeft)}
        >
          <div className="flex items-center gap-1">
            <Flame size={12} className={props.frontLeft > 0 ? 'text-white' : 'text-black'} />
            <span className={getTextClassName(props.frontLeft)}>
              前左热
            </span>
          </div>
        </div>
        <div
          className={getCellClassName(props.frontRight)}
        >
          <div className="flex items-center gap-1">
            <Flame size={12} className={props.frontRight > 0 ? 'text-white' : 'text-black'} />
            <span className={getTextClassName(props.frontRight)}>
              前右热
            </span>
          </div>
        </div>
        <div
          className={getCellClassName(props.rearLeft)}
        >
          <div className="flex items-center gap-1">
            <Flame size={12} className={props.rearLeft > 0 ? 'text-white' : 'text-black'} />
            <span className={getTextClassName(props.rearLeft)}>
              后左热
            </span>
          </div>
        </div>
        <div
          className={getCellClassName(props.rearRight)}
        >
          <div className="flex items-center gap-1">
            <Flame size={12} className={props.rearRight > 0 ? 'text-white' : 'text-black'} />
            <span className={getTextClassName(props.rearRight)}>
              后右热
            </span>
          </div>
        </div>
      </div>

      {/* Row 3 - Ventilation */}
      <div className="flex justify-between gap-2 w-full">
        <div
          className={getCellClassName(props.frontLeftVent)}
        >
          <div className="flex items-center gap-1">
            <Fan size={12} className={props.frontLeftVent > 0 ? 'text-white' : 'text-black'} />
            <span className={getTextClassName(props.frontLeftVent)}>
              前左风
            </span>
          </div>
        </div>
        <div
          className={getCellClassName(props.frontRightVent)}
        >
          <div className="flex items-center gap-1">
            <Fan size={12} className={props.frontRightVent > 0 ? 'text-white' : 'text-black'} />
            <span className={getTextClassName(props.frontRightVent)}>
              前右风
            </span>
          </div>
        </div>
        <div
          className={getCellClassName(props.rearLeftVent)}
        >
          <div className="flex items-center gap-1">
            <Fan size={12} className={props.rearLeftVent > 0 ? 'text-white' : 'text-black'} />
            <span className={getTextClassName(props.rearLeftVent)}>
              后左风
            </span>
          </div>
        </div>
        <div
          className={getCellClassName(props.rearRightVent)}
        >
          <div className="flex items-center gap-1">
            <Fan size={12} className={props.rearRightVent > 0 ? 'text-white' : 'text-black'} />
            <span className={getTextClassName(props.rearRightVent)}>
              后右风
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatHeatingWidget;
