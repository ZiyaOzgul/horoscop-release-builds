import { Colors } from "@/constants/Colors";
import { useAppDispatch } from "@/redux/hooks";
import { setSelectedLoveMatch } from "@/redux/horoscopeSlicer";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  ImageSourcePropType,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";

type ZodiacItem = {
  photoData: ImageSourcePropType;
  zodiacName: string;
  id: string;
};

const LoveMatch: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const zodiacImages = useMemo(
    () => [
      require("@/assets/images/horoscope/signs/aries.png"),
      require("@/assets/images/horoscope/signs/taurus.png"),
      require("@/assets/images/horoscope/signs/gemini.png"),
      require("@/assets/images/horoscope/signs/cancer.png"),
      require("@/assets/images/horoscope/signs/leo.png"),
      require("@/assets/images/horoscope/signs/virgo.png"),
      require("@/assets/images/horoscope/signs/libra.png"),
      require("@/assets/images/horoscope/signs/scorpio.png"),
      require("@/assets/images/horoscope/signs/sagittarius.png"),
      require("@/assets/images/horoscope/signs/capricorn.png"),
      require("@/assets/images/horoscope/signs/aquarius.png"),
      require("@/assets/images/horoscope/signs/pisces.png"),
    ],
    []
  );

  // get localized zodiac names from translations; guarded
  const zodiacNames: string[] = useMemo(() => {
    const raw = t("loveMatch.zodiacNames", { returnObjects: true }) as unknown;
    if (Array.isArray(raw)) {
      return raw.map((s) => String(s ?? ""));
    }
    // fallback English names if translations missing
    return [
      "Aries",
      "Taurus",
      "Gemini",
      "Cancer",
      "Leo",
      "Virgo",
      "Libra",
      "Scorpio",
      "Sagittarius",
      "Capricorn",
      "Aquarius",
      "Pisces",
    ];
  }, [t]);

  // merge images + names into zodiacData safe array
  const zodiacData: ZodiacItem[] = useMemo(() => {
    const length = Math.min(zodiacImages.length, zodiacNames.length);
    return Array.from({ length }).map((_, i) => ({
      photoData: zodiacImages[i],
      zodiacName: zodiacNames[i],
      id: zodiacNames[i], // Use zodiac name as base ID
    }));
  }, [zodiacImages, zodiacNames]);

  const [selectedFirstZodiac, setSelectedFirstZodiac] =
    useState<ZodiacItem | null>(null);
  const [selectedSecondZodiac, setSelectedSecondZodiac] =
    useState<ZodiacItem | null>(null);

  const handleZodiacPress = (item: ZodiacItem) => {
    // Now we allow same zodiac to be selected twice
    // Just fill first slot, then second slot
    if (!selectedFirstZodiac) {
      // Add unique identifier for first selection
      setSelectedFirstZodiac({ ...item, id: `${item.zodiacName}_first` });
    } else if (!selectedSecondZodiac) {
      // Add unique identifier for second selection
      setSelectedSecondZodiac({ ...item, id: `${item.zodiacName}_second` });
    } else {
      // Both slots filled - optionally replace the first one or do nothing
      // Option 1: Replace first slot (cycling behavior)
      setSelectedFirstZodiac({ ...item, id: `${item.zodiacName}_first` });
      setSelectedSecondZodiac(null);

      // Option 2: Do nothing (uncomment this and comment above 2 lines)
      // return;
    }
  };

  // reanimated entrance
  const translateY = useSharedValue(-60);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withTiming(0, {
      duration: 500,
      easing: Easing.out(Easing.exp),
    });
    opacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.ease),
    });
  }, [opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const renderZodiacItem = ({ item }: { item: ZodiacItem }) => {
    // Check if this zodiac is selected in either slot
    const isSelectedFirst = selectedFirstZodiac?.zodiacName === item.zodiacName;
    const isSelectedSecond =
      selectedSecondZodiac?.zodiacName === item.zodiacName;

    // Show different visual feedback based on selection
    const selectionCount =
      (isSelectedFirst ? 1 : 0) + (isSelectedSecond ? 1 : 0);

    return (
      <TouchableOpacity onPress={() => handleZodiacPress(item)}>
        <View
          style={[
            styles.zodiacView,
            selectionCount > 0 && styles.selectedItem,
            selectionCount === 2 && styles.doubleSelected, // Both slots use this zodiac
          ]}
        >
          <Image
            source={item.photoData}
            resizeMode="cover"
            style={styles.zodiacImage}
          />
          <Text
            style={[
              styles.zodiacName,
              selectionCount > 0 && styles.selectedZodiacText,
            ]}
          >
            {item.zodiacName}
          </Text>
          {selectionCount > 0 && (
            <View style={styles.selectionBadge}>
              <Text style={styles.selectionBadgeText}>
                {selectionCount === 2 ? "2x" : "✓"}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const handleSubmit = (data: ZodiacItem[]) => {
    dispatch(setSelectedLoveMatch(data));
    router.push("/(auth)/(modal)/resultLoveMatch");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("loveMatch.title")}</Text>

      <Animated.View style={[styles.selectedContainer, animatedStyle]}>
        {/* First slot */}
        {selectedFirstZodiac == null ? (
          <View style={styles.emptySlot}>
            <Image
              source={require("@/assets/images/horoscope/signs/heart.png")}
              style={styles.selectedZodiacImage}
              resizeMode="cover"
            />
            <Text style={styles.slotLabel}>1</Text>
          </View>
        ) : (
          <View
            style={{ flexDirection: "column", gap: 6, position: "relative" }}
          >
            <TouchableOpacity
              onPress={() => setSelectedFirstZodiac(null)}
              style={{
                backgroundColor: "#7b25e5",
                alignItems: "center",
                justifyContent: "center",
                position: "absolute",
                top: hp(-0.4),
                right: wp(2),
                borderRadius: 999,
                zIndex: 12,
              }}
            >
              <Ionicons size={hp(3.4)} color={"#fff"} name="close" />
            </TouchableOpacity>

            <Image
              style={styles.selectedZodiacImage}
              resizeMode="cover"
              source={selectedFirstZodiac.photoData}
            />
            <Text style={styles.selectedZodiacName}>
              {selectedFirstZodiac.zodiacName}
            </Text>
          </View>
        )}

        {/* heart between if both selected */}
        {selectedFirstZodiac !== null && selectedSecondZodiac !== null ? (
          <Image
            style={{ height: hp(4), width: hp(4) }}
            resizeMode="cover"
            source={require("@/assets/images/horoscope/love.png")}
          />
        ) : (
          <Ionicons name="heart" size={hp(4)} color="#ddd" />
        )}

        {/* Second slot */}
        {selectedSecondZodiac == null ? (
          <View style={styles.emptySlot}>
            <Image
              source={require("@/assets/images/horoscope/signs/heart.png")}
              style={styles.selectedZodiacImage}
              resizeMode="cover"
            />
            <Text style={styles.slotLabel}>2</Text>
          </View>
        ) : (
          <View
            style={{ flexDirection: "column", gap: 6, position: "relative" }}
          >
            <TouchableOpacity
              onPress={() => setSelectedSecondZodiac(null)}
              style={{
                backgroundColor: "#7b25e5",
                alignItems: "center",
                justifyContent: "center",
                position: "absolute",
                top: hp(-0.4),
                right: wp(2),
                borderRadius: 999,
                zIndex: 12,
              }}
            >
              <Ionicons size={hp(3.4)} color={"#fff"} name="close" />
            </TouchableOpacity>

            <Image
              style={styles.selectedZodiacImage}
              resizeMode="cover"
              source={selectedSecondZodiac.photoData}
            />
            <Text style={styles.selectedZodiacName}>
              {selectedSecondZodiac.zodiacName}
            </Text>
          </View>
        )}
      </Animated.View>

      {selectedFirstZodiac !== null && selectedSecondZodiac !== null ? (
        <TouchableOpacity
          style={styles.buttonContainer}
          onPress={() =>
            handleSubmit([selectedFirstZodiac, selectedSecondZodiac])
          }
        >
          <LinearGradient
            colors={["#724cfd", "#bb38f6"]}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.buttonText}>{t("loveMatch.button")}</Text>
          </LinearGradient>
        </TouchableOpacity>
      ) : (
        <Text style={styles.text}>{t("loveMatch.chooseZodiacs")}</Text>
      )}

      <View style={styles.flatListContainer}>
        <Image
          source={require("@/assets/images/horoscope/starsBg.png")}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
        <Animated.FlatList
          entering={FadeInDown.delay(100).springify()}
          data={zodiacData}
          keyExtractor={(item) => item.zodiacName}
          numColumns={3}
          contentContainerStyle={{
            paddingVertical: hp(2),
          }}
          renderItem={renderZodiacItem}
          persistentScrollbar={true}
        />
      </View>

      <LinearGradient
        colors={["transparent", "#fff"]}
        style={styles.fadeOverlay}
        pointerEvents="none"
      />

      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
    </View>
  );
};

export default LoveMatch;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: hp(3),
    paddingBottom: hp(3.2),
    paddingHorizontal: wp(5),
    backgroundColor: "#fff",
  },
  title: {
    color: Colors.purpleColorBlack,
    fontSize: hp(4.1),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
    textAlign: "center",
  },
  selectedContainer: {
    flexDirection: "row",
    height: hp(27),
    alignItems: "center",
    justifyContent: "center",
    gap: hp(4),
  },
  selectedZodiacImage: {
    width: hp(16),
    height: hp(16),
  },
  text: {
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
    fontSize: hp(2.6),
    color: Colors.purpleColorBlack,
    textAlign: "center",
    marginBottom: hp(5.2),
  },
  zodiacView: {
    height: hp(15.5),
    width: hp(13),
    gap: 4,
    borderRadius: 16,
    overflow: "hidden",
    alignItems: "center",
    position: "relative",
  },
  zodiacImage: {
    height: hp(12),
    width: hp(12),
  },
  zodiacName: {
    fontFamily: "Rubik_400Regular",
    fontSize: hp(2.1),
    color: Colors.purpleColorBlack,
    textAlign: "center",
    marginTop: hp(0.5),
  },
  fadeOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
  },
  selectedZodiacName: {
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
    fontSize: hp(2.6),
    color: Colors.purpleColorBlack,
    textAlign: "center",
  },
  selectedItem: {
    backgroundColor: "#7b25e599",
    margin: hp(0.1),
  },
  doubleSelected: {
    backgroundColor: "#9b45ff",
    borderWidth: 2,
    borderColor: "#724cfd",
  },
  selectedZodiacText: {
    color: "#fff",
    fontWeight: "600",
  },
  buttonContainer: {
    borderRadius: 10,
    overflow: "hidden",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    elevation: 3,
    marginBottom: hp(4),
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
  emptySlot: {
    position: "relative",
  },
  slotLabel: {
    position: "absolute",
    bottom: hp(1),
    right: wp(2),
    backgroundColor: Colors.purpleColorBlack,
    color: "#fff",
    fontFamily: "Rubik_600SemiBold",
    fontSize: hp(1.6),
    paddingHorizontal: hp(1),
    paddingVertical: hp(0.3),
    borderRadius: hp(1),
  },
  selectionBadge: {
    position: "absolute",
    top: hp(0.5),
    right: wp(1),
    backgroundColor: "#724cfd",
    borderRadius: hp(1.5),
    paddingHorizontal: hp(0.8),
    paddingVertical: hp(0.3),
    minWidth: hp(2.5),
    alignItems: "center",
    justifyContent: "center",
  },
  selectionBadgeText: {
    color: "#fff",
    fontSize: hp(1.4),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
  },
  flatListContainer: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 15,
    flex: 1,
    marginHorizontal: -wp(5),
    paddingHorizontal: wp(5),
  },
  backgroundImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    left: 0,
    right: 0,
    tintColor: Colors.purpleColorBlack,
    opacity: 1,
  },
});
