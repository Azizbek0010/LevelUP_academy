import * as React from "react";
import * as ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import "./index.css";
import App from "./App.jsx";

// ⚡ Lazy load pages — each loads only when navigated to
// This shaves ~700 KB from the initial bundle (Recharts is the main offender)
const Dashboard = React.lazy(() => import("./pages/Dashboard.jsx"));
const Students = React.lazy(() => import("./pages/Students.jsx"));
const Groups = React.lazy(() => import("./pages/Groups.jsx"));
const GroupDetail = React.lazy(() => import("./pages/GroupDetail.jsx"));
const Payments = React.lazy(() => import("./pages/Payments.jsx"));
const Expenses = React.lazy(() => import("./pages/Expenses.jsx"));
const Reports = React.lazy(() => import("./pages/Reports.jsx"));
const Mentors = React.lazy(() => import("./pages/Mentors.jsx"));
const Chat = React.lazy(() => import("./pages/Chat.jsx"));
const Settings = React.lazy(() => import("./pages/Settings.jsx"));
const NotFound = React.lazy(() => import("./pages/NotFound.jsx"));
const ErrorPage = React.lazy(() => import("./pages/ErrorPage.jsx"));

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <React.Suspense fallback={<PageFallback />}><ErrorPage /></React.Suspense>,
    children: [
      { index: true, element: <React.Suspense fallback={<PageFallback />}><Dashboard /></React.Suspense> },
      { path: "students", element: <React.Suspense fallback={<PageFallback />}><Students /></React.Suspense> },
      { path: "groups", element: <React.Suspense fallback={<PageFallback />}><Groups /></React.Suspense> },
      { path: "groups/:id", element: <React.Suspense fallback={<PageFallback />}><GroupDetail /></React.Suspense> },
      { path: "payments", element: <React.Suspense fallback={<PageFallback />}><Payments /></React.Suspense> },
      { path: "expenses", element: <React.Suspense fallback={<PageFallback />}><Expenses /></React.Suspense> },
      { path: "reports", element: <React.Suspense fallback={<PageFallback />}><Reports /></React.Suspense> },
      { path: "mentors", element: <React.Suspense fallback={<PageFallback />}><Mentors /></React.Suspense> },
      { path: "chat", element: <React.Suspense fallback={<PageFallback />}><Chat /></React.Suspense> },
      { path: "settings", element: <React.Suspense fallback={<PageFallback />}><Settings /></React.Suspense> },
      { path: "*", element: <React.Suspense fallback={<PageFallback />}><NotFound /></React.Suspense> },
    ],
  },
]);

function PageFallback() {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[var(--green)] border-t-transparent rounded-full animate-spin" />
        <span className="text-[13px] text-[var(--text-muted)]">Yuklanmoqda...</span>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
