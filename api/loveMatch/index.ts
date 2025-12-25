import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL!;
const client = new ConvexHttpClient(convexUrl);

export const getLoveMatchDetails = async (
  loveMatchZodiacs: string,
  selectedLang: string,
  firstPersonGender?: string,
  secondPersonGender?: string
) => {
  try {
    console.log("💕 Analyzing love match (via Convex - Secure)");

    const result = await client.action(api.openai.analyzeLoveMatch, {
      zodiacPair: loveMatchZodiacs,
      selectedLang,
      firstPersonGender: firstPersonGender || undefined,
      secondPersonGender: secondPersonGender || undefined,
    });

    console.log("Love Match API Response:", result);

    // The Convex action returns the exact format we need
    return result;
  } catch (error) {
    console.error("Error on love match analysis:", error);

    return {
      status: 500,
      loveMatch: {
        percentage: "0%",
        categories: {
          love: {
            percentage: 0,
            explanation:
              "Unable to analyze compatibility at this time. Please try again.",
          },
          business: {
            percentage: 0,
            explanation:
              "Unable to analyze compatibility at this time. Please try again.",
          },
          sex: {
            percentage: 0,
            explanation:
              "Unable to analyze compatibility at this time. Please try again.",
          },
          friendship: {
            percentage: 0,
            explanation:
              "Unable to analyze compatibility at this time. Please try again.",
          },
        },
      },
    };
  }
};

export interface LoveMatchCategory {
  percentage: number;
  explanation: string;
}

export interface LoveMatchData {
  percentage: string;
  categories: {
    love: LoveMatchCategory;
    business: LoveMatchCategory;
    sex: LoveMatchCategory;
    friendship: LoveMatchCategory;
  };
}

export interface LoveMatchResponse {
  status: number;
  loveMatch: LoveMatchData;
}
