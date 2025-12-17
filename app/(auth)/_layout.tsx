import { Colors } from "@/constants/Colors";
import { Entypo, Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";

import { heightPercentageToDP } from "react-native-responsive-screen";

const Layout = () => {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        contentStyle: {
          backgroundColor: "#fff",
        },
        headerShown: false,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="(modal)/settings"
        options={{
          presentation: "modal",
          headerShown: false,
          title: "settings",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.dismiss()}>
              <Ionicons
                color={Colors.purpleColorBlack}
                size={heightPercentageToDP(3.4)}
                name="chevron-back"
              />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="(modal)/resultLoveMatch"
        options={{
          presentation: "modal",
          headerShown: false,
          title: "settings",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.dismiss()}>
              <Ionicons
                color={Colors.purpleColorBlack}
                size={heightPercentageToDP(3.4)}
                name="chevron-back"
              />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="(modal)/dreamResult"
        options={{
          presentation: "modal",
          headerShown: false,
          title: "",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.dismiss()}>
              <Ionicons
                color={Colors.purpleColorBlack}
                size={heightPercentageToDP(3.4)}
                name="chevron-back"
              />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={() => router.dismiss()}>
              <Entypo
                color={Colors.purpleColorBlack}
                size={heightPercentageToDP(3.4)}
                name="share"
              />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="(modal)/Languages"
        options={{
          presentation: "modal",
          headerShown: false,
          title: "languages",
        }}
      />
      <Stack.Screen
        name="(modal)/changePassword"
        options={{
          presentation: "modal",
          headerShown: false,
          title: "changePassword",
        }}
      />
      <Stack.Screen
        name="(modal)/Security"
        options={{
          presentation: "modal",
          headerShown: false,
          title: "Security",
        }}
      />
      <Stack.Screen
        name="(modal)/Social"
        options={{
          presentation: "modal",
          headerShown: false,
          title: "Social",
        }}
      />
      <Stack.Screen
        name="(modal)/notifications"
        options={{
          presentation: "modal",
          headerShown: false,
          title: "Security",
        }}
      />
      <Stack.Screen
        name="(modal)/confirmPhotoCaptured"
        options={{
          presentation: "modal",
          headerShown: false,
          title: "PhotoConfirm",
        }}
      />
      <Stack.Screen
        name="(modal)/palmAnalyse"
        options={{
          presentation: "modal",
          headerShown: false,
          title: "PalmAnalyse",
        }}
      />
      <Stack.Screen
        name="(modal)/viewPalmistry"
        options={{
          presentation: "modal",
          headerShown: false,
          title: "View Palmistry",
        }}
      />
      <Stack.Screen
        name="(modal)/viewDream"
        options={{
          presentation: "modal",
          headerShown: false,
          title: "View Dream",
        }}
      />
      <Stack.Screen
        name="(modal)/Plans"
        options={{
          presentation: "modal",
          headerShown: false,
          title: "Plans",
        }}
      />
    </Stack>
  );
};

export default Layout;
