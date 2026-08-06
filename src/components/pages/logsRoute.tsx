import { Routes, Route } from "react-router-dom";
import LogsPage from "../../pages/logs/LogsPage";

export default function LogsRoutes() {
  return (
    <Routes>
      <Route>
        <Route index element={<LogsPage />} />
      </Route>
    </Routes>
  );
}
