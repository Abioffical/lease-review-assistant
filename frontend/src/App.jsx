import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import NewReview from "./pages/NewReview";
import ReviewDetail from "./pages/ReviewDetail";
import History from "./pages/History";
import Standards from "./pages/Standards";

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<NewReview />} />
          <Route path="/reviews/:id" element={<ReviewDetail />} />
          <Route path="/history" element={<History />} />
          <Route path="/standards" element={<Standards />} />
        </Routes>
      </main>
    </div>
  );
}
