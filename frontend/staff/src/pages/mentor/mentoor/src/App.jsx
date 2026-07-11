import { useState } from "react";
import Sidebar from "./components/Sidebar";
import DashboardPage from "./pages/DashboardPage";
import DavomatPage from "./pages/DavomatPage";
import HomeworkPage from "./pages/HomeworkPage";
import CoinsPage from "./pages/CoinsPage";
import SalaryPage from "./pages/SalaryPage";

const PAGES = {
  dashboard: DashboardPage,
  davomat: DavomatPage,
  homework: HomeworkPage,
  coins: CoinsPage,
  salary: SalaryPage,
};

export default function App() {
  const [active, setActive] = useState("davomat");
  const Page = PAGES[active];

  return (
    <div className="flex h-screen w-full bg-surface font-body">
      <Sidebar active={active} setActive={setActive} />
      <main className="flex-1 overflow-y-auto px-8 py-6">
        <Page />
      </main>
    </div>
  );
}
