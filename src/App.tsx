import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import BatteryWidget from './components/BatteryWidget';
import DoorsWindowsWidget from './components/DoorsWindowsWidget';
import VehicleDoorsWidget from './components/VehicleDoorsWidget';
import FOTAVersionWidget from './components/FOTAVersionWidget';
import GPSWidget from './components/GPSWidget';
import SpecialModesWidget from './components/SpecialModesWidget';
import VehicleInfoWidget from './components/VehicleInfoWidget';
import SeatHeatingWidget from './components/SeatHeatingWidget';
import ConnectionWidget from './components/ConnectionWidget';
import TemperatureWidget from './components/TemperatureWidget';
import ChargingWidget from './components/ChargingWidget';
import { NIOWidgetData, GeneratedImage } from './types';

interface WidgetDataState {
  // Battery
  batterySoc: number;
  batteryRange: number;
  totalMileage: number;
  isCharging: boolean;

  // GPS
  gpsLongitude: number;
  gpsLatitude: number;
  gpsAddress: string;

  // Special Modes
  petMode: boolean;
  powerHoldMode: boolean;
  campingMode: boolean;
  defenderMode: boolean;
  remoteVideo: boolean;

  // Temperature
  insideTemp: number;
  outsideTemp: number;
  acOn: boolean;

  // Seat Heating & Ventilation
  steeringWheelHeat: number;
  frontLeftHeat: number;
  frontRightHeat: number;
  rearLeftHeat: number;
  rearRightHeat: number;
  thirdRowLeftHeat: number;
  thirdRowRightHeat: number;
  frontLeftVent: number;
  frontRightVent: number;
  rearLeftVent: number;
  rearRightVent: number;
  // Charging info
  chargingPower: number;
  chargingCurrent: number;
  chargingVoltage: number;
  chrgReq: number;

  // Connection
  cdcConnected: boolean;
  adcConnected: boolean;
  accountId: string;

  // FOTA
  fotaVersion: string;
  fotaPartNumber: string;
  fotaIsLatest: boolean;

  // Windows
  frontLeftWindow: number;
  frontRightWindow: number;
  rearLeftWindow: number;
  rearRightWindow: number;
  frontTrunk: number; // 后备箱
  // Door status (1.0 = 关门, 0.0 = 开门)
  doorFrontLeft: number;
  doorFrontRight: number;
  doorRearLeft: number;
  doorRearRight: number;
  engineHood: number;
  tailgate: number;
  chargePort: number;
  // Door lock
  isLocked: boolean;
}

