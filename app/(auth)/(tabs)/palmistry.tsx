import PermissionScreen from "@/components/PermissionScreen";
import { MaterialIcons } from "@expo/vector-icons";
import {
  CameraType,
  CameraView,
  FlashMode,
  useCameraPermissions,
} from "expo-camera";
import { useRouter } from "expo-router";
import { default as React, useEffect, useRef, useState } from "react";
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";

const index = () => {
  const [facing, setFacing] = useState<CameraType>("back");
  const [isFlashOpen, setIsFlashOpen] = useState<FlashMode>("off");
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

  function toggleCameraFacing() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }
  function togleFlashlight() {
    setIsFlashOpen((current) => (current === "off" ? "on" : "off"));
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
          skipProcessing: false,
        });

        console.log("Photo taken:", photo.uri);

        // Fotoğraf onay sayfasına yönlendir
        router.push({
          pathname: "/(auth)/(modal)/confirmPhotoCaptured",
          params: { photoUri: photo.uri },
        });
      } catch (error) {
        console.error("Error taking picture:", error);
      }
    }
  };

  // Permission request wrapper fonksiyonu
  const handleRequestPermission = async () => {
    try {
      const result = await requestPermission();
      console.log("Permission request result:", result);
      return result;
    } catch (error) {
      console.error("Permission request error:", error);
      throw error;
    }
  };

  useEffect(() => {
    console.log("camera render");
    console.log("Permission status:", permission?.status);
  }, [permission]);

  // Eğer izin durumu henüz yüklenmemişse
  if (!permission) {
    return <PermissionScreen />;
  }

  // Eğer izin verilmemişse
  if (!permission.granted) {
    return <PermissionScreen onRequestPermission={handleRequestPermission} />;
  }

  // İzin verildiyse kamerayı göster
  return (
    <SafeAreaView style={styles.container}>
      <CameraView
        style={styles.cameraView}
        facing={facing}
        ref={cameraRef}
        mirror={false}
        mode="picture"
        flash={isFlashOpen}
      >
        {/* El Silüeti Overlay */}
        <View style={styles.overlayContainer}>
          <View style={styles.handSilhouette}>
            {/* El silüeti SVG veya resim buraya gelecek */}
            {/* <Image
              source={require("@/assets/images/horoscope/hand-outline.png")}
              style={styles.handOutline}
              resizeMode="contain"
            /> */}
          </View>
        </View>

        {/* Kamera Kontrolleri */}
        <View style={styles.controlTopContainer}>
          <TouchableOpacity
            style={styles.flashContainer}
            onPress={togleFlashlight}
          >
            {isFlashOpen == "on" ? (
              <MaterialIcons name="flashlight-on" size={24} color="white" />
            ) : (
              <MaterialIcons name="flashlight-off" size={24} color="white" />
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={styles.flipContainer}
            onPress={toggleCameraFacing}
          >
            <MaterialIcons name="flip-camera-android" size={24} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.captureContainer}
            onPress={takePicture}
          >
            <View style={styles.captureButton}>
              <View style={styles.captureInner} />
            </View>
          </TouchableOpacity>
        </View>
      </CameraView>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
    </SafeAreaView>
  );
};

export default index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  cameraView: {
    flex: 1,
    position: "relative",
  },
  overlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
  },
  handSilhouette: {
    width: wp(70),
    height: hp(50),
    justifyContent: "center",
    alignItems: "center",
  },
  controlsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: hp(15),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: wp(8),
    paddingBottom: hp(4),
    zIndex: 10,
  },
  controlTopContainer: {
    position: "absolute",
    top: hp(4),
    right: 0,
    height: hp(15),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: wp(8),
    paddingBottom: hp(4),
    zIndex: 10,
  },
  flipContainer: {
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 30,
    padding: 12,
    alignSelf: "flex-start",
  },
  flashContainer: {
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 30,
    padding: 12,
    alignSelf: "flex-end",
  },
  captureContainer: {
    alignItems: "center",
    flex: 1,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderWidth: 4,
    borderColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  captureInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "white",
  },
  handOutline: {
    height: hp(60),
    width: wp(40),
  },
});
