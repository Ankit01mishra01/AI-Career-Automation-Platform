"use server";

import { db } from "@/lib/prisma";
import { isDbConnectionError, DB_SETUP_HINT } from "@/lib/db-utils";
import { generateGeminiContent } from "@/lib/gemini";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function saveResume(content) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    const resume = await db.resume.upsert({
      where: {
        userId: user.id,
      },
      update: {
        content,
      },
      create: {
        userId: user.id,
        content,
      },
    });

    revalidatePath("/resume");
    return resume;
  } catch (error) {
    console.error("Error saving resume:", error.message);
    throw new Error("Failed to save resume");
  }
}

export async function getResume() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    return await db.resume.findUnique({
      where: {
        userId: user.id,
      },
    });
  } catch (error) {
    if (isDbConnectionError(error)) {
      const dbError = new Error(DB_SETUP_HINT);
      dbError.code = "DB_CONNECTION_ERROR";
      throw dbError;
    }
    throw error;
  }
}

export async function improveWithAI({ current, type }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: {
      industry: true,
    },
  });

  if (!user) throw new Error("User not found");

  const industry =
    user.industryName?.replace(/-/g, " ") || "professional";

  const prompt = `As an expert resume writer, improve the following ${type} description for a ${industry} professional.
Make it more impactful, quantifiable, and aligned with industry standards.

Current content:
"${current}"

Requirements:
1. Use strong action verbs
2. Include metrics and results where possible
3. Highlight relevant technical skills
4. Keep it concise but detailed (2-4 sentences)
5. Focus on achievements over responsibilities
6. Use industry-specific keywords

Return ONLY the improved description text. No labels, quotes, or explanations.`;

  const result = await generateGeminiContent(prompt);

  if (result.success) {
    return {
      content: result.content,
      source: "ai",
      model: result.model,
    };
  }

  // No API key — basic local improvement only
  if (result.reason === "MISSING_API_KEY") {
    return {
      content: getBasicImprovedContent(current, type),
      source: "fallback",
      message: result.userMessage,
    };
  }

  // API key present but call failed — surface the real error to the user
  console.error("Improve with AI failed:", result.reason, result.error?.message);
  throw new Error(result.userMessage);
}

const getBasicImprovedContent = (current, type) => {
  if (!current || current.trim().length === 0) {
    return `Enhanced ${type} content with measurable achievements and impact-focused language.`;
  }

  let improved = current.trim();
  improved = improved.charAt(0).toUpperCase() + improved.slice(1);
  if (!improved.endsWith(".")) {
    improved += ".";
  }

  return improved;
};
