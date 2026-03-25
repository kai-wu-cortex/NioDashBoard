export interface WidgetData {
  id: string;
  name: string;
  component: () => JSX.Element;
}

// Battery Widget Data
export interface BatteryData {
  isCharging: boolean;
  soc: number;
  range: number;
  totalMileage: number;
}

// Doors & Windows Data
export interface DoorWindowState {
  [key: string]: boolean;
}

// Vehicle Doors Data
export interface VehicleDoor {
  id: string;
  name: string;
  isOpen: boolean;
}

// GPS Data
export interface GPSData {
  longitude: number;
  latitude: number;
  address: string;
}

// Software Version Data
export interface SoftwareVersionData {
  currentVersion: string;
  partNumber: string;
  isUpToDate: boolean;
}

// Special Mode Data
export interface SpecialModesState {
  [key: string]: boolean;
}

// Vehicle Info Data
export interface VehicleInfoData {
  totalMileage: number;
  vehicleId: string;
  status: string;
}

// Seat Heating Data
export interface SeatHeatingState {
  steeringWheel: number;
  front: number;
  rear: number;
  ventilation: number;
}

// Connection Data
export interface ConnectionData {
  cdcConnected: boolean;
  adcConnected: boolean;
  accountId: string;
}

// Temperature Data
export interface TemperatureData {
  inside: number;
  outside: number;
  acOn: boolean;
}

// NIO API Response Types
export interface NIOAPIResponse {
  request_id: string;
  result_code: string;
  server_time: number;
  data: NIOWidgetData;
}

export interface GeneratedImage {
  name: string;
  dataUrl: string;
  width: number;
  height: number;
}

export interface NIOWidgetData {
  checked_in: {
    checked: boolean;
    days: number;
  };
  alarm: any[];
  status: {
    hvac_status: {
      temperature: number;
      outside_temperature: number;
      air_conditioner_on: boolean;
    };
    heating_status: {
      steer_wheel_heat_sts: number;
      seat_heat_frnt_le_sts: number;
      seat_heat_frnt_ri_sts: number;
      seat_heat_re_le_sts: number;
      seat_heat_re_ri_sts: number;
      seat_vent_frnt_le_sts: number;
      seat_vent_frnt_ri_sts: number;
    };
    position_status: {
      longitude: number;
      latitude: number;
    };
    connection_status: {
      connected: boolean;
      cdc_connected: boolean;
      adc_connected: boolean;
    };
    offcar_mode_status: {
      pet_mode: number;
      power_hold_mode: number;
      camping_mode: number;
      defender_mode: number;
      remote_video: number;
    };
    exterior_status: {
      mileage: number;
      vehicle_state: number;
    };
    fota_status: {
      current_version: string;
      part_number: string;
      is_latest: boolean;
    };
    window_status: {
      win_front_left_posn: number;
      win_front_right_posn: number;
      win_rear_left_posn: number;
      win_rear_right_posn: number;
    };
    battery: {
      soc: number;
      range: number;
    };
  };
}
