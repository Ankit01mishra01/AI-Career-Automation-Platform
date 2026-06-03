import { getCoverLetters } from "@/actions/cover-letter";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import CoverLetterList from "./_components/cover-letter-list";
import { checkUser } from "@/lib/checkUser";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "AI Cover Letters | Career Genius",
  description:
    "Create, edit, and export personalized ATS-friendly cover letters powered by AI",
};

export default async function CoverLetterPage() {
  const user = await checkUser();

  if (!user) {
    redirect("/sign-in");
  }

  let coverLetters = [];
  try {
    coverLetters = await getCoverLetters();
  } catch (error) {
    console.error("Failed to load cover letters:", error);
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-2 items-center justify-between mb-5">
        <h1 className="text-4xl md:text-6xl font-bold gradient-title">
          My Cover Letters
        </h1>
        <Link href="/ai-cover-letter/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create New
          </Button>
        </Link>
      </div>

      <CoverLetterList coverLetters={coverLetters} />
    </div>
  );
}
