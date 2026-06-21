import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "@/components/Layout/Sidebar";
import Header from "@/components/Layout/Header";
import OverviewPage from "@/pages/OverviewPage";
import ChannelPage from "@/pages/ChannelPage";
import FunnelPage from "@/pages/FunnelPage";
import PersonnelPage from "@/pages/PersonnelPage";
import AlertPage from "@/pages/AlertPage";
import ReportPage from "@/pages/ReportPage";

export default function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-brand-bg">
        <Sidebar />
        <div className="flex-1 ml-[220px]">
          <Header />
          <main className="min-h-[calc(100vh-56px)]">
            <Routes>
              <Route path="/" element={<Navigate to="/overview" replace />} />
              <Route path="/overview" element={<OverviewPage />} />
              <Route path="/channel" element={<ChannelPage />} />
              <Route path="/funnel" element={<FunnelPage />} />
              <Route path="/personnel" element={<PersonnelPage />} />
              <Route path="/alert" element={<AlertPage />} />
              <Route path="/report" element={<ReportPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}
