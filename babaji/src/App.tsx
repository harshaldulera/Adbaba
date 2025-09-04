import { SnackbarProvider } from "notistack";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { BusinessProvider } from "./context/BusinessContext";
import Home from "./pages/home";
import Funnel from "./pages/funnel";

function App() {
  return (
    <SnackbarProvider>
      <BusinessProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/funnel" element={<Funnel />} />
          </Routes>
        </Router>
      </BusinessProvider>
    </SnackbarProvider>
  )
}

export default App;