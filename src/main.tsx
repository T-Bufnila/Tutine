import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { applyCachedTheme } from "./lib/themes";
import { applyCachedTypography } from "./lib/typography";
import "./styles/themes.css";
import "./styles/typography.css";
import "./styles/base.css";
import "./styles/controls.css";
import "./styles/layout.css";
import "./styles/todos.css";
import "./styles/routines.css";
import "./styles/settings.css";
import "./styles/history.css";

applyCachedTheme();
applyCachedTypography();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
