import { interpretTarot } from "@/api/tarot";
import { Colors } from "@/constants/Colors";
import { api } from "@/convex/_generated/api";
import { usePlatinumStatus } from "@/hooks/usePremiumCheck";
import { useAppSelector } from "@/redux/hooks";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AdEventType, InterstitialAd } from "react-native-google-mobile-ads";
import LinearGradient from "react-native-linear-gradient";
import PagerView from "react-native-pager-view";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";

interface TarotReadingResponse {
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

const TarotResult = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useUser();
  const { t, i18n } = useTranslation();
  const selectedLang = i18n.language;

  // Get card image function - uses original card names from tarotData
  const getCardImage = (cardName: string, position?: number) => {
    // Try to get original English card name from tarotData
    let englishCardName = cardName;

    if (tarotData && tarotData.cards && position) {
      // Find the original card name from tarotData by position
      const originalCard = tarotData.cards.find(
        (c: any) => c.position === position
      );
      if (originalCard && originalCard.cardName) {
        englishCardName = originalCard.cardName;
      }
    }

    // Convert to image filename format
    let imageName = englishCardName
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

    // Map card names to image filenames
    const cardImageMap: { [key: string]: any } = {
      // Major Arcana
      the_fool: require("@/assets/images/horoscope/tarotDeck/the_fool.png"),
      the_magician: require("@/assets/images/horoscope/tarotDeck/the_magician.png"),
      the_high_priestess: require("@/assets/images/horoscope/tarotDeck/the_high_priestess.png"),
      the_empress: require("@/assets/images/horoscope/tarotDeck/the_empress.png"),
      the_emperor: require("@/assets/images/horoscope/tarotDeck/the_emperor.png"),
      the_hierophant: require("@/assets/images/horoscope/tarotDeck/the_hierophant.png"),
      the_lovers: require("@/assets/images/horoscope/tarotDeck/the_lovers.png"),
      the_chariot: require("@/assets/images/horoscope/tarotDeck/the_chariot.png"),
      strength: require("@/assets/images/horoscope/tarotDeck/strength.png"),
      the_hermit: require("@/assets/images/horoscope/tarotDeck/the_hermit.png"),
      wheel_of_fortune: require("@/assets/images/horoscope/tarotDeck/wheel_of_fortune.png"),
      justice: require("@/assets/images/horoscope/tarotDeck/justice.png"),
      the_hanged_man: require("@/assets/images/horoscope/tarotDeck/the_hanged_man.png"),
      death: require("@/assets/images/horoscope/tarotDeck/death.png"),
      temperance: require("@/assets/images/horoscope/tarotDeck/temperance.png"),
      the_devil: require("@/assets/images/horoscope/tarotDeck/the_devil.png"),
      the_tower: require("@/assets/images/horoscope/tarotDeck/the_tower.png"),
      the_star: require("@/assets/images/horoscope/tarotDeck/the_star.png"),
      the_moon: require("@/assets/images/horoscope/tarotDeck/the_moon.png"),
      the_sun: require("@/assets/images/horoscope/tarotDeck/the_sun.png"),
      judgement: require("@/assets/images/horoscope/tarotDeck/judgement.png"),
      the_world: require("@/assets/images/horoscope/tarotDeck/the_world.png"),
      // Minor Arcana - Wands
      ace_of_wands: require("@/assets/images/horoscope/tarotDeck/ace_of_wands.png"),
      two_of_wands: require("@/assets/images/horoscope/tarotDeck/two_of_wands.png"),
      three_of_wands: require("@/assets/images/horoscope/tarotDeck/three_of_wands.png"),
      four_of_wands: require("@/assets/images/horoscope/tarotDeck/four_of_wands.png"),
      five_of_wands: require("@/assets/images/horoscope/tarotDeck/five_of_wands.png"),
      six_of_wands: require("@/assets/images/horoscope/tarotDeck/six_of_wands.png"),
      seven_of_wands: require("@/assets/images/horoscope/tarotDeck/seven_of_wands.png"),
      eight_of_wands: require("@/assets/images/horoscope/tarotDeck/eight_of_wands.png"),
      nine_of_wands: require("@/assets/images/horoscope/tarotDeck/nine_of_wands.png"),
      ten_of_wands: require("@/assets/images/horoscope/tarotDeck/ten_of_wands.png"),
      page_of_wands: require("@/assets/images/horoscope/tarotDeck/page_of_wands.png"),
      knight_of_wands: require("@/assets/images/horoscope/tarotDeck/knight_of_wands.png"),
      queen_of_wands: require("@/assets/images/horoscope/tarotDeck/queen_of_wands.png"),
      king_of_wands: require("@/assets/images/horoscope/tarotDeck/king_of_wands.png"),
      // Minor Arcana - Cups
      ace_of_cups: require("@/assets/images/horoscope/tarotDeck/ace_of_cups.png"),
      two_of_cups: require("@/assets/images/horoscope/tarotDeck/two_of_cups.png"),
      three_of_cups: require("@/assets/images/horoscope/tarotDeck/three_of_cups.png"),
      four_of_cups: require("@/assets/images/horoscope/tarotDeck/four_of_cups.png"),
      five_of_cups: require("@/assets/images/horoscope/tarotDeck/five_of_cups.png"),
      six_of_cups: require("@/assets/images/horoscope/tarotDeck/six_of_cups.png"),
      seven_of_cups: require("@/assets/images/horoscope/tarotDeck/seven_of_cups.png"),
      eight_of_cups: require("@/assets/images/horoscope/tarotDeck/eight_of_cups.png"),
      nine_of_cups: require("@/assets/images/horoscope/tarotDeck/nine_of_cups.png"),
      ten_of_cups: require("@/assets/images/horoscope/tarotDeck/ten_of_cups.png"),
      page_of_cups: require("@/assets/images/horoscope/tarotDeck/page_of_cups.png"),
      knight_of_cups: require("@/assets/images/horoscope/tarotDeck/knight_of_cups.png"),
      queen_of_cups: require("@/assets/images/horoscope/tarotDeck/queen_of_cups.png"),
      king_of_cups: require("@/assets/images/horoscope/tarotDeck/king_of_cups.png"),
      // Minor Arcana - Swords
      ace_of_swords: require("@/assets/images/horoscope/tarotDeck/ace_of_swords.png"),
      two_of_swords: require("@/assets/images/horoscope/tarotDeck/two_of_swords.png"),
      three_of_swords: require("@/assets/images/horoscope/tarotDeck/three_of_swords.png"),
      four_of_swords: require("@/assets/images/horoscope/tarotDeck/four_of_swords.png"),
      five_of_swords: require("@/assets/images/horoscope/tarotDeck/five_of_swords.png"),
      six_of_swords: require("@/assets/images/horoscope/tarotDeck/six_of_swords.png"),
      seven_of_swords: require("@/assets/images/horoscope/tarotDeck/seven_of_swords.png"),
      eight_of_swords: require("@/assets/images/horoscope/tarotDeck/eight_of_swords.png"),
      nine_of_swords: require("@/assets/images/horoscope/tarotDeck/nine_of_swords.png"),
      ten_of_swords: require("@/assets/images/horoscope/tarotDeck/ten_of_swords.png"),
      page_of_swords: require("@/assets/images/horoscope/tarotDeck/page_of_swords.png"),
      knight_of_swords: require("@/assets/images/horoscope/tarotDeck/knight_of_swords.png"),
      queen_of_swords: require("@/assets/images/horoscope/tarotDeck/queen_of_swords.png"),
      king_of_swords: require("@/assets/images/horoscope/tarotDeck/king_of_swords.png"),
      // Minor Arcana - Pentacles
      ace_of_pentacles: require("@/assets/images/horoscope/tarotDeck/ace_of_pentacles.png"),
      two_of_pentacles: require("@/assets/images/horoscope/tarotDeck/two_of_pentacles.png"),
      three_of_pentacles: require("@/assets/images/horoscope/tarotDeck/three_of_pentacles.png"),
      four_of_pentacles: require("@/assets/images/horoscope/tarotDeck/four_of_pentacles.png"),
      five_of_pentacles: require("@/assets/images/horoscope/tarotDeck/five_of_pentacles.png"),
      six_of_pentacles: require("@/assets/images/horoscope/tarotDeck/six_of_pentacles.png"),
      seven_of_pentacles: require("@/assets/images/horoscope/tarotDeck/seven_of_pentacles.png"),
      eight_of_pentacles: require("@/assets/images/horoscope/tarotDeck/eight_of_pentacles.png"),
      nine_of_pentacles: require("@/assets/images/horoscope/tarotDeck/nine_of_pentacles.png"),
      ten_of_pentacles: require("@/assets/images/horoscope/tarotDeck/ten_of_pentacles.png"),
      page_of_pentacles: require("@/assets/images/horoscope/tarotDeck/page_of_pentacles.png"),
      knight_of_pentacles: require("@/assets/images/horoscope/tarotDeck/knight_of_pentacles.png"),
      queen_of_pentacles: require("@/assets/images/horoscope/tarotDeck/queen_of_pentacles.png"),
      king_of_pentacles: require("@/assets/images/horoscope/tarotDeck/king_of_pentacles.png"),
    };

    // Return the mapped image or fallback
    return (
      cardImageMap[imageName] ||
      require("@/assets/images/horoscope/tarotCard.png")
    );
  };

