import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
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

const Languages = () => {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [isChanging, setIsChanging] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);

  const changeLanguage = async (languageCode: string) => {
    if (selectedLanguage === languageCode || isChanging) return;

    try {
      setIsChanging(true);
      setSelectedLanguage(languageCode);

      await i18n.changeLanguage(languageCode);

      setTimeout(() => {
        setIsChanging(false);
        // Alert.alert(
        //   t("language.success.title"),
        //   t("language.success.message"),
        //   [{ text: t("common.done"), style: "default" }]
        // );
      }, 300);
    } catch (error) {
      console.error("Error changing language:", error);
      setIsChanging(false);
      setSelectedLanguage(i18n.language);

      Alert.alert(t("language.error.title"), t("language.error.message"), [
        { text: t("common.cancel"), style: "cancel" },
      ]);
    }
  };

  const languages = [
    {
      code: "en",
      name: "English",
      nativeName: "English",
      flag: require("@/assets/images/horoscope/english.png"),
    },
    {
      code: "tr",
      name: "Turkish",
      nativeName: "Türkçe",
      flag: require("@/assets/images/horoscope/turkey.png"),
    },
    {
      code: "sp",
      name: "Spanish",
      nativeName: "Español",
      flag: require("@/assets/images/horoscope/spainFlag.png"),
    },
    {
      code: "ja",
      name: "Japanese",
      nativeName: "日本語",
      flag: require("@/assets/images/horoscope/jpFlag.png"),
    },
    {
      code: "ru",
      name: "Russian",
      nativeName: "Русский",
      flag: require("@/assets/images/horoscope/ruFlag.png"),
    },
  ];

  return (
    <ScrollView
      style={{
        flex: 1,
      }}
    >
      {/* Back Button */}
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backButtonContainer}
          onPress={() => router.dismiss()}
          disabled={isChanging}
        >
          <Ionicons
            color={Colors.purpleColorBlack}
            size={hp(3.4)}
            name="chevron-back"
          />
        </TouchableOpacity>

        {/* Title */}
        <Text style={styles.title}>{t("language.title")}</Text>

        {/* Subtitle Section */}
        <View style={styles.accountTextBox}>
          <Text style={styles.subtitle}>{t("language.select")}</Text>
        </View>

        {/* Language Options */}
        <View style={styles.buttonBox}>
          {languages.map((language) => {
            const isActive = selectedLanguage === language.code;
            const isCurrentlyChanging = isChanging && isActive;

            return (
              <TouchableOpacity
                key={language.code}
                style={[styles.buttonCont, isActive && styles.buttonContActive]}
                onPress={() => changeLanguage(language.code)}
                disabled={isChanging}
                activeOpacity={0.7}
              >
                <View style={styles.languageInfo}>
                  <Text
                    style={[
                      styles.buttonText,
                      isActive && styles.buttonTextActive,
                    ]}
                  >
                    {language.nativeName}
                  </Text>
                  <Text style={styles.languageSubtext}>{language.name}</Text>

                  {isActive && !isChanging && (
                    <View style={styles.activeBadge}>
                      <Ionicons
                        name="checkmark-circle"
                        size={hp(2)}
                        color={Colors.purpleColorBlack}
                      />
                      <Text style={styles.activeBadgeText}>
                        {t("language.active")}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.rightSection}>
                  {isCurrentlyChanging ? (
                    <ActivityIndicator
                      size="small"
                      color={Colors.purpleColorBlack}
                    />
                  ) : (
                    <View style={styles.flagContainer}>
                      <Image
                        source={language.flag}
                        resizeMode="cover"
                        style={styles.flag}
                      />
                      {isActive && (
                        <View style={styles.checkmarkOverlay}>
                          <Ionicons
                            name="checkmark-circle"
                            size={hp(3)}
                            color="#4CAF50"
                          />
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons
            name="information-circle-outline"
            size={hp(2.5)}
            color={Colors.purpleColorBlack}
          />
          <Text style={styles.infoText}>{t("language.info")}</Text>
        </View>

        {/* App Version (Optional) */}
        {/* <View style={styles.footer}>
        <Text style={styles.footerText}>
          {t("language.currentLanguage")}: {t(`language.${selectedLanguage}`)}
        </Text>
      </View> */}

        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="dark-content"
        />
      </View>
    </ScrollView>
  );
};

export default Languages;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: hp(3.8),
    paddingVertical: hp(3.2),
    paddingHorizontal: wp(5),
    position: "relative",
    backgroundColor: "#fff",
  },
  backButtonContainer: {
    position: "absolute",
    top: hp(3.8),
    left: wp(4),
    zIndex: 10,
    backgroundColor: "#fff",
    borderRadius: hp(2),
    padding: hp(1),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: hp(4.6),
    color: Colors.purpleColorBlack,
    fontWeight: "600",
    fontFamily: "Rubik_600SemiBold",
    paddingTop: hp(4),
    marginBottom: hp(1),
  },
  subtitle: {
    fontSize: hp(2),
    color: "#666",
    fontFamily: "Rubik_400Regular",
  },
  accountTextBox: {
    paddingHorizontal: wp(2),
    width: wp(90),
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    paddingTop: hp(2),
    paddingBottom: hp(1.5),
  },
  buttonBox: {
    marginTop: hp(4),
    gap: hp(2),
  },
  buttonCont: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingVertical: hp(2.5),
    paddingHorizontal: wp(4),
    backgroundColor: "#f8f9fa",
    borderRadius: hp(2),
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  buttonContActive: {
    backgroundColor: "#f0f0ff",
    borderColor: Colors.purpleColorBlack,
    shadowOpacity: 0.1,
    elevation: 4,
  },
  languageInfo: {
    flex: 1,
    gap: hp(0.3),
  },
  buttonText: {
    fontSize: hp(2.4),
    color: "#333",
    fontWeight: "600",
    fontFamily: "Rubik_600SemiBold",
  },
  buttonTextActive: {
    color: Colors.purpleColorBlack,
  },
  languageSubtext: {
    fontSize: hp(1.6),
    color: "#999",
    fontFamily: "Rubik_400Regular",
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: hp(0.5),
    marginTop: hp(0.5),
  },
  activeBadgeText: {
    fontSize: hp(1.5),
    color: Colors.purpleColorBlack,
    fontFamily: "Rubik_500Medium",
    fontWeight: "500",
  },
  rightSection: {
    justifyContent: "center",
    alignItems: "center",
    width: hp(7),
    height: hp(7),
  },
  flagContainer: {
    position: "relative",
    width: hp(7),
    height: hp(7),
  },
  flag: {
    height: "100%",
    width: "100%",
    borderRadius: hp(1),
  },
  checkmarkOverlay: {
    position: "absolute",
    bottom: -hp(0.5),
    right: -hp(0.5),
    backgroundColor: "#fff",
    borderRadius: hp(1.5),
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: hp(1.2),
    marginTop: hp(4),
    padding: hp(2),
    backgroundColor: "#f0f0ff",
    borderRadius: hp(1.5),
    borderLeftWidth: 4,
    borderLeftColor: Colors.purpleColorBlack,
  },
  infoText: {
    flex: 1,
    fontSize: hp(1.7),
    color: "#555",
    fontFamily: "Rubik_400Regular",
    lineHeight: hp(2.4),
  },
  footer: {
    marginTop: "auto",
    paddingTop: hp(2),
    alignItems: "center",
  },
  footerText: {
    fontSize: hp(1.6),
    color: "#999",
    fontFamily: "Rubik_400Regular",
  },
});
