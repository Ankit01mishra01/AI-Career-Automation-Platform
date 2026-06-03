import { redirect } from "next/navigation";
import { industries } from "@/data/industries";
import OnboardingForm from "./_components/onboarding-form";
import { getUserOnboardingStatus } from "@/actions/user";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Onboarding",
  description: "Complete your profile for personalized career insights and AI tools",
};

const OnboardingPage= async()=> {
  // Check if user is already onboarded
  const { isOnboarded } = await getUserOnboardingStatus();

  if (isOnboarded) {
    redirect("/dashboard");
  }

  return (
    <main>
      <OnboardingForm industries={industries} />
    </main>
  );
};
export default OnboardingPage;
