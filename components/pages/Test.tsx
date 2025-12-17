import { getUserHoroscope } from "@/api/horoscope";
import { Colors } from "@/constants/Colors";
import { api } from "@/convex/_generated/api";
import { useUserDataTranslation } from "@/locales/translationHelper";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setHoroscopeData, setUserData } from "@/redux/horoscopeSlicer";
import { useUser } from "@clerk/clerk-expo";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery } from "convex/react";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import PagerView from "react-native-pager-view";
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

// Zodiac images mapping
const zodiacImages: { [key: string]: any } = {
  Aries: require("@/assets/images/horoscope/signs/aries.png"),
  Taurus: require("@/assets/images/horoscope/signs/taurus.png"),
  Gemini: require("@/assets/images/horoscope/signs/gemini.png"),
  Cancer: require("@/assets/images/horoscope/signs/cancer.png"),
  Leo: require("@/assets/images/horoscope/signs/leo.png"),
  Virgo: require("@/assets/images/horoscope/signs/virgo.png"),
  Libra: require("@/assets/images/horoscope/signs/libra.png"),
  Scorpio: require("@/assets/images/horoscope/signs/scorpio.png"),
  Sagittarius: require("@/assets/images/horoscope/signs/sagittarius.png"),
  Capricorn: require("@/assets/images/horoscope/signs/capricorn.png"),
  Aquarius: require("@/assets/images/horoscope/signs/aquarius.png"),
  Pisces: require("@/assets/images/horoscope/signs/pisces.png"),
};
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

const getZodiacImage = (signName: string) => {
  return zodiacImages[signName] || null;
};

const getOldZodiacImages = (signName: string) => {
  return oldZodiacImages[signName] || null;
};

const HOROSCOPE_CACHE_KEY = "@horoscope_cache";
const HOROSCOPE_CACHE_DATE_KEY = "@horoscope_cache_date";

// Helper functions for caching
const getCachedHoroscope = async (date: string) => {
  try {
    const cachedDate = await AsyncStorage.getItem(HOROSCOPE_CACHE_DATE_KEY);
    if (cachedDate === date) {
      const cachedData = await AsyncStorage.getItem(HOROSCOPE_CACHE_KEY);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    }
    return null;
  } catch (error) {
    console.error("Error reading cached horoscope:", error);
    return null;
  }
};

