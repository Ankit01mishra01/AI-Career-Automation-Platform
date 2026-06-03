import { NextResponse } from "next/server";
import { generateGeminiContent } from "@/lib/gemini";
import { auth } from "@clerk/nextjs/server";

// Fallback responses when AI API is not configured
const getFallbackResponse = (prompt, type) => {
  const fallbackResponses = {
    resume: "To enhance your resume content, focus on using action verbs, quantifying achievements with specific metrics, and highlighting relevant technical skills. Consider structuring your experience to show progression and impact. For personalized improvements, please configure the AI service.",
    "cover-letter": "For an effective cover letter, personalize the content to the specific role and company, highlight your most relevant achievements, and demonstrate your understanding of the company's needs. Show enthusiasm and explain how you can add value. For AI-generated content, please configure the AI service.",
    interview: "For interview preparation, research the company thoroughly, practice common behavioral questions using the STAR method, prepare specific examples that demonstrate your skills, and think of thoughtful questions to ask the interviewer. For personalized interview questions, please configure the AI service.",
    "industry-insights": "Industry trends show continued growth in digital transformation, remote work adoption, and skills-based hiring. Focus on developing both technical and soft skills, stay updated with industry developments, and build a strong professional network. For detailed industry analysis, please configure the AI service.",
    default: "Thank you for your request. For personalized AI-generated content and insights, please configure the AI service with a valid API key. In the meantime, focus on continuous learning, skill development, and professional networking."
  };
  
  return fallbackResponses[type] || fallbackResponses.default;
};

export async function POST(request) {
  let requestType = "default";
  
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prompt, type } = await request.json();
    requestType = type || "default";

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    let enhancedPrompt = prompt;

    switch (type) {
      case "resume":
        enhancedPrompt = `As a professional resume writer, ${prompt}. 
          Please provide actionable, specific advice with quantifiable metrics where possible.
          Keep the response concise and professional.`;
        break;
      case "cover-letter":
        enhancedPrompt = `As a professional writing expert specializing in cover letters, ${prompt}. 
          Create compelling, personalized content that highlights relevant skills and experiences.
          Maintain a professional yet engaging tone.`;
        break;
      case "interview":
        enhancedPrompt = `As a career coach specializing in interview preparation, ${prompt}. 
          Provide practical, actionable advice with specific examples.
          Focus on helping the candidate showcase their best qualities.`;
        break;
      case "industry-insights":
        enhancedPrompt = `As an industry analyst, ${prompt}. 
          Provide current, accurate data and insights.
          Focus on practical information that can help with career decisions.`;
        break;
      default:
        enhancedPrompt = prompt;
    }

    const result = await generateGeminiContent(enhancedPrompt);

    if (!result.success) {
      if (result.reason === "MISSING_API_KEY") {
        return NextResponse.json({
          success: true,
          data: {
            content: getFallbackResponse(prompt, type),
            type,
            timestamp: new Date().toISOString(),
          },
        });
      }

      return NextResponse.json(
        { success: false, error: result.userMessage },
        { status: 502 }
      );
    }

    console.log(`AI request: ${type || "general"} - ${prompt.substring(0, 50)}...`);

    return NextResponse.json({
      success: true,
      data: {
        content: result.content,
        type,
        model: result.model,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error("AI generation error:", error);
    console.warn('Falling back to default response due to error');
    
    // Return fallback response instead of error
    return NextResponse.json({
      success: true,
      data: {
        content: getFallbackResponse("", requestType) + " [Note: AI service encountered an error]",
        type: requestType,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}
