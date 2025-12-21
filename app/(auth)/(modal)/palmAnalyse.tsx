import { analysePalm } from "@/api/palmistry";
import { api } from "@/convex/_generated/api";
import { usePremiumStatus } from "@/hooks/usePremiumCheck";
import { useAppSelector } from "@/redux/hooks";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
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
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";

type AnalysisResult = {
  status: number;
  analysis?: {
    summary: string;
    details: string;
    life_line: string;
    heart_line: string;
    fate_line: string;
    hand_type: string;
    result: string;
  };
  message?: string;
};

const PalmAnalyse: React.FC = () => {
  const router = useRouter();
  const { user } = useUser();
  const { photoUri } = useLocalSearchParams<{ photoUri: string }>();
  const { t, i18n } = useTranslation();
  const selectedLang = i18n.language;
  const { isGold, isPlatinum } = usePremiumStatus();

  // Direct query to Convex as fallback to check subscription status
  const userProfile = useQuery(api.users.getUserWithClerkID, {
    clerkId: user?.id,
  });

  // Check gold/platinum status from both Redux and Convex - no ads for gold or platinum users
  const currentUser = useAppSelector((state) => state.horoscope.userData);
  const userTypeFromRedux = currentUser?.userType;
  const userTypeFromConvex = (userProfile as any)?.userType;
  const isUserGoldOrPlatinum = 
    isGold || 
    isPlatinum || 
    userTypeFromRedux === "gold" || 
    userTypeFromRedux === "platinum" ||
    userTypeFromConvex === "gold" ||
    userTypeFromConvex === "platinum";

  const [isLoading, setIsLoading] = useState(true);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const [showAdWaitingScreen, setShowAdWaitingScreen] = useState(false);
  const [adWatched, setAdWatched] = useState(false);

  const [ad, setAd] = useState<InterstitialAd | null>(null);
  const [loaded, setLoaded] = useState(false);
  const adTimeoutRef = useRef<number | null>(null);
  const [showSkipButton, setShowSkipButton] = useState(false);

  // Initialize ad - skip for premium users
  useEffect(() => {
    // Wait for user data to be available before checking premium status
    if (userProfile === undefined && !currentUser) {
      console.log("⏳ Waiting for user data to load (palm)...");
      return;
    }

    console.log("🔍 Ad check (palm):", {
      isGold,
      isPlatinum,
      isUserGoldOrPlatinum,
      userTypeFromRedux,
      userTypeFromConvex,
      hasUserProfile: userProfile !== undefined,
      hasCurrentUser: !!currentUser,
    });

    // If user is gold or platinum, skip ads entirely
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
    });

    interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      console.log("✅ Ad dismissed/closed");
      setAdWatched(true);
      setShowAdWaitingScreen(false);
      if (adTimeoutRef.current) {
        clearTimeout(adTimeoutRef.current);
      }
    });

    interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
      console.log("❌ Ad error:", error);
      setAdWatched(true);
      setShowAdWaitingScreen(false);
      if (adTimeoutRef.current) {
        clearTimeout(adTimeoutRef.current);
      }
    });

    interstitial.load();
    setAd(interstitial);

    return () => {
      if (adTimeoutRef.current) {
        clearTimeout(adTimeoutRef.current);
      }
      interstitial.removeAllListeners();
    };
  }, [
    isGold,
    isPlatinum,
    isUserGoldOrPlatinum,
    currentUser?.userType,
    (userProfile as any)?.userType,
  ]);

  useEffect(() => {
    if (!photoUri) {
      router.push("/(auth)/(tabs)/palmistry");
    } else {
      analysePalmApi();
    }
  }, [photoUri]);

  const savePalmistry = useMutation(api.palmistries.savePalmistryAnalysis);

  const analysePalmApi = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await analysePalm(photoUri, selectedLang);
      console.log("Analysis result:", result);

      const parsedResult: AnalysisResult =
        typeof result === "string" ? JSON.parse(result) : result;

      setAnalysisResult(parsedResult);

      // Save to database if successful
      if (parsedResult.status === 200 && parsedResult.analysis && user?.id) {
        try {
          await savePalmistry({
            userId: user.id,
            photoUri: photoUri,
            analysis: parsedResult.analysis,
          });
          console.log("✅ Palmistry analysis saved to database");
        } catch (saveError) {
          console.error("Error saving palmistry analysis:", saveError);
          // Don't block the UI if save fails
        }
      }

      // Show ad after successful analysis - skip for premium users
      if (parsedResult.status === 200 && parsedResult.analysis) {
        // If user is gold or platinum, skip the ad waiting screen
        if (isUserGoldOrPlatinum) {
          console.log("✅ Gold/Platinum user - skipping ad waiting screen");
          setAdWatched(true);
          setShowAdWaitingScreen(false);
        } else {
          setShowAdWaitingScreen(true);

          // Set timeout for ad (10 seconds)
          adTimeoutRef.current = setTimeout(() => {
            console.log("⏱️ Ad timeout - skipping ad");
            setAdWatched(true);
            setShowAdWaitingScreen(false);
          }, 10000);

          // Show skip button after 5 seconds
          setTimeout(() => {
            setShowSkipButton(true);
          }, 5000);

          // Try to show ad after a short delay
          setTimeout(() => {
            if (loaded && ad) {
              console.log("Showing interstitial ad");
              ad.show();
            } else {
              console.log("Ad not loaded yet, will show when ready");
            }
          }, 500);
        }
      }
    } catch (err: any) {
      console.error("Analysis error:", err);
      const msg =
        (err && err.message) ||
        t("palmistry.error.defaultMessage") ||
        "Failed to analyze palm. Please try again.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Watch for ad to become loaded and show it if waiting
  useEffect(() => {
    if (loaded && ad && showAdWaitingScreen && !adWatched) {
      console.log("Ad became loaded, showing now");
      setTimeout(() => {
        ad.show();
      }, 300);
    }
  }, [loaded, ad, showAdWaitingScreen, adWatched]);

  const handleRetry = () => {
    setAdWatched(false);
    setShowAdWaitingScreen(false);
    setShowSkipButton(false);
    router.push("/(auth)/(tabs)/palmistry");
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleSkipAd = () => {
    setAdWatched(true);
    setShowAdWaitingScreen(false);
    if (adTimeoutRef.current) {
      clearTimeout(adTimeoutRef.current);
    }
  };

  // animation for stick
  const stickY = useSharedValue(0);

  useEffect(() => {
    const up = -hp(8);
    const down = hp(22);
    const halfDuration = 700;

    stickY.value = withRepeat(
      withSequence(
        withTiming(up, {
          duration: halfDuration,
          easing: Easing.inOut(Easing.cubic),
        }),
        withTiming(down, {
          duration: halfDuration,
          easing: Easing.inOut(Easing.cubic),
        })
      ),
      -1,
      true
    );
  }, [stickY]);

  const stickStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: stickY.value }],
    };
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("palmistry.headerTitle")}</Text>
        </View>

        <View style={styles.imageContainer}>
          <Animated.Image
            source={require("@/assets/images/horoscope/scanStick.png")}
            style={[styles.scanStick, stickStyle]}
            resizeMode="cover"
          />
          <Image
            source={require("@/assets/images/horoscope/handPalmitry.png")}
            style={styles.handPlaceHolderStyle}
            resizeMode="cover"
          />
        </View>

        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#7b25e5" />
          <Text style={styles.loadingText}>
            {t("palmistry.loading.analyzingTitle")}
          </Text>
          <Text style={styles.loadingSubText}>
            {t("palmistry.loading.analyzingSub")}
          </Text>
        </View>
      </View>
    );
  }

  if (
    error ||
    analysisResult?.status === 202 ||
    analysisResult?.status === 500
  ) {
    const errorMessage =
      error || analysisResult?.message || t("palmistry.error.defaultMessage");

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
            source={require("@/assets/images/horoscope/handPalmitry.png")}
            style={styles.handPlaceHolderStyle}
            resizeMode="cover"
          />
        </View>

        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={60} color="#ff6b6b" />
          <Text style={styles.errorTitle}>{t("palmistry.error.title")}</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>
              {t("palmistry.error.retryButton")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (analysisResult?.status === 200 && analysisResult.analysis) {
    const a = analysisResult.analysis;

    // Show waiting screen if ad hasn't been watched yet
    if (showAdWaitingScreen && !adWatched) {
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
              source={require("@/assets/images/horoscope/eye.png")}
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

            {/* Skip button after 5 seconds */}
            {showSkipButton && (
              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkipAd}
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

    // Show results only after ad is watched
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("palmistry.headerTitle")}</Text>
        </View>

        <View style={styles.imageContainer}>
          <Image
            source={require("@/assets/images/horoscope/eye.png")}
            style={styles.handPlaceHolderStyle}
            resizeMode="cover"
          />
        </View>

        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>
            {t("palmistry.result.pageTitle")}
          </Text>

          <LinearGradient
            colors={["#B73AF3", "#6950FB"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.resultCard}
          >
            <View style={styles.resultCardHeader}>
              <Ionicons
                name="document-text-outline"
                size={hp(3)}
                color={"#fff"}
              />
              <Text style={styles.resultCardTitle}>
                {t("palmistry.result.summary")}
              </Text>
            </View>
            <Text style={styles.resultCardText}>{a.summary}</Text>
          </LinearGradient>

          <LinearGradient
            colors={["#B73AF3", "#6950FB"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.resultCard}
          >
            <View style={styles.resultCardHeader}>
              <Ionicons
                name="information-circle-outline"
                size={hp(3)}
                color={"#fff"}
              />
              <Text style={styles.resultCardTitle}>
                {t("palmistry.result.details")}
              </Text>
            </View>
            <Text style={styles.resultCardText}>{a.details}</Text>
          </LinearGradient>

          <LinearGradient
            colors={["#B73AF3", "#6950FB"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.resultCard}
          >
            <View style={styles.resultCardHeader}>
              <Ionicons
                name="checkmark-circle-outline"
                size={hp(3)}
                color={"#fff"}
              />
              <Text style={styles.resultCardTitle}>
                {t("palmistry.result.result")}
              </Text>
            </View>
            <Text style={styles.resultCardText}>{a.result}</Text>
          </LinearGradient>

          <LinearGradient
            colors={["#B73AF3", "#6950FB"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.resultCard}
          >
            <View style={styles.resultCardHeader}>
              <Ionicons name="hand-left-outline" size={hp(3)} color={"#fff"} />
              <Text style={styles.resultCardTitle}>
                {t("palmistry.result.handType")}
              </Text>
            </View>
            <Text style={styles.resultCardText}>{a.hand_type}</Text>
          </LinearGradient>

          <View style={styles.linesContainer}>
            <LinearGradient
              colors={["#B73AF3", "#6950FB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.resultCard}
            >
              <View style={styles.resultCardHeader}>
                <Ionicons name="pulse-outline" size={hp(3)} color={"#fff"} />
                <Text style={styles.resultCardTitle}>
                  {t("palmistry.result.lifeLine")}
                </Text>
              </View>
              <Text style={styles.resultCardText}>{a.life_line}</Text>
            </LinearGradient>

            <LinearGradient
              colors={["#B73AF3", "#6950FB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.resultCard}
            >
              <View style={styles.resultCardHeader}>
                <Ionicons name="heart-outline" size={hp(3)} color={"#fff"} />
                <Text style={styles.resultCardTitle}>
                  {t("palmistry.result.heartLine")}
                </Text>
              </View>
              <Text style={styles.resultCardText}>{a.heart_line}</Text>
            </LinearGradient>

            <LinearGradient
              colors={["#B73AF3", "#6950FB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.resultCard}
            >
              <View style={styles.resultCardHeader}>
                <Ionicons name="star-outline" size={hp(3)} color={"#fff"} />
                <Text style={styles.resultCardTitle}>
                  {t("palmistry.result.fateLine")}
                </Text>
              </View>
              <Text style={styles.resultCardText}>{a.fate_line}</Text>
            </LinearGradient>
          </View>
        </View>

        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="dark-content"
        />
      </ScrollView>
    );
  }

  return null;
};

export default PalmAnalyse;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9ff",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#f8f9ff",
    paddingHorizontal: wp(5),
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
    width: wp(100),
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
  scanStick: {
    width: wp(90),
    height: hp(5),
    position: "absolute",
    top: hp(6),
    alignSelf: "center",
    zIndex: 3,
  },
  loadingContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: wp(10),
  },
  loadingText: {
    fontSize: hp(2.2),
    fontWeight: "600",
    color: "#333",
    marginTop: hp(2),
    textAlign: "center",
  },
  loadingSubText: {
    fontSize: hp(1.8),
    color: "#666",
    marginTop: hp(1),
    textAlign: "center",
    lineHeight: hp(2.5),
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: wp(10),
  },
  errorTitle: {
    fontSize: hp(2.5),
    fontWeight: "600",
    color: "#ff6b6b",
    marginTop: hp(2),
    textAlign: "center",
  },
  errorText: {
    fontSize: hp(1.8),
    color: "#666",
    marginTop: hp(1),
    textAlign: "center",
    lineHeight: hp(2.5),
  },
  retryButton: {
    backgroundColor: "#7b25e5",
    paddingHorizontal: wp(8),
    paddingVertical: hp(1.5),
    borderRadius: 25,
    marginTop: hp(3),
  },
  retryButtonText: {
    color: "white",
    fontSize: hp(1.8),
    fontWeight: "600",
  },
  resultContainer: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(3),
  },
  resultTitle: {
    fontSize: hp(2.8),
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
    marginBottom: hp(3),
  },
  resultCard: {
    borderRadius: 16,
    padding: wp(4),
    marginBottom: hp(2),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    overflow: "hidden",
  },
  resultCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: hp(1.5),
    gap: wp(2),
  },
  resultCardTitle: {
    fontSize: hp(2.3),
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },
  resultCardText: {
    fontSize: hp(1.9),
    fontWeight: "400",
    color: "#fff",
    lineHeight: hp(2.5),
    textAlign: "center",
  },
  linesContainer: {
    marginTop: hp(1),
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
});
