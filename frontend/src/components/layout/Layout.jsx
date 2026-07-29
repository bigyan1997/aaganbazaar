import { Suspense } from "react";
import { Outlet } from "react-router-dom";

import CompareFloatingBar from "../catalog/CompareFloatingBar";
import Footer from "./Footer";
import LoadingScreen from "./LoadingScreen";
import Navbar from "./Navbar";

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-20">
        <Suspense fallback={<LoadingScreen />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <CompareFloatingBar />
    </div>
  );
}
