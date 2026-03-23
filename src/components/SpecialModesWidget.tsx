import React from 'react';
import { PawPrint, Power, Tent, Shield, Video } from 'lucide-react';
import { SpecialModesState } from '../types';

const SpecialModesWidget: React.FC<SpecialModesState> = (props) => {
  const modes = [
    { key: 'pet', label: '宠物模式', icon: PawPrint, enabled: props.pet ?? false },
    { key: 'power', label: '保持耗电', icon: Power, enabled: props.power ?? false },
    { key: 'camping', label: '露营模式', icon: Tent, enabled: props.camping ?? false },
    { key: 'defender', label: '守卫模式', icon: Shield, enabled: props.defender ?? false },
    { key: 'remote', label: '远程视频', icon: Video, enabled: props.remote ?? true },
  ];

  return (
    <div className="w-[296px] h-[152px] bg-white rounded-none p-[6px_10px_6px_10px] flex flex-col justify-between gap-[2px]">
      <span className="text-[#000000] text-[14px] font-[600] font-jetbrains">特殊模式</span>
      <div className="flex flex-col gap-[2px] flex-1">
        {modes.map((mode) => {
          const Icon = mode.icon;
          return (
            <div key={mode.key} className="flex items-center justify-between w-full py-[1px]">
              <div className="flex items-center gap-2">
                <Icon size={16} className="text-[#444444]" />
                <span className="text-[#444444] text-[13px] font-[500] font-jetbrains">{mode.label}</span>
              </div>
              <div
                className={`w-[34px] h-[16px] rounded-[12px] flex items-center px-[1px] ${
                  mode.enabled ? 'bg-black justify-end' : 'bg-[#E5E5E5] justify-start'
                }`}
              >
                <div className={`w-[14px] h-[14px] rounded-full bg-white`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SpecialModesWidget;
