import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL!;
const client = new ConvexHttpClient(convexUrl);

export interface TarotCard {
  position: number;
  cardName: string;
  direction: "upright" | "reversed";
  positionMeaning: string;
}

export interface TarotReadingRequest {
  intent: string;
  spread: string;
  domain: string;
  cards: TarotCard[];
}

export interface TarotReadingResponse {
  status: number;
  reading: {
    overall_summary: string;
    cards: Array<{
      position: number;
      cardName: string;
      direction: string;
      positionMeaning: string;
      interpretation: string;
    }>;
    guidance: string;
  };
}

export const interpretTarot = async (
  tarotData: TarotReadingRequest,
  selectedLang: string
): Promise<TarotReadingResponse> => {
  try {
    console.log("🔮 Interpreting tarot reading (via Convex - Secure)");

    const result = await client.action(api.openai.interpretTarot, {
      intent: tarotData.intent,
      spread: tarotData.spread,
      domain: tarotData.domain,
      cards: tarotData.cards,
      selectedLang,
    });

    console.log("Tarot interpretation complete", result);
    return result;
  } catch (error) {
    console.error("Error interpreting tarot:", error);
    throw error;
  }
};

