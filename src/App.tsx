import { Routes, Route } from 'react-router';
import Layout from '@/components/Layout';
import Home from '@/pages/home';
import NotFound from '@/pages/not-found';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
