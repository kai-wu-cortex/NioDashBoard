export interface WidgetDataState {
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

const toBoolean = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value > 0;
  }

  return fallback;
};

const mapFotaIsLatest = (prev: WidgetDataState, apiData: any): boolean => {
  const isLatest = apiData.status?.fota_status?.is_latest;
  if (isLatest !== undefined && isLatest !== null) {
    return toBoolean(isLatest, prev.fotaIsLatest);
  }

  const availableUpdate = apiData.status?.fota_status?.available_update;
  if (availableUpdate !== undefined && availableUpdate !== null) {
    return !toBoolean(availableUpdate, false);
  }

  return prev.fotaIsLatest;
};

const mapIsLocked = (prev: WidgetDataState, apiData: any): boolean => {
  const doorLock = apiData.status?.door_status?.door_lock;
  if (doorLock !== undefined && doorLock !== null) {
    return toBoolean(doorLock, prev.isLocked);
  }

  const vehicleLockStatus = apiData.status?.door_status?.vehicle_lock_status;
  return toBoolean(vehicleLockStatus, prev.isLocked);
};

export const mapNioApiDataToWidgetState = (prev: WidgetDataState, apiData: any): WidgetDataState => {
  return {
    ...prev,
    // Battery
    batterySoc: apiData.status?.soc_status?.soc ?? prev.batterySoc,
    batteryRange: apiData.status?.soc_status?.remaining_actual_range ?? prev.batteryRange,
    totalMileage: apiData.status?.exterior_status?.mileage ?? prev.totalMileage,
    isCharging: (apiData.status?.soc_status?.charge_state ?? 0) === 1.0,

    // GPS
    gpsLongitude: apiData.status?.position_status?.longitude ?? prev.gpsLongitude,
    gpsLatitude: apiData.status?.position_status?.latitude ?? prev.gpsLatitude,
    gpsAddress: apiData.status?.position_status?.address ?? prev.gpsAddress,

    // Special Modes
    petMode: (apiData.status?.offcar_mode_status?.pet_mode ?? 0) > 0,
    powerHoldMode: (apiData.status?.offcar_mode_status?.power_hold_mode ?? 0) > 0,
    campingMode: (apiData.status?.offcar_mode_status?.camping_mode ?? 0) > 0,
    defenderMode: (apiData.status?.offcar_mode_status?.defender_mode ?? 0) > 0,
    remoteVideo: (apiData.status?.offcar_mode_status?.remote_video ?? 0) > 0,

    // Temperature - support both climate_status and hvac_status
    insideTemp: apiData.status?.climate_status?.inside_temp ?? apiData.status?.hvac_status?.temperature ?? prev.insideTemp,
    outsideTemp: apiData.status?.climate_status?.outside_temp ?? apiData.status?.hvac_status?.outside_temperature ?? prev.outsideTemp,
    acOn: toBoolean(apiData.status?.climate_status?.ac_on ?? apiData.status?.hvac_status?.air_conditioner_on, prev.acOn),

    // Seat Heating & Ventilation - support both climate_status and heating_status
    steeringWheelHeat: apiData.status?.climate_status?.steering_wheel_heat_level ?? apiData.status?.heating_status?.steer_wheel_heat_sts ?? prev.steeringWheelHeat,
    frontLeftHeat: apiData.status?.climate_status?.front_left_heat_level ?? apiData.status?.heating_status?.seat_heat_frnt_le_sts ?? prev.frontLeftHeat,
    frontRightHeat: apiData.status?.climate_status?.front_right_heat_level ?? apiData.status?.heating_status?.seat_heat_frnt_ri_sts ?? prev.frontRightHeat,
    rearLeftHeat: apiData.status?.climate_status?.rear_left_heat_level ?? apiData.status?.heating_status?.seat_heat_re_le_sts ?? prev.rearLeftHeat,
    rearRightHeat: apiData.status?.climate_status?.rear_right_heat_level ?? apiData.status?.heating_status?.seat_heat_re_ri_sts ?? prev.rearRightHeat,
    thirdRowLeftHeat: apiData.status?.climate_status?.third_row_left_heat_level ?? apiData.status?.heating_status?.seat_heat_thrd_le_sts ?? prev.thirdRowLeftHeat,
    thirdRowRightHeat: apiData.status?.climate_status?.third_row_right_heat_level ?? apiData.status?.heating_status?.seat_heat_thrd_ri_sts ?? prev.thirdRowRightHeat,
    frontLeftVent: apiData.status?.climate_status?.front_left_vent_level ?? apiData.status?.heating_status?.seat_vent_frnt_le_sts ?? prev.frontLeftVent,
    frontRightVent: apiData.status?.climate_status?.front_right_vent_level ?? apiData.status?.heating_status?.seat_vent_frnt_ri_sts ?? prev.frontRightVent,
    rearLeftVent: apiData.status?.climate_status?.rear_left_vent_level ?? apiData.status?.heating_status?.seat_vent_re_le_sts ?? prev.rearLeftVent,
    rearRightVent: apiData.status?.climate_status?.rear_right_vent_level ?? apiData.status?.heating_status?.seat_vent_re_ri_sts ?? prev.rearRightVent,

    // Charging info
    chargingPower: apiData.status?.soc_status?.charging_power ?? prev.chargingPower,
    chargingCurrent: apiData.status?.soc_status?.charging_current ?? prev.chargingCurrent,
    chargingVoltage: apiData.status?.soc_status?.charging_voltage ?? prev.chargingVoltage,
    chrgReq: apiData.status?.soc_status?.chrg_req ?? prev.chrgReq,

    // Connection
    cdcConnected: apiData.status?.connection_status?.cdc_connected ?? prev.cdcConnected,
    adcConnected: apiData.status?.connection_status?.adc_connected ?? prev.adcConnected,
    accountId: apiData.status?.connection_status?.account_id ?? apiData.status?.offcar_mode_status?.pw_hold_acc_id ?? apiData.status?.maintain_status?.account_id ?? prev.accountId,

    // FOTA
    fotaVersion: apiData.status?.fota_status?.current_version ?? prev.fotaVersion,
    fotaPartNumber: apiData.status?.fota_status?.current_part_number ?? apiData.status?.fota_status?.part_number ?? prev.fotaPartNumber,
    fotaIsLatest: mapFotaIsLatest(prev, apiData),

    // Windows - support both door_status and window_status
    frontLeftWindow: apiData.status?.door_status?.front_left_window ?? apiData.status?.window_status?.win_front_left_posn ?? prev.frontLeftWindow,
    frontRightWindow: apiData.status?.door_status?.front_right_window ?? apiData.status?.window_status?.win_front_right_posn ?? prev.frontRightWindow,
    rearLeftWindow: apiData.status?.door_status?.rear_left_window ?? apiData.status?.window_status?.win_rear_left_posn ?? prev.rearLeftWindow,
    rearRightWindow: apiData.status?.door_status?.rear_right_window ?? apiData.status?.window_status?.win_rear_right_posn ?? prev.rearRightWindow,
    frontTrunk: apiData.status?.door_status?.front_trunk ?? apiData.status?.window_status?.sun_roof_posn ?? prev.frontTrunk,

    // Door status (1.0 = closed, 0.0 = open) - support both naming patterns
    doorFrontLeft: apiData.status?.door_status?.front_left_door ?? apiData.status?.door_status?.door_ajar_front_left_status ?? prev.doorFrontLeft,
    doorFrontRight: apiData.status?.door_status?.front_right_door ?? apiData.status?.door_status?.door_ajar_front_right_status ?? prev.doorFrontRight,
    doorRearLeft: apiData.status?.door_status?.rear_left_door ?? apiData.status?.door_status?.door_ajar_rear_left_status ?? prev.doorRearLeft,
    doorRearRight: apiData.status?.door_status?.rear_right_door ?? apiData.status?.door_status?.door_ajar_rear_right_status ?? prev.doorRearRight,
    engineHood: apiData.status?.door_status?.engine_hood ?? apiData.status?.door_status?.engine_hood_ajar_status ?? prev.engineHood,
    tailgate: apiData.status?.door_status?.tailgate ?? apiData.status?.door_status?.tailgate_ajar_status ?? prev.tailgate,
    chargePort: apiData.status?.door_status?.charge_port ?? apiData.status?.door_status?.second_charge_port_ajar_status ?? prev.chargePort,

    // Door lock status - support both formats
    isLocked: mapIsLocked(prev, apiData),
  };
};