  // Translate tarot card name - uses original card name from tarotData
  const translateTarotCard = (cardName: string, position?: number): string => {
    // Try to get original English card name from tarotData
    let englishCardName = cardName;

    if (tarotData && tarotData.cards && position) {
      // Find the original card name from tarotData by position
      const originalCard = tarotData.cards.find(
        (c: any) => c.position === position
      );
      if (originalCard && originalCard.cardName) {
        englishCardName = originalCard.cardName;
      }
    }

    // Translate the English card name
    const translationKey = `tarot.cards.translations.${englishCardName}`;
    const translated = t(translationKey);
    // If translation exists and is different from key, return it
    if (translated && translated !== translationKey) {
      return translated;
    }
    // Otherwise return the card name as is (might already be translated)
    return cardName;
  };
  const { isPlatinum, isGold } = usePlatinumStatus();

  // Parse tarot data from params
  const [tarotData, setTarotData] = useState<any>(null);
  const [tarotResults, setTarotResults] = useState<TarotReadingResponse | null>(
    null
  );
  const [calculating, setCalculating] = useState(false);

  // Direct query to Convex as fallback to check subscription status
  const userProfile = useQuery(api.users.getUserWithClerkID, {
    clerkId: user?.id,
  });

  // Check platinum and gold status from both Redux and Convex
  const currentUser = useAppSelector((state) => state.horoscope.userData);
  const userTypeFromRedux = currentUser?.userType;
  const userTypeFromConvex = (userProfile as any)?.userType;
  const isUserPlatinum =
    isPlatinum ||
    userTypeFromRedux === "platinum" ||
    userTypeFromConvex === "platinum";
  const isUserGold =
    isGold || userTypeFromRedux === "gold" || userTypeFromConvex === "gold";

