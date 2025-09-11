import { SnackbarProvider } from "notistack";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { BusinessProvider } from "./context/BusinessContext";
import Home from "./pages/home";
import Funnel from "./pages/funnel";
import Socials from "./pages/socials";

function App() {
  return (
    <SnackbarProvider>
      <BusinessProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/funnel" element={<Funnel />} />
            <Route path="/socials" element={<Socials />} />
          </Routes>
        </Router>
      </BusinessProvider>
    </SnackbarProvider>
  );
}

export default App;
