import { inngest } from "@/lib/inngest/client"
import { db } from "@/lib/prisma";

export const generateIndustryInsights = inngest.createFunction(
  { 
    id: "generate-industry-insights",
    retries: 3,
    concurrency: { limit: 5 }
  },
  { cron: "0 0 * * 0" },
  async ({ event, step }) => {
    try {
      console.log("Starting industry insights generation job");
      
      const industries = await step.run("fetch-industries", async () => {
        try {
          return await db.industryInsight.findMany({
            select: { industry: true },
          });
        } catch (error) {
          console.error("Failed to fetch industries:", error);
          throw error;
        }
      });

      console.log(`Found ${industries.length} industries to process`);

      for (const { industry } of industries) {
        try {
          const prompt = `
Analyze the current state of the ${industry} industry and provide insights in ONLY the following JSON format without any additional notes or explanations:
{
  "salaryRanges": [
    { "role": "string", "min": number, "max": number, "median": number, "location": "string" }
  ],
  "growthRate": number,
  "demandLevel": "HIGH" | "MEDIUM" | "LOW",
  "topSkills": ["skill1", "skill2"],
  "marketOutlook": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
  "keyTrends": ["trend1", "trend2"],
  "recommendedSkills": ["skill1", "skill2"]
}

IMPORTANT: Return ONLY the JSON. No additional text, notes, or markdown formatting.
Include at least 5 common roles for salary ranges.
Growth rate should be a percentage.
Include at least 5 skills and trends.
          `;

          // Use direct Gemini API call since Inngest AI wrapper is not available
          const { generateGeminiContent } = require("@/lib/gemini");

          const aiResult = await step.run(
            `generate-insights-${industry}`,
            async () => generateGeminiContent(prompt)
          );

          let insights;
          try {
            if (!aiResult.success) {
              throw new Error(aiResult.reason || "AI generation failed");
            }

            const cleanedText = aiResult.content
              .replace(/```(?:json)?\n?/g, "")
              .trim();

            insights = JSON.parse(cleanedText);
            console.log(`Successfully parsed AI response for ${industry}`);
          } catch (error) {
            console.error(`Failed to parse AI response for ${industry}:`, error);
            // Fallback to default insights if parsing fails
            insights = {
              salaryRanges: [
                { role: "Entry Level", min: 40000, max: 60000, median: 50000, location: "US" },
                { role: "Mid Level", min: 60000, max: 90000, median: 75000, location: "US" },
                { role: "Senior Level", min: 90000, max: 130000, median: 110000, location: "US" },
                { role: "Lead", min: 120000, max: 160000, median: 140000, location: "US" },
                { role: "Manager", min: 130000, max: 180000, median: 155000, location: "US" }
              ],
              growthRate: 10.0,
              demandLevel: "MEDIUM",
              topSkills: ["Communication", "Problem Solving", "Leadership", "Technical Skills", "Analytics"],
              marketOutlook: "NEUTRAL",
              keyTrends: ["Digital Transformation", "Remote Work", "Automation", "Sustainability", "Data Analytics"],
              recommendedSkills: ["Digital Literacy", "Adaptability", "Project Management", "Collaboration", "Continuous Learning"]
            };
            console.log(`Using fallback insights for ${industry}`);
          }

          await step.run(`update-${industry}-insights`, async () => {
            try {
              await db.industryInsight.updateMany({
                where: { industry },
                data: {
                  salaryRanges: insights.salaryRanges,
                  growthRate: insights.growthRate,
                  demandLevel: insights.demandLevel,
                  topSkills: insights.topSkills,
                  marketOutlook: insights.marketOutlook,
                  keyTrends: insights.keyTrends,
                  recommendedSkills: insights.recommendedSkills,
                  lastUpdated: new Date(),
                  nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
              });
              console.log(`Successfully updated insights for ${industry}`);
            } catch (error) {
              console.error(`Failed to update insights for ${industry}:`, error);
              throw error;
            }
          });
        } catch (error) {
          console.error(`Failed to process industry ${industry}:`, error);
          // Continue with other industries even if one fails
        }
      }

      console.log("Industry insights generation job completed successfully");
      return { success: true, industriesProcessed: industries.length };
    } catch (error) {
      console.error("Industry insights generation job failed:", error);
      throw error;
    }
  }
);
