// main.jsx — App entry point: router setup + React root mount
//
// Routing strategy: every route is duplicated at "/" and "/:lang".
// When :lang is present (e.g. /en/signup), all components read it via useParams()
// and build locale-aware links with `prefix = lang ? \`/${lang}\` : ""`.
// Default locale is French — no lang prefix means FR.
// Only "en" is currently used as an explicit lang prefix.

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
import SignUp from "./pages/SignUp";
import Troupes from "./pages/Troupes";
import PaymentThanks from "./pages/PaymentThanks";
import CodeOfConduct from "./pages/CodeOfConduct";
import Faq from "./pages/Faq";
import NotFound from "./pages/NotFound";

// Pages that live on another site (the public studio schedule is served by
// the Dome admin app) -- a full page load there, not an in-app route.
const PUBLIC_SCHEDULE_URL = "https://dome.swingconnexion.com/schedule-public";
const ExternalRedirect = ({ to }) => {
  React.useEffect(() => window.location.replace(to), [to]);
  return null;
};

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
      { path: "signup", element: <SignUp /> },
      { path: "payment-thanks", element: <PaymentThanks /> },
      { path: "troupes", element: <Troupes /> },
      { path: "codeofconduct", element: <CodeOfConduct /> },
      { path: "faq", element: <Faq /> },
      { path: "schedule-public", element: <ExternalRedirect to={PUBLIC_SCHEDULE_URL} /> },

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
      { path: "signup", element: <SignUp /> },
      { path: "payment-thanks", element: <PaymentThanks /> },
      { path: "troupes", element: <Troupes /> },
      { path: "codeofconduct", element: <CodeOfConduct /> },
      { path: "faq", element: <Faq /> },
      { path: "schedule-public", element: <ExternalRedirect to={PUBLIC_SCHEDULE_URL} /> },

      // 404 for any other /:lang/... path
      { path: "*", element: <NotFound /> },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);
