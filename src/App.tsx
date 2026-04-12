import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Home from '@/pages/home';
import ParticleSystemWebGL from '@/pages/particle-system-webgl';
import GameOfLife from '@/pages/game-of-life';
import EcosystemSim from '@/pages/ecosystem-sim';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
        </Route>
        <Route path="/particle-system-webgl" element={<ParticleSystemWebGL />} />
        <Route path="/game-of-life" element={<GameOfLife />} />
        <Route path="/ecosystem-sim" element={<EcosystemSim />} />
      </Routes>
    </BrowserRouter>
  );
}
