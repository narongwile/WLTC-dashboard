export interface VehicleParams {
    mass: number;          // kg
    frontalArea: number;   // m^2
    Cd: number;            // Drag coefficient
    Crr: number;           // Rolling resistance
    wheelDiameter: number; // m
    gearRatio: number;
    // FCEV Params
    maxFcPower: number;    // kW (e.g., 80kW)
    battCapacity: number;  // kWh
}

export interface SimulationState {
    time: number;          // s
    velocity: number;      // m/s
    acceleration: number;  // m/s^2
    distance: number;      // m
    energy: number;        // kWh consumed TOTAL
    isPlaying: boolean;
    progress: number;      // 0-100% of cycle
    // FCEV State
    soc: number;           // % Battery State of Charge
    h2Mass: number;        // kg Hydrogen remaining
    fcPower: number;       // kW Output of Fuel Cell
    battPower: number;     // kW Output of Battery
    mode: 'EV' | 'HYBRID' | 'REGEN' | 'IDLE';
}

export interface ForceData {
    faero: number;
    froll: number;
    finertia: number;
    ftotal: number;
    power: number;         // kW (Total Demand)
}

export type ViewMode = 'statemachine' | 'strategymap' | 'simulink' | 'drivingcycle';
