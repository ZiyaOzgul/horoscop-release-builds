import { useAuth } from "@clerk/clerk-expo";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

/**
 * OAuth callback handler for Clerk SSO
 * This route handles the redirect from OAuth providers (Google, Facebook, Apple)
 * URL format: horoscope://ssp-callback?created_session_id=xxx&rotating_token=xxx
 *
 * Note: Clerk automatically processes the callback when the URL is opened.
 * We just need to wait for the session to be activated and then redirect.
 */
export default function SSOCallback() {
  const { isSignedIn, isLoaded } = useAuth();
  const params = useLocalSearchParams<{
    created_session_id?: string;
    rotating_token?: string;
  }>();

  useEffect(() => {
    // Clerk automatically processes the callback when this route is opened
    // We just need to wait for auth state to update and then redirect

    if (!isLoaded) {
      return; // Wait for Clerk to load
    }

    const handleRedirect = async () => {
      // Wait a bit for Clerk to process the callback and activate the session
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Check auth state again after delay
      if (isSignedIn) {
        // Session is active, redirect to loading page
        router.replace("/(public)/(account)/loading");
      } else if (params.created_session_id) {
        // We have session ID but not signed in yet - wait a bit more and try again
        await new Promise((resolve) => setTimeout(resolve, 500));
        router.replace("/(public)/(account)/loading");
      } else {
        // No session ID and not signed in - redirect to index
        router.replace("/(public)");
      }
    };

    handleRedirect();
  }, [isSignedIn, isLoaded, params.created_session_id]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
      }}
    >
      <ActivityIndicator size="large" />
    </View>
  );
}
