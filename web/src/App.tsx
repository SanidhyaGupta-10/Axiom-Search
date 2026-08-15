import { BrowserRouter, Route, Routes } from "react-router"
import Auth from "./pages/Auth"
import Home from "./pages/Home"


export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App