import { useState, useRef, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area } from 'recharts';
import { Play, Pause, RotateCcw, Settings, Activity, ChevronsRight, Workflow } from 'lucide-react';
import CarSchematic from './components/CarSchematic';
import SchematicModal from './components/SchematicModal';
import StatCard from './components/StatCard';
import { StaticChart, PlayheadOverlay } from './components/ChartOptimization';

import BatteryDetail from './components/details/BatteryDetail';
import MotorDetail from './components/details/MotorDetail';
import DriverDetail from './components/details/DriverDetail';
import FuelCellDetail from './components/details/FuelCellDetail';
import EMSDetail from './components/details/EMSDetail';
import HydrogenTankDetail from './components/details/HydrogenTankDetail';
import WheelDetail from './components/details/WheelDetail';
import TransmissionDetail from './components/details/TransmissionDetail';
import RouteMap from './components/RouteMap';
import type { SimulationState, VehicleParams } from './types';

// --- Constants ---
const G = 9.81;
const RHO_AIR = 1.225;

// --- Icons & Assets ---
// Simple Car SVG Component that accepts dynamic props for animation
// CarSchematic and SchematicModal extracted to components folder

export default function AdvancedWLTCDashboard() {
  // 1. State Management
  const [params, setParams] = useState<VehicleParams>({
    mass: 2000,
    frontalArea: 2,
    Cd: 0.3,
    Crr: 0.01,
    wheelDiameter: 1.0,
    maxFcPower: 85,    // 85kW Stack
    battCapacity: 15,  // 15kWh Buffer Battery
    gearRatio: 9.0,    // 9:1 Single Speed Gear
  });



  const [showSchematic, setShowSchematic] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [leftView, setLeftView] = useState<'stats' | 'map'>('stats');

  const [simState, setSimState] = useState<SimulationState>({
    time: 0,
    velocity: 0,
    acceleration: 0,
    distance: 0,
    energy: 0,
    isPlaying: false,
    progress: 0,
    // FCEV Init
    soc: 80,          // Start at 80% SOC
    h2Mass: 5.0,      // 5kg Tank
    fcPower: 0,
    battPower: 0,
    mode: 'IDLE'
  });

  // Pre-calculated WLTC Cycle & Results Cache
  const animationRef = useRef<number>(0); // Initialize with 0 or undefined but type correctly
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  // Power Split History for Real-time Chart
  const [powerHistory, setPowerHistory] = useState<Array<{ time: number, P_demand: number, P_fc: number, P_batt: number }>>([]);

  // 2. Physics Engine & Cycle Generation (Memoized)
  const wltcData = useMemo(() => {
    // Generate simplified WLTC profile (30 mins / 1800s Cycle compressed to 100s for demo or full loop?)
    // Let's stick to the 100s "Short Cycle" from the previous file but refined
    // Let's stick to the 100s "Short Cycle" from the previous file but refined
    const data: any[] = [];
    const dt = 0.2; // 5Hz simulation step for smoothness
    const duration = 120; // Extended slightly

    let dist = 0;
    let energySum = 0;

    for (let t = 0; t <= duration; t += dt) {
      let v_target = 0;
      // WLTC-ish Shape
      if (t < 10) v_target = 0;
      else if (t < 30) v_target = (t - 10) * 0.8; // Accel
      else if (t < 50) v_target = 16 + Math.sin(t * 0.5) * 2; // Cruise/Noise
      else if (t < 70) v_target = 16 + (t - 50) * 0.5; // High speed accel
      else if (t < 90) v_target = 26; // Max speed ~94 km/h
      else if (t < 110) v_target = 26 - (t - 90) * 1.3; // Decel
      else v_target = 0;

      v_target = Math.max(0, v_target);

      // Calculate derived physics for PREVIEW charts
      // Note: We recalculate dynamic physics during render for sliders, 
      // but charts need a baseline. We'll use current params for charts.
      // but charts need a baseline. We'll use current params for charts.
      const prev: any = data[data.length - 1];
      const acc = prev ? (v_target - prev.velocity) / dt : 0;

      // Forces
      const Fa = 0.5 * RHO_AIR * params.Cd * params.frontalArea * v_target * v_target;
      const Fr = params.Crr * params.mass * G * (v_target > 0.1 ? 1 : 0);
      const Fi = params.mass * acc;
      const Ft = Fa + Fr + Fi;
      const P = (Ft * v_target) / 1000; // kW

      if (t > 0) {
        dist += v_target * dt;
        if (P > 0) energySum += (P * dt) / 3600; // kWh
      }

      data.push({
        time: t,
        velocity: v_target,
        acceleration: acc,
        faero: Fa,
        froll: Fr,
        finertia: Fi,
        ftotal: Ft,
        power: P,
        energyCum: energySum,
        distCum: dist
      });
    }
    return data;
  }, [params]); // Re-run when parameters change to update charts

  // 3. Animation Loop
  const tick = (timestamp: number) => {
    if (!startTimeRef.current) startTimeRef.current = timestamp - pausedTimeRef.current;

    // Elapsed time in seconds
    const elapsed = (timestamp - startTimeRef.current) / 1000; // Real-time playback
    // Speed up factor could be applied here

    if (elapsed >= wltcData[wltcData.length - 1].time) {
      setSimState(prev => ({ ...prev, isPlaying: false, progress: 100 }));
      return;
    }

    // Find current data point
    const idx = wltcData.findIndex(d => d.time >= elapsed);
    if (idx !== -1) {
      const point = wltcData[idx];
      setSimState(prev => {
        // --- EMS LOGIC (Real-time approx) ---
        // 1. Determine Power Demand
        const P_demand = point.power; // kW

        // 2. Rule-Based Power Split
        let P_fc = 0;
        let P_batt = 0;
        let mode: SimulationState['mode'] = 'IDLE';

        if (P_demand <= 0) {
          // REGEN: All to Battery
          P_fc = 0; // Fuel Cell Idles
          P_batt = P_demand; // Negative power charges battery
          mode = 'REGEN';
        } else {
          // DRIVE
          if (P_demand < 20) {
            // Low Power: EV Mode (Battery only)
            P_fc = 0;
            P_batt = P_demand;
            mode = 'EV';
          } else {
            // High Power: Hybrid Mode (FC + Battery)
            // FC attempts to cover baseload or follows load with lag
            // Simple Rule: FC takes demand up to Max, Battery buffers transients
            P_fc = Math.min(params.maxFcPower, P_demand);
            // If FC is maxed, Battery assists. 
            // Ideally FC should run at efficient points (e.g. constant 40kW), but let's make it load-following for now.
            P_batt = P_demand - P_fc;
            mode = 'HYBRID';
          }
        }

        // 3. Integrate Consumption
        // Time step delta since last frame isn't perfect in this simple loop, 
        // but for display we can simulate rates.
        // H2 Rate: approx 0.05 kg/hr per kW (generous efficiency)
        // 1 kg H2 ~ 33 kWh LHV. efficiency ~ 50% -> 16.5 kWh elecsimState. 
        // So 1 kWh elec = 1/16.5 = 0.06 kg H2
        const dt = 0.1; // approximate real-time delta for visual smoothness
        const h2_rate = (P_fc / 16.5) / 3600; // kg/s
        const h2_consumed_step = h2_rate * dt;

        // Batt Rate
        const batt_energy_step = (P_batt * dt) / 3600; // kWh

        // Update power history for real-time chart
        setPowerHistory(hist => {
          const newEntry = { time: point.time, P_demand: P_demand, P_fc: P_fc, P_batt: P_batt };
          const updated = [...hist, newEntry];
          // Keep last 100 entries for performance
          return updated.slice(-100);
        });

        return {
          time: point.time,
          velocity: point.velocity,
          acceleration: point.acceleration,
          distance: point.distCum,
          energy: point.energyCum,
          isPlaying: true,
          progress: (point.time / wltcData[wltcData.length - 1].time) * 100,
          // Update FCEV State
          fcPower: P_fc,
          battPower: P_batt,
          h2Mass: Math.max(0, prev.h2Mass - h2_consumed_step),
          soc: Math.max(0, Math.min(100, prev.soc - (batt_energy_step / params.battCapacity * 100))),
          mode: mode
        };
      });
    }

    animationRef.current = requestAnimationFrame(tick);
  };

  const togglePlay = () => {
    if (simState.isPlaying) {
      setSimState(s => ({ ...s, isPlaying: false }));
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      pausedTimeRef.current = performance.now() - startTimeRef.current;
    } else {
      setSimState(s => ({ ...s, isPlaying: true }));
      // If restarting from end
      if (simState.progress >= 100) {
        startTimeRef.current = performance.now();
        pausedTimeRef.current = 0;
      } else {
        startTimeRef.current = performance.now() - (simState.time * 1000);
      }
      animationRef.current = requestAnimationFrame(tick);
    }
  };

  const reset = () => {
    setSimState({
      time: 0,
      velocity: 0,
      acceleration: 0,
      distance: 0,
      energy: 0,
      isPlaying: false,
      progress: 0,
      soc: 80,
      h2Mass: 5.0,
      fcPower: 0,
      battPower: 0,
      mode: 'IDLE'
    });
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    pausedTimeRef.current = 0;
    startTimeRef.current = 0;
    setPowerHistory([]); // Clear power history on reset
  };

  // 4. Instantaneous Values for Display (Recalculated from current state to be sure)
  const currentForces = useMemo(() => {
    const v = simState.velocity;
    const a = simState.acceleration;
    const Fa = 0.5 * RHO_AIR * params.Cd * params.frontalArea * v * v;
    const Fr = params.Crr * params.mass * G * (v > 0.1 ? 1 : 0); // Simple rolling cut-off
    const Fi = params.mass * a;
    const Ft = Fa + Fr + Fi;
    return {
      faero: Fa,
      froll: Fr,
      finertia: Fi,
      ftotal: Ft,
      power: (Ft * v) / 1000
    };
  }, [simState.velocity, simState.acceleration, params]);

  // Wheel Rotation (Degrees) = (Distance / Circumference) * 360
  // Circumference = PI * D
  const wheelDeg = (simState.distance % (Math.PI * params.wheelDiameter)) / (Math.PI * params.wheelDiameter) * 360;




  const handleBlockClick = (blockId: string) => {
    setActiveModal(blockId);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white p-4 lg:p-8">

      {/* HEADER */}
      <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-500" />
            WLTC Vehicle Dynamics Analyzer(A2TE KMUTT: Narongkorn Buanarth)
          </h1>
          {/* <p className="text-slate-400 text-sm mt-1">A2TE KMUTT: Narongkorn Buanarth</p> */}
          <p className="text-slate-400 text-sm mt-1">Real-time Physics Simulation & Powertrain Analysis</p>
        </div>
        <div className="flex gap-2">
          <div className="px-4 py-2 bg-slate-900 rounded-lg border border-slate-800 flex flex-col items-end">
            <span className="text-xs text-slate-500">CYCLE</span>
            <span className="font-mono text-emerald-400">WLTC Class 3b</span>
          </div>
          <div className="px-4 py-2 bg-slate-900 rounded-lg border border-slate-800 flex flex-col items-end">
            <span className="text-xs text-slate-500">SYSTEM STATUS</span>
            <div className="flex items-center gap-2">
              <span className={`font-mono font-bold ${simState.mode === 'HYBRID' ? 'text-purple-400' : simState.mode === 'EV' ? 'text-blue-400' : simState.mode === 'REGEN' ? 'text-emerald-400' : 'text-slate-400'}`}>
                {simState.mode}
              </span>
              <span className="text-slate-600">|</span>
              <span className="font-mono text-slate-300">{simState.isPlaying ? 'RUNNING' : 'STANDBY'}</span>
            </div>
          </div>
          <button
            onClick={() => setShowSchematic(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg border border-blue-500 flex items-center gap-2 transition-colors shadow-lg shadow-blue-900/20"
          >
            <Workflow className="w-4 h-4" />
            <span className="hidden md:inline">System Diagram</span>
          </button>
        </div>
      </header>

      {/* MAIN LAYOUT GRID */}
      <div className="grid grid-cols-12 gap-6">

        {/* LEFT COLUMN: Controls & Parameters (3 cols) */}
        <div className="col-span-12 lg:col-span-3 space-y-6">

          {/* Controls Card */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
            <h3 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-2">
              <ChevronsRight className="w-4 h-4" /> SIMULATION CONTROL
            </h3>

            <div className="flex gap-2 mb-6">
              <button
                onClick={togglePlay}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${simState.isPlaying
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-[0_0_15px_rgba(217,119,6,0.5)]'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                  }`}
              >
                {simState.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                {simState.isPlaying ? 'PAUSE' : 'START'}
              </button>
              <button
                onClick={reset}
                className="px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Progress</span>
                <span>{simState.time.toFixed(1)}s / {wltcData[wltcData.length - 1].time}s</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300 ease-out"
                  style={{ width: `${simState.progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Parameters Tuner */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
            <h3 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4" /> VEHICLE PARAMETERS
            </h3>

            <div className="space-y-5">
              {/* Mass */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Vehicle Mass (m)</span>
                  <span className="text-blue-400 font-mono">{params.mass} kg</span>
                </div>
                <input
                  type="range" min="500" max="3000" step="50"
                  value={params.mass}
                  onChange={(e) => setParams({ ...params, mass: Number(e.target.value) })}
                  className="w-full text-blue-500 accent-blue-500 h-1 bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>

              {/* Area */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Frontal Area (A)</span>
                  <span className="text-blue-400 font-mono">{params.frontalArea} m²</span>
                </div>
                <input
                  type="range" min="1.0" max="4.0" step="0.1"
                  value={params.frontalArea}
                  onChange={(e) => setParams({ ...params, frontalArea: Number(e.target.value) })}
                  className="w-full accent-blue-500 h-1 bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>

              {/* Cd */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Drag Coeff (Cd)</span>
                  <span className="text-blue-400 font-mono">{params.Cd}</span>
                </div>
                <input
                  type="range" min="0.15" max="0.6" step="0.01"
                  value={params.Cd}
                  onChange={(e) => setParams({ ...params, Cd: Number(e.target.value) })}
                  className="w-full accent-blue-500 h-1 bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>

              {/* Crr */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Rolling Res (Crr)</span>
                  <span className="text-blue-400 font-mono">{params.Crr}</span>
                </div>
                <input
                  type="range" min="0.005" max="0.05" step="0.001"
                  value={params.Crr}
                  onChange={(e) => setParams({ ...params, Crr: Number(e.target.value) })}
                  className="w-full accent-blue-500 h-1 bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
              <div className="text-xs text-slate-500 mb-1">Energy Consumed</div>
              <div className="text-lg font-mono text-white">{simState.energy.toFixed(3)} <span className="text-sm text-slate-400">kWh</span></div>
            </div>
            <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
              <div className="text-xs text-slate-500 mb-1">Distance</div>
              <div className="text-lg font-mono text-white">{(simState.distance / 1000).toFixed(2)} <span className="text-sm text-slate-400">km</span></div>
            </div>
          </div>

        </div>

        {/* MIDDLE/RIGHT: Visualization & Charts (9 cols) */}
        <div className="col-span-12 lg:col-span-9 space-y-6">

          {/* 1. VISUALIZER & HUD */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">

            {/* LEFT COLUMN: HUD STATS / MAP */}
            <div className="col-span-1 flex flex-col h-full bg-[#0f172a] border border-slate-800 rounded-2xl p-1 overflow-hidden relative">
              {/* Visual Toggle */}
              <div className="absolute top-4 right-4 z-20 flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                <button
                  onClick={() => setLeftView('stats')}
                  className={`px-3 py-1 text-[10px] font-bold rounded ${leftView === 'stats' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  STATS
                </button>
                <button
                  onClick={() => setLeftView('map')}
                  className={`px-3 py-1 text-[10px] font-bold rounded ${leftView === 'map' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  MAP
                </button>
              </div>

              {leftView === 'stats' ? (
                <div className="flex flex-col gap-4 p-4 h-full">
                  <StatCard
                    title="INSTANT POWER"
                    value={Math.abs(currentForces.power).toFixed(1)}
                    unit="kW"
                    variant="sparkline"
                    data={wltcData}
                    dataKey="power"
                    color="#3b82f6"
                    className="flex-1"
                  />
                  <StatCard
                    title="AERODYNAMIC DRAG"
                    value={currentForces.faero.toFixed(0)}
                    unit="N"
                    variant="wind"
                    subValue={`${((currentForces.faero / Math.max(1, Math.abs(currentForces.ftotal))) * 100).toFixed(0)}% of total load`}
                    color="#a855f7" // Purple
                    className="flex-1"
                  />
                  <StatCard
                    title="WHEEL RPM"
                    value={((simState.velocity / (Math.PI * params.wheelDiameter)) * 60).toFixed(0)}
                    unit="RPM"
                    variant="radial"
                    subValue="No Slip Condition"
                    color="#f59e0b" // Amber
                    className="flex-1"
                  />
                </div>
              ) : (
                <div className="h-full p-2">
                  <RouteMap progress={simState.progress} />
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: MAIN SCHEMATIC */}
            <div className="col-span-2 bg-[#0f172a] border border-slate-800 rounded-2xl p-6 relative h-full">
              {/* Overlay Text */}
              <div className="absolute top-6 left-6 font-mono text-xs z-10 space-y-1">
                <div className="text-emerald-400">SPEED: {(simState.velocity * 3.6).toFixed(1)} km/h</div>
                <div className="text-purple-400">DRAG: {currentForces.faero.toFixed(0)} N</div>
                <div className="text-amber-400">ROLL: {currentForces.froll.toFixed(0)} N</div>
                <div className="text-blue-400">NET: {currentForces.ftotal.toFixed(0)} N</div>
              </div>

              <div className="w-full h-full flex items-center justify-center">
                <CarSchematic
                  velocity={simState.velocity}
                  forces={currentForces}
                  wheelRotation={wheelDeg}
                  params={params}
                />
              </div>
            </div>
          </div>

          {/* 2. CHARTS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Velocity Profile */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-slate-400">VELOCITY PROFILE</h3>
                <span className="text-xs text-blue-400 font-mono">{simState.velocity.toFixed(1)} m/s</span>
              </div>
              <div className="h-[200px] w-full relative">
                {/* The Chart is Memoized (Static) */}
                <StaticChart>
                  <AreaChart data={wltcData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                    <XAxis dataKey="time" stroke="#475569" fontSize={10} tickFormatter={(val) => val.toFixed(0)} />
                    <YAxis stroke="#475569" fontSize={10} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                      itemStyle={{ color: '#3b82f6' }}
                      formatter={(value: any) => [value ? (Number(value).toFixed(1) + ' m/s') : '0 m/s', 'Velocity']}
                    />
                    <Area
                      type="monotone"
                      dataKey="velocity"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fill="url(#velocityGradient)"
                      isAnimationActive={false} // Important: Disable internal Recharts animation for static data
                    />
                  </AreaChart>
                </StaticChart>

                {/* The Cursor Moves Overlay */}
                <div className="absolute inset-0 pointer-events-none" style={{ left: '0px', right: '0px', top: '5px', bottom: '25px' }}>
                  {/* Adjust margins above to match Chart margins approximately */}
                  <PlayheadOverlay progress={simState.progress} />
                </div>
              </div>
            </div>

            {/* Power Distribution */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-slate-400">POWER DEMAND BREAKDOWN</h3>
                <span className="text-xs text-emerald-400 font-mono">{currentForces.power.toFixed(1)} kW</span>
              </div>
              <div className="h-[200px] w-full relative">
                <StaticChart>
                  <AreaChart data={wltcData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                    <XAxis dataKey="time" stroke="#475569" fontSize={10} tickFormatter={(val) => val.toFixed(0)} />
                    <YAxis stroke="#475569" fontSize={10} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                    <Area type="monotone" dataKey="power" stackId="1" stroke="#10b981" fill="#10b981" name="Total Net" fillOpacity={0.1} isAnimationActive={false} />
                  </AreaChart>
                </StaticChart>

                <div className="absolute inset-0 pointer-events-none" style={{ left: '0px', right: '0px', top: '5px', bottom: '25px' }}>
                  <PlayheadOverlay progress={simState.progress} />
                </div>
              </div>
            </div>

            {/* Force Analysis */}
            <div className="col-span-1 lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-slate-400">RESISTIVE FORCES DECOMPOSITION</h3>
                <div className="flex gap-4 text-xs">
                  <span className="text-pink-500">■ Aero</span>
                  <span className="text-amber-500">■ Roll</span>
                  <span className="text-indigo-500">■ Inertia</span>
                </div>
              </div>
              <div className="h-[220px] w-full relative">
                <StaticChart>
                  <LineChart data={wltcData} margin={{ top: 5, right: 0, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                    <XAxis dataKey="time" stroke="#475569" fontSize={10} tickFormatter={(val) => val.toFixed(0)} />
                    <YAxis stroke="#475569" fontSize={10} label={{ value: 'Force (N)', angle: -90, position: 'insideLeft', fill: '#64748b' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                    <Line type="monotone" dataKey="faero" stroke="#ec4899" strokeWidth={2} dot={false} name="Aerodynamic" isAnimationActive={false} />
                    <Line type="monotone" dataKey="froll" stroke="#f59e0b" strokeWidth={2} dot={false} name="Rolling Res." isAnimationActive={false} />
                    <Line type="monotone" dataKey="finertia" stroke="#6366f1" strokeWidth={2} dot={false} name="Inertia" isAnimationActive={false} />
                  </LineChart>
                </StaticChart>
                <div className="absolute inset-0 pointer-events-none" style={{ left: '0px', right: '0px', top: '5px', bottom: '25px' }}>
                  <PlayheadOverlay progress={simState.progress} />
                </div>
              </div>
            </div>

            {/* POWER SPLIT CHART - Real-time P_demand vs P_fc vs P_batt */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-slate-400">POWER SPLIT (Real-time)</h3>
                <div className="flex gap-4 text-xs">
                  <span className="text-orange-400">● P_demand</span>
                  <span className="text-cyan-400">● P_fc</span>
                  <span className="text-blue-400">● P_batt</span>
                </div>
              </div>
              <div className="h-[200px] w-full">
                <StaticChart>
                  <LineChart data={powerHistory} margin={{ top: 5, right: 0, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                    <XAxis dataKey="time" stroke="#475569" fontSize={10} tickFormatter={(val) => val.toFixed(0)} />
                    <YAxis stroke="#475569" fontSize={10} domain={[-20, 100]} label={{ value: 'kW', angle: -90, position: 'insideLeft', fill: '#64748b' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                    <Line type="monotone" dataKey="P_demand" stroke="#f97316" strokeWidth={2} dot={false} name="P_demand" isAnimationActive={false} />
                    <Line type="monotone" dataKey="P_fc" stroke="#22d3ee" strokeWidth={2} dot={false} name="P_fc" isAnimationActive={false} />
                    <Line type="monotone" dataKey="P_batt" stroke="#3b82f6" strokeWidth={2} dot={false} name="P_batt" isAnimationActive={false} />
                  </LineChart>
                </StaticChart>
              </div>
            </div>

            {/* FC EFFICIENCY MAP VISUALIZATION */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-slate-400">FUEL CELL EFFICIENCY MAP</h3>
                <div className="flex gap-2 text-xs">
                  <span className={`px-2 py-0.5 rounded ${simState.fcPower > 0 ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-700 text-slate-400'}`}>
                    FC: {simState.fcPower.toFixed(1)} kW
                  </span>
                  <span className="text-slate-500">η: {simState.fcPower > 0 ? (45 + (simState.fcPower / params.maxFcPower) * 10).toFixed(1) : 0}%</span>
                </div>
              </div>
              <div className="h-[200px] w-full relative bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                {/* Efficiency Contours (Simplified Visual) */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {/* Background gradient zones */}
                  <defs>
                    <linearGradient id="effGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
                      <stop offset="30%" stopColor="#f59e0b" stopOpacity="0.3" />
                      <stop offset="60%" stopColor="#22c55e" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.2" />
                    </linearGradient>
                  </defs>
                  <rect x="0" y="0" width="100" height="100" fill="url(#effGradient)" />

                  {/* Efficiency contour lines */}
                  <path d="M5,95 Q40,50 95,40" fill="none" stroke="#ef4444" strokeWidth="0.5" strokeDasharray="2" />
                  <path d="M10,95 Q45,45 95,30" fill="none" stroke="#f59e0b" strokeWidth="0.5" strokeDasharray="2" />
                  <path d="M20,95 Q50,35 95,20" fill="none" stroke="#22c55e" strokeWidth="0.5" strokeDasharray="2" />
                  <path d="M35,95 Q60,25 95,10" fill="none" stroke="#22d3ee" strokeWidth="0.5" strokeDasharray="2" />

                  {/* Efficiency labels */}
                  <text x="3" y="85" fontSize="3" fill="#ef4444">30%</text>
                  <text x="10" y="70" fontSize="3" fill="#f59e0b">40%</text>
                  <text x="25" y="55" fontSize="3" fill="#22c55e">50%</text>
                  <text x="45" y="35" fontSize="3" fill="#22d3ee">55%</text>
                </svg>

                {/* Operating Point Indicator */}
                <div
                  className={`absolute w-4 h-4 rounded-full transition-all duration-300 ${simState.fcPower > 0 ? 'bg-white shadow-[0_0_15px_white]' : 'bg-slate-600'}`}
                  style={{
                    left: `${Math.min(95, (simState.fcPower / params.maxFcPower) * 100)}%`,
                    bottom: `${Math.min(90, 20 + (simState.fcPower / params.maxFcPower) * 70)}%`,
                    transform: 'translate(-50%, 50%)'
                  }}
                >
                  {simState.fcPower > 0 && <div className="absolute inset-0 rounded-full animate-ping bg-white opacity-50" />}
                </div>

                {/* Axis Labels */}
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 font-bold">FC Power (kW) →</div>
                <div className="absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] text-slate-500 font-bold">Load Point</div>

                {/* Current values overlay */}
                <div className="absolute top-2 right-2 bg-slate-900/80 px-3 py-2 rounded text-[10px] font-mono space-y-1">
                  <div className="text-cyan-400">P_fc: {simState.fcPower.toFixed(1)} kW</div>
                  <div className="text-slate-400">Max: {params.maxFcPower} kW</div>
                  <div className={`${simState.fcPower > params.maxFcPower * 0.4 && simState.fcPower < params.maxFcPower * 0.7 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    Zone: {simState.fcPower > params.maxFcPower * 0.7 ? 'High Load' : simState.fcPower > params.maxFcPower * 0.4 ? 'Optimal' : simState.fcPower > 0 ? 'Low Load' : 'Idle'}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* SCHEMATIC MODAL */}
      {showSchematic && (
        <SchematicModal
          onClose={() => setShowSchematic(false)}
          simState={simState}
          forces={currentForces}
          params={params}
          onBlockClick={handleBlockClick}
        />
      )}

      {/* DETAIL MODALS */}
      {activeModal === 'battery' && (
        <BatteryDetail
          onClose={() => setActiveModal(null)}
          simState={simState}
          forces={currentForces}
        />
      )}
      {activeModal === 'motor' && (
        <MotorDetail
          onClose={() => setActiveModal(null)}
          simState={simState}
          forces={currentForces}
          params={params}
        />
      )}
      {/* Driver/Cycle is usually represented as the 'cycle' or 'driver' block if we had one explicit click ID.
          Assuming 'driver' or similar if added to schematic later, or reusing logic for inputs.
          Let's map 'inverter' roughly to Driver/Control for now or add a specific check.
          Actually the schematic has: battery, inverter, motor, dynamics.
          Let's verify ids in SchematicModal: battery, inverter, motor, dynamics.
          I will map 'inverter' to DriverDetail for now as it controls the motor.
      */}
      {activeModal === 'inverter' && (
        <DriverDetail
          onClose={() => setActiveModal(null)}
          forces={currentForces}
          currentSpeed={simState.velocity}
        />
      )}
      {activeModal === 'fc' && (
        <FuelCellDetail
          onClose={() => setActiveModal(null)}
          simState={simState}
        />
      )}
      {activeModal === 'ems' && (
        <EMSDetail
          onClose={() => setActiveModal(null)}
          simState={simState}
          params={params}
          onUpdateParams={(newParams) => setParams({ ...params, ...newParams })}
        />
      )}
      {activeModal === 'h2' && (
        <HydrogenTankDetail
          onClose={() => setActiveModal(null)}
          simState={simState}
        />
      )}
      {activeModal === 'dynamics' && (
        <WheelDetail
          onClose={() => setActiveModal(null)}
          simState={simState}
          forces={currentForces}
          params={params}
        />
      )}
      {activeModal === 'transmission' && (
        <TransmissionDetail
          onClose={() => setActiveModal(null)}
          simState={simState}
          forces={currentForces}
          params={params}
          onUpdateParams={(newParams) => setParams({ ...params, ...newParams })}
        />
      )}
    </div>
  );
}

// Helper for wheel turning
// Note: In a real app we'd use Canvas for high-perf, but for simple schematic SVG is fine.