const setCachedHoroscope = async (date: string, data: any) => {
  try {
    await AsyncStorage.setItem(HOROSCOPE_CACHE_DATE_KEY, date);
    await AsyncStorage.setItem(HOROSCOPE_CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Error saving cached horoscope:", error);
  }
};

const Horoscope: React.FC = () => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<"today" | "week" | "month">("today");
  const date = new Date();
  const todayString = date.toISOString().split("T")[0]; // "YYYY-MM-DD"
  const { user } = useUser();
  const dispatch = useAppDispatch();
  const userDataHoroscope = useAppSelector((s) => s.horoscope.userData);
  const aiResultHoroscope = useAppSelector(
    (s) => s.horoscope.horoscopeResultData
  );
  const [showLanding, setShowLanding] = useState(true);
  const [loading, setLoading] = useState(false);
  const pagerRef = useRef<PagerView | null>(null);

  const handleLandingPress = () => {
    pagerRef.current?.setPage(1);
    setShowLanding(false);
  };

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

  const { translateZodiacSign, translateElement, translatePolarity } =
    useUserDataTranslation();

  const saveHoroscope = useMutation(api.users.saveHoroscope);

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

  const pageMapping: { [K in "today" | "week" | "month"]: number } = {
    today: 1,
    week: 2,
    month: 3,
  };
  const stateMapping: { [key: number]: "today" | "week" | "month" } = {
    1: "today",
    2: "week",
    3: "month",
  };

  const handlePageSelected = (e: any) => {
    const position = e.nativeEvent.position;
    if (position !== 0 && stateMapping[position]) {
      setSelected(stateMapping[position]);
    }
  };
  const { i18n } = useTranslation();
  const selectedLang = i18n.language;
  const handleButtonPress = (value: "today" | "week" | "month") => {
    setSelected(value);
    pagerRef.current?.setPage(pageMapping[value]);
  };

  const getHoroscopeData = async (aiReq: string) => {
    setLoading(true);
    try {
      // First check cache for today's data
      const cachedData = await getCachedHoroscope(todayString);
      if (cachedData) {
        console.log("📦 Using cached horoscope data");
        dispatch(setHoroscopeData(cachedData));
        setLoading(false);
        return;
      }

      // If no cache, fetch from API
      console.log("🌐 Fetching horoscope from API");
      const Horoscope = await getUserHoroscope(aiReq, selectedLang);
      const statusCode = Horoscope.status;
      const horoscopeData = Horoscope.horoscope;

      if (statusCode === 200) {
        // Save to database
        await saveHoroscope({
          userId: user!.id,
          date: todayString,
          daily: horoscopeData.daily,
          weekly: horoscopeData.weekly,
          monthly: horoscopeData.monthly,
        });

        // Cache the data locally
        await setCachedHoroscope(todayString, horoscopeData);

        dispatch(setHoroscopeData(horoscopeData));
      }
    } catch (error) {
      console.error("Error fetching horoscope:", error);
    } finally {
      setLoading(false);
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
        // First check if we have cached data for today
        const cachedData = await getCachedHoroscope(todayString);
        if (cachedData) {
          console.log("📦 Using cached horoscope data from useEffect");
          dispatch(setHoroscopeData(cachedData));
          return;
        }

        // If no cache, fetch from API
        const aiRequestData = `Moon Sign: ${userDataHoroscope.moonSign}, sun sign ${userDataHoroscope.sunSign}, ascendant: ${userDataHoroscope.ascendant}`;
        getHoroscopeData(aiRequestData);
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
      <View style={styles.container}>
        <Text style={styles.dateTitle}>{formattedDate}</Text>

        <View
          style={{
            position: "relative",
            alignItems: "center",
            justifyContent: "center",
            width: hp(30),
            height: hp(30),
            borderRadius: 999,
          }}
        >
          {/* Outer Glow Layer */}
          <Animated.View
            style={[
              {
                position: "absolute",
                backgroundColor: "#FFD700",
                borderRadius: 999,
                height: hp(28),
                width: hp(28),
                opacity: 0.3,
              },
              animatedStyle,
            ]}
          />
          {/* Middle Glow Layer */}
          <Animated.View
            style={[
              {
                position: "absolute",
                backgroundColor: "#FFA500",
                borderRadius: 999,
                height: hp(26),
                width: hp(26),
                opacity: 0.5,
              },
              animatedStyle,
            ]}
          />
          {/* Inner Glow Layer */}
          <Animated.View
            style={[
              {
                position: "absolute",
                backgroundColor: "#FFD700",
                borderRadius: 999,
                height: hp(24),
                width: hp(24),
                opacity: 0.7,
              },
              animatedStyle,
            ]}
          />
          <Animated.Image
            source={require("@/assets/images/horoscope/starH.png")}
            style={[styles.image, animatedStyle, styles.starGlow]}
            resizeMode="cover"
          />
        </View>

        <Text
          style={{
            textAlign: "center",
            paddingVertical: hp(4),
            paddingHorizontal: wp(10),
            fontFamily: "Rubik_600SemiBold",
            fontSize: hp(3.2),
            fontWeight: "600",
            color: Colors.purpleColorBlack,
          }}
        >
          {loadingText}
        </Text>
      </View>
    );
  }

  // Use either Redux data or database data
  const currentHoroscopeData = aiResultHoroscope || {
    daily: todaysHoroscope?.daily,
    weekly: todaysHoroscope?.weekly,
    monthly: todaysHoroscope?.monthly,
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        nestedScrollEnabled={true}
      >
        <Text style={styles.dateTitle}>{formattedDate}</Text>

        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={{ justifyContent: "center", alignItems: "center" }}
        >
          <View style={{ width: wp(100), alignItems: "center" }}>
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
          </View>

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
                {/* Left Side: Moon Sign and Ascendant */}
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
                        Your horoscope is
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

          <PagerView
            initialPage={0}
            style={{
              height: hp(73.3),
              width: wp(100),
              paddingVertical: hp(1),
              borderRadius: 22,
              overflow: "hidden",
            }}
            ref={pagerRef}
            onPageSelected={handlePageSelected}
          >
            {/* Landing page */}
            <View key="page0" style={styles.page}>
              {showLanding ? (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={handleLandingPress}
                  style={{ alignItems: "center" }}
                >
                  <View
                    style={{
                      position: "relative",
                      alignItems: "center",
                      justifyContent: "center",
                      width: hp(30),
                      height: hp(30),
                      borderRadius: 999,
                    }}
                  >
                    {/* Outer Glow Layer */}
                    <Animated.View
                      style={[
                        {
                          position: "absolute",
                          backgroundColor: "#FFD700",
                          borderRadius: 999,
                          height: hp(28),
                          width: hp(28),
                          opacity: 0.3,
                        },
                        animatedStyle,
                      ]}
                    />
                    {/* Middle Glow Layer */}
                    <Animated.View
                      style={[
                        {
                          position: "absolute",
                          backgroundColor: "#FFA500",
                          borderRadius: 999,
                          height: hp(26),
                          width: hp(26),
                          opacity: 0.5,
                        },
                        animatedStyle,
                      ]}
                    />
                    {/* Inner Glow Layer */}
                    <Animated.View
                      style={[
                        {
                          position: "absolute",
                          backgroundColor: "#FFD700",
                          borderRadius: 999,
                          height: hp(24),
                          width: hp(24),
                          opacity: 0.7,
                        },
                        animatedStyle,
                      ]}
                    />
                    <Animated.Image
                      source={require("@/assets/images/horoscope/icon4.png")}
                      style={[styles.image, animatedStyle, styles.starGlow]}
                      resizeMode="cover"
                    />
                  </View>

                  <Text
                    style={{
                      textAlign: "center",
                      paddingVertical: hp(4),
                      paddingHorizontal: wp(10),
                      fontFamily: "Rubik_600SemiBold",
                      fontSize: hp(3.2),
                      fontWeight: "600",
                      color: Colors.purpleColorBlack,
                    }}
                  >
                    {t("horoscope.landing.title")}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View />
              )}
            </View>

            {/* Today */}
            <ScrollView key="page1" style={styles.page}>
              {/* Moon Sign Card */}
              <View style={styles.cardContainer}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle}>
                    {t("horoscope.signs.moon")}
                  </Text>
                  <Image
                    source={getZodiacImage(userDataHoroscope.moonSign)}
                    style={styles.cardZodiacImage}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.signRow}>
                    <MaterialCommunityIcons
                      size={hp(6.8)}
                      name={
                        `zodiac-${userDataHoroscope.moonSign.toLowerCase()}` as any
                      }
                      color={Colors.purpleColorBlack}
                    />
                    <Text style={styles.signName}>
                      {translateZodiacSign(userDataHoroscope.moonSign)}
                    </Text>
                  </View>
                  <View style={styles.symbolContainer}>
                    <Text style={styles.symbolText}>
                      {currentHoroscopeData?.daily?.moonSign}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Sun Sign Card */}
              <View style={styles.cardContainer}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle}>
                    {t("horoscope.signs.sun")}
                  </Text>
                  <Image
                    source={getZodiacImage(userDataHoroscope.sunSign)}
                    style={styles.cardZodiacImage}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.signRow}>
                    <MaterialCommunityIcons
                      size={hp(6.8)}
                      name={
                        `zodiac-${userDataHoroscope.sunSign.toLowerCase()}` as any
                      }
                      color={Colors.purpleColorBlack}
                    />
                    <Text style={styles.signName}>
                      {translateZodiacSign(userDataHoroscope.sunSign)}
                    </Text>
                  </View>
                  <View style={styles.symbolContainer}>
                    <Text style={styles.symbolText}>
                      {currentHoroscopeData?.daily?.sunSign}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Ascendant Sign Card */}
              <View style={styles.cardContainer}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle}>
                    {t("horoscope.signs.ascendant")}
                  </Text>
                  <Image
                    source={getZodiacImage(userDataHoroscope.ascendant)}
                    style={styles.cardZodiacImage}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.signRow}>
                    <MaterialCommunityIcons
                      size={hp(6.8)}
                      name={
                        `zodiac-${userDataHoroscope.ascendant.toLowerCase()}` as any
                      }
                      color={Colors.purpleColorBlack}
                    />
                    <Text style={styles.signName}>
                      {translateZodiacSign(userDataHoroscope.ascendant)}
                    </Text>
                  </View>
                  <View style={styles.symbolContainer}>
                    <Text style={styles.symbolText}>
                      {currentHoroscopeData?.daily?.ascendant}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Week */}
            <ScrollView key="page2" style={styles.page}>
              {/* Moon Sign Card */}
              <View style={styles.cardContainer}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle}>
                    {t("horoscope.signs.moon")}
                  </Text>
                  <Image
                    source={getZodiacImage(userDataHoroscope.moonSign)}
                    style={styles.cardZodiacImage}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.signRow}>
                    <MaterialCommunityIcons
                      size={hp(6.8)}
                      name={
                        `zodiac-${userDataHoroscope.moonSign.toLowerCase()}` as any
                      }
                      color={Colors.purpleColorBlack}
                    />
                    <Text style={styles.signName}>
                      {translateZodiacSign(userDataHoroscope.moonSign)}
                    </Text>
                  </View>
                  <View style={styles.symbolContainer}>
                    <Text style={styles.symbolText}>
                      {currentHoroscopeData?.weekly?.moonSign}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Sun Sign Card */}
              <View style={styles.cardContainer}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle}>
                    {t("horoscope.signs.sun")}
                  </Text>
                  <Image
                    source={getZodiacImage(userDataHoroscope.sunSign)}
                    style={styles.cardZodiacImage}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.signRow}>
                    <MaterialCommunityIcons
                      size={hp(6.8)}
                      name={
                        `zodiac-${userDataHoroscope.sunSign.toLowerCase()}` as any
                      }
                      color={Colors.purpleColorBlack}
                    />
                    <Text style={styles.signName}>
                      {translateZodiacSign(userDataHoroscope.sunSign)}
                    </Text>
                  </View>
                  <View style={styles.symbolContainer}>
                    <Text style={styles.symbolText}>
                      {currentHoroscopeData?.weekly?.sunSign}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Ascendant Sign Card */}
              <View style={styles.cardContainer}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle}>
                    {t("horoscope.signs.ascendant")}
                  </Text>
                  <Image
                    source={getZodiacImage(userDataHoroscope.ascendant)}
                    style={styles.cardZodiacImage}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.signRow}>
                    <MaterialCommunityIcons
                      size={hp(6.8)}
                      name={
                        `zodiac-${userDataHoroscope.ascendant.toLowerCase()}` as any
                      }
                      color={Colors.purpleColorBlack}
                    />
                    <Text style={styles.signName}>
                      {translateZodiacSign(userDataHoroscope.ascendant)}
                    </Text>
                  </View>
                  <View style={styles.symbolContainer}>
                    <Text style={styles.symbolText}>
                      {currentHoroscopeData?.weekly?.ascendant}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Month */}
            <ScrollView key="page3" style={styles.page}>
              {/* Moon Sign Card */}
              <View style={styles.cardContainer}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle}>
                    {t("horoscope.signs.moon")}
                  </Text>
                  <Image
                    source={getZodiacImage(userDataHoroscope.moonSign)}
                    style={styles.cardZodiacImage}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.signRow}>
                    <MaterialCommunityIcons
                      size={hp(6.8)}
                      name={
                        `zodiac-${userDataHoroscope.moonSign.toLowerCase()}` as any
                      }
                      color={Colors.purpleColorBlack}
                    />
                    <Text style={styles.signName}>
                      {translateZodiacSign(userDataHoroscope.moonSign)}
                    </Text>
                  </View>
                  <View style={styles.symbolContainer}>
                    <Text style={styles.symbolText}>
                      {currentHoroscopeData?.monthly?.moonSign}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Sun Sign Card */}
              <View style={styles.cardContainer}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle}>
                    {t("horoscope.signs.sun")}
                  </Text>
                  <Image
                    source={getZodiacImage(userDataHoroscope.sunSign)}
                    style={styles.cardZodiacImage}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.signRow}>
                    <MaterialCommunityIcons
                      size={hp(6.8)}
                      name={
                        `zodiac-${userDataHoroscope.sunSign.toLowerCase()}` as any
                      }
                      color={Colors.purpleColorBlack}
                    />
                    <Text style={styles.signName}>
                      {translateZodiacSign(userDataHoroscope.sunSign)}
                    </Text>
                  </View>
                  <View style={styles.symbolContainer}>
                    <Text style={styles.symbolText}>
                      {currentHoroscopeData?.monthly?.sunSign}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Ascendant Sign Card */}
              <View style={styles.cardContainer}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle}>
                    {t("horoscope.signs.ascendant")}
                  </Text>
                  <Image
                    source={getZodiacImage(userDataHoroscope.ascendant)}
                    style={styles.cardZodiacImage}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.signRow}>
                    <MaterialCommunityIcons
                      size={hp(6.8)}
                      name={
                        `zodiac-${userDataHoroscope.ascendant.toLowerCase()}` as any
                      }
                      color={Colors.purpleColorBlack}
                    />
                    <Text style={styles.signName}>
                      {translateZodiacSign(userDataHoroscope.ascendant)}
                    </Text>
                  </View>
                  <View style={styles.symbolContainer}>
                    <Text style={styles.symbolText}>
                      {currentHoroscopeData?.monthly?.ascendant}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </PagerView>
        </Animated.View>
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
  scrollContent: {
    paddingTop: hp(3.8),
    alignItems: "center",
    paddingBottom: hp(3.2),
    paddingHorizontal: wp(5),
    flexGrow: 1,
  },
  dateTitle: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: hp(2.3),
    fontWeight: "600",
    color: Colors.purpleColorBlack,
  },
  buttonBox: {
    width: wp(80),
    flexDirection: "row",
    paddingTop: wp(10),
    justifyContent: "space-between",
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
  page: {
    marginTop: hp(2),
  },
  symbolContainer: {
    marginVertical: hp(1),
    minHeight: hp(25),
    backgroundColor: Colors.purplePalmitryBg,
    paddingVertical: hp(4),
    paddingHorizontal: wp(4),
    borderRadius: 16,
    overflow: "hidden",
    width: "100%",
  },
  symbolText: {
    fontFamily: "Rubik_500Medium",
    fontWeight: "500",
    fontSize: hp(2.2),
    color: "#fff",
    textAlign: "center",
    marginTop: hp(1),
  },
  signRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(2),
    marginBottom: hp(1),
  },
  signTitle: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: hp(2.2),
    color: Colors.purpleColorBlack,
    textAlign: "center",
    marginRight: wp(2),
  },
  signName: {
    fontFamily: "Rubik_500Medium",
    fontSize: hp(2.2),
    color: Colors.purpleColorBlack,
    textAlign: "center",
    marginLeft: wp(2),
  },
  pageTitle: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: hp(3),
    color: Colors.purpleColorBlack,
  },
  cardContainer: {
    marginBottom: hp(2),
    marginHorizontal: wp(6),
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: wp(4),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: hp(1.5),
  },
  cardTitle: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: hp(2.5),
    fontWeight: "600",
    color: Colors.purpleColorBlack,
    flex: 1,
  },
  cardZodiacImage: {
    width: hp(15),
    height: hp(15),
    borderRadius: hp(4),
  },
  cardContent: {
    paddingTop: hp(1),
    width: "100%",
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
});
