import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { Href, useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Dimensions,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import PagerView from "react-native-pager-view";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type Slide = {
  title: string;
  text: string;
  buttonText: string;
};

const Opening: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation();

  // images kept in code (do not put requires into JSON)
  const images = useMemo(
    () => [
      require("@/assets/images/horoscope/pageScroll.png"),
      require("@/assets/images/horoscope/loveMatch.png"),
      require("@/assets/images/horoscope/handPalmitry.png"),
      require("@/assets/images/horoscope/dreamClick.png"),
      require("@/assets/images/horoscope/tarotCard.png"),
    ],
    []
  );

  // fetch slides from translations (guarded)
  const slides: Slide[] = useMemo(() => {
    const raw = t("opening.slides", { returnObjects: true }) as unknown;
    if (Array.isArray(raw)) {
      return raw.map((s: any) => ({
        title: String(s.title ?? ""),
        text: String(s.text ?? ""),
        buttonText: String(s.buttonText ?? ""),
      }));
    }
    // fallback default English copy (keeps UI functional)
    return [
      {
        title: "Cosmic Journey & Self-Discovery",
        text: "Welcome to the horoscope app — we guide you on a cosmic journey of self-discovery and enlightenment.",
        buttonText: "Check My Horoscope",
      },
      {
        title: "Find Your Love Match",
        text: "Match zodiac signs that are most compatible with you this month. Let the horoscope help you find your future partner.",
        buttonText: "Find Your Love",
      },
      {
        title: "Discover Your Future",
        text: "Our palm-reading feature offers initialized insights into your future. Scan your palm and let the stars reveal your path.",
        buttonText: "Read Your Palm",
      },
      {
        title: "Unlock Your Inner Secrets",
        text: "Discover the hidden language of your subconscious. This brief guide to dream interpretation offers insights that can transform your waking life.",
        buttonText: "Interpret My Dream",
      },
      {
        title: "Divination with Tarot Cards",
        text: "Dive into the mystical world of tarot cards. Find answers to your questions and gain deep insights about your future.",
        buttonText: "Read My Tarot",
      },
    ];
  }, [t]);

  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentPage, setCurrentPage] = useState(0);

  const renderCount = Math.min(images.length, slides.length);

  return (
    <View style={styles.wrapper}>
      <PagerView
        style={styles.pagerView}
        initialPage={0}
        onPageScroll={(e) => {
          const { position, offset } = e.nativeEvent;
          scrollX.setValue(position + offset);
        }}
        onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
      >
        {Array.from({ length: renderCount }).map((_, index) => {
          const item = slides[index];
          const imageUrl = images[index];
          return (
            <View style={styles.container} key={index}>
              <View style={styles.contentWrapper}>
                <View style={styles.imageContainer}>
                  <Image
                    source={imageUrl}
                    style={styles.imageScroll}
                    resizeMode="contain"
                  />
                </View>

                <View style={styles.textContentContainer}>
                  <View style={styles.titleBox}>
                    <Text style={styles.titleText} numberOfLines={3}>
                      {item.title}
                    </Text>
                    <Text style={styles.text} numberOfLines={5}>
                      {item.text}
                    </Text>
                  </View>

                  <View style={styles.buttonWrapper}>
                    <TouchableOpacity
                      style={styles.buttonContainer}
                      onPress={() => {
                        const routes: Href[] = [
                          "/(auth)/(tabs)/Horoscope",
                          "/(auth)/(tabs)/loveMatch",
                          "/(auth)/(tabs)/palmistry",
                          "/(auth)/(tabs)/Dream",
                          "/(auth)/(tabs)/tarot",
                        ];
                        const route = routes[index] ?? "/";
                        router.push(route);
                      }}
                    >
                      <LinearGradient
                        colors={["#5d6dfe", "#7b25e5"]}
                        style={styles.gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Text style={styles.buttonText} numberOfLines={1}>
                          {item.buttonText}
                        </Text>
                        <Ionicons
                          name="chevron-forward"
                          color={"white"}
                          size={hp(2.5)}
                          style={styles.chevronIcon}
                        />
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </PagerView>

      <View style={styles.sliderBox}>
        {Array.from({ length: renderCount }).map((_, index) => {
          const dotWidth = scrollX.interpolate({
            inputRange: [index - 1, index, index + 1],
            outputRange: [wp(2), wp(8), wp(2)],
            extrapolate: "clamp",
          });
          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                { width: dotWidth },
                currentPage === index ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          );
        })}
      </View>

      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
    </View>
  );
};

export default Opening;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#fff",
  },
  pagerView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: hp(3.8),
    paddingBottom: hp(2),
  },
  contentWrapper: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
  },
  imageContainer: {
    flex: SCREEN_HEIGHT < 700 ? 0.45 : 0.5, // Adjust for small screens
    width: wp(100),
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: wp(5),
  },
  imageScroll: {
    width: "100%",
    height: "100%",
    maxWidth: wp(90),
    maxHeight: hp(45),
  },
  textContentContainer: {
    flex: 0.5,
    width: wp(100),
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: hp(2),
    minHeight: hp(25),
  },
  titleBox: {
    width: wp(85),
    alignItems: "center",
    paddingHorizontal: wp(5),
    marginTop: hp(2),
    flex: 1,
    justifyContent: "center",
  },
  titleText: {
    fontSize: SCREEN_HEIGHT < 700 ? hp(3.2) : hp(4),
    color: Colors.purpleColorBlack,
    textAlign: "center",
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "700",
    marginBottom: hp(1),
  },
  text: {
    fontSize: SCREEN_HEIGHT < 700 ? hp(1.8) : hp(2),
    color: "#000",
    fontFamily: "Rubik_400Regular",
    textAlign: "center",
    lineHeight: SCREEN_HEIGHT < 700 ? hp(2.3) : hp(2.8),
  },
  buttonWrapper: {
    width: wp(100),
    alignItems: "center",
    justifyContent: "center",
    marginTop: hp(2),
  },
  buttonContainer: {
    borderRadius: 35,
    overflow: "hidden",
    width: wp(80),
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  gradient: {
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(4),
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    flexDirection: "row",
    position: "relative",
  },
  buttonText: {
    color: "white",
    fontSize: SCREEN_HEIGHT < 700 ? hp(2) : hp(2.3),
    fontFamily: "Rubik_600SemiBold",
    textAlign: "center",
    paddingRight: wp(8), // Space for chevron
  },
  chevronIcon: {
    position: "absolute",
    right: wp(4),
  },
  sliderBox: {
    flexDirection: "row",
    alignSelf: "center",
    paddingBottom: hp(3),
    paddingTop: hp(1),
  },
  dot: {
    height: hp(0.4),
    borderRadius: 5,
    marginHorizontal: 5,
    backgroundColor: "#ccc",
  },
  activeDot: {
    backgroundColor: Colors.purpleColorBlack,
  },
  inactiveDot: {
    backgroundColor: "#ccc",
  },
});
