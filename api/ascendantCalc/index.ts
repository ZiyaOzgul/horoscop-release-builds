import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL!;
const client = new ConvexHttpClient(convexUrl);

export const calculateAscendantWithGPT = async (
  birthDate: string, // Format: "DD.MM.YYYY"
  birthTime: string, // Format: "HH:MM"
  city: string
) => {
  try {
    console.log(
      "🌟 Calculating ascendant (via Convex - Secure)",
      birthDate,
      birthTime,
      city
    );

    const result = await client.action(api.openai.calculateAscendant, {
      birthDate,
      birthTime,
      city,
    });

    console.log("Ascendant calculation complete", result);
    return result;
  } catch (error) {
    console.error("Error calculating ascendant with GPT:", error);
    throw error;
  }
};
