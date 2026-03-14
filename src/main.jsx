import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import App from "./App";
import Landing from "./pages/Landing";
import GroupClasses from "./pages/GroupClasses";
import MercredisSwing from "./pages/MercredisSwing";
import IntroClasses from "./pages/IntroClasses";
import Privates from "./pages/Privates";
import Contact from "./pages/Contact";
import Staff from "./pages/Staff";
import Registration from "./pages/Registration";
import Payment from "./pages/Payment";
import NotFound from "./pages/NotFound";
import { PopupProvider } from "./components/Popup";

const router = createBrowserRouter([
  // Plain routes (no language in URL)
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Landing /> },

      { path: "mercredisswing", element: <MercredisSwing /> },
      { path: "introclasses", element: <IntroClasses /> },
      { path: "groupclasses", element: <GroupClasses /> },
      { path: "privatelessons", element: <Privates /> },
      { path: "contact", element: <Contact /> },
      { path: "staff", element: <Staff /> },
      { path: "register", element: <Registration /> },
      { path: "payment", element: <Payment /> },

      // 404 for any other /... path
      { path: "*", element: <NotFound /> },
    ],
  },

  // Language-prefixed routes
  {
    path: "/:lang",
    element: <App />,
    children: [
      { index: true, element: <Landing /> },

      { path: "mercredisswing", element: <MercredisSwing /> },
      { path: "introclasses", element: <IntroClasses /> },
      { path: "groupclasses", element: <GroupClasses /> },
      { path: "privatelessons", element: <Privates /> },
      { path: "contact", element: <Contact /> },
      { path: "staff", element: <Staff /> },
      { path: "register", element: <Registration /> },
      { path: "payment", element: <Payment /> },

      // 404 for any other /:lang/... path
      { path: "*", element: <NotFound /> },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <PopupProvider>
    <RouterProvider router={router} />
  </PopupProvider>,
);
