import { SnackbarProvider } from "notistack";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { BusinessProvider } from "./context/BusinessContext";
import Home from "./pages/home";
import Funnel from "./pages/funnel";
import Social from "./pages/social";

function App() {
  return (
    <SnackbarProvider>
      <BusinessProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/funnel" element={<Funnel />} />
            <Route path="/socials" element={<Social />} />
          </Routes>
        </Router>
      </BusinessProvider>
    </SnackbarProvider>
  )
}

export default App;