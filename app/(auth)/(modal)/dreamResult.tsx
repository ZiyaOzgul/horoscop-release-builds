import { dreamInterpretation } from "@/api/dream";
import Ladingdream from "@/components/Ladingdream";
import { Colors } from "@/constants/Colors";
import { api } from "@/convex/_generated/api";
import { usePlatinumStatus } from "@/hooks/usePremiumCheck";
import { useAppSelector } from "@/redux/hooks";
import { useUser } from "@clerk/clerk-expo";
import { Entypo, Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Animated,
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
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";

const ResultDream = () => {
  interface DreamInterpretationResponse {
    status: number;
    interpretation: Interpretation;
  }

  interface Interpretation {
    symbols: SymbolInterpretation[];
    overall_message: string;
  }

  interface SymbolInterpretation {
    symbol: string;
    meanings: string[];
  }

  const [dreamResults, setDreamResults] =
    useState<DreamInterpretationResponse | null>(null);

  // Ad section
  const [ad, setAd] = useState<InterstitialAd | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [adWatched, setAdWatched] = useState(false);
  const adTimeoutRef = useRef<number | null>(null);

  const scrollX = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const { user } = useUser();
  const dreamReq = useAppSelector((state) => state.horoscope.dreamReqData);
  const [currentPage, setCurrentPage] = useState(0);
  const { t, i18n } = useTranslation();
  const selectedLang = i18n.language;
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

  // Initialize ad - skip for premium users
  useEffect(() => {
    // Wait for user data to be available before checking premium status
    if (userProfile === undefined && !currentUser) {
      console.log("⏳ Waiting for user data to load (dream)...");
      return;
    }

    console.log("🔍 Ad check (dream):", {
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

      // Show ad after a small delay to ensure component is ready
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
      // Cleanup
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

  const saveDream = useMutation(api.dreams.saveDreamAnalysis);

  const getDreamData = async () => {
    console.log("get dream data");
    const dreamRes = await dreamInterpretation(dreamReq, selectedLang);
    if (dreamRes.status == 200) {
      setDreamResults(dreamRes);

      // Save to database if successful
      if (dreamRes.interpretation && user?.id) {
        try {
          await saveDream({
            userId: user.id,
            dreamDescription: dreamReq || "",
            symbols: dreamRes.interpretation.symbols || [],
            overallMessage: dreamRes.interpretation.overall_message || "",
          });
          console.log("✅ Dream analysis saved to database");
        } catch (saveError) {
          console.error("Error saving dream analysis:", saveError);
          // Don't block the UI if save fails
        }
      }
    }
  };

  useEffect(() => {
    getDreamData();
  }, [dreamReq]);

  const handleGoBack = () => {
    router.back();
  };

  // Skip ad button after 5 seconds
  const [showSkipButton, setShowSkipButton] = useState(false);
  useEffect(() => {
    const skipTimer = setTimeout(() => {
      setShowSkipButton(true);
    }, 5000);

    return () => clearTimeout(skipTimer);
  }, []);

  if (dreamReq == "" || dreamResults == null || dreamResults == undefined) {
    return <Ladingdream />;
  }

  // Show waiting screen while ad hasn't been watched yet
  if (!adWatched) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("dreamResult.text")}</Text>
        </View>

        <View style={styles.imageContainer}>
          <Image
            source={require("@/assets/images/horoscope/dreamPageIco.png")}
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

          {/* Skip button after 5 seconds */}
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
  const { symbols, overall_message } = dreamResults.interpretation;
  return (
    <View style={styles.container}>
      <View
        style={{
          justifyContent: "space-between",
          width: wp(90),
          alignItems: "center",
          flexDirection: "row",
        }}
      >
        <TouchableOpacity onPress={() => router.dismiss()}>
          <Ionicons
            color={Colors.purpleColorBlack}
            size={hp(3.4)}
            name="chevron-back"
          />
        </TouchableOpacity>
        <TouchableOpacity>
          <Entypo color={Colors.purpleColorBlack} size={hp(3.4)} name="share" />
        </TouchableOpacity>
      </View>
      <View style={styles.titleContainer}>
        <Text style={styles.mainTitle}>{t("dreamResult.text")}</Text>
        <View style={styles.titleUnderline} />
      </View>
      <View style={styles.imageWrapper}>
        <Image
          source={require("@/assets/images/horoscope/dreamPageIco.png")}
          style={styles.image}
          resizeMode="contain"
        />
      </View>
      <PagerView
        initialPage={0}
        onPageScroll={(e) => {
          const { position, offset } = e.nativeEvent;
          scrollX.setValue(position + offset);
        }}
        onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
        style={{ height: hp(58), paddingHorizontal: wp(2) }}
      >
        {symbols.map((item, index) => (
          <View key={index} style={styles.pageContainer}>
            <LinearGradient
              colors={["#B73AF3", "#6950FB", "#8e61fe"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.symbolContainer}
            >
              <View style={styles.symbolHeader}>
                <View style={styles.iconContainer}>
                  <Ionicons name="sparkles" size={hp(3.5)} color="#fff" />
                </View>
                <Text style={styles.symbolTitle}>{item.symbol}</Text>
              </View>
              <ScrollView
                style={styles.symbolContent}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.symbolContentContainer}
              >
                {Array.isArray(item.meanings) ? (
                  item.meanings.map((meaning: string, meaningIndex: number) => (
                    <View key={meaningIndex} style={styles.meaningItem}>
                      <View style={styles.bulletPoint} />
                      <Text style={styles.symbolText}>{meaning}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.symbolText}>{item.meanings}</Text>
                )}
              </ScrollView>
            </LinearGradient>
          </View>
        ))}
        <View style={styles.pageContainer}>
          <LinearGradient
            colors={["#B73AF3", "#6950FB", "#8e61fe"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.symbolContainer}
          >
            <View style={styles.symbolHeader}>
              <View style={styles.iconContainer}>
                <Ionicons name="star" size={hp(3.5)} color="#fff" />
              </View>
              <Text style={styles.symbolTitle}>{t("dreamResult.overall")}</Text>
            </View>
            <ScrollView
              style={styles.symbolContent}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.symbolContentContainer}
            >
              <Text style={styles.symbolText}>{overall_message}</Text>
            </ScrollView>
          </LinearGradient>
        </View>
      </PagerView>
      <View style={styles.sliderBox}>
        {Array.from({ length: symbols.length + 1 }).map((_, index) => {
          const dotWidth = scrollX.interpolate({
            inputRange: [index - 1, index, index + 1],
            outputRange: [wp(2), wp(8), wp(2)],
            extrapolate: "clamp",
          });
          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                { width: dotWidth },
                currentPage === index ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          );
        })}
      </View>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
    </View>
  );
};

export default ResultDream;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: hp(3.8),
    paddingBottom: hp(2.5),
    paddingHorizontal: wp(4),
    position: "relative",
    overflow: "visible",
  },
  loadingText: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: hp(4),
    fontWeight: "600",
    color: Colors.purpleColorBlack,
    textAlign: "center",
  },
  titleContainer: {
    alignItems: "center",
    marginTop: hp(2),
    marginBottom: hp(1),
  },
  mainTitle: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: hp(3.5),
    fontWeight: "700",
    color: Colors.purpleColorBlack,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  titleUnderline: {
    width: wp(20),
    height: hp(0.3),
    backgroundColor: Colors.purpleColorBlack,
    borderRadius: 2,
    marginTop: hp(0.5),
    opacity: 0.6,
  },
  imageWrapper: {
    alignItems: "center",
    marginVertical: hp(1),
    shadowColor: Colors.purpleColorBlack,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  image: {
    width: wp(60),
    height: hp(15),
  },
  pageContainer: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    justifyContent: "center",
    alignItems: "center",
  },
  symbolContainer: {
    width: "100%",
    height: hp(53),
    borderRadius: 24,
    paddingVertical: hp(2.5),
    paddingHorizontal: wp(5),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    overflow: "hidden",
  },
  symbolHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: hp(2),
    gap: wp(3),
  },
  iconContainer: {
    width: hp(5),
    height: hp(5),
    borderRadius: hp(2.5),
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  symbolTitle: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: hp(3.2),
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    textTransform: "capitalize",
    letterSpacing: 0.5,
    flex: 1,
  },
  symbolContent: {
    flex: 1,
  },
  symbolContentContainer: {
    paddingBottom: hp(2),
  },
  meaningItem: {
    flexDirection: "row",
    marginBottom: hp(1.5),
    alignItems: "flex-start",
  },
  bulletPoint: {
    width: hp(0.8),
    height: hp(0.8),
    borderRadius: hp(0.4),
    backgroundColor: "#fff",
    marginTop: hp(1),
    marginRight: wp(3),
    flexShrink: 0,
  },
  symbolText: {
    fontFamily: "Rubik_400Regular",
    fontSize: hp(2.1),
    fontWeight: "400",
    color: "#fff",
    textAlign: "left",
    lineHeight: hp(3),
    letterSpacing: 0.3,
    flex: 1,
  },
  sliderBox: {
    flexDirection: "row",
    alignSelf: "center",
    marginBottom: hp(4),
  },
  dot: {
    height: hp(0.4),
    borderRadius: 5,
    marginHorizontal: 5,
    backgroundColor: "#ccc",
  },
  activeDot: {
    backgroundColor: Colors.purpleColorBlack,
  },
  inactiveDot: {
    backgroundColor: "#ccc",
  },
  // Ad waiting screen styles
  header: {
    flexDirection: "row",
    alignItems: "center",
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
    alignSelf: "center",
  },
  handPlaceHolderStyle: {
    width: "90%",
    height: "90%",
    alignSelf: "center",
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
