import React, { Suspense } from "react";
import { BarLoader } from "react-spinners";

export const metadata = {
  title: "Resume Builder",
  description: "Build and export an ATS-optimized resume with AI assistance",
};

const Layout = ({ children }) => {
  return (
    <div className="px-5">
      <Suspense
        fallback={<BarLoader className="mt-4" width={"100%"} color="gray" />}
      >
        {children}
      </Suspense>
    </div>
  );
};

export default Layout;