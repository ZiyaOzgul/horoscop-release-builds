import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL!;
const client = new ConvexHttpClient(convexUrl);

export const getUserHoroscopePeriod = async (
  horoscopeDetails: string,
  selectedLang: string,
  period: "daily" | "weekly" | "monthly",
  isPremium: boolean = false
) => {
  try {
    console.log(`🌐 Fetching ${period} horoscope (via Convex - Secure)`);

    const result = await client.action(api.openai.generateHoroscope, {
      horoscopeDetails,
      selectedLang,
      period,
      isPremium,
    });

    return result;
  } catch (error) {
    console.error(`Error on ${period} horoscope:`, error);
    throw error;
  }
};

// Progressive loading function
export const getUserHoroscopeProgressive = async (
  horoscopeDetails: string,
  selectedLang: string,
  onPeriodComplete?: (
    period: "daily" | "weekly" | "monthly",
    data: any
  ) => void,
  isPremium: boolean = true
) => {
  const result = {
    status: 200,
    horoscope: {
      daily: null as any,
      weekly: null as any,
      monthly: null as any,
    },
  };

  try {
    // Load daily first (most important, ~3-5 seconds)
    const daily = await getUserHoroscopePeriod(
      horoscopeDetails,
      selectedLang,
      "daily",
      isPremium
    );
    result.horoscope.daily = daily.horoscope;
    onPeriodComplete?.("daily", daily.horoscope);

    // Load weekly and monthly in parallel (~3-5 seconds total)
    const [weekly, monthly] = await Promise.all([
      getUserHoroscopePeriod(
        horoscopeDetails,
        selectedLang,
        "weekly",
        isPremium
      ),
      getUserHoroscopePeriod(
        horoscopeDetails,
        selectedLang,
        "monthly",
        isPremium
      ),
    ]);

    result.horoscope.weekly = weekly.horoscope;
    result.horoscope.monthly = monthly.horoscope;

    onPeriodComplete?.("weekly", weekly.horoscope);
    onPeriodComplete?.("monthly", monthly.horoscope);

    return result;
  } catch (error) {
    console.error("Error in progressive horoscope loading:", error);
    throw error;
  }
};

// Keep original function as fallback
export const getUserHoroscope = getUserHoroscopeProgressive;

export const getUserHoroscopePeriodFree = async (
  horoscopeDetails: string,
  selectedLang: string,
  period: "daily" | "weekly" | "monthly"
) => {
  // Just call the main function with isPremium = false
  // The Convex action handles the free tier logic
  return await getUserHoroscopePeriod(
    horoscopeDetails,
    selectedLang,
    period,
    false // isPremium = false for free users
  );
};

// Progressive loading function for non-premium users
export const getUserHoroscopeProgressiveFree = async (
  horoscopeDetails: string,
  selectedLang: string,
  onPeriodComplete?: (period: "daily" | "weekly" | "monthly", data: any) => void
) => {
  // Just call the main function with isPremium = false
  return await getUserHoroscopeProgressive(
    horoscopeDetails,
    selectedLang,
    onPeriodComplete,
    false // isPremium = false
  );
};
