import { Tabs } from "expo-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Image } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { heightPercentageToDP } from "react-native-responsive-screen";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Layout = () => {
  const { t } = useTranslation();
  const translateY = useSharedValue(60);
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
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#7b25e5",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 0,
          borderTopColor: "transparent",
          elevation: 0,
          shadowColor: "transparent",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0,
          shadowRadius: 0,
          marginBottom: insets.bottom + 6,
          marginTop: 0,
          paddingTop: 0,
        },

        tabBarLabelStyle: {
          paddingVertical: heightPercentageToDP(0.8),
          fontFamily: "Rubik_400Regular",
          fontSize: heightPercentageToDP(1.1),
          textAlign: "center",
        },
        tabBarItemStyle: {
          paddingBottom: heightPercentageToDP(0.8),
        },
      }}
    >
      <Tabs.Screen
        name="Horoscope"
        options={{
          title: t("bottomBar.horoscope"),
          headerShown: false,
          tabBarIcon: ({ color, focused, size }) => (
            <Animated.View
              style={[
                {
                  height: 1,
                  justifyContent: "center",
                  paddingBottom: heightPercentageToDP(2.8),
                  alignItems: "center",
                },
                animatedStyle,
              ]}
            >
              {/* style={{
                height: 1,
                justifyContent: "center",
                paddingBottom: heightPercentageToDP(2.8),
                alignItems: "center",
              }} */}

              {focused ? (
                <Image
                  source={require("@/assets/images/horoscope/astrology.png")}
                  style={{
                    height: heightPercentageToDP(5),
                    width: heightPercentageToDP(5),
                  }}
                  resizeMode="contain"
                />
              ) : (
                <Image
                  source={require("@/assets/images/horoscope/horoscope.png")}
                  style={{
                    height: heightPercentageToDP(5),
                    width: heightPercentageToDP(5),
                  }}
                  resizeMode="contain"
                />
              )}
            </Animated.View>
          ),
        }}
      />
      <Tabs.Screen
        name="loveMatch"
        options={{
          title: t("bottomBar.loveMatch"),
          headerShown: false,
          tabBarIcon: ({ color, focused, size }) => (
            <Animated.View
              style={[
                {
                  height: 1,
                  justifyContent: "center",
                  paddingBottom: heightPercentageToDP(2.8),
                  alignItems: "center",
                },
                animatedStyle,
              ]}
            >
              {focused ? (
                <Image
                  source={require("@/assets/images/horoscope/love.png")}
                  style={{
                    height: heightPercentageToDP(5),
                    width: heightPercentageToDP(5),
                  }}
                  resizeMode="contain"
                />
              ) : (
                <Image
                  source={require("@/assets/images/horoscope/loveClick.png")}
                  style={{
                    height: heightPercentageToDP(5),
                    width: heightPercentageToDP(5),
                  }}
                  resizeMode="contain"
                />
              )}
            </Animated.View>
          ),
        }}
      />

      <Tabs.Screen
        name="palmistry"
        options={{
          title: t("bottomBar.palmistry"),
          headerShown: false,
          tabBarIcon: ({ color, focused, size }) => (
            <Animated.View
              style={[
                {
                  height: 1,
                  justifyContent: "center",
                  paddingBottom: heightPercentageToDP(2.8),
                  alignItems: "center",
                },
                animatedStyle,
              ]}
            >
              {focused ? (
                <Image
                  source={require("@/assets/images/horoscope/handClick.png")}
                  style={{
                    height: heightPercentageToDP(5),
                    width: heightPercentageToDP(5),
                  }}
                  resizeMode="contain"
                />
              ) : (
                <Image
                  source={require("@/assets/images/horoscope/hand.png")}
                  style={{
                    height: heightPercentageToDP(5),
                    width: heightPercentageToDP(5),
                  }}
                  resizeMode="contain"
                />
              )}
            </Animated.View>
          ),
        }}
      />

      <Tabs.Screen
        name="Dream"
        options={{
          title: t("bottomBar.dream"),
          headerShown: false,
          tabBarIcon: ({ color, focused, size }) => (
            <Animated.View
              style={[
                {
                  height: 1,
                  justifyContent: "center",
                  paddingBottom: heightPercentageToDP(2.8),
                  alignItems: "center",
                },
                animatedStyle,
              ]}
            >
              {focused ? (
                <Image
                  source={require("@/assets/images/horoscope/dreamClick.png")}
                  style={{
                    height: heightPercentageToDP(5),
                    width: heightPercentageToDP(5),
                  }}
                  resizeMode="contain"
                />
              ) : (
                <Image
                  source={require("@/assets/images/horoscope/dream.png")}
                  style={{
                    height: heightPercentageToDP(5),
                    width: heightPercentageToDP(5),
                  }}
                  resizeMode="contain"
                />
              )}
            </Animated.View>
          ),
        }}
      />

      <Tabs.Screen
        name="Profile"
        options={{
          title: t("bottomBar.profile"),
          headerShown: false,
          tabBarIcon: ({ color, focused, size }) => (
            <Animated.View
              style={[
                {
                  height: 1,
                  justifyContent: "center",
                  paddingBottom: heightPercentageToDP(2.8),
                  alignItems: "center",
                },
                animatedStyle,
              ]}
            >
              {focused ? (
                <Image
                  source={require("@/assets/images/horoscope/virgoClick.png")}
                  style={{
                    height: heightPercentageToDP(5),
                    width: heightPercentageToDP(5),
                  }}
                  resizeMode="contain"
                />
              ) : (
                <Image
                  source={require("@/assets/images/horoscope/virgo.png")}
                  style={{
                    height: heightPercentageToDP(5),
                    width: heightPercentageToDP(5),
                  }}
                  resizeMode="contain"
                />
              )}
            </Animated.View>
          ),
        }}
      />
    </Tabs>
  );
};

export default Layout;
