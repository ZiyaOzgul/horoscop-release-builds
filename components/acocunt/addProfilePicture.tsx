import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";

import { calculateAscendantWithGPT } from "@/api/ascendantCalc";
import { Colors } from "@/constants/Colors";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAppSelector } from "@/redux/hooks";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

const AddProfilePicture: React.FC = () => {
  const router = useRouter();
  const { user } = useUser();
  const { t } = useTranslation();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const registerFullUserMutation = useMutation(api.users.registerFullUser);
  const generateUploadUrl = useMutation(api.users.generateUploadUrl);

  const userRegisterData = useAppSelector(
    (state) => state.horoscope.registerData
  );

  const pickImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          t("profilePicture.permission.title"),
          t("profilePicture.permission.message")
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert(
        t("profilePicture.pickError.title"),
        t("profilePicture.pickError.message")
      );
    }
  };

  const uploadImageToConvex = async (imageUri: string): Promise<string> => {
    try {
      const uploadUrl = await generateUploadUrl();

      const response = await fetch(imageUri);
      const blob = await response.blob();

      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": blob.type },
        body: blob,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image");
      }

      const { storageId } = await uploadResponse.json();
      return storageId;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  };

  const unsetPicture = async () => {
    try {
      setUploading(true);
      
      // Calculate ascendant on client side if birth time and city are available
      let ascendant: string | undefined;
      if (userRegisterData?.birthTime && userRegisterData?.city && userRegisterData?.birthDate) {
        try {
          const gptResult = await calculateAscendantWithGPT(
            userRegisterData.birthDate,
            userRegisterData.birthTime,
            userRegisterData.city
          );
          ascendant = gptResult.ascendant;
        } catch (error) {
          console.error("Error calculating ascendant:", error);
          // Continue without ascendant - Convex will use fallback
        }
      }

      const sendData = {
        email: userRegisterData?.email ?? "",
        clerkId: user?.id ?? "",
        birthTime: userRegisterData?.birthTime,
        gender: userRegisterData?.gender,
        birthDate: userRegisterData?.birthDate,
        city: userRegisterData?.city,
        firstName: userRegisterData?.firstName,
        lastName: userRegisterData?.lastName,
        userType: "normal",
        ascendant: ascendant,
      };

      await registerFullUserMutation(sendData);
      router.push("/(public)/(account)/newComerPage");
    } catch (error) {
      console.error("Error registering user:", error);
      Alert.alert(
        t("profilePicture.upload.registerFailed.title"),
        t("profilePicture.upload.registerFailed.message")
      );
    } finally {
      setUploading(false);
    }
  };

  const setPicture = async () => {
    if (!selectedImage) {
      Alert.alert(
        t("profilePicture.noImage.title"),
        t("profilePicture.noImage.message")
      );
      return;
    }

    try {
      setUploading(true);

      const storageId = await uploadImageToConvex(selectedImage);

      // Calculate ascendant on client side if birth time and city are available
      let ascendant: string | undefined;
      if (userRegisterData?.birthTime && userRegisterData?.city && userRegisterData?.birthDate) {
        try {
          const gptResult = await calculateAscendantWithGPT(
            userRegisterData.birthDate,
            userRegisterData.birthTime,
            userRegisterData.city
          );
          ascendant = gptResult.ascendant;
        } catch (error) {
          console.error("Error calculating ascendant:", error);
          // Continue without ascendant - Convex will use fallback
        }
      }

      const sendData = {
        email: userRegisterData?.email ?? "",
        clerkId: user?.id ?? "",
        birthTime: userRegisterData?.birthTime,
        gender: userRegisterData?.gender,
        birthDate: userRegisterData?.birthDate,
        city: userRegisterData?.city,
        firstName: userRegisterData?.firstName,
        lastName: userRegisterData?.lastName,
        userType: "normal",
        profilePictureId: storageId as Id<"_storage">,
        ascendant: ascendant,
      };

      await registerFullUserMutation(sendData);

      try {
        await user?.setProfileImage({ file: selectedImage });
      } catch (clerkError) {
        console.log("Could not update Clerk profile:", clerkError);
      }

      router.push("/(public)/(account)/newComerPage");
    } catch (error) {
      console.error("Error setting picture:", error);
      Alert.alert(
        t("profilePicture.upload.failed.title"),
        t("profilePicture.upload.failed.message")
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <ImageBackground
      style={styles.container}
      source={require("../../assets/images/horoscope/regBg.png")}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons color={"#afafaf"} size={hp(4)} name="chevron-back" />
      </TouchableOpacity>

      <Text style={styles.title}>{t("profilePicture.title")}</Text>

      <View
        style={{
          alignItems: "center",
          paddingTop: hp(6),
        }}
      >
        <TouchableOpacity style={styles.userBox} onPress={pickImage}>
          <Image
            source={
              selectedImage
                ? { uri: selectedImage }
                : require("@/assets/images/horoscope/addUser.png")
            }
            resizeMode="cover"
            style={styles.userImage}
          />
          {!selectedImage && (
            <View style={styles.overlay}>
              <Ionicons name="camera" size={hp(5)} color="#fff" />
              <Text style={styles.tapText}>
                {t("profilePicture.overlay.tap")}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.adsButtonContainer}>
        <TouchableOpacity
          style={styles.unlockButton}
          onPress={unsetPicture}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {t("profilePicture.buttons.later")}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.adsButton, !selectedImage && styles.disabledButton]}
          onPress={setPicture}
          disabled={!selectedImage || uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.buttonText}>
                {t("profilePicture.buttons.next")}
              </Text>
              <Ionicons
                name="chevron-forward"
                color={"#fff"}
                size={hp(4)}
                style={styles.chevron}
              />
            </>
          )}
        </TouchableOpacity>
      </View>

      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
    </ImageBackground>
  );
};

export default AddProfilePicture;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: hp(3.8),
    alignItems: "center",
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: wp(4),
    top: hp(4),
  },
  title: {
    fontSize: hp(4),
    color: "#fff",
    fontWeight: "600",
    fontFamily: "Rubik_600SemiBold",
    paddingTop: hp(16),
  },
  userBox: {
    height: hp(30),
    width: hp(30),
    overflow: "hidden",
    borderRadius: hp(15),
    position: "relative",
  },
  userImage: {
    height: hp(30),
    width: hp(30),
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  tapText: {
    color: "#fff",
    fontSize: hp(1.8),
    marginTop: hp(1),
  },
  adsButtonContainer: {
    paddingTop: hp(8),
    alignItems: "center",
    gap: hp(3),
  },
  adsButton: {
    width: wp(80),
    height: hp(6),
    backgroundColor: Colors.adsButtonColor,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  disabledButton: {
    opacity: 0.5,
  },
  unlockButton: {
    width: wp(80),
    height: hp(6),
    backgroundColor: "#ffffff00",
    borderWidth: 2,
    borderColor: Colors.purplePalmitryBg,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    position: "relative",
  },
  buttonText: {
    fontSize: hp(2.2),
    color: "#fff",
    textTransform: "uppercase",
  },
  chevron: {
    position: "absolute",
    right: wp(2),
    top: hp(1),
  },
});
