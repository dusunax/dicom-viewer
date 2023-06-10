import { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import MainPage from "@/pages/Main";
const Loading = lazy(() => import("@/pages/common/Loading"));
const ExamplePage = lazy(() => import("@/pages/Example"));

const ThreePage = lazy(() => import("@/pages/view/Three"));
const Convertor = lazy(() => import("@/pages/convertor/Convertor"));

export default function Router() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<MainPage />} />

          <Route path="/view/dicom" element={<ExamplePage />} />
          <Route path="/view/3d" element={<ThreePage />} />

          <Route path="/convertor" element={<Convertor />} />
          <Route path="/convertor/:convert-type" element={<Convertor />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
