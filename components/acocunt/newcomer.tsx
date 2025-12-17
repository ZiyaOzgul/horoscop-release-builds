import { api } from "@/convex/_generated/api";
import { useUserDataTranslation } from "@/locales/translationHelper";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setUserData } from "@/redux/horoscopeSlicer";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  ImageBackground,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";

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

const Newcomer = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  const userData = useQuery(api.users.getUserWithClerkID, {
    clerkId: user?.id,
  });

  useEffect(() => {
    if (userData) {
      dispatch(setUserData(userData));
      setLoading(false);
    }
  }, [userData]);
  const { translateZodiacSign } = useUserDataTranslation();
  const userDetails = useAppSelector((state) => state.horoscope.userData);

  if (loading || !userDetails) {
    return (
      <ImageBackground
        source={require("../../assets/images/horoscope/regBg.png")}
        style={styles.container}
      >
        <Text style={styles.loadingText}>{t("newcomer.loading")}</Text>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require("../../assets/images/horoscope/regBg.png")}
      style={styles.container}
    >
      <View style={{ alignItems: "center" }}>
        <Image
          source={zodiacImages[userDetails.sunSign]}
          style={styles.zodiacSign}
          resizeMode="cover"
        />
      </View>

      <Text style={styles.hText}>
        {t("newcomer.hello", { name: userDetails.firstName })}
      </Text>
      <Text style={styles.zodiacName}>
        {t("newcomer.yourZodiacSign", {
          sign: translateZodiacSign(userDetails.sunSign),
        })}
      </Text>
      <Text style={styles.title}>{t("newcomer.letsSeeDailyHoroscope")}</Text>

      <View style={styles.buttonWrapper}>
        <TouchableOpacity
          style={styles.buttonContainer}
          onPress={() => router.push("/(auth)/(tabs)/Horoscope")}
        >
          <LinearGradient
            colors={["#616FFE", "#7F1FE2"]}
            style={styles.gradient}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.buttonText}>{t("newcomer.next")}</Text>
            <Ionicons
              name="chevron-forward"
              color={"white"}
              size={24}
              style={styles.icon}
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
    </ImageBackground>
  );
};

export default Newcomer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: hp(3.8),
    paddingHorizontal: wp(5),
    alignContent: "center",
  },
  zodiacSign: {
    height: hp(20),
    width: hp(20),
    marginTop: hp(10),
  },
  hText: {
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
    color: "#fff",
    fontSize: hp(3.8),
    textAlign: "center",
  },
  zodiacName: {
    fontFamily: " Rubik_500Medium",
    fontWeight: "medium",
    color: "#fff",
    fontSize: hp(3.1),
    textAlign: "center",
    marginTop: hp(1),
  },
  title: {
    marginTop: hp(6),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
    color: "#fff",
    fontSize: hp(5.4),
    textAlign: "center",
  },
  buttonWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: hp(6),
  },
  buttonContainer: {
    flexDirection: "row",
    borderRadius: 35,
    overflow: "hidden",
    width: wp(80),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    elevation: 3,
  },
  gradient: {
    paddingVertical: hp(1.8),
    alignItems: "center",
    width: wp(80),
    flexDirection: "row",
    justifyContent: "center",
    position: "relative",
  },
  buttonText: {
    color: "white",
    fontSize: hp(2.3),
    fontFamily: "Rubik_600SemiBold",
  },
  icon: {
    position: "absolute",
    top: hp(1.8),
    right: wp(4),
  },
  loadingText: {
    fontSize: hp(4),
    color: "#fff",
    textAlign: "center",
    marginTop: hp(6),
  },
});
