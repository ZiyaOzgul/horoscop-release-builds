import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL!;
const client = new ConvexHttpClient(convexUrl);

export const dreamInterpretation = async (
  dreamText: string,
  selectedLang: string,
  gender?: string
) => {
  try {
    console.log("🌙 Interpreting dream (via Convex - Secure)");

    const result = await client.action(api.openai.interpretDream, {
      dreamText,
      selectedLang,
      gender: gender || undefined,
    });

    console.log("Interpretation complete", result);
    return result;
  } catch (error) {
    console.error("Error interpreting dream:", error);
    throw error;
  }
};
