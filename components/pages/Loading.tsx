import { Colors } from "@/constants/Colors";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Purchases from "react-native-purchases";
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
  const router = useRouter();
  const { user } = useUser();
  const clerkId = user?.id;
  const [canRedirect, setCanRedirect] = useState(false);
  const [premiumChecked, setPremiumChecked] = useState(false);
  const premiumCheckRef = useRef(false);

  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);

  const userProfile = useQuery(api.users.getUserWithClerkID, { clerkId });
  const checkSubscriptionValidity = useMutation(
    api.users.checkSubscriptionValidity
  );
  const updateSubscription = useMutation(api.users.updateSubscription);

  // Timer to allow redirect after 1.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setCanRedirect(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Check premium status when user profile is loaded
  useEffect(() => {
    if (
      !clerkId ||
      userProfile === undefined ||
      premiumCheckRef.current ||
      !canRedirect
    ) {
      return;
    }

    const checkPremiumStatus = async () => {
      if (premiumCheckRef.current) return;
      premiumCheckRef.current = true;

      try {
        console.log("🔍 Checking premium subscription status...");
        
        // First, sync with RevenueCat to ensure database is up to date
        try {
          await Purchases.logIn(clerkId);
          const customerInfo = await Purchases.getCustomerInfo();
          console.log("📱 RevenueCat customer info:", customerInfo);

          const isPremiumActive =
            typeof customerInfo.entitlements.active["Premium"] !== "undefined";

          if (isPremiumActive) {
            const expirationDate =
              customerInfo.entitlements.active["Premium"]?.expirationDate;

            console.log("✅ RevenueCat shows premium subscription active");
            console.log("📅 Expiration date:", expirationDate);

            // Update database with RevenueCat status
            await updateSubscription({
              clerkId: clerkId,
              userType: "premium",
              subscriptionStatus: "active",
              revenueCatUserId: customerInfo.originalAppUserId,
              subscriptionEndDate: expirationDate
                ? new Date(expirationDate).getTime()
                : undefined,
            });
            console.log("✅ Database updated with premium status");
          } else {
            console.log("ℹ️ RevenueCat shows no active premium subscription");
          }
        } catch (revenueCatError) {
          console.error("⚠️ Error syncing with RevenueCat:", revenueCatError);
          // Continue with database check even if RevenueCat fails
        }

        // Then check subscription validity in database
        const result = await checkSubscriptionValidity({ clerkId });
        
        if (result?.wasDowngraded) {
          console.log("⚠️ User subscription expired - downgraded to normal");
        } else if (result?.isValid) {
          console.log("✅ Premium subscription is valid in database");
        } else {
          console.log("ℹ️ User is on free plan");
        }
        
        setPremiumChecked(true);
      } catch (error) {
        console.error("❌ Error checking premium status:", error);
        // Continue even if check fails
        setPremiumChecked(true);
      }
    };

    // Set a timeout to ensure we don't wait forever
    const timeout = setTimeout(() => {
      if (!premiumChecked) {
        console.log("⏱️ Premium check timeout - continuing anyway");
        setPremiumChecked(true);
      }
    }, 3000); // 3 second timeout

    checkPremiumStatus();

    return () => clearTimeout(timeout);
  }, [clerkId, userProfile, canRedirect, checkSubscriptionValidity, updateSubscription, premiumChecked]);

  useEffect(() => {
    console.log("=== LOADING PAGE DEBUG ===");
    console.log("user:", user);
    console.log("clerkId:", clerkId);
    console.log("userProfile:", userProfile);
    console.log("userProfile type:", typeof userProfile);
    console.log("canRedirect:", canRedirect);
    console.log("premiumChecked:", premiumChecked);

    if (!user) {
      console.log("❌ No user found, waiting...");
      return;
    }

    // userProfile undefined ise henüz Convex'ten veri gelmiyor
    if (userProfile === undefined) {
      console.log("⏳ userProfile is undefined - still loading from Convex");
      return;
    }

    // Wait for the 1.5 second timer before redirecting
    if (!canRedirect) {
      console.log("⏳ Waiting for 1.5 seconds before redirect...");
      return;
    }

    // Wait for premium check to complete (or timeout after 2 seconds)
    if (!premiumChecked && userProfile) {
      console.log("⏳ Waiting for premium status check...");
      return;
    }

    if (userProfile === null) {
      console.log("✅ userProfile is null - redirecting to registerDetails");
      router.replace("/(public)/(account)/registerDetails");
    } else if (userProfile) {
      console.log("✅ userProfile found:", userProfile);

      const {
        firstName,
        lastName,
        birthDate,
        gender,
        city,
        sunSign,
        moonSign,
        ascendant,
        element,
        polarity,
        modality,
      } = userProfile;

      const fields = [
        firstName,
        lastName,
        birthDate,
        gender,
        city,
        sunSign,
        moonSign,
        ascendant,
        element,
        polarity,
        modality,
      ];

      console.log("Field values:", {
        firstName,
        lastName,
        birthDate,
        gender,
        city,
        sunSign,
        moonSign,
        ascendant,
        element,
        polarity,
        modality,
      });

      const isIncomplete = fields.some(
        (field) => field == null || field === ""
      );

      console.log("Is profile incomplete?", isIncomplete);

      if (isIncomplete) {
        console.log("➡️ Redirecting to registerDetails - profile incomplete");
        router.replace("/(public)/(account)/registerDetails");
      } else {
        console.log("➡️ Redirecting to loginDirector - profile complete");
        router.replace("/(public)/(account)/loginDirector");
      }
    }
  }, [
    user,
    userProfile,
    router,
    clerkId,
    canRedirect,
    premiumChecked,
    checkSubscriptionValidity,
  ]);

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
      style={styles.container}
      source={require("@/assets/images/horoscope/bg.png")}
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <View style={{ alignItems: "center" }}>
        <Animated.Image
          source={require("@/assets/images/horoscope/icon.png")}
          style={[styles.image, animatedStyle]}
          resizeMode="cover"
        />
      </View>

      <View style={{ paddingTop: hp(16), paddingBottom: hp(8) }}>
        <Text style={styles.textW}>{t("loading.welcome.welcome")}</Text>
        <Text style={styles.textH}>{t("loading.welcome.horoscope")}</Text>
      </View>

      <View style={styles.loadingIndicatorContainer}>
        <ActivityIndicator size="large" color={Colors.purpleColor} />
      </View>
      {/* Debug bilgisi - production'da kaldırabilirsiniz */}
      {__DEV__ && (
        <View style={{ position: "absolute", bottom: 50, left: 20, right: 20 }}>
          <Text style={{ color: "white", fontSize: 12, textAlign: "center" }}>
            User: {user ? "✓" : "✗"} | Profile:{" "}
            {userProfile === undefined
              ? "Loading..."
              : userProfile === null
                ? "Null"
                : "Found"}{" "}
            | Timer: {canRedirect ? "Ready" : "Waiting..."}
          </Text>
        </View>
      )}
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
    width: hp(25),
    height: hp(25),
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
    color: "#fff",
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
