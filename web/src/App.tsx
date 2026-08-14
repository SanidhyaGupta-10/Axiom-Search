import { BrowserRouter, Route, Routes } from "react-router"
import Auth from "./pages/Auth"
import Dashboard from "./pages/Dashboard"

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/auth" element={<Auth />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App