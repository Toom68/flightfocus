import { useFlightStore } from '@/store/flightStore';
import { HomeScreen } from '@/components/HomeScreen';
import { GroundedView } from '@/components/GroundedView';
import { SimulationView } from '@/components/SimulationView';

export default function App() {
  const { viewMode } = useFlightStore();

  return (
    <div className="min-h-screen bg-cabin-dark font-display">
      {viewMode === 'home' && <HomeScreen />}
      {viewMode === 'grounded' && <GroundedView />}
      {(viewMode === 'simulation' || viewMode === 'fullscreen') && <SimulationView />}
    </div>
  );
}
