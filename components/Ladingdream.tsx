import { Colors } from "@/constants/Colors";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { StatusBar, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";

const Ladingdream = () => {
  const translateY = useSharedValue(0);

  useEffect(() => {
    // Yukarı aşağı hareket animasyonu
    translateY.value = withRepeat(
      withTiming(-20, {
        duration: 2000, // 2 saniye yukarı
        easing: Easing.inOut(Easing.ease),
      }),
      -1, // Sonsuz tekrar
      true // Reverse (yukarı-aşağı-yukarı)
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: translateY.value,
        },
      ],
    };
  });
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <View style={{ alignItems: "center" }}>
        <Animated.Image
          source={require("@/assets/images/horoscope/dreamCatch.png")}
          style={[styles.image, animatedStyle]}
          resizeMode="contain"
        />
      </View>
      <View style={{ paddingTop: hp(16), paddingBottom: hp(8) }}>
        <Text style={styles.textW}>{t("loading.loadingDreams.catch")}</Text>
        <Text style={styles.textH}>{t("loading.loadingDreams.dreams")}</Text>
      </View>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
    </View>
  );
};

export default Ladingdream;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: hp(10),
    justifyContent: "center",
    alignContent: "center",
  },
  image: {
    width: hp(30),
    height: hp(30),
  },
  textW: {
    fontSize: hp(2.8),
    fontFamily: "Rubik_400Regular",
    fontWeight: "normal",
    color: Colors.purplePalmitryBg,
    textAlign: "center",
  },
  textH: {
    fontSize: hp(4.8),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
    color: Colors.purpleColorBlack,
    textAlign: "center",
  },
});