const App: React.FC = () => {
  // Initial default data
  const [widgetData, setWidgetData] = useState<WidgetDataState>({
    batterySoc: 67,
    batteryRange: 388,
    totalMileage: 78485,
    isCharging: false,

    gpsLongitude: 113.8420,
    gpsLatitude: 22.7261,
    gpsAddress: '广东省深圳市宝安区停车场',

    petMode: false,
    powerHoldMode: false,
    campingMode: false,
    defenderMode: false,
    remoteVideo: true,

    insideTemp: 23.0,
    outsideTemp: 26.0,
    acOn: true,

    steeringWheelHeat: 0,
    frontLeftHeat: 0,
    frontRightHeat: 0,
    rearLeftHeat: 0,
    rearRightHeat: 0,
    thirdRowLeftHeat: 0,
    thirdRowRightHeat: 0,
    frontLeftVent: 0,
    frontRightVent: 0,
    rearLeftVent: 0,
    rearRightVent: 0,
    // Charging info
    chargingPower: 0,
    chargingCurrent: 0,
    chargingVoltage: 0,
    chrgReq: 0,

    cdcConnected: true,
    adcConnected: true,
    accountId: '412125065',

    fotaVersion: 'v3.3.1',
    fotaPartNumber: 'V0081364 EZ',
    fotaIsLatest: true,

    frontLeftWindow: 0,
    frontRightWindow: 1,
    rearLeftWindow: 0,
    rearRightWindow: 1,
    frontTrunk: 0,
    doorFrontLeft: 1.0,
    doorFrontRight: 1.0,
    doorRearLeft: 1.0,
    doorRearRight: 1.0,
    engineHood: 1.0,
    tailgate: 1.0,
    chargePort: 1.0,
    isLocked: false,
  });

  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [generating, setGenerating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // Refs for each widget (for screenshot)
  const widgetRefs = {
    battery: useRef<HTMLDivElement>(null),
    doorsWindows: useRef<HTMLDivElement>(null),
    vehicleDoors: useRef<HTMLDivElement>(null),
    fotaVersion: useRef<HTMLDivElement>(null),
    gps: useRef<HTMLDivElement>(null),
    specialModes: useRef<HTMLDivElement>(null),
    vehicleInfo: useRef<HTMLDivElement>(null),
    seatHeating: useRef<HTMLDivElement>(null),
    connection: useRef<HTMLDivElement>(null),
    temperature: useRef<HTMLDivElement>(null),
    charging: useRef<HTMLDivElement>(null),
  };

  const widgetInfos = [
    { ref: widgetRefs.battery, name: '电池信息' },
    { ref: widgetRefs.doorsWindows, name: '门窗状态' },
    { ref: widgetRefs.vehicleDoors, name: '车门' },
    { ref: widgetRefs.fotaVersion, name: '软件版本' },
    { ref: widgetRefs.gps, name: 'GPS位置' },
    { ref: widgetRefs.specialModes, name: '特殊模式' },
    { ref: widgetRefs.vehicleInfo, name: '车辆信息' },
    { ref: widgetRefs.seatHeating, name: '座椅加热' },
    { ref: widgetRefs.connection, name: '连接状态' },
    { ref: widgetRefs.temperature, name: '温度' },
    { ref: widgetRefs.charging, name: '充电信息' },
  ];

  // Fetch data from NIO API (through Vite proxy to avoid CORS)
  // Parameters exactly matching the curl request
  const updateFromAPI = async () => {
    setUpdating(true);
    const url = "/nio-api/app/api/icar/v2/widget/info?lang=zh-CN&app_id=10002&timestamp=1774198476&app_ver=6.3.0&device_id=14e3f556d3984993a59ad96e8af3ba2d&widget_functions=rvs_set_doorlock%2Crvs_set_air_conditioner%2Crvs_set_tailgate%2Crvs_exe_findme&widget_size=medium&region=cn&vehicle_id=c36736658c7b4b7e8d5a484b8f908b43&sign=7165a503f129317c909169732c6260de";

    const headers = {
      "Host": "app.nio.com",
      "Connection": "keep-alive",
      "Accept": "application/json,text/json,text/plain",
      "User-Agent": "VehicleWidgetExtension/6.3.0 (com.do1.WeiLaiApp.NIOVehicleWidget; build:2586; iOS 26.3.1) Alamofire/5.9.1",
      "Authorization": "Bearer 2.0IkLw1IayXSA5CD32/1MdpTe9sF9zhR5BPmTEA3a2JX0=",
      "Accept-Language": "zh-CN,zh-Hans;q=0.9",
    };

    try {
      const response = await fetch(url, { headers, method: 'GET', mode: 'cors' });
      const data = await response.json();

      if (data.result_code === 'success' && data.data) {
        const apiData = data.data;

        // Map API data to our state
        setWidgetData(prev => ({
          ...prev,
          // Battery
          batterySoc: apiData.status?.soc_status?.soc ?? prev.batterySoc,
          batteryRange: apiData.status?.soc_status?.remaining_actual_range ?? prev.batteryRange,
          totalMileage: apiData.status?.exterior_status?.mileage ?? prev.totalMileage,
          isCharging: (apiData.status?.soc_status?.charge_state ?? 0) === 1.0,

          // GPS
          gpsLongitude: apiData.status?.position_status?.longitude ?? prev.gpsLongitude,
          gpsLatitude: apiData.status?.position_status?.latitude ?? prev.gpsLatitude,

          // Special Modes
          petMode: (apiData.status?.offcar_mode_status?.pet_mode ?? 0) > 0,
          powerHoldMode: (apiData.status?.offcar_mode_status?.power_hold_mode ?? 0) > 0,
          campingMode: (apiData.status?.offcar_mode_status?.camping_mode ?? 0) > 0,
          defenderMode: (apiData.status?.offcar_mode_status?.defender_mode ?? 0) > 0,
          remoteVideo: (apiData.status?.offcar_mode_status?.remote_video ?? 0) > 0,

          // Temperature
          insideTemp: apiData.status?.hvac_status?.temperature ?? prev.insideTemp,
          outsideTemp: apiData.status?.hvac_status?.outside_temperature ?? prev.outsideTemp,
          acOn: apiData.status?.hvac_status?.air_conditioner_on ?? prev.acOn,

          // Seat Heating & Ventilation
          steeringWheelHeat: apiData.status?.heating_status?.steer_wheel_heat_sts ?? prev.steeringWheelHeat,
          frontLeftHeat: apiData.status?.heating_status?.seat_heat_frnt_le_sts ?? prev.frontLeftHeat,
          frontRightHeat: apiData.status?.heating_status?.seat_heat_frnt_ri_sts ?? prev.frontRightHeat,
          rearLeftHeat: apiData.status?.heating_status?.seat_heat_re_le_sts ?? prev.rearLeftHeat,
          rearRightHeat: apiData.status?.heating_status?.seat_heat_re_ri_sts ?? prev.rearRightHeat,
          thirdRowLeftHeat: apiData.status?.heating_status?.seat_heat_thrd_le_sts ?? prev.thirdRowLeftHeat,
          thirdRowRightHeat: apiData.status?.heating_status?.seat_heat_thrd_ri_sts ?? prev.thirdRowRightHeat,
          frontLeftVent: apiData.status?.heating_status?.seat_vent_frnt_le_sts ?? prev.frontLeftVent,
          frontRightVent: apiData.status?.heating_status?.seat_vent_frnt_ri_sts ?? prev.frontRightVent,
          rearLeftVent: apiData.status?.heating_status?.seat_vent_re_le_sts ?? prev.rearLeftVent,
          rearRightVent: apiData.status?.heating_status?.seat_vent_re_ri_sts ?? prev.rearRightVent,
          // Charging info
          chargingPower: apiData.status?.soc_status?.charging_power ?? prev.chargingPower,
          chargingCurrent: apiData.status?.soc_status?.charging_current ?? prev.chargingCurrent,
          chargingVoltage: apiData.status?.soc_status?.charging_voltage ?? prev.chargingVoltage,
          chrgReq: apiData.status?.soc_status?.chrg_req ?? prev.chrgReq,

          // Connection
          cdcConnected: apiData.status?.connection_status?.cdc_connected ?? prev.cdcConnected,
          adcConnected: apiData.status?.connection_status?.adc_connected ?? prev.adcConnected,
          accountId: apiData.status?.offcar_mode_status?.pw_hold_acc_id ?? apiData.status?.maintain_status?.account_id ?? prev.accountId,

          // FOTA
          fotaVersion: apiData.status?.fota_status?.current_version ?? prev.fotaVersion,
          fotaPartNumber: apiData.status?.fota_status?.part_number ?? prev.fotaPartNumber,
          fotaIsLatest: apiData.status?.fota_status?.is_latest ?? prev.fotaIsLatest,

          // Windows
          frontLeftWindow: apiData.status?.window_status?.win_front_left_posn ?? prev.frontLeftWindow,
          frontRightWindow: apiData.status?.window_status?.win_front_right_posn ?? prev.frontRightWindow,
          rearLeftWindow: apiData.status?.window_status?.win_rear_left_posn ?? prev.rearLeftWindow,
          rearRightWindow: apiData.status?.window_status?.win_rear_right_posn ?? prev.rearRightWindow,
          frontTrunk: apiData.status?.window_status?.sun_roof_posn ?? prev.frontTrunk,
          // Door status (1.0 = closed, 0.0 = open)
          doorFrontLeft: apiData.status?.door_status?.door_ajar_front_left_status ?? prev.doorFrontLeft,
          doorFrontRight: apiData.status?.door_status?.door_ajar_front_right_status ?? prev.doorFrontRight,
          doorRearLeft: apiData.status?.door_status?.door_ajar_rear_left_status ?? prev.doorRearLeft,
          doorRearRight: apiData.status?.door_status?.door_ajar_rear_right_status ?? prev.doorRearRight,
          engineHood: apiData.status?.door_status?.engine_hood_ajar_status ?? prev.engineHood,
          tailgate: apiData.status?.door_status?.tailgate_ajar_status ?? prev.tailgate,
          chargePort: apiData.status?.door_status?.second_charge_port_ajar_status ?? prev.chargePort,
          // Door lock status
          isLocked: apiData.status?.door_status?.vehicle_lock_status ?? prev.isLocked,
        }));

        setLastUpdate(new Date().toLocaleString());
      }
    } catch (error) {
      console.error('Failed to fetch from NIO API:', error);
      alert('获取数据失败，可能是跨域问题。请在浏览器控制台查看错误信息。');
    }

    setUpdating(false);
  };

  const generateImages = async () => {
    setGenerating(true);
    // Scroll to top to ensure everything is visible
    window.scrollTo(0, 0);

    // Fix text shifting issue - add inline style for images
    const fixStyle = document.createElement('style');
    document.head.appendChild(fixStyle);
    fixStyle.sheet?.insertRule('img { display: inline !important; }');
    fixStyle.sheet?.insertRule('body > div img { display: inline-block !important; }');

    const images: GeneratedImage[] = [];

    for (const { ref, name } of widgetInfos) {
      if (ref.current) {
        const canvas = await html2canvas(ref.current, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
        });
        images.push({
          name,
          dataUrl: canvas.toDataURL('image/png'),
        });
      }
    }

    // Remove the temporary style
    document.head.removeChild(fixStyle);

    setGeneratedImages(images);
    setGenerating(false);
  };

  const downloadImage = (image: GeneratedImage) => {
    const link = document.createElement('a');
    link.download = `${image.name}.png`;
    link.href = image.dataUrl;
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#e4e4e4] p-[16px]">
      <div className="w-[1232px] mx-auto">
        <div className="flex items-center justify-between mb-[16px]">
          <div>
            <h1 className="text-[24px] font-[700] text-black font-jetbrains">
              NIO Widget Dashboard (VER1)
            </h1>
            {lastUpdate && (
              <p className="text-[12px] text-gray-500 font-jetbrains mt-[4px]">
                最后更新: {lastUpdate}
              </p>
            )}
          </div>
          <div className="flex gap-[12px]">
            <button
              onClick={updateFromAPI}
              disabled={updating}
              className="px-[16px] py-[10px] bg-blue-600 text-white rounded font-jetbrains hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              {updating ? '更新中...' : '从NIO API更新数据'}
            </button>
            <button
              onClick={generateImages}
              disabled={generating}
              className="px-[16px] py-[10px] bg-black text-white rounded font-jetbrains hover:bg-gray-800 disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              {generating ? '生成中...' : '生成所有组件图片'}
            </button>
          </div>
        </div>

        {/* Row 1 - 3 widgets */}
        <div className="flex gap-[16px] mb-[16px]">
          <div ref={widgetRefs.battery}>
            <BatteryWidget
              isCharging={widgetData.isCharging}
              soc={widgetData.batterySoc}
              range={widgetData.batteryRange}
              totalMileage={widgetData.totalMileage}
            />
          </div>
          <div ref={widgetRefs.doorsWindows}>
            <DoorsWindowsWidget
              driverDoor={widgetData.frontLeftWindow > 0}
              passengerDoor={widgetData.frontRightWindow > 0}
              rearLeftDoor={widgetData.rearLeftWindow > 0}
              rearRightDoor={widgetData.rearRightWindow > 0}
              frontTrunk={widgetData.frontTrunk > 0}
              isLocked={widgetData.isLocked}
            />
          </div>
          <div ref={widgetRefs.vehicleDoors}>
            <VehicleDoorsWidget
              frontLeft={widgetData.doorFrontLeft}
              frontRight={widgetData.doorFrontRight}
              rearLeft={widgetData.doorRearLeft}
              rearRight={widgetData.doorRearRight}
              engineHood={widgetData.engineHood}
              tailgate={widgetData.tailgate}
              chargePort={widgetData.chargePort}
            />
          </div>
        </div>

        {/* Row 2 - 4 widgets */}
        <div className="flex gap-[16px] mb-[16px]">
          <div ref={widgetRefs.fotaVersion}>
            <FOTAVersionWidget
              currentVersion={widgetData.fotaVersion}
              partNumber={widgetData.fotaPartNumber}
              isUpToDate={widgetData.fotaIsLatest}
            />
          </div>
          <div ref={widgetRefs.gps}>
            <GPSWidget
              longitude={widgetData.gpsLongitude}
              latitude={widgetData.gpsLatitude}
            />
          </div>
          <div ref={widgetRefs.specialModes}>
            <SpecialModesWidget
              pet={widgetData.petMode}
              power={widgetData.powerHoldMode}
              camping={widgetData.campingMode}
              defender={widgetData.defenderMode}
              remote={widgetData.remoteVideo}
            />
          </div>
          <div ref={widgetRefs.charging}>
            <ChargingWidget
              chargingPower={widgetData.chargingPower}
              chargingCurrent={widgetData.chargingCurrent}
              chargingVoltage={widgetData.chargingVoltage}
              chrgReq={widgetData.chrgReq}
            />
          </div>
        </div>

        {/* Row 3 - 4 widgets */}
        <div className="flex gap-[16px] mb-[32px]">
          <div ref={widgetRefs.vehicleInfo}>
            <VehicleInfoWidget
              totalMileage={widgetData.totalMileage}
              vehicleId="c367...08b43"
              status="Ready"
            />
          </div>
          <div ref={widgetRefs.seatHeating}>
            <SeatHeatingWidget
              steeringWheel={widgetData.steeringWheelHeat}
              frontLeft={widgetData.frontLeftHeat}
              frontRight={widgetData.frontRightHeat}
              rearLeft={widgetData.rearLeftHeat}
              rearRight={widgetData.rearRightHeat}
              frontLeftVent={widgetData.frontLeftVent}
              frontRightVent={widgetData.frontRightVent}
              rearLeftVent={widgetData.rearLeftVent}
              rearRightVent={widgetData.rearRightVent}
            />
          </div>
          <div ref={widgetRefs.connection}>
            <ConnectionWidget
              cdcConnected={widgetData.cdcConnected}
              adcConnected={widgetData.adcConnected}
              accountId={widgetData.accountId}
            />
          </div>
          <div ref={widgetRefs.temperature}>
            <TemperatureWidget
              inside={widgetData.insideTemp}
              outside={widgetData.outsideTemp}
              acOn={widgetData.acOn}
            />
          </div>
        </div>

        {/* Generated Images Section */}
        {generatedImages.length > 0 && (
          <div className="mt-[40px]">
            <h2 className="text-[18px] font-[600] mb-[16px] text-black font-jetbrains">
              生成的图片 ({generatedImages.length})
            </h2>
            <div className="grid grid-cols-5 gap-[16px]">
              {generatedImages.map((img) => (
                <div key={img.name} className="flex flex-col gap-[8px]">
                  <div className="bg-white p-[4px] rounded shadow-sm">
                    <img src={img.dataUrl} alt={img.name} className="w-full" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-jetbrains text-gray-600">{img.name}</span>
                    <button
                      onClick={() => downloadImage(img)}
                      className="px-[8px] py-[4px] text-[12px] bg-black text-white rounded font-jetbrains hover:bg-gray-800"
                    >
                      下载
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
