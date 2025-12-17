// utils/translationHelpers.ts
import { useTranslation } from "react-i18next";

export const useUserDataTranslation = () => {
  const { t } = useTranslation();

  const translateZodiacSign = (sign: string | undefined): string => {
    if (!sign) return "";

    const signMap: { [key: string]: string } = {
      Aries: t("userHoroscope.aries"),
      Taurus: t("userHoroscope.taurus"),
      Gemini: t("userHoroscope.gemini"),
      Cancer: t("userHoroscope.cancer"),
      Leo: t("userHoroscope.leo"),
      Virgo: t("userHoroscope.virgo"),
      Libra: t("userHoroscope.libra"),
      Scorpio: t("userHoroscope.scorpio"),
      Sagittarius: t("userHoroscope.sagittarius"),
      Capricorn: t("userHoroscope.capricorn"),
      Aquarius: t("userHoroscope.aquarius"),
      Pisces: t("userHoroscope.pisces"),
    };

    return signMap[sign] || sign;
  };

  // Translate elements
  const translateElement = (element: string | undefined): string => {
    if (!element) return "";

    const elementMap: { [key: string]: string } = {
      Fire: t("elements.fire"),
      Earth: t("elements.earth"),
      Air: t("elements.air"),
      Water: t("elements.water"),
    };

    return elementMap[element] || element;
  };

  // Translate polarity
  const translatePolarity = (polarity: string | undefined): string => {
    if (!polarity) return "";

    const polarityMap: { [key: string]: string } = {
      Positive: t("polarity.positive"),
      Negative: t("polarity.negative"),
      Yang: t("polarity.yang"),
      Yin: t("polarity.yin"),
    };

    return polarityMap[polarity] || polarity;
  };

  // Translate modality
  const translateModality = (modality: string | undefined): string => {
    if (!modality) return "";

    const modalityMap: { [key: string]: string } = {
      Cardinal: t("modality.cardinal"),
      Fixed: t("modality.fixed"),
      Mutable: t("modality.mutable"),
    };

    return modalityMap[modality] || modality;
  };

  // Translate gender
  const translateGender = (gender: string | undefined): string => {
    if (!gender) return "";

    const genderMap: { [key: string]: string } = {
      Male: t("registerDetailsG.labels.male"),
      Female: t("registerDetailsG.labels.female"),
    };

    return genderMap[gender] || gender;
  };

  return {
    translateZodiacSign,
    translateElement,
    translatePolarity,
    translateModality,
    translateGender,
  };
};

/**
 * Normalize zodiac sign input to standard English key
 * Use this when saving user data to ensure consistency
 */
export const normalizeZodiacSign = (sign: string): string => {
  const normalizedMap: { [key: string]: string } = {
    // English
    aries: "Aries",
    taurus: "Taurus",
    gemini: "Gemini",
    cancer: "Cancer",
    leo: "Leo",
    virgo: "Virgo",
    libra: "Libra",
    scorpio: "Scorpio",
    sagittarius: "Sagittarius",
    capricorn: "Capricorn",
    aquarius: "Aquarius",
    pisces: "Pisces",

    // Turkish
    koç: "Aries",
    boğa: "Taurus",
    ikizler: "Gemini",
    yengeç: "Cancer",
    aslan: "Leo",
    başak: "Virgo",
    terazi: "Libra",
    akrep: "Scorpio",
    yay: "Sagittarius",
    oğlak: "Capricorn",
    kova: "Aquarius",
    balık: "Pisces",

    // Japanese
    牡羊座: "Aries",
    牡牛座: "Taurus",
    双子座: "Gemini",
    蟹座: "Cancer",
    獅子座: "Leo",
    乙女座: "Virgo",
    天秤座: "Libra",
    蠍座: "Scorpio",
    射手座: "Sagittarius",
    山羊座: "Capricorn",
    水瓶座: "Aquarius",
    魚座: "Pisces",

    // Russian
    овен: "Aries",
    телец: "Taurus",
    близнецы: "Gemini",
    рак: "Cancer",
    лев: "Leo",
    дева: "Virgo",
    весы: "Libra",
    скорпион: "Scorpio",
    стрелец: "Sagittarius",
    козерог: "Capricorn",
    водолей: "Aquarius",
    рыбы: "Pisces",
  };

  return normalizedMap[sign.toLowerCase()] || sign;
};
