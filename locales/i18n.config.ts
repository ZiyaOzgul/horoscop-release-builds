import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Import translation files
import en from "../locales/en/translation.json";
import ja from "../locales/jp/translation.json";
import ru from "../locales/ru/translation.json";
import sp from "../locales/sp/translation.json";
import tr from "../locales/tr/translation.json";
const LANGUAGE_STORAGE_KEY = "@app_language";

// Language detector
const languageDetector = {
  type: "languageDetector" as const,
  async: true,
  detect: async (callback: (lang: string) => void) => {
    try {
      // Try to get saved language from AsyncStorage
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);

      if (savedLanguage) {
        callback(savedLanguage);
        return;
      }

      // If no saved language, use device language
      const locales = Localization.getLocales();
      const deviceLanguage = locales[0]?.languageCode || "en"; // Get first locale's language code
      callback(deviceLanguage);
    } catch (error) {
      console.error("Error detecting language:", error);
      callback("en"); // fallback to English
    }
  },
  init: () => {},
  cacheUserLanguage: async (language: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch (error) {
      console.error("Error saving language:", error);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: "v4", // Important for React Native
    resources: {
      en: {
        translation: en,
      },
      sp: {
        translation: sp,
      },
      tr: {
        translation: tr,
      },
      ja: {
        translation: ja,
      },
      ru: {
        translation: ru,
      },
    },
    fallbackLng: "en",
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false, // Important for React Native
    },
  });

export default i18n;
