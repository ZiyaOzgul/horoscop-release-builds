import { v } from "convex/values";
import OpenAI from "openai";
import { action } from "./_generated/server";

// Note: This file handles OpenAI API calls and other sensitive API operations
// All API keys are stored securely in Convex environment variables

// This runs on the server, so your API key is safe!
export const generateHoroscope = action({
  args: {
    horoscopeDetails: v.string(),
    selectedLang: v.string(),
    period: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly")
    ),
    isPremium: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Get the API key from Convex environment variables (server-side only!)
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY not configured in Convex dashboard");
    }

    const openai = new OpenAI({ apiKey });

    try {
      console.log(`🌐 Fetching ${args.period} horoscope (Server-side)`);

      // For free users on weekly/monthly, only return sunSign
      const isFreeUser = !args.isPremium && args.period !== "daily";

      const systemContent = isFreeUser
        ? `You are an expert astrologer. Create a ${args.period} horoscope in ${args.selectedLang}.

Return ONLY valid JSON without markdown:
{
  "status": 200,
  "horoscope": {
    "sunSign": "detailed explanation (minimum 3-4 sentences) with planetary influences and actionable advice",
    "love": {"percentage": 0-100 },
    "career": {"percentage": 0-100 },
    "luck": {"percentage": 0-100 },
    "health": {"percentage": 0-100}
  }
}

Be specific and insightful based on: ${args.horoscopeDetails}`
        : `You are an expert astrologer. Create a ${args.period} horoscope in ${args.selectedLang}.

Return ONLY valid JSON without markdown:
{
  "status": 200,
  "horoscope": {
    "sunSign": "detailed explanation (minimum 3-4 sentences) with planetary influences and actionable advice",
    "love": {"percentage": 0-100, "explanation": "detailed explanation (minimum 3-4 sentences)"},
    "career": {"percentage": 0-100, "explanation": "detailed explanation (minimum 3-4 sentences)"},
    "luck": {"percentage": 0-100, "explanation": "detailed explanation (minimum 3-4 sentences)"},
    "health": {"percentage": 0-100, "explanation": "detailed explanation (minimum 3-4 sentences)"}
  }
}

Be specific and insightful based on: ${args.horoscopeDetails}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemContent,
          },
          {
            role: "user",
            content: `Generate ${args.period} horoscope`,
          },
        ],
        temperature: 0.7,
        max_tokens: isFreeUser ? 800 : 1500,
        top_p: 0.9,
      });

      const messageContent = response.choices[0].message.content;
      if (!messageContent) {
        throw new Error("Message content is null");
      }

      const cleanedContent = messageContent
        .replace(/```json\n?|\n?```/g, "")
        .trim();
      const message = JSON.parse(cleanedContent);

      return {
        status: message.status,
        horoscope: message.horoscope,
      };
    } catch (error) {
      console.error(`Error on ${args.period} horoscope:`, error);
      throw error;
    }
  },
});

export const interpretDream = action({
  args: {
    dreamText: v.string(),
    selectedLang: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY not configured in Convex dashboard");
    }

    const openai = new OpenAI({ apiKey });

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a helpful dream interpreter. Provide detailed and insightful dream interpretations. And give result only as a JsonObject. i will use data you provided.and add status to 200 if its success. Give provide detailed interpretation in json. Json data must look like this  'status': 200 'interpretation': 'symbols': ['symbol' '''meanings' '', '' 'overall_message': ''}} dont write json to top of it just give me only json data. Give the results only language as ${args.selectedLang}`,
          },
          {
            role: "user",
            content: args.dreamText,
          },
        ],
        temperature: 1,
        max_tokens: 2048,
        top_p: 1,
      });

      const messageContent = response.choices[0].message.content;
      if (!messageContent) {
        throw new Error("Message content is null");
      }

      const message = JSON.parse(messageContent);
      return {
        status: message.status,
        interpretation: message.interpretation,
      };
    } catch (error) {
      console.error("Error interpreting dream:", error);
      throw error;
    }
  },
});

