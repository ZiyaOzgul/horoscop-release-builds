import {
  getUserHoroscopeProgressive,
  getUserHoroscopeProgressiveFree,
} from "@/api/horoscope";
import { Colors } from "@/constants/Colors";
import { api } from "@/convex/_generated/api";
import { usePlatinumStatus } from "@/hooks/usePremiumCheck";
import { useUserDataTranslation } from "@/locales/translationHelper";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setHoroscopeData, setUserData } from "@/redux/horoscopeSlicer";
import { useUser } from "@clerk/clerk-expo";
import { FontAwesome, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery } from "convex/react";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
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
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";

const oldZodiacImages: { [key: string]: any } = {
  Aries: require("@/assets/images/horoscope/oldSigns/aries.png"),
  Taurus: require("@/assets/images/horoscope/oldSigns/taurus.png"),
  Gemini: require("@/assets/images/horoscope/oldSigns/gemini.png"),
  Cancer: require("@/assets/images/horoscope/oldSigns/cancer.png"),
  Leo: require("@/assets/images/horoscope/oldSigns/leo.png"),
  Virgo: require("@/assets/images/horoscope/oldSigns/virgo.png"),
  Libra: require("@/assets/images/horoscope/oldSigns/libra.png"),
  Scorpio: require("@/assets/images/horoscope/oldSigns/scorpio.png"),
  Sagittarius: require("@/assets/images/horoscope/oldSigns/sagittarius.png"),
  Capricorn: require("@/assets/images/horoscope/oldSigns/capricorn.png"),
  Aquarius: require("@/assets/images/horoscope/oldSigns/aquarius.png"),
  Pisces: require("@/assets/images/horoscope/oldSigns/pisces.png"),
};

const getOldZodiacImages = (signName: string) => {
  return oldZodiacImages[signName] || null;
};

const HOROSCOPE_CACHE_KEY = "@horoscope_cache";
const HOROSCOPE_CACHE_DATE_KEY = "@horoscope_cache_date";
const HOROSCOPE_CACHE_PREMIUM_KEY = "@horoscope_cache_premium";

const getCachedHoroscope = async (date: string, isPremium: boolean) => {
  try {
    const cachedDate = await AsyncStorage.getItem(HOROSCOPE_CACHE_DATE_KEY);
    const cachedPremium = await AsyncStorage.getItem(
      HOROSCOPE_CACHE_PREMIUM_KEY
    );

    // Check if we have cached data for this date
    if (cachedDate === date) {
      // If date matches, check if premium status also matches
      if (cachedPremium === String(isPremium)) {
        // Both date and premium status match - use cache
        const cachedData = await AsyncStorage.getItem(HOROSCOPE_CACHE_KEY);
        if (cachedData) {
          console.log(`📦 Using cached horoscope data (platinum: ${isPremium})`);
          return JSON.parse(cachedData);
        }
      }
      // Date matches but premium status doesn't - cache is invalid for current status
      // Don't clear cache here, let the separate useEffect handle cache clearing
      // when premium status actually changes
    }
    // Date doesn't match or no cache - return null
    return null;
  } catch (error) {
    console.error("Error reading cached horoscope:", error);
    return null;
  }
};

const setCachedHoroscope = async (
  date: string,
  data: any,
  isPremium: boolean
) => {
  try {
    await AsyncStorage.setItem(HOROSCOPE_CACHE_DATE_KEY, date);
    await AsyncStorage.setItem(HOROSCOPE_CACHE_PREMIUM_KEY, String(isPremium));
    await AsyncStorage.setItem(HOROSCOPE_CACHE_KEY, JSON.stringify(data));
    // Note: isPremium parameter now represents platinum status
    console.log(`💾 Cached horoscope data (platinum: ${isPremium})`);
  } catch (error) {
    console.error("Error saving cached horoscope:", error);
  }
};

const clearCachedHoroscope = async () => {
  try {
    await AsyncStorage.removeItem(HOROSCOPE_CACHE_DATE_KEY);
    await AsyncStorage.removeItem(HOROSCOPE_CACHE_PREMIUM_KEY);
    await AsyncStorage.removeItem(HOROSCOPE_CACHE_KEY);
    console.log("🗑️ Cleared horoscope cache");
  } catch (error) {
    console.error("Error clearing cached horoscope:", error);
  }
};

