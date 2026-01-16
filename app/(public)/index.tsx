import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Dimensions,
  Image,
  ImageBackground,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";

import { useSSO } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import LinearGradient from "react-native-linear-gradient";

const Index = () => {
  const { t } = useTranslation();
  const { startSSOFlow } = useSSO();
  const { height: SCREEN_HEIGHT } = Dimensions.get("window");

  const handleFacebookLogin = async () => {
    try {
      const callbackUrl = Linking.createURL("/(public)/ssp-callback", {
        scheme: "horoscope",
      });

      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_facebook",
        redirectUrl: callbackUrl,
      });
      if (createdSessionId && setActive) {
        await setActive({
          session: createdSessionId,
          redirectUrl: "",
        });
        router.replace("/(public)/(account)/loading");
      }
    } catch (error) {
      console.error("Facebook login error:", error);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const callbackUrl = Linking.createURL("/(public)/ssp-callback", {
        scheme: "horoscope",
      });

      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: callbackUrl,
      });

      if (createdSessionId && setActive) {
        await setActive({
          session: createdSessionId,
          redirectUrl: "",
        });
        router.replace("/(public)/(account)/loading");
      }
    } catch (error) {
      console.error("Google login error:", error);
    }
  };

  const handleApplelogin = async () => {
    try {
      const callbackUrl = Linking.createURL("/(public)/ssp-callback", {
        scheme: "horoscope",
      });

      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_apple",
        redirectUrl: callbackUrl,
      });
      if (createdSessionId && setActive) {
        await setActive({
          session: createdSessionId,
          redirectUrl: "",
        });
        router.replace("/(public)/(account)/loading");
      }
    } catch (error) {
      console.error("Apple login error:", error);
    }
  };

  return (
    <ImageBackground
      style={styles.container}
      source={require("../../assets/images/horoscope/regBg.png")}
      resizeMode="cover"
    >
      <Text style={styles.title}>{t("authIndex.title")}</Text>

      <View style={styles.cardBox}>
        <TouchableOpacity
          onPress={handleFacebookLogin}
          style={[
            styles.card,
            {
              backgroundColor: "rgba(24, 1, 44, 0.8)",
            },
          ]}
        >
          <View style={styles.cardRow}>
            <Image
              source={require("@/assets/images/horoscope/facebookico.png")}
              style={{
                height: hp(5),
                width: hp(5),
                resizeMode: "contain",
              }}
            />
            <Text style={styles.cardText}>
              {t("authIndex.enterWith.facebook")}
            </Text>
            <Ionicons name="chevron-forward" size={24} color={Colors.border} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleGoogleLogin}
          style={[
            styles.card,
            {
              backgroundColor: "rgba(24, 1, 44, 0.8)",
            },
          ]}
        >
          <View style={styles.cardRow}>
            <Image
              source={require("@/assets/images/horoscope/googleico.png")}
              style={{
                height: hp(5),
                width: hp(5),
                resizeMode: "contain",
              }}
            />
            <Text style={styles.cardText}>
              {t("authIndex.enterWith.google")}
            </Text>
            <Ionicons name="chevron-forward" size={24} color={Colors.border} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleApplelogin}
          style={[
            styles.card,
            {
              backgroundColor: "rgba(24, 1, 44, 0.8)",
            },
          ]}
        >
          <View style={styles.cardRow}>
            <Image
              source={require("@/assets/images/horoscope/appleico2.png")}
              style={{
                height: hp(5),
                width: hp(5),
                resizeMode: "contain",
              }}
            />
            <Text style={styles.cardText}>
              {t("authIndex.enterWith.apple")}
            </Text>
            <Ionicons name="chevron-forward" size={24} color={Colors.border} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.separatorRow}>
        <View style={styles.separatorLine} />
        <Text style={styles.orText}>{t("authIndex.or")}</Text>
        <View style={styles.separatorLine} />
      </View>

      <TouchableOpacity
        style={styles.buttonContainer}
        onPress={() => router.push("/(public)/(account)/login")}
      >
        <LinearGradient
          colors={["#616FFE", "#7F1FE2"]}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          <Text
            style={[
              styles.buttonText,
              {
                fontSize: SCREEN_HEIGHT < 700 ? hp(1.8) : hp(2),
              },
            ]}
          >
            {t("authIndex.buttons.login")}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.signupRow}>
        <Text style={styles.noAccountText}>{t("authIndex.noAccount")}</Text>
        <TouchableOpacity
          onPress={() => router.push("/(public)/(account)/register")}
          style={styles.signupButton}
        >
          <Text style={styles.signupText}>{t("authIndex.buttons.signup")}</Text>
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

export default Index;

const styles = StyleSheet.create({
  container: {
    justifyContent: "flex-end",
    alignItems: "center",
    flex: 1,
    paddingBottom: hp(10),
    fontFamily: "Rubik_400Regular",
  },
  title: {
    color: "#fff",
    fontSize: hp(4),
    fontWeight: "600",
    fontFamily: "Rubik_600SemiBold",
  },
  cardBox: {
    paddingVertical: 20,
    gap: 20,
  },
  card: {
    justifyContent: "center",
    opacity: 0.9,
    borderRadius: 16,
    height: hp(8),
    width: wp(85),
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardText: {
    fontSize: 17,
    fontWeight: "600",
    color: Colors.border,
  },
  buttonContainer: {
    overflow: "hidden",
    width: wp(85),
    maxWidth: 400,
    minWidth: 280,
    paddingTop: hp(2.5),
    borderRadius: 16,
    alignSelf: "center",
  },
  gradient: {
    borderRadius: 16,
    paddingVertical: hp(2),
    paddingHorizontal: wp(6),
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    minHeight: hp(6),
    maxHeight: hp(8),
  },
  buttonText: {
    color: "white",
    fontSize: hp(2),
    fontWeight: "600",
    fontFamily: "Rubik_600SemiBold",
    flexShrink: 1,
    textAlign: "center",
    includeFontPadding: false,
    textAlignVertical: "center",
    paddingHorizontal: wp(2),
  },
  separatorRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: wp(100),
    paddingTop: hp(6),
    paddingHorizontal: wp(10),
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ccc",
  },
  orText: {
    marginHorizontal: wp(6),
    color: Colors.border,
    fontWeight: "300",
    fontSize: hp(1.8),
  },
  signupRow: {
    paddingTop: 20,
    flexDirection: "row",
  },
  noAccountText: {
    fontSize: hp(1.6),
    color: "#888",
    fontWeight: "400",
    paddingVertical: 10,
  },
  signupButton: {
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  signupText: {
    fontSize: hp(1.8),
    fontWeight: "600",
    color: "#C68FE6",
  },
  shadow: {
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
