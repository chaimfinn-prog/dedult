import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Loading from "./components/Loading";
import Login from "./pages/Login";
import GeneralPicks from "./pages/GeneralPicks";
import LiveMatches from "./pages/LiveMatches";
import Leaderboard from "./pages/Leaderboard";
import Bracket from "./pages/Bracket";
import Admin from "./pages/Admin";
import Rules from "./pages/Rules";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-full place-items-center">
        <Loading label="מתחבר…" />
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<GeneralPicks />} />
        <Route path="/matches" element={<LiveMatches />} />
        <Route path="/bracket" element={<Bracket />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/rules" element={<Rules />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
