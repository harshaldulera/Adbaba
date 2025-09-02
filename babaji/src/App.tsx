import { SnackbarProvider } from "notistack";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { BusinessProvider } from "./context/BusinessContext";
import Home from "./pages/home";

function App() {
  return (
    <SnackbarProvider>
      <BusinessProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </Router>
      </BusinessProvider>
    </SnackbarProvider>
  )
}

export default App;