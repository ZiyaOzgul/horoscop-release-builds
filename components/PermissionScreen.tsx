import { Colors } from "@/constants/Colors";
import { PermissionResponse } from "expo-camera";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

// Props interface tanımı
interface PermissionScreenProps {
  onRequestPermission?: () => Promise<PermissionResponse>;
}
const PermissionScreen: React.FC<PermissionScreenProps> = ({
  onRequestPermission,
}) => {
  const router = useRouter();
  const { t } = useTranslation();

  const handleSubmit = async () => {
    try {
      if (onRequestPermission) {
        // Expo camera hook'undan gelen fonksiyonu kullan
        const result = await onRequestPermission();
        console.log("Permission result:", result);
        // Izin başarılı ise ana component otomatik olarak güncellenecek
      } else {
        // Fallback - platform kontrolü ile
        if (Platform.OS === "android") {
          const PermissionsAndroid = require("react-native").PermissionsAndroid;
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.CAMERA,
            {
              title: t("photo.permission.title"),
              message: t("photo.permission.message"),
              buttonNeutral: t("photo.permission.buttonNeatural"),
              buttonNegative: t("photo.permission.buttonNegative"),
              buttonPositive: t("photo.permission.buttonPositive"),
            }
          );
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            console.log("permission granted");
            // Izin verildikten sonra ana ekrana geri dön veya yenile
            router.replace("/"); // veya uygun route
          } else {
            console.log("camera permission denied");
          }
        } else {
          // iOS için expo-camera permission sistemi kullanılmalı
          console.log("iOS permission handling should be done via expo-camera");
        }
      }
    } catch (error) {
      console.log("Permission error:", error);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <Text style={styles.palmistryText}>{t("photo.permissionText")}</Text>
        <Image
          source={require("@/assets/images/horoscope/handPalmitry.png")}
          style={styles.image}
          resizeMode="cover"
        />
        <TouchableOpacity style={styles.buttonContainer} onPress={handleSubmit}>
          <LinearGradient
            colors={["#724cfd", "#bb38f6"]}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.buttonText}>{t("photo.give")}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
    </SafeAreaProvider>
  );
};

export default PermissionScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  palmistryText: {
    paddingHorizontal: wp(10),
    marginTop: hp(10),
    fontFamily: "Rubik_600SemiBold",
    fontSize: hp(2.3),
    fontWeight: "600",
    textAlign: "center",
    color: Colors.purpleColorBlack,
  },
  image: {
    marginVertical: hp(4),
    width: wp(80),
    height: hp(40),
  },
  buttonContainer: {
    borderRadius: 10,
    overflow: "hidden",
    width: wp(80),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    elevation: 3,
    marginTop: hp(2),
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
