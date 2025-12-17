import { Colors } from "@/constants/Colors";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
const PhotoConfirmScreen = () => {
  const { photoUri } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const handleRetake = () => {
    // Kamera sayfasına geri dön
    router.back();
  };

  const handleConfirm = () => {
    // Fotoğrafı onayla ve bir sonraki sayfaya geç
    // Burada fotoğrafı işleyebilir, kaydedebilin veya analiz sayfasına gönderebilirsiniz
    console.log("Photo confirmed:", photoUri);

    // Örnek: Analiz sayfasına yönlendir
    router.push({
      pathname: "/(auth)/(modal)/palmAnalyse",
      params: { photoUri: photoUri },
    });
  };

  if (!photoUri) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
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
          <Text style={styles.errorText}>{t("confirmPhoto.notFound")}</Text>
          <TouchableOpacity
            style={styles.buttonContainer}
            onPress={() => router.back()}
          >
            <LinearGradient
              colors={["#724cfd", "#bb38f6"]}
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.buttonText}>{t("confirmPhoto.back")}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
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
        <Text style={styles.title}>{t("confirmPhoto.check")}</Text>

        <View style={styles.imageContainer}>
          <Image
            source={{ uri: photoUri as string }}
            style={styles.capturedImage}
            resizeMode="cover"
          />
        </View>

        <Text style={styles.instruction}>{t("confirmPhoto.inst")}</Text>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.buttonContainer, styles.retakeButton]}
            onPress={handleRetake}
          >
            <View style={styles.retakeGradient}>
              <MaterialIcons
                name="camera-alt"
                size={24}
                color={Colors.purpleColorBlack}
              />
              <Text style={styles.retakeText}> {t("confirmPhoto.retake")}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.buttonContainer, styles.confirmButton]}
            onPress={handleConfirm}
          >
            <LinearGradient
              colors={["#724cfd", "#bb38f6"]}
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialIcons name="check" size={24} color="white" />
              <Text style={styles.buttonText}>{t("confirmPhoto.submit")}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default PhotoConfirmScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#fff",
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
    marginTop: hp(2),
    fontFamily: "Rubik_600SemiBold",
    fontSize: hp(2.8),
    fontWeight: "600",
    textAlign: "center",
    color: Colors.purpleColorBlack,
    marginBottom: hp(3),
  },
  imageContainer: {
    width: wp(85),
    height: hp(50),
    borderRadius: 15,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    elevation: 8,
    marginBottom: hp(3),
  },
  capturedImage: {
    width: "100%",
    height: "100%",
  },
  overlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  handOutline: {
    width: wp(60),
    height: hp(40),
    tintColor: "rgba(255, 255, 255, 0.3)",
  },
  instruction: {
    paddingHorizontal: wp(5),
    fontFamily: "Rubik_400Regular",
    fontSize: hp(1.8),
    textAlign: "center",
    color: Colors.purpleColorBlack,
    lineHeight: hp(2.5),
    marginBottom: hp(4),
  },
  buttonGroup: {
    width: "100%",
    gap: hp(2),
  },
  buttonContainer: {
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    elevation: 3,
  },
  retakeButton: {
    borderWidth: 2,
    borderColor: Colors.purpleColorBlack,
    backgroundColor: "white",
  },
  confirmButton: {
    // LinearGradient ile stil verilecek
  },
  retakeGradient: {
    paddingVertical: hp(1.8),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: wp(2),
  },
  gradient: {
    paddingVertical: hp(1.8),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: wp(2),
  },
  retakeText: {
    color: Colors.purpleColorBlack,
    fontSize: hp(2.1),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
  },
  buttonText: {
    color: "white",
    fontSize: hp(2.1),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
  },
  errorText: {
    fontSize: hp(2.5),
    color: "red",
    textAlign: "center",
    marginTop: hp(20),
    marginBottom: hp(5),
  },
});