// Percentage Bar Component
const PercentageBar: React.FC<{
  title: string;
  percentage: number;
  icon?: any;
  barColor: string;
}> = ({ title, percentage, icon, barColor }) => {
  return (
    <View style={styles.percentageBarContainer}>
      <View style={styles.percentageBarHeader}>
        {icon && icon}
        <Text style={styles.percentageBarTitle}>{title}</Text>
      </View>
      <View style={styles.percentageBarRow}>
        <View style={styles.percentageBarBackground}>
          <View
            style={[
              {
                height: "100%",
                backgroundColor: barColor,
                borderRadius: hp(0.6),
              },
              { width: `${percentage}%` },
            ]}
          />
        </View>
        <Text style={[styles.percentageBarText, { color: barColor }]}>
          {percentage}%
        </Text>
      </View>
    </View>
  );
};

const Horoscope: React.FC = () => {
  const { t } = useTranslation();
  const [selected, setSelected] = React.useState<"today" | "week" | "month">(
    "today"
  );
  const date = new Date();
  const todayString = date.toISOString().split("T")[0];
  const { user } = useUser();
  const dispatch = useAppDispatch();
  const userDataHoroscope = useAppSelector((s) => s.horoscope.userData);
  const aiResultHoroscope = useAppSelector(
    (s) => s.horoscope.horoscopeResultData
  );
  const [loading, setLoading] = React.useState(false);

  const getUserDataFromConvex = useQuery(api.users.getUserWithClerkID, {
    clerkId: user?.id,
  });

  const todaysHoroscope = useQuery(
    api.users.getTodaysHoroscope,
    user?.id
      ? {
          userId: user.id,
          date: todayString,
        }
      : "skip"
  );

  // Check platinum status - only platinum users get full access
  const { isPlatinum, userType } = usePlatinumStatus();
  const userTypeFromRedux = useAppSelector(
    (state) => state.horoscope.userData?.userType
  );
  const userTypeFromConvex = (getUserDataFromConvex as any)?.userType;
  const isUserPlatinum =
    isPlatinum ||
    userTypeFromRedux === "platinum" ||
    userTypeFromConvex === "platinum" ||
    userType === "platinum";
  
  // Debug logging for platinum status
  React.useEffect(() => {
    console.log("🔍 Horoscope Platinum Status Check:", {
      isPlatinum,
      userTypeFromRedux,
      userTypeFromConvex,
      userType,
      isUserPlatinum,
      shouldBlurCards: !isUserPlatinum
    });
  }, [isPlatinum, userTypeFromRedux, userTypeFromConvex, userType, isUserPlatinum]);

  const { translateZodiacSign, translateElement, translatePolarity } =
    useUserDataTranslation();

  const saveHoroscope = useMutation(api.users.saveHoroscope);

  // Animation for scroll indicator
  const scrollIndicatorY = useSharedValue(0);

  useEffect(() => {
    scrollIndicatorY.value = withRepeat(
      withTiming(8, {
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, [scrollIndicatorY]);

  const scrollIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: scrollIndicatorY.value }],
      opacity: 0.7,
    };
  });
  const [loadingPeriods, setLoadingPeriods] = React.useState({
    daily: false,
    weekly: false,
    monthly: false,
  });
  useEffect(() => {
    if (getUserDataFromConvex && userDataHoroscope === undefined) {
      dispatch(setUserData(getUserDataFromConvex));
    }
  }, [getUserDataFromConvex, userDataHoroscope, dispatch]);

  useEffect(() => {
    if (todaysHoroscope && aiResultHoroscope === undefined) {
      dispatch(
        setHoroscopeData({
          daily: todaysHoroscope.daily,
          weekly: todaysHoroscope.weekly,
          monthly: todaysHoroscope.monthly,
        })
      );
    }
  }, [todaysHoroscope, aiResultHoroscope, dispatch]);

  // Clear cache and re-fetch when platinum status changes
  const prevPlatinumStatusRef = React.useRef<boolean | undefined>(undefined);
  const isInitialMountRef = React.useRef(true);

  useEffect(() => {
    // Skip on initial mount - don't clear cache just because isUserPlatinum is being determined
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      prevPlatinumStatusRef.current = isUserPlatinum;
      return;
    }

    // Only clear cache if platinum status actually changed (after initial mount)
    if (
      prevPlatinumStatusRef.current !== undefined &&
      prevPlatinumStatusRef.current !== isUserPlatinum
    ) {
      console.log(
        `🔄 Platinum status changed from ${prevPlatinumStatusRef.current} to ${isUserPlatinum} - clearing cache and re-fetching`
      );
      clearCachedHoroscope();

      // Clear Redux state to force re-fetch - set to undefined to trigger useEffect
      dispatch(setHoroscopeData(undefined as any));
    }
    prevPlatinumStatusRef.current = isUserPlatinum;
  }, [isUserPlatinum, dispatch]);

  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.8);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.2, {
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );

    glowOpacity.value = withRepeat(
      withTiming(1, {
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, [scale, glowOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: glowOpacity.value,
  }));

  const { i18n } = useTranslation();
  const selectedLang = i18n.language;

  const handleButtonPress = (value: "today" | "week" | "month") => {
    setSelected(value);
  };

  const getHoroscopeDataWithLoadingStates = async (aiReq: string) => {
    setLoading(true);
    setLoadingPeriods({ daily: true, weekly: true, monthly: true });

    try {
      const cachedData = await getCachedHoroscope(todayString, isUserPlatinum);
      if (cachedData) {
        dispatch(setHoroscopeData(cachedData));
        setLoading(false);
        setLoadingPeriods({ daily: false, weekly: false, monthly: false });
        return;
      }

      console.log("🌐 Fetching horoscope progressively");
      console.log(`👤 User platinum status: ${isUserPlatinum}`);

      const loadedPeriods: any = {};

      // Use premium API only for platinum users, free API for everyone else
      const horoscopeAPI = isUserPlatinum
        ? getUserHoroscopeProgressive
        : getUserHoroscopeProgressiveFree;

      await horoscopeAPI(aiReq, selectedLang, (period, data) => {
        console.log(`✅ ${period} horoscope loaded`);

        loadedPeriods[period] = data;

        dispatch(
          setHoroscopeData({
            daily: loadedPeriods.daily || null,
            weekly: loadedPeriods.weekly || null,
            monthly: loadedPeriods.monthly || null,
          })
        );

        // Update loading state for this period
        setLoadingPeriods((prev) => ({ ...prev, [period]: false }));

        if (period === "daily") {
          setLoading(false);
        }

        if (period === "monthly") {
          const fullData = {
            daily: loadedPeriods.daily,
            weekly: loadedPeriods.weekly,
            monthly: loadedPeriods.monthly,
          };
          setCachedHoroscope(todayString, fullData, isUserPlatinum);

          saveHoroscope({
            userId: user!.id,
            date: todayString,
            daily: fullData.daily,
            weekly: fullData.weekly,
            monthly: fullData.monthly,
          }).catch((error) => {
            console.error("Background save failed:", error);
          });
        }
      });
    } catch (error) {
      console.error("Error fetching horoscope:", error);
      setLoading(false);
      setLoadingPeriods({ daily: false, weekly: false, monthly: false });
    }
  };

  useEffect(() => {
    const checkAndFetchHoroscope = async () => {
      if (
        userDataHoroscope !== undefined &&
        aiResultHoroscope === undefined &&
        !todaysHoroscope &&
        !loading
      ) {
        const cachedData = await getCachedHoroscope(todayString, isUserPlatinum);
        if (cachedData) {
          dispatch(setHoroscopeData(cachedData));
          return;
        }
        const aiRequestData = `Moon Sign: ${userDataHoroscope.moonSign}, sun sign ${userDataHoroscope.sunSign}, ascendant: ${userDataHoroscope.ascendant}`;
        getHoroscopeDataWithLoadingStates(aiRequestData);
      }
    };

    checkAndFetchHoroscope();
  }, [
    userDataHoroscope,
    aiResultHoroscope,
    todaysHoroscope,
    loading,
    todayString,
    dispatch,
    isUserPlatinum, // Add isUserPlatinum to dependencies to re-fetch when platinum status changes
  ]);

  const formattedDate = t("horoscope.dateFormat", {
    day: date.getDate().toString().padStart(2, "0"),
    month: (date.getMonth() + 1).toString().padStart(2, "0"),
    year: date.getFullYear(),
  });

  if (
    userDataHoroscope === undefined ||
    (aiResultHoroscope === undefined && !todaysHoroscope) ||
    loading
  ) {
    const loadingText = todaysHoroscope
      ? t("horoscope.loading.loading")
      : t("horoscope.loading.generating");

    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <Text style={styles.loadingDateTitle}>{formattedDate}</Text>

          <View style={styles.loadingImageWrapper}>
            <Animated.View style={[styles.loadingGlowOuter, animatedStyle]} />
            <Animated.View style={[styles.loadingGlowMiddle, animatedStyle]} />
            <Animated.View style={[styles.loadingGlowInner, animatedStyle]} />
            <Animated.Image
              source={require("@/assets/images/horoscope/starH.png")}
              style={[styles.loadingImage, animatedStyle]}
              resizeMode="cover"
            />
          </View>

          <Text style={styles.loadingText}>{loadingText}</Text>
        </View>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="dark-content"
        />
      </View>
    );
  }

  const currentHoroscopeData = aiResultHoroscope || {
    daily: todaysHoroscope?.daily,
    weekly: todaysHoroscope?.weekly,
    monthly: todaysHoroscope?.monthly,
  };

  const renderHoroscopeContent = (data: any) => {
    if (!data) return null;

    // For non-platinum users, blur love/career/luck/health cards on all periods
    // Only platinum users get full access to detailed horoscope
    const shouldBlurCards = !isUserPlatinum;

    return (
      <>
        {/* General Horoscope Card */}
        <LinearGradient
          colors={["#B73AF3", "#6950FB"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.resultCard}
        >
          <View style={styles.resultCardHeader}>
            <MaterialCommunityIcons
              name={`zodiac-${userDataHoroscope.sunSign.toLowerCase()}` as any}
              size={hp(3)}
              color={"#fff"}
              style={styles.zodiacIcon}
            />
            <Text style={styles.resultCardTitle}>
              {t("horoscope.barTitles.general")}
            </Text>
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            contentContainerStyle={styles.resultCardScrollContent}
          >
            <Text style={styles.resultCardText}>{data.sunSign}</Text>
          </ScrollView>
          {/* Scroll indicator */}
          <View style={styles.scrollIndicatorContainer}>
            <Animated.View
              style={[styles.scrollIndicator, scrollIndicatorStyle]}
            >
              <Ionicons
                name="chevron-down"
                size={hp(2.5)}
                color="rgba(255, 255, 255, 0.8)"
              />
            </Animated.View>
          </View>
        </LinearGradient>

        {/* Love Card */}
        {data.love && (
          <View style={styles.cardWrapper}>
            <LinearGradient
              colors={["#B73AF3", "#6950FB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.resultCard}
            >
              <View style={styles.resultCardHeader}>
                <Image
                  source={require("@/assets/images/horoscope/loveIconHoroscope.png")}
                  style={styles.resultCardIcon}
                  resizeMode="contain"
                />
                <Text style={styles.resultCardTitle}>
                  {t("horoscope.barTitles.love")}
                </Text>
              </View>
              <View style={styles.resultCardTextContainer}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                  contentContainerStyle={styles.resultCardScrollContent}
                >
                  <Text style={styles.resultCardText}>
                    {data.love.explanation || ""}
                  </Text>
                </ScrollView>
                {shouldBlurCards && (
                  <>
                    <BlurView
                      intensity={100}
                      style={styles.blurTextOverlay}
                      tint="dark"
                    />
                    <LinearGradient
                      colors={["#B73AF3", "#6950FB"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.blurGradientOverlay}
                    />
                    <View style={styles.premiumPromptContainer}>
                      <MaterialCommunityIcons
                        name="lock"
                        size={hp(4)}
                        color="#fff"
                        style={styles.lockIcon}
                      />
                      <Text style={styles.premiumPromptText}>
                        {t("horoscope.premium.buyPremiumForAccess") ||
                          "Buy Platinum for Access"}
                      </Text>
                    </View>
                  </>
                )}
                {/* Scroll indicator */}
                <View style={styles.scrollIndicatorContainer}>
                  <Animated.View
                    style={[styles.scrollIndicator, scrollIndicatorStyle]}
                  >
                    <Ionicons
                      name="chevron-down"
                      size={hp(2.5)}
                      color="rgba(255, 255, 255, 0.8)"
                    />
                  </Animated.View>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Career Card */}
        {data.career && (
          <View style={styles.cardWrapper}>
            <LinearGradient
              colors={["#B73AF3", "#6950FB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.resultCard}
            >
              <View style={styles.resultCardHeader}>
                <Image
                  source={require("@/assets/images/horoscope/moneyIconHoroscope.png")}
                  style={styles.resultCardIcon}
                  resizeMode="contain"
                />
                <Text style={styles.resultCardTitle}>
                  {t("horoscope.barTitles.career")}
                </Text>
              </View>
              <View style={styles.resultCardTextContainer}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                  contentContainerStyle={styles.resultCardScrollContent}
                >
                  <Text style={styles.resultCardText}>
                    {data.career.explanation || ""}
                  </Text>
                </ScrollView>
                {shouldBlurCards && (
                  <>
                    <BlurView
                      intensity={100}
                      style={styles.blurTextOverlay}
                      tint="dark"
                    />
                    <LinearGradient
                      colors={["#B73AF3", "#6950FB"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.blurGradientOverlay}
                    />
                    <View style={styles.premiumPromptContainer}>
                      <MaterialCommunityIcons
                        name="lock"
                        size={hp(4)}
                        color="#fff"
                        style={styles.lockIcon}
                      />
                      <Text style={styles.premiumPromptText}>
                        {t("horoscope.premium.buyPremiumForAccess") ||
                          "Buy Platinum for Access"}
                      </Text>
                    </View>
                  </>
                )}
                {/* Scroll indicator */}
                <View style={styles.scrollIndicatorContainer}>
                  <Animated.View
                    style={[styles.scrollIndicator, scrollIndicatorStyle]}
                  >
                    <Ionicons
                      name="chevron-down"
                      size={hp(2.5)}
                      color="rgba(255, 255, 255, 0.8)"
                    />
                  </Animated.View>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Luck Card */}
        {data.luck && (
          <View style={styles.cardWrapper}>
            <LinearGradient
              colors={["#B73AF3", "#6950FB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.resultCard}
            >
              <View style={styles.resultCardHeader}>
                <Image
                  source={require("@/assets/images/horoscope/luckIconHoroscope.png")}
                  style={styles.resultCardIcon}
                  resizeMode="contain"
                />
                <Text style={styles.resultCardTitle}>
                  {t("horoscope.barTitles.lucks")}
                </Text>
              </View>
              <View style={styles.resultCardTextContainer}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                  contentContainerStyle={styles.resultCardScrollContent}
                >
                  <Text style={styles.resultCardText}>
                    {data.luck.explanation || ""}
                  </Text>
                </ScrollView>
                {shouldBlurCards && (
                  <>
                    <BlurView
                      intensity={100}
                      style={styles.blurTextOverlay}
                      tint="dark"
                    />
                    <LinearGradient
                      colors={["#B73AF3", "#6950FB"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.blurGradientOverlay}
                    />
                    <View style={styles.premiumPromptContainer}>
                      <MaterialCommunityIcons
                        name="lock"
                        size={hp(4)}
                        color="#fff"
                        style={styles.lockIcon}
                      />
                      <Text style={styles.premiumPromptText}>
                        {t("horoscope.premium.buyPremiumForAccess") ||
                          "Buy Platinum for Access"}
                      </Text>
                    </View>
                  </>
                )}
                {/* Scroll indicator */}
                <View style={styles.scrollIndicatorContainer}>
                  <Animated.View
                    style={[styles.scrollIndicator, scrollIndicatorStyle]}
                  >
                    <Ionicons
                      name="chevron-down"
                      size={hp(2.5)}
                      color="rgba(255, 255, 255, 0.8)"
                    />
                  </Animated.View>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Health Card */}
        {data.health && (
          <View style={styles.cardWrapper}>
            <LinearGradient
              colors={["#B73AF3", "#6950FB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.resultCard}
            >
              <View style={styles.resultCardHeader}>
                <FontAwesome name="plus" size={hp(3.3)} color="white" />
                <Text style={styles.resultCardTitle}>
                  {t("horoscope.barTitles.health")}
                </Text>
              </View>
              <View style={styles.resultCardTextContainer}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                  contentContainerStyle={styles.resultCardScrollContent}
                >
                  <Text style={styles.resultCardText}>
                    {data.health.explanation || ""}
                  </Text>
                </ScrollView>
                {shouldBlurCards && (
                  <>
                    <BlurView
                      intensity={100}
                      style={styles.blurTextOverlay}
                      tint="dark"
                    />
                    <LinearGradient
                      colors={["#B73AF3", "#6950FB"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.blurGradientOverlay}
                    />
                    <View style={styles.premiumPromptContainer}>
                      <MaterialCommunityIcons
                        name="lock"
                        size={hp(4)}
                        color="#fff"
                        style={styles.lockIcon}
                      />
                      <Text style={styles.premiumPromptText}>
                        {t("horoscope.premium.buyPremiumForAccess") ||
                          "Buy Platinum for Access"}
                      </Text>
                    </View>
                  </>
                )}
                {/* Scroll indicator */}
                <View style={styles.scrollIndicatorContainer}>
                  <Animated.View
                    style={[styles.scrollIndicator, scrollIndicatorStyle]}
                  >
                    <Ionicons
                      name="chevron-down"
                      size={hp(2.5)}
                      color="rgba(255, 255, 255, 0.8)"
                    />
                  </Animated.View>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}
      </>
    );
  };

  const selectedData =
    selected === "today"
      ? currentHoroscopeData?.daily
      : selected === "week"
        ? currentHoroscopeData?.weekly
        : currentHoroscopeData?.monthly;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.dateTitle}>{formattedDate}</Text>

          <Animated.View
            entering={FadeInDown.delay(100).springify()}
            style={{
              justifyContent: "center",
              alignItems: "center",
              width: wp(100),
            }}
          >
            <View style={styles.buttonBox}>
              <TouchableOpacity onPress={() => handleButtonPress("today")}>
                <Text
                  style={
                    selected !== "today"
                      ? styles.buttonSelector
                      : styles.selectedButton
                  }
                >
                  {t("horoscope.buttons.today")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => handleButtonPress("week")}>
                <Text
                  style={
                    selected !== "week"
                      ? styles.buttonSelector
                      : styles.selectedButton
                  }
                >
                  {t("horoscope.buttons.week")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => handleButtonPress("month")}>
                <Text
                  style={
                    selected !== "month"
                      ? styles.buttonSelector
                      : styles.selectedButton
                  }
                >
                  {t("horoscope.buttons.month")}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {!loading && (loadingPeriods.weekly || loadingPeriods.monthly) && (
            <Animated.View
              entering={FadeInDown.delay(100).springify()}
              style={styles.backgroundLoadingContainer}
            >
              <ActivityIndicator size="small" color="#7b25e5" />
              <Text style={styles.backgroundLoadingText}>
                {loadingPeriods.weekly && loadingPeriods.monthly
                  ? t("horoscope.loading.weeklyMonthly") ||
                    "Loading weekly & monthly..."
                  : loadingPeriods.weekly
                    ? t("horoscope.loading.weekly") || "Loading weekly..."
                    : t("horoscope.loading.monthly") || "Loading monthly..."}
              </Text>
            </Animated.View>
          )}
          {/* User Astrological Profile Section */}
          {userDataHoroscope && (
            <Animated.View
              entering={FadeInDown.delay(200).springify()}
              style={styles.profileSection}
            >
              <Image
                source={require("@/assets/images/horoscope/starsBg.png")}
                style={styles.profileBackground}
                resizeMode="cover"
              />

              <View style={styles.profileContent}>
                <View style={styles.leftColumn}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>
                      {t("profile.user.moonSign")}
                    </Text>
                    <View style={styles.infoValueRow}>
                      <Text style={styles.infoValue}>
                        {translateZodiacSign(userDataHoroscope.moonSign)}
                      </Text>
                      <MaterialCommunityIcons
                        name={
                          `zodiac-${userDataHoroscope.moonSign.toLowerCase()}` as any
                        }
                        size={hp(3)}
                        color={Colors.borderColor}
                        style={styles.zodiacIcon}
                      />
                    </View>
                  </View>
                  <View style={[styles.infoItem, { marginBottom: 0 }]}>
                    <Text style={styles.infoLabel}>
                      {t("profile.user.ascendant")}
                    </Text>
                    <View style={styles.infoValueRow}>
                      <Text style={styles.infoValue}>
                        {translateZodiacSign(userDataHoroscope.ascendant)}
                      </Text>
                      <MaterialCommunityIcons
                        name={
                          `zodiac-${userDataHoroscope.ascendant.toLowerCase()}` as any
                        }
                        size={hp(3)}
                        color={Colors.borderColor}
                        style={styles.zodiacIcon}
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.centerColumn}>
                  <Image
                    source={getOldZodiacImages(userDataHoroscope.sunSign)}
                    style={styles.sunSignImage}
                    resizeMode="contain"
                  />
                  <View style={styles.horoscopeTextContainer}>
                    <View style={styles.horoscopeSignRow}>
                      <Text style={styles.horoscopeText}>
                        {t("horoscope.barTitles.yourHoroscope")}
                      </Text>
                      <Text style={styles.horoscopeSignText}>
                        {translateZodiacSign(userDataHoroscope.sunSign)}
                      </Text>
                    </View>
                    <MaterialCommunityIcons
                      name={
                        `zodiac-${userDataHoroscope.sunSign.toLowerCase()}` as any
                      }
                      size={hp(3)}
                      color={Colors.purpleColorBlack}
                      style={styles.zodiacIcon}
                    />
                  </View>
                </View>

                <View style={styles.rightColumn}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>
                      {t("profile.user.element")}
                    </Text>
                    <Text style={styles.infoValue}>
                      {translateElement(userDataHoroscope.element)}
                    </Text>
                  </View>
                  <View style={[styles.infoItem, { marginBottom: 0 }]}>
                    <Text style={styles.infoLabel}>
                      {t("profile.user.polarity")}
                    </Text>
                    <Text style={styles.infoValue}>
                      {translatePolarity(userDataHoroscope.polarity)}
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Percentage Bars Section */}
          {selectedData && (
            <Animated.View
              entering={FadeInDown.delay(300).springify()}
              style={styles.percentageBarsSection}
            >
              <View style={styles.percentageBarsGrid}>
                {selectedData.love && (
                  <PercentageBar
                    title={t("horoscope.barTitles.love")}
                    barColor="#b84aec"
                    percentage={selectedData.love.percentage || 0}
                    icon={
                      <Image
                        source={require("@/assets/images/horoscope/loveIcon.png")}
                        style={styles.percentageBarIcon}
                        resizeMode="contain"
                      />
                    }
                  />
                )}
                {selectedData.career && (
                  <PercentageBar
                    title={t("horoscope.barTitles.career")}
                    barColor="#60ec4b"
                    percentage={selectedData.career.percentage || 0}
                    icon={
                      <Image
                        source={require("@/assets/images/horoscope/bussinesIcon.png")}
                        style={styles.percentageBarIcon}
                        resizeMode="contain"
                      />
                    }
                  />
                )}
                {selectedData.luck && (
                  <PercentageBar
                    title={t("horoscope.barTitles.lucks")}
                    barColor="#fec83c"
                    percentage={selectedData.luck.percentage || 0}
                    icon={
                      <MaterialCommunityIcons
                        name="star-four-points"
                        size={hp(3.3)}
                        color={Colors.borderColor}
                      />
                    }
                  />
                )}
                {selectedData.health && (
                  <PercentageBar
                    title={t("horoscope.barTitles.health")}
                    barColor="#ff3c3d"
                    percentage={selectedData.health.percentage || 0}
                    icon={
                      <FontAwesome
                        name="plus"
                        size={hp(3.3)}
                        color={Colors.borderColor}
                      />
                    }
                  />
                )}
              </View>
            </Animated.View>
          )}
        </View>

        {/* Horoscope Content */}
        <View style={styles.contentContainer}>
          {renderHoroscopeContent(selectedData)}
        </View>
      </ScrollView>

      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
    </View>
  );
};

export default Horoscope;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: hp(5),
  },
  headerContainer: {
    paddingTop: hp(3.8),
    paddingBottom: hp(2),
    paddingHorizontal: wp(5),
    alignItems: "center",
    backgroundColor: "#fff",
    width: wp(100),
  },
  dateTitle: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: hp(2.3),
    fontWeight: "600",
    color: Colors.purpleColorBlack,
    marginBottom: hp(2),
  },
  buttonBox: {
    width: wp(90),
    flexDirection: "row",
    paddingVertical: hp(0.5),
    paddingHorizontal: wp(6),
    justifyContent: "space-between",
    borderRadius: 25,
    borderColor: Colors.borderColor,
    borderWidth: 2,
    marginBottom: hp(2),
  },
  buttonSelector: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: hp(2.3),
    fontWeight: "600",
    color: Colors.border,
  },
  selectedButton: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: hp(2.3),
    fontWeight: "600",
    color: Colors.purpleColorBlack,
  },
  image: {
    width: hp(30),
    height: hp(30),
    zIndex: 10,
  },
  starGlow: {
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 20,
  },
  profileSection: {
    width: wp(100),
    height: hp(35),
    borderRadius: 20,
    marginTop: hp(4),
    marginBottom: hp(2),
    overflow: "hidden",
    position: "relative",
  },
  profileBackground: {
    position: "absolute",
    width: wp(100),
    height: "100%",
    left: 0,
    right: 0,
    tintColor: Colors.purpleColorBlack,
    opacity: 1,
  },
  profileContent: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    zIndex: 1,
  },
  leftColumn: {
    alignItems: "center",
    justifyContent: "center",
  },
  centerColumn: {
    alignItems: "center",
    justifyContent: "flex-start",
  },
  rightColumn: {
    alignItems: "flex-start",
    justifyContent: "center",
  },
  infoItem: {
    marginBottom: hp(2),
    alignItems: "center",
  },
  infoLabel: {
    fontFamily: "Rubik_500Medium",
    fontSize: hp(1.8),
    fontWeight: "500",
    color: "#555",
    opacity: 0.8,
    marginBottom: hp(0.8),
    textAlign: "center",
  },
  infoValue: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: hp(2),
    fontWeight: "600",
    color: Colors.borderColor,
    textAlign: "center",
  },
  sunSignImage: {
    width: hp(22),
    height: hp(22),
  },
  infoValueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  zodiacIcon: {
    marginLeft: wp(2),
  },
  horoscopeTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: wp(40),
    marginBottom: hp(1),
  },
  horoscopeText: {
    fontFamily: "Rubik_500Medium",
    fontSize: hp(2),
    fontWeight: "500",
    color: Colors.borderColor,
    textAlign: "center",
  },
  horoscopeSignRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  horoscopeSignText: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: hp(2.5),
    fontWeight: "600",
    color: Colors.purpleColorBlack,
    marginLeft: wp(0.5),
  },
  // Percentage Bars Section
  percentageBarsSection: {
    width: wp(100),
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    backgroundColor: "#fff",
  },
  percentageBarsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  percentageBarContainer: {
    width: wp(42),
    marginBottom: hp(2),
  },
  percentageBarHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp(0.8),
    gap: wp(1.5),
  },
  percentageBarIcon: {
    width: hp(2.5),
    height: hp(2.5),
    tintColor: Colors.borderColor,
  },
  percentageBarTitle: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: hp(1.8),
    fontWeight: "600",
    color: Colors.borderColor,
  },
  percentageBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(2),
  },
  percentageBarBackground: {
    flex: 1,
    height: hp(1.2),
    backgroundColor: "#E8E8E8",
    borderRadius: hp(0.6),
    overflow: "hidden",
  },
  percentageBarFill: {
    height: "100%",
    backgroundColor: Colors.borderColor,
    borderRadius: hp(0.6),
  },
  percentageBarText: {
    fontFamily: "Rubik_700Bold",
    fontSize: hp(1.6),
    fontWeight: "700",

    minWidth: wp(10),
    textAlign: "right",
  },
  contentContainer: {
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
  },
  resultCard: {
    borderRadius: 16,
    padding: wp(5),
    marginBottom: hp(2.5),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    overflow: "hidden",
    minHeight: hp(30),
    maxHeight: hp(65),
  },
  resultCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: hp(2),
    gap: wp(2),
  },
  resultCardIcon: {
    width: hp(3.5),
    height: hp(3.5),
    tintColor: "#fff",
  },
  resultCardTitle: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: hp(2.6),
    fontWeight: "600",
    color: "#fff",
    flex: 1,
    textAlign: "center",
  },
  resultCardPercentage: {
    fontFamily: "Rubik_700Bold",
    fontSize: hp(2.5),
    fontWeight: "700",
    color: "#fff",
  },
  resultCardText: {
    fontFamily: "Rubik_400Regular",
    fontSize: hp(2.1),
    fontWeight: "400",
    color: "#fff",
    lineHeight: hp(3.2),
    textAlign: "left",
    paddingHorizontal: wp(1.5),
  },
  resultCardTextContainer: {
    position: "relative",
    marginTop: hp(2),
    flex: 1,
    minHeight: hp(22),
    maxHeight: hp(55),
  },
  resultCardScrollContent: {
    paddingBottom: hp(1),
    flexGrow: 1,
  },
  scrollIndicatorContainer: {
    position: "absolute",
    bottom: hp(2),
    right: wp(4),
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  },
  scrollIndicator: {
    alignItems: "center",
    justifyContent: "center",
  },
  loadingIndicatorContainer: {
    position: "absolute",
    bottom: hp(5),
    left: 0,
    right: 0,
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  loadingDateTitle: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: hp(2.3),
    fontWeight: "600",
    color: Colors.purpleColorBlack,
    marginBottom: hp(4),
  },
  loadingImageWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    width: hp(30),
    height: hp(30),
    borderRadius: 999,
  },
  loadingGlowOuter: {
    position: "absolute",
    backgroundColor: "#FFD700",
    borderRadius: 999,
    height: hp(28),
    width: hp(28),
    opacity: 0.3,
  },
  loadingGlowMiddle: {
    position: "absolute",
    backgroundColor: "#FFA500",
    borderRadius: 999,
    height: hp(26),
    width: hp(26),
    opacity: 0.5,
  },
  loadingGlowInner: {
    position: "absolute",
    backgroundColor: "#FFD700",
    borderRadius: 999,
    height: hp(24),
    width: hp(24),
    opacity: 0.7,
  },
  loadingImage: {
    width: hp(30),
    height: hp(30),
    zIndex: 10,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 20,
  },
  loadingText: {
    textAlign: "center",
    paddingVertical: hp(4),
    paddingHorizontal: wp(10),
    fontFamily: "Rubik_600SemiBold",
    fontSize: hp(3.2),
    fontWeight: "600",
    color: Colors.purpleColorBlack,
  },
  backgroundLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
    backgroundColor: "#f0e6ff",
    borderRadius: 20,
    marginVertical: hp(1),
    gap: wp(2),
  },
  backgroundLoadingText: {
    fontFamily: "Rubik_500Medium",
    fontSize: hp(1.6),
    color: "#7b25e5",
    fontWeight: "500",
  },
  cardWrapper: {
    position: "relative",
    marginBottom: hp(2),
  },
  blurredCard: {
    opacity: 0.4,
  },
  blurOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    overflow: "hidden",
    zIndex: 10,
  },
  blurTextOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    overflow: "hidden",
    zIndex: 10,
  },
  blurGradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    opacity: 0.95,
    zIndex: 11,
  },
  premiumPromptContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 12,
    paddingHorizontal: wp(4),
  },
  lockIcon: {
    marginBottom: hp(1),
  },
  premiumPromptText: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: hp(2),
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
    lineHeight: hp(2.8),
  },
  percentageBarWrapper: {
    position: "relative",
    width: wp(42),
    marginBottom: hp(2),
  },
});
