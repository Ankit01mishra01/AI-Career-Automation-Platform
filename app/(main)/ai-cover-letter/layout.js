import { Suspense } from "react";
import { BarLoader } from "react-spinners";

export const metadata = {
  title: "Cover Letters | Career Genius",
  description:
    "AI-powered cover letter builder with ATS optimization and PDF export",
};

export default function CoverLetterLayout({ children }) {
  return (
    <div className="px-5">
      <Suspense
        fallback={<BarLoader className="mt-4" width="100%" color="gray" />}
      >
        {children}
      </Suspense>
    </div>
  );
}
