import { getResume } from "@/actions/resume";
import ResumeBuilder from "./_components/resume-builder";
import { AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ResumePage() {
  let resume = null;
  let dbError = null;

  try {
    resume = await getResume();
  } catch (error) {
    if (error.code === "DB_CONNECTION_ERROR") {
      dbError = error.message;
    } else {
      throw error;
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-4">
      {dbError && (
        <div className="flex gap-3 items-start p-4 border border-red-500/50 bg-red-500/10 rounded-lg text-sm">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-400">Database not connected</p>
            <p className="text-muted-foreground mt-1">{dbError}</p>
          </div>
        </div>
      )}
      <ResumeBuilder initialContent={resume?.content} />
    </div>
  );
}
