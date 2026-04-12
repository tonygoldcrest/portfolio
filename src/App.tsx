import { Routes, Route } from 'react-router';

function Home() {
  return <h1 className="text-3xl font-bold p-8">Home</h1>;
}

function NotFound() {
  return <h1 className="text-3xl font-bold p-8">404 — Not found</h1>;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
