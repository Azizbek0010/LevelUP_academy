import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import DashboardPage from "./pages/DashboardPage";
import DavomatPage from "./pages/DavomatPage";
import HomeworkPage from "./pages/HomeworkPage";
import CoinsPage from "./pages/CoinsPage";
import SalaryPage from "./pages/SalaryPage";
import { clearAuth, getUser, getToken } from "./api";

const PAGES = {
  dashboard: DashboardPage,
  davomat: DavomatPage,
  homework: HomeworkPage,
  coins: CoinsPage,
  salary: SalaryPage,
};

export default function App() {
  const [active, setActive] = useState("davomat");
  const [loading, setLoading] = useState(true);

  // Load token from localStorage once
  const token = getToken();
  const user = getUser();

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleLogout = () => {
    clearAuth();
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f6f4ea]">
        <div className="text-ink-faint">Yuklanmoqda...</div>
      </div>
    );
  }

  const Page = PAGES[active] || DashboardPage;

  return (
    <div className="flex h-screen w-full bg-[#f6f4ea] font-body">
      <Sidebar
        active={active}
        setActive={setActive}
        user={user}
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-y-auto px-8 py-6">
        <Page token={token} user={user} />
      </main>
    </div>
  );
}
