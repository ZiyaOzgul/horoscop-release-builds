import { getLoveMatchDetails } from "@/api/loveMatch";
import Loading from "@/components/Loading";
import { Colors } from "@/constants/Colors";
import { api } from "@/convex/_generated/api";
import { usePlatinumStatus } from "@/hooks/usePremiumCheck";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setLoveMatch } from "@/redux/horoscopeSlicer";
import { useUser } from "@clerk/clerk-expo";
import { Entypo, Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
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

const ResultLoveMatch = () => {
  const router = useRouter();
  const { user } = useUser();
  const zodiacData = useAppSelector(
    (state) => state.horoscope.selectedLoveMatch
  );

  const loveMatchData = useAppSelector(
    (state) => state.horoscope.loveMatchResults
  );
  const [calculating, setCalculating] = useState(false);
  const { isPlatinum, isGold } = usePlatinumStatus();

  // Direct query to Convex as fallback to check subscription status
  const userProfile = useQuery(api.users.getUserWithClerkID, {
    clerkId: user?.id,
  });

  // Check platinum and gold status from both Redux and Convex - no ads for platinum or gold users
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

  // ad section
  const [ad, setAd] = useState<InterstitialAd | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [adWatched, setAdWatched] = useState(false);
  const adTimeoutRef = useRef<number | null>(null);
  const [showSkipButton, setShowSkipButton] = useState(false);

  // PagerView state
  const pagerRef = useRef<PagerView>(null);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    // Wait for user data to be available before checking premium status
    if (userProfile === undefined && !currentUser) {
      console.log("⏳ Waiting for user data to load...");
      return;
    }

    console.log("🔍 Ad check (love match):", {
      isPlatinum,
      isGold,
      isUserPlatinum,
      isUserGold,
      isUserGoldOrPlatinum,
      userTypeFromRedux,
      userTypeFromConvex,
      hasUserProfile: userProfile !== undefined,
      hasCurrentUser: !!currentUser,
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

    // Fallback timeout - if ad doesn't show within 10 seconds, skip it
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

  // Skip button timer
  useEffect(() => {
    const skipTimer = setTimeout(() => {
      setShowSkipButton(true);
    }, 5000);

    return () => clearTimeout(skipTimer);
  }, []);

  const dispatch = useAppDispatch();
  const { t, i18n } = useTranslation();
  const selectedLang = i18n.language;

  const getLoveResult = async (reqData: string) => {
    // Get user's gender from Redux or Convex
    const userGender = currentUser?.gender || (userProfile as any)?.gender;
    // For love match, we use the user's gender for the first person
    // Since we don't have second person's gender info, we only pass the first person's gender
    const result = await getLoveMatchDetails(
      reqData,
      selectedLang,
      userGender, // first person gender (current user)
      undefined // second person gender (not available in current implementation)
    );
    const status = result.status;
    const matchData = result.loveMatch;
    if (status === 200) {
      console.log(matchData);
      setCalculating(false);
      dispatch(setLoveMatch(result));
    }
  };

  useEffect(() => {
    if (zodiacData !== undefined) {
      setCalculating(true);
      const reqData = `${zodiacData[0].zodiacName} ${zodiacData[1].zodiacName}`;
      getLoveResult(reqData);
    }
  }, [zodiacData]);

  const handleGoBack = () => {
    router.back();
  };

  const handleSkipAd = () => {
    setAdWatched(true);
    if (adTimeoutRef.current) {
      clearTimeout(adTimeoutRef.current);
    }
  };

  // Categories data from API response
  const categories = [
    {
      key: "love",
      title: t("resultLoveMatch.love") || "Love",
      percentage: loveMatchData?.loveMatch.categories?.love?.percentage || 0,
      explanation: loveMatchData?.loveMatch.categories?.love?.explanation || "",
      icon: "heart",
    },
    {
      key: "business",
      title: t("resultLoveMatch.business") || "Business",
      percentage:
        loveMatchData?.loveMatch.categories?.business?.percentage || 0,
      explanation:
        loveMatchData?.loveMatch.categories?.business?.explanation || "",
      icon: "briefcase",
    },
    {
      key: "sex",
      title: t("resultLoveMatch.sex") || "Sex",
      percentage: loveMatchData?.loveMatch.categories?.sex?.percentage || 0,
      explanation: loveMatchData?.loveMatch.categories?.sex?.explanation || "",
      icon: "flame",
    },
    {
      key: "friendship",
      title: t("resultLoveMatch.friendship") || "Friendship",
      percentage:
        loveMatchData?.loveMatch.categories?.friendship?.percentage || 0,
      explanation:
        loveMatchData?.loveMatch.categories?.friendship?.explanation || "",
      icon: "people",
    },
  ];

  const overallPercentage = parseInt(
    loveMatchData?.loveMatch.percentage || "75"
  );

  if (zodiacData === undefined || loveMatchData === undefined || calculating) {
    return <Loading />;
  }

  // Show waiting screen while ad hasn't been watched yet
  if (!adWatched) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("palmistry.headerTitle")}</Text>
        </View>

        <View style={styles.imageContainer}>
          <Image
            source={require("@/assets/images/horoscope/heartIco.png")}
            style={styles.handPlaceHolderStyle}
            resizeMode="cover"
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
            <TouchableOpacity style={styles.skipButton} onPress={handleSkipAd}>
              <Text style={styles.skipButtonText}>
                {t("palmistry.ad.skip") || "Skip"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  const renderCategoryPage = (
    category: (typeof categories)[0],
    index: number
  ) => (
    <Animated.View
      key={category.key}
      entering={FadeInUp.delay(index * 100).springify()}
      style={styles.pageContainer}
    >
      <LinearGradient
        colors={["#B73AF3", "#6950FB", "#8e61fe"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        <View style={styles.categoryHeader}>
          <View style={styles.iconContainer}>
            <Ionicons name={category.icon as any} size={hp(4)} color="#fff" />
          </View>
          <Text style={styles.categoryTitle}>{category.title}</Text>
        </View>

        <View style={styles.categoryPercentageContainer}>
          <View style={styles.circularProgress}>
            <Text style={styles.categoryPercentageText}>
              {category.percentage}%
            </Text>
          </View>
        </View>

        <View style={styles.categoryExplanationContainer}>
          <ScrollView
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.explanationScrollContent}
            nestedScrollEnabled={true}
          >
            <Text style={styles.categoryExplanation}>
              {category.explanation}
            </Text>
          </ScrollView>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  // Show main content after ad has been watched
  return (
    <LinearGradient
      colors={["#FDF8FF", "#F5F0FF", "#FDF8FF"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Buttons */}
        <TouchableOpacity
          style={styles.backButtonContainer}
          onPress={() => router.dismiss()}
        >
          <Ionicons
            color={Colors.purpleColorBlack}
            size={hp(3.4)}
            name="chevron-back"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.shareButtonContainer}
          onPress={() => router.dismiss()}
        >
          <Entypo color={Colors.purpleColorBlack} size={hp(3.4)} name="share" />
        </TouchableOpacity>

        {/* Main Title */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={styles.mainTitleContainer}
        >
          <Text style={styles.mainTitle}>
            {t("resultLoveMatch.mainTitle") || "Aşk Uyumunuz"}
          </Text>
          <View style={styles.mainTitleUnderline} />
        </Animated.View>

        {/* Zodiac Images Section */}
        <View style={styles.zodiacContainer}>
          <View style={styles.zodiacImageContainer}>
            <Image
              style={styles.zodiacImage}
              resizeMode="cover"
              source={zodiacData[0].photoData}
            />
            <Text style={styles.zodiacName}>{zodiacData[0].zodiacName}</Text>
          </View>
          <View style={styles.imageBox}>
            <Image
              source={require("@/assets/images/horoscope/heartIco.png")}
              style={styles.heart}
              resizeMode="cover"
            />
            <Text style={styles.heartPercentage}>
              {loveMatchData.loveMatch.percentage}
            </Text>
          </View>
          <View style={styles.zodiacImageContainer}>
            <Image
              style={styles.zodiacImage}
              resizeMode="cover"
              source={zodiacData[1].photoData}
            />
            <Text style={styles.zodiacName}>{zodiacData[1].zodiacName}</Text>
          </View>
        </View>

        {/* Overall Score Card with Blur Effect */}
        <View style={styles.percentageContainer}>
          {!adWatched && (
            <BlurView intensity={90} style={styles.blurOverlay}>
              <Ionicons name="lock-closed" size={hp(4)} color="#7b25e5" />
              <Text style={styles.blurText}>
                {t("resultLoveMatch.watchAdToUnlock") || "Watch ad to unlock"}
              </Text>
            </BlurView>
          )}

          <Text style={styles.percentageText}>
            {t("resultLoveMatch.potentialToCharm")}
          </Text>

          {/* Overall Score Bar */}
          <View style={styles.overallScoreContainer}>
            <View style={styles.barWrapper}>
              <View style={styles.barBackground}>
                <View
                  style={[styles.barFill, { width: `${overallPercentage}%` }]}
                />
              </View>
              <Text style={styles.overallPercentageText}>
                {overallPercentage}%
              </Text>
            </View>
          </View>

          {/* Quick Scores Grid */}
          <View style={styles.scoresSection}>
            <Text style={styles.scoresSectionTitle}>
              {t("resultLoveMatch.scores") || "Quick Overview"}
            </Text>
            <View style={styles.scoresGrid}>
              {categories.map((cat) => (
                <View key={cat.key} style={styles.scoreItem}>
                  <View style={styles.scoreItemLeft}>
                    <Ionicons
                      name={cat.icon as any}
                      size={hp(2)}
                      color={Colors.borderColor}
                    />
                    <Text style={styles.scoreItemLabel}>{cat.title}</Text>
                  </View>
                  <Text style={styles.scoreItemValue}>{cat.percentage}%</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Category Details with PagerView */}
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsTitle}>
            {t("resultLoveMatch.details") || "Detailed Analysis"}
          </Text>
          <Text style={styles.detailsSubtitle}>
            {t("resultLoveMatch.swipeToExplore") ||
              "Swipe to explore each category"}
          </Text>

          {/* Page Indicators */}
          <View style={styles.pageIndicators}>
            {categories.map((category, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => pagerRef.current?.setPage(index)}
                style={[
                  styles.pageIndicator,
                  currentPage === index && styles.pageIndicatorActive,
                ]}
              >
                <Text
                  style={[
                    styles.pageIndicatorText,
                    currentPage === index && styles.pageIndicatorTextActive,
                  ]}
                >
                  {category.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* PagerView */}
          <View style={styles.pagerWrapper}>
            <PagerView
              ref={pagerRef}
              style={styles.pagerView}
              initialPage={0}
              onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
            >
              {categories.map((category, index) =>
                renderCategoryPage(category, index)
              )}
            </PagerView>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

export default ResultLoveMatch;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    paddingVertical: hp(3.8),
    paddingHorizontal: wp(5),
    paddingBottom: hp(5),
  },
  backButtonContainer: {
    position: "absolute",
    top: hp(3.8),
    left: wp(4),
    zIndex: 10,
  },
  shareButtonContainer: {
    position: "absolute",
    top: hp(3.8),
    right: wp(4),
    zIndex: 10,
  },
  zodiacContainer: {
    marginTop: hp(6),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: hp(1),
  },
  zodiacImageContainer: {
    width: hp(14),
    height: hp(18),
    alignItems: "center",
    justifyContent: "flex-end",
  },
  zodiacImage: {
    width: hp(14),
    height: hp(14),
  },
  zodiacName: {
    fontFamily: "Rubik_400Regular",
    fontSize: hp(2.1),
    color: Colors.purpleColorBlack,
    textAlign: "center",
    marginTop: hp(0.5),
  },
  heart: {
    width: hp(10),
    height: hp(10),
    overflow: "visible",
  },
  imageBox: {
    width: hp(10),
    height: hp(10),
    zIndex: 11,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "visible",
  },
  heartPercentage: {
    fontSize: hp(2.6),
    fontWeight: "600",
    fontFamily: "Rubik_600SemiBold",
    color: "#fff",
    position: "absolute",
    bottom: hp(3.4),
  },
  percentageContainer: {
    width: "100%",
    borderRadius: 15,
    borderColor: Colors.borderColor,
    borderWidth: 2,
    marginTop: hp(4),
    padding: wp(5),
    position: "relative",
    overflow: "hidden",
  },
  blurOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: hp(1),
  },
  blurText: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: hp(2),
    color: "#7b25e5",
  },
  percentageText: {
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
    fontSize: hp(2.6),
    textAlign: "center",
    color: Colors.borderColor,
    marginBottom: hp(2),
  },
  overallScoreContainer: {
    width: "100%",
    marginBottom: hp(3),
  },
  barWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(3),
  },
  barBackground: {
    flex: 1,
    height: hp(2),
    backgroundColor: "#E8E8E8",
    borderRadius: 10,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: Colors.borderColor,
    borderRadius: 10,
  },
  overallPercentageText: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: hp(2.2),
    color: Colors.borderColor,
    minWidth: wp(15),
    textAlign: "right",
  },
  scoresSection: {
    width: "100%",
  },
  scoresSectionTitle: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: hp(2),
    color: Colors.borderColor,
    marginBottom: hp(1.5),
  },
  scoresGrid: {
    width: "100%",
    gap: hp(1.2),
  },
  scoreItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: wp(2),
  },
  scoreItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(2),
  },
  scoreItemLabel: {
    fontFamily: "Rubik_400Regular",
    fontSize: hp(1.9),
    color: Colors.borderColor,
  },
  scoreItemValue: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: hp(1.9),
    color: Colors.borderColor,
  },
  detailsContainer: {
    marginTop: hp(4),
  },
  detailsTitle: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: hp(2.8),
    color: Colors.purpleColorBlack,
    textAlign: "center",
  },
  detailsSubtitle: {
    fontFamily: "Rubik_400Regular",
    fontSize: hp(1.8),
    color: "#666",
    textAlign: "center",
    marginTop: hp(0.5),
    marginBottom: hp(2),
  },
  pageIndicators: {
    borderRadius: 25,
    borderWidth: 2,
    borderColor: Colors.borderColor,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: wp(2),
    marginBottom: hp(2),
    flexWrap: "wrap",
    paddingVertical: hp(1),
    paddingHorizontal: wp(1),
  },
  pageIndicator: { paddingHorizontal: wp(4), paddingVertical: hp(0.5) },
  pageIndicatorActive: {
    backgroundColor: Colors.borderColor,
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.5),
    borderRadius: 15,
    borderWidth: 2,
    borderColor: Colors.borderColor,
  },
  pageIndicatorText: {
    fontFamily: "Rubik_500Medium",
    fontSize: hp(1.6),
    color: Colors.borderColor,
  },
  pageIndicatorTextActive: {
    color: "#fff",
  },

  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: wp(2),
    marginBottom: hp(3),
  },
  categoryTitle: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: hp(3),
    color: "#fff",
  },
  categoryPercentageContainer: {
    alignItems: "center",
    marginBottom: hp(3),
  },
  circularProgress: {
    width: hp(15),
    height: hp(15),
    borderRadius: hp(7.5),
    borderWidth: 8,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  categoryPercentageText: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: hp(4),
    color: "#fff",
  },

  categoryExplanation: {
    fontFamily: "Rubik_400Regular",
    fontSize: hp(2.1),
    color: "#fff",
    textAlign: "center",
    lineHeight: hp(3.2),
  },
  mainTitleContainer: {
    alignItems: "center",
    marginTop: hp(1),
  },
  mainTitle: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: hp(3.2),
    fontWeight: "700",
    color: Colors.purpleColorBlack,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  mainTitleUnderline: {
    width: wp(25),
    height: hp(0.3),
    backgroundColor: Colors.purpleColorBlack,
    borderRadius: 2,
    marginTop: hp(0.5),
    opacity: 0.6,
  },
  pagerWrapper: {
    backgroundColor: "transparent",
  },
  cardGradient: {
    flex: 1,
    borderRadius: 24,
    paddingVertical: wp(6),
    paddingHorizontal: wp(6),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    justifyContent: "space-between",
  },
  iconContainer: {
    width: hp(6),
    height: hp(6),
    borderRadius: hp(3),
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  explanationScrollContent: {
    paddingBottom: hp(2),
    paddingHorizontal: wp(1),
  },
  adWaitingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: wp(10),
  },
  adWaitingTitle: {
    fontSize: hp(2.5),
    fontWeight: "600",
    color: "#333",
    marginTop: hp(2),
    textAlign: "center",
  },
  adWaitingText: {
    fontSize: hp(1.8),
    color: "#666",
    marginTop: hp(1),
    textAlign: "center",
    lineHeight: hp(2.5),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: hp(6),
    paddingBottom: hp(2),
    position: "relative",
  },
  backButton: {
    padding: 10,
  },
  headerTitle: {
    fontSize: hp(2.5),
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    flex: 1,
    marginRight: 44,
  },
  imageContainer: {
    width: wp(85),
    height: hp(50),
    borderRadius: 15,
    overflow: "hidden",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  handPlaceHolderStyle: {
    width: "90%",
    height: "90%",
    alignSelf: "center",
  },
  skipButton: {
    marginTop: hp(3),
    paddingHorizontal: wp(8),
    paddingVertical: hp(1.5),
    backgroundColor: "#7b25e5",
    borderRadius: 25,
  },
  skipButtonText: {
    color: "#fff",
    fontSize: hp(2),
    fontWeight: "600",
  },

  pagerView: {
    height: hp(75),
  },
  pageContainer: {
    height: "100%",
    padding: wp(2),
    borderRadius: 24,
    marginHorizontal: wp(2),
    overflow: "hidden",
  },
  categoryExplanationContainer: {
    flex: 1,
    minHeight: hp(20),
    maxHeight: hp(35),
    justifyContent: "flex-start",
    paddingTop: hp(1),
  },
});