export const analyzeLoveMatch = action({
  args: {
    zodiacPair: v.string(),
    selectedLang: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY not configured in Convex dashboard");
    }

    const openai = new OpenAI({ apiKey });

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an expert astrologer specializing in zodiac compatibility. Analyze compatibility with detailed explanations (3-4 sentences minimum per category). Return only valid JSON, no markdown or extra text.",
          },
          {
            role: "user",
            content: `Analyze ${args.zodiacPair} compatibility in ${args.selectedLang}. Provide percentage (0-100) and detailed explanation (minimum 3-4 sentences) for Love, Business, Sex, and Friendship. Consider elemental traits, strengths, and challenges.

JSON format:
{
  "status": 200,
  "match": {
    "percentage": "75",
    "categories": {
      "love": {"percentage": 85, "explanation": "detailed explanation here..."},
      "business": {"percentage": 70, "explanation": "detailed explanation here..."},
      "sex": {"percentage": 90, "explanation": "detailed explanation here..."},
      "friendship": {"percentage": 80, "explanation": "detailed explanation here..."}
    }
  }
}

Return ONLY the JSON object.`,
          },
        ],
        temperature: 0.8,
        max_tokens: 3000,
        top_p: 0.95,
      });

      const messageContent = response.choices[0].message.content;
      if (!messageContent) {
        throw new Error("Message content is null");
      }

      const cleanedContent = messageContent
        .replace(/```json\n?|\n?```/g, "")
        .trim();
      const message = JSON.parse(cleanedContent);

      if (!message.match || !message.match.categories) {
        throw new Error("Invalid response structure from GPT");
      }

      const defaultCategory = {
        percentage: 50,
        explanation: "Analysis unavailable for this category.",
      };

      const categories = {
        love: message.match.categories.love || defaultCategory,
        business: message.match.categories.business || defaultCategory,
        sex: message.match.categories.sex || defaultCategory,
        friendship: message.match.categories.friendship || defaultCategory,
      };

      return {
        status: message.status || 200,
        loveMatch: {
          percentage: message.match.percentage || "50%",
          categories: categories,
        },
      };
    } catch (error) {
      console.error("Error analyzing love match:", error);
      throw error;
    }
  },
});

export const analyzePalmistry = action({
  args: {
    base64Image: v.string(),
    selectedLang: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY not configured in Convex dashboard");
    }

    const openai = new OpenAI({ apiKey });

    const systemPrompt = `
You are an expert palm reader who analyzes any hand photo, regardless of quality.
RULES:
1. Never refuse analysis unless the image is clearly not a hand.
2. Always give a full reading from visible features.
3. If lines are unclear, use hand shape, finger proportions, and overall look.
4. Faint lines still have meaning—interpret them as subtle traits.
OBSERVABLE FEATURES:
- Hand shape: square/rectangular, wide/narrow
- Finger length vs. palm: short/balanced/long
- Hand type: Earth (square palm, short fingers), Air (square, long fingers), Fire (long palm, short fingers), Water (long palm, long fingers)
LINES:
- Life line: energy/vitality (faint = adaptable, strong = robust)
- Heart line: emotions (subtle = private, clear = expressive)
- Fate line: career/direction (absent = independent, faint = flexible, clear = focused)
ALWAYS return:
{
  "status": 200,
  "analysis": {
    "details": "detailed  (minimum 3-4 sentences) palm reading.",
    "result": " detailed  (minimum 3-4 sentences) Future insights and tendencies.",
    "summary": "detailed  (minimum 3-4 sentences) personality overview.",
    "hand_type": "detailed  (minimum 2-4 sentences) Overall hand type and shape.",
    "life_line": "detailed  (minimum 2-4 sentences) Observation + meaning of vitality and resilience.",
    "heart_line": "detailed  (minimum 2-4 sentences) Observation + meaning of emotions and relationships.",
    "fate_line": "detailed  (minimum 2-4 sentences) Observation + meaning of direction and ambition."
  }
}
If the image is not a hand at all, return only:{ "status": 202 } give the all results language of only  ${args.selectedLang}
`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this hand photo for palm reading. Work with whatever details are visible - hand shape, finger proportions, any visible lines or features. Even if some lines appear faint or subtle, this is meaningful in palmistry. Provide a complete professional reading based on what you observe. Remember: many people naturally have faint lines, and interpreting these is part of your expertise. Return ONLY the JSON format specified.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${args.base64Image}`,
                  detail: "high",
                },
              },
            ],
          },
        ],
        max_tokens: 2500,
        temperature: 0.7,
      });

      const messageContent = response.choices[0].message.content;
      console.log("Raw AI response:", messageContent);

      if (!messageContent) {
        throw new Error("AI response is empty");
      }

      let cleanedContent = messageContent.trim();

      // Remove markdown code blocks if present
      if (cleanedContent.startsWith("```json")) {
        cleanedContent = cleanedContent
          .replace(/```json\n?/, "")
          .replace(/\n?```$/, "");
      } else if (cleanedContent.startsWith("```")) {
        cleanedContent = cleanedContent
          .replace(/```\n?/, "")
          .replace(/\n?```$/, "");
      }

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(cleanedContent);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        // Try to extract JSON from the content
        const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error(`Failed to parse AI response as JSON`);
        }
      }

      // Validate response structure
      if (!parsedResponse.status) {
        throw new Error("Invalid response format: missing status");
      }

      if (parsedResponse.status === 200) {
        if (!parsedResponse.analysis) {
          throw new Error(
            "Invalid response format: missing analysis for successful status"
          );
        }

        // Ensure all required fields exist
        const analysis = parsedResponse.analysis;
        if (
          !analysis.summary ||
          !analysis.hand_type ||
          !analysis.life_line ||
          !analysis.heart_line ||
          !analysis.fate_line
        ) {
          throw new Error("Invalid response: missing required analysis fields");
        }
      }

      return {
        status: parsedResponse.status,
        analysis: parsedResponse.analysis,
        message: parsedResponse.message,
      };
    } catch (error) {
      console.error("Error analyzing palmistry:", error);
      throw error;
    }
  },
});

