import { Colors } from "@/constants/Colors";
import React from "react";
import { useTranslation } from "react-i18next";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";

const Palmitry = () => {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("photo.title")}</Text>
      <Text style={styles.text}>{t("photo.permission")}</Text>

      <Image
        source={require("@/assets/images/horoscope/handPalmitry.png")}
        style={styles.image}
        resizeMode="cover"
      />
      <TouchableOpacity style={styles.buttonContainer}>
        <LinearGradient
          colors={["#724cfd", "#bb38f6"]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.buttonText}>{t("photo.give")}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

export default Palmitry;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingBottom: hp(3.2),
    paddingHorizontal: wp(5),
    backgroundColor: "#fff",
  },
  title: {
    color: Colors.purpleColorBlack,
    textAlign: "center",
    fontSize: hp(3.1),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
  },
  text: {
    paddingTop: hp(10),
    color: Colors.purpleColorBlack,
    textAlign: "center",
    fontSize: hp(2.1),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
  },

  image: {
    width: hp(40),
    height: hp(40),
  },

  buttonContainer: {
    borderRadius: 10,
    overflow: "hidden",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    elevation: 3,
    marginTop: hp(5),
  },
  gradient: {
    paddingVertical: hp(1.8),
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: hp(2.3),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
  },
});
