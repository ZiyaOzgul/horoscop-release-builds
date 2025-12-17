import { store } from "@/redux/horoscopeStore";
import { tokenCache } from "@/utils/cache";
import { ClerkLoaded, ClerkProvider, useAuth } from "@clerk/clerk-expo";
import {
  Rubik_400Regular,
  Rubik_500Medium,
  Rubik_600SemiBold,
  Rubik_700Bold,
  useFonts,
} from "@expo-google-fonts/rubik";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { Slot, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { LogBox, Platform } from "react-native";
import mobileAds, { MaxAdContentRating } from "react-native-google-mobile-ads";
import Purchases, { LOG_LEVEL } from "react-native-purchases";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider } from "react-redux";
import "../locales/i18n.config";

const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
const revenueCatApiKey = process.env.EXPO_PUBLIC_REVENUE_CAT_API_KEY;

if (!clerkPublishableKey) {
  throw new Error("Missing publishable key");
}
if (!revenueCatApiKey) {
  throw new Error("Missing Revenue cat key");
}

LogBox.ignoreLogs(["Clerk: Clerk has been loaded with development keys."]);

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

const InitialLayout = () => {
  const [fontsLoaded] = useFonts({
    Rubik_400Regular,
    Rubik_500Medium,
    Rubik_600SemiBold,
    Rubik_700Bold,
  });

  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  // Initialize AdMob
  useEffect(() => {
    console.log("🚀 Initializing AdMob...");

    mobileAds()
      .initialize()
      .then((adapterStatuses) => {
        console.log("✅ AdMob initialized successfully:", adapterStatuses);
      })
      .catch((error) => {
        console.error("❌ AdMob initialization error:", error);
      });

    mobileAds()
      .setRequestConfiguration({
        maxAdContentRating: MaxAdContentRating.PG,
        tagForChildDirectedTreatment: false,
        tagForUnderAgeOfConsent: false,
      })
      .then(() => {
        console.log("✅ AdMob request configuration set");
      });
  }, []);

  // Handle authentication routing
  useEffect(() => {
    if (!isLoaded) {
      console.log("Auth not loaded yet:", isLoaded);
      return;
    }

    const inAuthGroup = segments[0] === "(auth)";

    if (isSignedIn && !inAuthGroup) {
      console.log(
        "User signed in, redirecting to loading...",
        "isSignedIn:",
        isSignedIn,
        "inAuthGroup:",
        inAuthGroup
      );
      router.replace("/(public)/(account)/loading");
    } else if (!isSignedIn && inAuthGroup) {
      console.log(
        "User not signed in, redirecting to public...",
        "isSignedIn:",
        isSignedIn,
        "inAuthGroup:",
        inAuthGroup
      );
      router.replace("/(public)");
    }
  }, [isSignedIn, isLoaded]);

  // Initialize RevenueCat
  useEffect(() => {
    Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

    if (Platform.OS === "ios") {
      Purchases.configure({ apiKey: revenueCatApiKey });
      console.log("✅ RevenueCat configured for iOS");
    } else if (Platform.OS === "android") {
      Purchases.configure({ apiKey: revenueCatApiKey });
      console.log("✅ RevenueCat configured for Android");
    }
  }, []);

  // Hide splash screen when everything is ready
  useEffect(() => {
    if (fontsLoaded && isLoaded) {
      const timer = setTimeout(() => {
        SplashScreen.hideAsync()
          .then(() => console.log("✅ Splash screen hidden"))
          .catch((error) => console.error("❌ Error hiding splash:", error));
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [fontsLoaded, isLoaded]);

  return (
    <SafeAreaProvider>
      <Slot />
    </SafeAreaProvider>
  );
};

export default function RootLayout() {
  return (
    <ClerkProvider
      publishableKey={clerkPublishableKey!}
      tokenCache={tokenCache}
    >
      <ClerkLoaded>
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          <Provider store={store}>
            <InitialLayout />
          </Provider>
        </ConvexProviderWithClerk>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