export const calculateAscendant = action({
  args: {
    birthDate: v.string(),
    birthTime: v.string(),
    city: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY not configured in Convex dashboard");
    }

    const openai = new OpenAI({ apiKey });

    try {
      // Convert DD.MM.YYYY to YYYY-MM-DD for better GPT understanding
      const dateParts = args.birthDate.split(".");
      const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
      console.log(
        "🌟 Calculating ascendant (Server-side):",
        args.birthDate,
        args.birthTime,
        args.city
      );

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert astrologer specializing in ascendant (rising sign) calculations. Calculate the ascendant sign based on the provided birth data. Return ONLY a JSON object with no markdown formatting or json prefix. The JSON must have this exact structure: {"status": 200, "ascendant": {"sign": "sign name"}}. The sign name must be one of: Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces. Provide the result only english language.`,
          },
          {
            role: "user",
            content: `Calculate the ascendant (rising sign) for someone born on ${formattedDate} at ${args.birthTime} in ${args.city}. Return only the ascendant sign name.`,
          },
        ],
        temperature: 0.5,
        max_tokens: 256,
        top_p: 1,
      });

      const messageContent = response.choices[0].message.content;
      if (!messageContent) {
        throw new Error("Message content is null");
      }

      // Remove potential markdown formatting
      const cleanContent = messageContent
        .replace(/```json\n?|\n?```/g, "")
        .trim();
      const message = JSON.parse(cleanContent);

      console.log("Ascendant calculation complete", message);

      return {
        status: message.status,
        ascendant: message.ascendant.sign,
      };
    } catch (error) {
      console.error("Error calculating ascendant with GPT:", error);
      throw error;
    }
  },
});

export const deleteClerkUser = action({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    if (!clerkSecretKey) {
      throw new Error("CLERK_SECRET_KEY not configured in Convex dashboard");
    }

    try {
      console.log("🗑️ Deleting user from Clerk (Server-side):", args.userId);

      const deleteReq = await fetch(
        `https://api.clerk.com/v1/users/${args.userId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${clerkSecretKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await deleteReq.json();

      if (deleteReq.ok) {
        console.log("User deleted from Clerk successfully:", result);
        return {
          success: true,
          data: result,
        };
      } else {
        console.error("Failed to delete user from Clerk:", result);
        return {
          success: false,
          error: result.message || "Failed to delete user from Clerk",
        };
      }
    } catch (error) {
      console.error("Error deleting user from Clerk:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  },
});