  // Gold and Platinum users skip ads
  const isUserGoldOrPlatinum = isUserPlatinum || isUserGold;

  // Ad section
  const [ad, setAd] = useState<InterstitialAd | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [adWatched, setAdWatched] = useState(false);
  const adTimeoutRef = useRef<number | null>(null);
  const [showSkipButton, setShowSkipButton] = useState(false);

  // PagerView state
  const pagerRef = useRef<PagerView>(null);
  const [currentPage, setCurrentPage] = useState(0);

  // Parse tarot data from params
  useEffect(() => {
    if (params.tarotData) {
      try {
        const parsed = JSON.parse(params.tarotData as string);
        setTarotData(parsed);
      } catch (error) {
        console.error("Error parsing tarot data:", error);
        router.back();
      }
    }
  }, [params.tarotData]);

  // Initialize ad - skip for premium users
  useEffect(() => {
    if (userProfile === undefined && !currentUser) {
      console.log("⏳ Waiting for user data to load (tarot)...");
      return;
    }

    console.log("🔍 Ad check (tarot):", {
      isPlatinum,
      isGold,
      isUserPlatinum,
      isUserGold,
      isUserGoldOrPlatinum,
    });

    if (isUserGoldOrPlatinum) {
      console.log("✅ Gold/Platinum user - skipping ads");
      setAdWatched(true);
      return;
    }

    const interstitial = InterstitialAd.createForAdRequest(
      "ca-app-pub-4099680443697121/8512554374"
    );

    let adShown = false;

    interstitial.addAdEventListener(AdEventType.LOADED, () => {
      console.log("✅ Ad loaded");
      setLoaded(true);

      if (!adShown) {
        adShown = true;
        setTimeout(() => {
          interstitial.show();
        }, 500);
      }
    });

    interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      console.log("✅ Ad dismissed/closed");
      setAdWatched(true);
      if (adTimeoutRef.current) {
        clearTimeout(adTimeoutRef.current);
      }
    });

    interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
      console.log("❌ Ad error:", error);
      setAdWatched(true);
      if (adTimeoutRef.current) {
        clearTimeout(adTimeoutRef.current);
      }
    });

    adTimeoutRef.current = setTimeout(() => {
      console.log("⏱️ Ad timeout - skipping ad");
      setAdWatched(true);
    }, 10000);

    interstitial.load();
    setAd(interstitial);

    return () => {
      if (adTimeoutRef.current) {
        clearTimeout(adTimeoutRef.current);
      }
      interstitial.removeAllListeners();
    };
  }, [
    isPlatinum,
    isGold,
    isUserPlatinum,
    isUserGold,
    isUserGoldOrPlatinum,
    currentUser?.userType,
    (userProfile as any)?.userType,
  ]);

  // Get tarot reading
  const getTarotReading = async () => {
    if (!tarotData) return;

    setCalculating(true);
    try {
      const result = await interpretTarot(tarotData, selectedLang);
      if (result.status === 200) {
        setTarotResults(result);
      }
    } catch (error) {
      console.error("Error interpreting tarot:", error);
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    if (tarotData && adWatched) {
      getTarotReading();
    }
  }, [tarotData, adWatched]);

  const handleGoBack = () => {
    router.back();
  };

  // Skip ad button after 5 seconds
  useEffect(() => {
    const skipTimer = setTimeout(() => {
      setShowSkipButton(true);
    }, 5000);

    return () => clearTimeout(skipTimer);
  }, []);

  // Loading state
  if (!tarotData || calculating || !tarotResults) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("tarot.result.title")}</Text>
        </View>

        <View style={styles.loadingContainer}>
          <Image
            source={require("@/assets/images/horoscope/tarotCard.png")}
            style={styles.loadingImage}
            resizeMode="contain"
          />
          <Text style={styles.loadingTitle}>
            {t("tarot.result.loading.title")}
          </Text>
          <Text style={styles.loadingSubtitle}>
            {t("tarot.result.loading.subtitle")}
          </Text>
          <ActivityIndicator size="large" color={Colors.purpleColorBlack} />
        </View>
      </View>
    );
  }

  // Show waiting screen while ad hasn't been watched yet
  if (!adWatched) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("tarot.result.title")}</Text>
        </View>

        <View style={styles.imageContainer}>
          <Image
            source={require("@/assets/images/horoscope/facedMoon.png")}
            style={styles.handPlaceHolderStyle}
            resizeMode="contain"
          />
        </View>

        <View style={styles.adWaitingContainer}>
          <Ionicons name="gift-outline" size={80} color="#7b25e5" />
          <Text style={styles.adWaitingTitle}>
            {t("palmistry.ad.waitingTitle")}
          </Text>
          <Text style={styles.adWaitingText}>
            {t("palmistry.ad.waitingMessage")}
          </Text>
          <ActivityIndicator
            size="large"
            color="#7b25e5"
            style={{ marginTop: hp(2) }}
          />

          {showSkipButton && (
            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => setAdWatched(true)}
            >
              <Text style={styles.skipButtonText}>
                {t("palmistry.ad.skip") || "Skip"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // Show main content after ad has been watched
  const totalPages = tarotResults.reading.cards.length + 2; // +2 for summary and guidance pages

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("tarot.result.title")}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* PagerView for cards */}
      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={0}
        onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
      >
        {/* Individual Card Pages */}
        {tarotResults.reading.cards.map((card, index) => (
          <ScrollView
            key={`card-${card.position}`}
            style={styles.pageContainer}
            contentContainerStyle={styles.pageContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Card Image - Large and Prominent at Top */}
            <Animated.View
              entering={FadeInDown.delay(100 * (index + 1))}
              style={styles.cardImageSection}
            >
              <View style={styles.cardImageWrapper}>
                <Image
                  source={getCardImage(card.cardName, card.position)}
                  style={[
                    styles.cardImageLarge,
                    (card.direction?.toLowerCase() === "reversed" ||
                      card.direction?.toLowerCase() === "ters") &&
                      styles.cardImageReversed,
                  ]}
                  resizeMode="contain"
                />
                {/* Direction Badge on Card */}
                <View
                  style={[
                    styles.directionBadgeOnCard,
                    (card.direction?.toLowerCase() === "reversed" ||
                      card.direction?.toLowerCase() === "ters") &&
                      styles.directionBadgeReversedOnCard,
                  ]}
                >
                  <Text
                    style={[
                      styles.directionTextOnCard,
                      (card.direction?.toLowerCase() === "reversed" ||
                        card.direction?.toLowerCase() === "ters") &&
                        styles.directionTextOnCardReversed,
                    ]}
                  >
                    {card.direction?.toLowerCase() === "upright" ||
                    card.direction?.toLowerCase() === "düz"
                      ? t("tarot.cards.upright")
                      : t("tarot.cards.reversed")}
                  </Text>
                </View>
              </View>

              {/* Card Name - Below Image */}
              <Text style={styles.cardTitleLarge}>
                {translateTarotCard(card.cardName, card.position)}
              </Text>

              {/* Position Info */}
              <View style={styles.positionContainerTop}>
                <Text style={styles.positionLabel}>
                  {t("tarot.cards.position")} {card.position}
                </Text>
                <Text style={styles.positionMeaning}>
                  {card.positionMeaning}
                </Text>
              </View>
            </Animated.View>

            {/* Interpretation - Below Card in Gradient */}
            <Animated.View
              entering={FadeInUp.delay(200 * (index + 1))}
              style={styles.interpretationWrapper}
            >
              <LinearGradient
                colors={["#B73AF3", "#6950FB", "#8e61fe"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.interpretationContainer}
              >
                <Text style={styles.interpretationTitle}>
                  {t("tarot.result.interpretation.title") || "Yorum"}
                </Text>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.interpretationScrollContent}
                  nestedScrollEnabled={true}
                >
                  <Text style={styles.cardInterpretation}>
                    {card.interpretation}
                  </Text>
                </ScrollView>
              </LinearGradient>
            </Animated.View>
          </ScrollView>
        ))}

        {/* Overall Summary Page */}
        <ScrollView
          key="summary"
          style={styles.pageContainer}
          contentContainerStyle={styles.pageContent}
        >
          <Animated.View
            entering={FadeInUp.delay(200)}
            style={styles.summaryWrapper}
          >
            <LinearGradient
              colors={["#B73AF3", "#6950FB", "#8e61fe"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.summaryContainer}
            >
              <Text style={styles.pageTitle}>
                {t("tarot.result.summary.title")}
              </Text>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.summaryScrollContent}
                nestedScrollEnabled={true}
              >
                <Text style={styles.summaryText}>
                  {tarotResults.reading.overall_summary}
                </Text>
              </ScrollView>
            </LinearGradient>
          </Animated.View>
        </ScrollView>
        {/* Guidance Page */}
        <ScrollView
          key="guidance"
          style={styles.pageContainer}
          contentContainerStyle={styles.pageContent}
        >
          <Animated.View
            entering={FadeInUp.delay(200)}
            style={styles.guidanceWrapper}
          >
            <LinearGradient
              colors={["#B73AF3", "#6950FB", "#8e61fe"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.guidanceContainer}
            >
              <Text style={styles.pageTitle}>
                {t("tarot.result.guidance.title")}
              </Text>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.guidanceScrollContent}
                nestedScrollEnabled={true}
              >
                <Text style={styles.guidanceText}>
                  {tarotResults.reading.guidance}
                </Text>
              </ScrollView>
            </LinearGradient>
          </Animated.View>
        </ScrollView>
      </PagerView>

      {/* Page Indicators */}
      <View style={styles.indicatorContainer}>
        {Array.from({ length: totalPages }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              currentPage === index && styles.activeIndicator,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

export default TarotResult;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: hp(6),
    paddingHorizontal: wp(5),
    paddingBottom: hp(2),
    backgroundColor: "#fff",
  },
  backButton: {
    padding: wp(2),
  },
  headerTitle: {
    fontSize: hp(2.5),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
    color: Colors.purpleColorBlack,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: wp(5),
  },
  loadingImage: {
    width: wp(40),
    height: hp(20),
    marginBottom: hp(3),
  },
  loadingTitle: {
    fontSize: hp(2.5),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
    color: Colors.purpleColorBlack,
    marginBottom: hp(1),
    textAlign: "center",
  },
  loadingSubtitle: {
    fontSize: hp(1.8),
    fontFamily: "Rubik_400Regular",
    color: Colors.grayColor,
    textAlign: "center",
    marginBottom: hp(3),
  },
  imageContainer: {
    alignItems: "center",
    paddingVertical: hp(5),
  },
  handPlaceHolderStyle: {
    width: wp(50),
    height: hp(25),
  },
  adWaitingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: wp(5),
  },
  adWaitingTitle: {
    fontSize: hp(2.5),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
    color: Colors.purpleColorBlack,
    marginTop: hp(3),
    marginBottom: hp(1),
    textAlign: "center",
  },
  adWaitingText: {
    fontSize: hp(1.8),
    fontFamily: "Rubik_400Regular",
    color: Colors.grayColor,
    textAlign: "center",
    marginBottom: hp(2),
  },
  skipButton: {
    marginTop: hp(3),
    paddingVertical: hp(1),
    paddingHorizontal: wp(6),
    borderRadius: 20,
    backgroundColor: Colors.purpleColorBlack,
  },
  skipButtonText: {
    color: "#fff",
    fontSize: hp(1.8),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
  },
  pagerView: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  pageContent: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    paddingBottom: hp(4),
  },
  cardImageSection: {
    width: "100%",
    alignItems: "center",
    marginBottom: hp(3),
  },
  interpretationWrapper: {
    width: "100%",
    marginBottom: hp(2),
  },
  interpretationContainer: {
    borderRadius: 16,
    padding: wp(5),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    overflow: "hidden",
    minHeight: hp(30),
    maxHeight: hp(50),
  },
  interpretationTitle: {
    fontSize: hp(2.5),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
    color: "#fff",
    marginBottom: hp(2),
  },
  interpretationScrollContent: {
    paddingBottom: hp(1),
    flexGrow: 1,
  },
  positionContainerTop: {
    marginTop: hp(2),
    marginBottom: hp(1),
    alignItems: "center",
  },
  summaryWrapper: {
    marginBottom: hp(2),
  },
  summaryContainer: {
    borderRadius: 16,
    padding: wp(5),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    overflow: "hidden",
    minHeight: hp(40),
    maxHeight: hp(65),
  },
  pageTitle: {
    fontSize: hp(2.8),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
    color: "#fff",
    marginBottom: hp(2),
  },
  summaryText: {
    fontSize: hp(2),
    fontFamily: "Rubik_400Regular",
    color: "#fff",
    lineHeight: hp(3),
  },
  summaryScrollContent: {
    paddingBottom: hp(1),
    flexGrow: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp(2),
  },
  cardTitle: {
    fontSize: hp(2.5),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
    color: "#fff",
    flex: 1,
  },
  cardImageWrapper: {
    width: wp(70),
    alignItems: "center",
    marginBottom: hp(2),
    position: "relative",
    paddingTop: hp(1),
  },
  cardImageLarge: {
    width: wp(70),
    height: wp(70) * 1.5, // 2:3 ratio (width * 1.5 = height)
    borderRadius: 16,
    backgroundColor: Colors.background,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
    maxWidth: wp(70),
    maxHeight: wp(70) * 1.5,
  },
  cardImageReversed: {
    transform: [{ rotate: "180deg" }],
  },
  directionBadgeOnCard: {
    position: "absolute",
    top: hp(1),
    right: wp(2),
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingVertical: hp(0.5),
    paddingHorizontal: wp(3),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(114, 76, 253, 0.5)",
  },
  directionBadgeReversedOnCard: {
    backgroundColor: "rgba(211, 47, 47, 0.95)",
    borderColor: "rgba(211, 47, 47, 0.5)",
  },
  directionTextOnCard: {
    color: Colors.purpleColorBlack,
    fontSize: hp(1.3),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
  },
  directionTextOnCardReversed: {
    color: "#fff",
  },
  cardTitleLarge: {
    fontSize: hp(2.8),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
    color: Colors.purpleColorBlack,
    textAlign: "center",
    marginBottom: hp(1.5),
  },
  directionBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    paddingVertical: hp(0.5),
    paddingHorizontal: wp(3),
    borderRadius: 12,
  },
  directionBadgeReversed: {
    backgroundColor: "rgba(211, 47, 47, 0.8)",
  },
  directionText: {
    color: "#fff",
    fontSize: hp(1.5),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
  },
  positionLabel: {
    fontSize: hp(1.8),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
    color: Colors.purpleColorBlack,
    marginBottom: hp(0.5),
  },
  positionMeaning: {
    fontSize: hp(2),
    fontFamily: "Rubik_400Regular",
    color: Colors.grayColor,
    fontStyle: "italic",
  },
  cardInterpretation: {
    fontSize: hp(2),
    fontFamily: "Rubik_400Regular",
    color: "#fff",
    lineHeight: hp(3),
  },
  guidanceWrapper: {
    marginBottom: hp(2),
  },
  guidanceContainer: {
    borderRadius: 16,
    padding: wp(5),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    overflow: "hidden",
    minHeight: hp(40),
    maxHeight: hp(65),
  },
  guidanceText: {
    fontSize: hp(2),
    fontFamily: "Rubik_400Regular",
    color: "#fff",
    lineHeight: hp(3),
  },
  guidanceScrollContent: {
    paddingBottom: hp(1),
    flexGrow: 1,
  },
  indicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: hp(2),
    gap: wp(2),
  },
  indicator: {
    width: wp(2),
    height: wp(2),
    borderRadius: wp(1),
    backgroundColor: Colors.border,
  },
  activeIndicator: {
    width: wp(6),
    backgroundColor: Colors.purpleColorBlack,
  },
});
