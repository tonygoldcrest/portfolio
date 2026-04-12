import { Outlet } from 'react-router';

export default function Layout() {
  return (
    <div className="min-h-screen bg-neutral-800 text-foreground w-5/6 m-auto">
      <Outlet />
    </div>
  );
}
