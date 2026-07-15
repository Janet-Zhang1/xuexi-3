import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { VocabularyApp } from "@/pages/VocabularyApp";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<VocabularyApp />} />
      </Routes>
    </Router>
  );
}
