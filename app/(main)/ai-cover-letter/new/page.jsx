import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import CoverLetterGenerator from "../_components/cover-letter-generator";
import { checkUser } from "@/lib/checkUser";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Create Cover Letter | Career Genius",
  description:
    "Generate a personalized, ATS-friendly cover letter with AI using your profile and job details",
};

export default async function NewCoverLetterPage() {
  const user = await checkUser();

  if (!user) {
    redirect("/sign-in");
  }

  const userProfile = {
    name: user.name,
    industryName: user.industryName,
    experience: user.experience,
    skills: user.skills,
    bio: user.bio,
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-2">
        <Link href="/ai-cover-letter">
          <Button variant="link" className="gap-2 pl-0">
            <ArrowLeft className="h-4 w-4" />
            Back to Cover Letters
          </Button>
        </Link>

        <div className="pb-6">
          <h1 className="text-4xl md:text-6xl font-bold gradient-title">
            Create Cover Letter
          </h1>
          <p className="text-muted-foreground">
            Generate a tailored, ATS-friendly cover letter for your job application
          </p>
        </div>
      </div>

      <CoverLetterGenerator userProfile={userProfile} />
    </div>
  );
}
