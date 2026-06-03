import { GoogleGenerativeAI } from "@google/generative-ai";

/** Models tried in order — first available on the user's quota wins */
export const GEMINI_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-flash-latest",
];

export function getGeminiApiKey() {
  const key = (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    ""
  ).trim();

  if (!key || key === "your_gemini_api_key_here") {
    return null;
  }

  return key;
}

export function createGeminiClient() {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
}

function getErrorStatus(error) {
  return error?.status ?? error?.cause?.status ?? 0;
}

function getUserFacingError(reason, lastError) {
  switch (reason) {
    case "MISSING_API_KEY":
      return "Gemini API key not configured. Add GEMINI_API_KEY to .env.local and restart the dev server.";
    case "INVALID_API_KEY":
      return "Invalid Gemini API key. Create a new key at https://aistudio.google.com/apikey";
    case "QUOTA_EXCEEDED":
      return "Gemini API quota exceeded. Wait a minute and try again, or check billing at https://ai.google.dev";
    default:
      return (
        lastError?.message?.split("\n")[0] ||
        "AI service temporarily unavailable. Please try again."
      );
  }
}

/**
 * Generate text with Gemini, falling back across models when one is unavailable.
 */
export async function generateGeminiContent(
  prompt,
  { models = GEMINI_MODELS } = {}
) {
  const client = createGeminiClient();

  if (!client) {
    return {
      success: false,
      reason: "MISSING_API_KEY",
      userMessage: getUserFacingError("MISSING_API_KEY"),
    };
  }

  let lastError = null;

  for (const modelName of models) {
    try {
      const model = client.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const content = result.response.text()?.trim();

      if (!content) {
        lastError = new Error(`Empty response from ${modelName}`);
        continue;
      }

      return { success: true, content, model: modelName };
    } catch (error) {
      lastError = error;
      const status = getErrorStatus(error);

      if (status === 401 || status === 403) {
        return {
          success: false,
          reason: "INVALID_API_KEY",
          userMessage: getUserFacingError("INVALID_API_KEY", error),
          error,
        };
      }

      // Try the next model on 404 (deprecated) or 429 (quota on that model)
      continue;
    }
  }

  const status = getErrorStatus(lastError);
  const reason = status === 429 ? "QUOTA_EXCEEDED" : "API_ERROR";

  return {
    success: false,
    reason,
    userMessage: getUserFacingError(reason, lastError),
    error: lastError,
  };
}

/** Throw a clear error when AI generation fails (for server actions) */
export function assertGeminiSuccess(result) {
  if (result.success) return result;
  throw new Error(result.userMessage);
}
