import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";


const theme = createTheme({
  palette: {
    mode: "light",
    background: {
      default: "#f5f5f5"
    }
  }
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />        
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
