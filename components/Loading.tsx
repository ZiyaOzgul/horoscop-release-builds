import { Colors } from "@/constants/Colors";
import { default as React, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  ImageBackground,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";

const Loading = () => {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.3, {
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, [scale]);

  const { t } = useTranslation();

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <ImageBackground
      source={require("@/assets/images/horoscope/bg.png")}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={{ alignItems: "center" }}>
        <Animated.Image
          source={require("@/assets/images/horoscope/icon.png")}
          style={[styles.image, animatedStyle]}
          resizeMode="contain"
        />
      </View>

      <View style={{ paddingTop: hp(16), paddingBottom: hp(8) }}>
        <Text style={styles.textW}>{t("loading.loadingLoveMatch.calc")}</Text>
        <Text style={styles.textH}>{t("loading.loadingLoveMatch.loveM")}</Text>
      </View>

      <View style={styles.loadingIndicatorContainer}>
        <ActivityIndicator size="large" color={Colors.purpleColor} />
      </View>

      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
    </ImageBackground>
  );
};

export default Loading;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: hp(10),
    justifyContent: "flex-start",
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
    color: Colors.purpleColor,
    textAlign: "center",
  },
  textH: {
    fontSize: hp(4.8),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
    color: Colors.purpleColorBlack,
    textAlign: "center",
  },
  loadingIndicatorContainer: {
    position: "absolute",
    bottom: hp(5),
    left: 0,
    right: 0,
    alignItems: "center",
  },
});
