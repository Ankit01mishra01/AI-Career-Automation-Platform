"use server";

import { db } from "@/lib/prisma";
import { checkUser } from "@/lib/checkUser";
import { revalidatePath } from "next/cache";
import { generateGeminiContent } from "@/lib/gemini";

/** ATS-friendly fallback when Gemini is unavailable */
const getFallbackCoverLetter = ({
  jobTitle,
  companyName,
  jobDescription,
  user,
  personalizedContent,
}) => {
  const skills = user.skills?.join(", ") || "relevant professional skills";
  const experience = user.experience ?? "several";
  const industry = user.industryName?.replace(/-/g, " ") || "your field";

  return `${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}

${companyName}
[Hiring Manager]
[Company Address]

Dear Hiring Manager,

I am writing to express my strong interest in the ${jobTitle} position at ${companyName}. With ${experience} years of experience in ${industry} and expertise in ${skills}, I am confident I can contribute meaningfully to your team.

${jobDescription ? `Based on the role requirements, I understand you are seeking a professional who can deliver results aligned with: ${jobDescription.slice(0, 300)}${jobDescription.length > 300 ? "..." : ""}. ` : ""}Throughout my career, I have consistently demonstrated the ability to solve complex problems, collaborate across teams, and deliver measurable outcomes.

${user.bio ? `${user.bio}\n\n` : ""}${personalizedContent ? `${personalizedContent}\n\n` : ""}I would welcome the opportunity to discuss how my background aligns with ${companyName}'s goals. Thank you for your time and consideration.

Sincerely,
${user.name || "Your Name"}`;
};

export async function getCoverLetters() {
  try {
    const user = await checkUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    return await db.coverLetter.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error getting cover letters:", error);
    throw new Error("Failed to fetch cover letters");
  }
}

export async function deleteCoverLetter(id) {
  try {
    const user = await checkUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    const coverLetter = await db.coverLetter.findFirst({
      where: { id, userId: user.id },
    });

    if (!coverLetter) {
      throw new Error(
        "Cover letter not found or you don't have permission to delete it"
      );
    }

    await db.coverLetter.delete({ where: { id } });
    revalidatePath("/ai-cover-letter");

    return { success: true };
  } catch (error) {
    console.error("Error deleting cover letter:", error);
    throw new Error(error.message || "Failed to delete cover letter");
  }
}

export async function createCoverLetter(data) {
  try {
    const user = await checkUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    const { content, jobDescription, companyName, jobTitle } = data;

    const coverLetter = await db.coverLetter.create({
      data: {
        content,
        jobDescription: jobDescription || "",
        companyName,
        jobTitle,
        userId: user.id,
      },
    });

    revalidatePath("/ai-cover-letter");
    return coverLetter;
  } catch (error) {
    console.error("Error creating cover letter:", error);
    throw new Error("Failed to create cover letter");
  }
}

export async function getCoverLetterById(id) {
  try {
    const user = await checkUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    const coverLetter = await db.coverLetter.findFirst({
      where: { id, userId: user.id },
    });

    if (!coverLetter) {
      throw new Error(
        "Cover letter not found or you don't have permission to view it"
      );
    }

    return coverLetter;
  } catch (error) {
    console.error("Error getting cover letter:", error);
    throw new Error("Failed to fetch cover letter");
  }
}

export const getCoverLetter = getCoverLetterById;

export async function updateCoverLetter(id, data) {
  try {
    const user = await checkUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    const existingCoverLetter = await db.coverLetter.findFirst({
      where: { id, userId: user.id },
    });

    if (!existingCoverLetter) {
      throw new Error(
        "Cover letter not found or you don't have permission to update it"
      );
    }

    const { content, jobDescription, companyName, jobTitle } = data;

    const coverLetter = await db.coverLetter.update({
      where: { id },
      data: {
        content,
        jobDescription,
        companyName,
        jobTitle,
      },
    });

    revalidatePath("/ai-cover-letter");
    revalidatePath(`/ai-cover-letter/${id}`);

    return coverLetter;
  } catch (error) {
    console.error("Error updating cover letter:", error);
    throw new Error(error.message || "Failed to update cover letter");
  }
}

export async function generateCoverLetter({
  jobTitle,
  companyName,
  jobDescription,
  personalizedContent,
}) {
  try {
    const user = await checkUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    const userWithResume = await db.user.findUnique({
      where: { id: user.id },
      include: { resume: true },
    });

    const resumeExcerpt = userWithResume?.resume?.content
      ? userWithResume.resume.content.slice(0, 2000)
      : null;

    const prompt = `
Write a professional, ATS-friendly cover letter for the following position.

Job Title: ${jobTitle}
Company: ${companyName}
${jobDescription ? `Job Description:\n${jobDescription}` : ""}

Candidate Background:
- Name: ${user.name || "Candidate"}
- Industry: ${user.industryName?.replace(/-/g, " ") || "Professional"}
- Years of Experience: ${user.experience ?? "Not specified"}
- Skills: ${user.skills?.join(", ") || "Various professional skills"}
${user.bio ? `- Professional Bio: ${user.bio}` : ""}
${resumeExcerpt ? `- Resume Summary (use relevant details):\n${resumeExcerpt}` : ""}
${personalizedContent ? `- Additional Highlights: ${personalizedContent}` : ""}

Requirements:
1. Use clear section structure: date, salutation, 3-4 body paragraphs, professional closing
2. Mirror keywords from the job description for ATS compatibility
3. Highlight quantifiable achievements where possible
4. Keep tone professional and personalized to ${companyName}
5. Use standard business letter formatting in plain text/markdown
6. Do NOT use tables, images, or complex formatting
7. Length: approximately 300-400 words

Return only the cover letter content, no extra commentary.
`;

    const aiResult = await generateGeminiContent(prompt);
    let content;

    if (aiResult.success) {
      content = aiResult.content;
    } else if (aiResult.reason === "MISSING_API_KEY") {
      content = getFallbackCoverLetter({
        jobTitle,
        companyName,
        jobDescription,
        user: userWithResume || user,
        personalizedContent,
      });
    } else {
      throw new Error(aiResult.userMessage);
    }

    const coverLetter = await db.coverLetter.create({
      data: {
        userId: user.id,
        jobTitle,
        companyName,
        jobDescription: jobDescription || "",
        content,
      },
    });

    revalidatePath("/ai-cover-letter");
    return { success: true, content, id: coverLetter.id };
  } catch (error) {
    console.error("Error generating cover letter:", error);
    throw new Error(error.message || "Failed to generate cover letter");
  }
}
