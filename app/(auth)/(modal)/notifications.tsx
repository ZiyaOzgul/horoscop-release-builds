import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";

const Notifications = () => {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <View style={styles.container}>
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
      <Text style={styles.title}>{t("notifications.title")}</Text>
      <Text style={styles.text}>{t("notifications.textNull")}</Text>
    </View>
  );
};

export default Notifications;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: hp(3.2),
    paddingHorizontal: wp(5),
    position: "relative",
  },
  backButtonContainer: {
    position: "absolute",
    top: hp(3.5),
    left: wp(4),
    zIndex: 10,
  },
  title: {
    fontSize: hp(4.5),
    color: Colors.purpleColorBlack,
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
    marginBottom: hp(4),
    paddingHorizontal: hp(2),
  },
  text: {
    fontSize: hp(2.5),
    color: Colors.purpleColorBlack,
    fontFamily: "Rubik_500Medium",
    fontWeight: "500",
    marginBottom: hp(4),
    paddingHorizontal: hp(2),
  },
});
