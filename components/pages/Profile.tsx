import { Colors } from "@/constants/Colors";
import { api } from "@/convex/_generated/api";
import { useUserDataTranslation } from "@/locales/translationHelper";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setUserData } from "@/redux/horoscopeSlicer";
import { useUser } from "@clerk/clerk-expo";
import { Entypo, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Alert,
    Animated as anim,
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import PagerView from "react-native-pager-view";
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInLeft,
    FadeInRight,
} from "react-native-reanimated";
import {
    heightPercentageToDP as hp,
    widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { Toast } from "toastify-react-native";
import LoadingProfile from "../LoadingProfile";
import ImageCropRotate from "../util/ImageCropRotate";

import { usePlatinumStatus } from "@/hooks/usePremiumCheck";
import {
    RewardedAd,
    RewardedAdEventType,
} from "react-native-google-mobile-ads";

const Profile: React.FC = () => {
  const router = useRouter();
  const { user } = useUser();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const {
    translateZodiacSign,
    translateElement,
    translatePolarity,
    translateModality,
  } = useUserDataTranslation();

  const userDetails = useAppSelector((state) => state.horoscope.userData);
  const getUserDetails = useQuery(api.users.getUserWithClerkID, {
    clerkId: user?.id,
  });

  // Fetch past palmistries and dreams
  const pastPalmistries = useQuery(
    api.palmistries.getUserPalmistries,
    user?.id ? { userId: user.id, limit: 20 } : "skip"
  );
  const pastDreams = useQuery(
    api.dreams.getUserDreams,
    user?.id ? { userId: user.id, limit: 20 } : "skip"
  );

  // Check platinum and gold status
  const { isPlatinum, isGold } = usePlatinumStatus();
  const userTypeFromRedux = useAppSelector(
    (state) => state.horoscope.userData?.userType
  );
  const userTypeFromConvex = (getUserDetails as any)?.userType;
  const isUserPlatinum =
    isPlatinum ||
    userTypeFromRedux === "platinum" ||
    userTypeFromConvex === "platinum";
  const isUserGold =
    isGold || userTypeFromRedux === "gold" || userTypeFromConvex === "gold";

  // Gold and Platinum users have automatic access (no ads)
  const isUserGoldOrPlatinum = isUserPlatinum || isUserGold;

  const generateUploadUrl = useMutation(api.users.generateUploadUrl);
  const updateProfilePicture = useMutation(api.users.updateProfilePicture);

  const [uploading, setUploading] = useState(false);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  
  // Add state for crop modal
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedImageForCrop, setSelectedImageForCrop] = useState<string | null>(null);

  // Ad unlock states - only platinum users have automatic access (gold users need to watch ads)
  const [isPalmitryUnlocked, setIsPalmitryUnlocked] = useState(isUserPlatinum);
  const [isDreamsUnlocked, setIsDreamsUnlocked] = useState(isUserPlatinum);
  const [isLoadingAd, setIsLoadingAd] = useState(false);

  const scrollX = useRef(new anim.Value(0)).current;
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    if (getUserDetails) {
      dispatch(setUserData(getUserDetails));
    }
  }, [getUserDetails, dispatch]);

  // Update unlock states when platinum status changes (only platinum, not gold)
  useEffect(() => {
    if (isUserPlatinum) {
      setIsPalmitryUnlocked(true);
      setIsDreamsUnlocked(true);
    }
  }, [isUserPlatinum]);

  // Initialize rewarded ad with production ID
  const rewardedAd = RewardedAd.createForAdRequest(
    "ca-app-pub-4099680443697121/7554889448"
  );

  const handleWatchAd = async (type: "palmitry" | "dreams") => {
    setIsLoadingAd(true);

    try {
      const rewardedAd = RewardedAd.createForAdRequest(
        "ca-app-pub-4099680443697121/7554889448",
        {
          requestNonPersonalizedAdsOnly: false,
        }
      );

      const loaded = await new Promise((resolve) => {
        const unsubscribeLoaded = rewardedAd.addAdEventListener(
          RewardedAdEventType.LOADED,
          () => {
            resolve(true);
          }
        );

        rewardedAd.load();

        // Cleanup after timeout
        setTimeout(() => {
          unsubscribeLoaded();
        }, 10000);
      });

      if (loaded) {
        const unsubscribeEarned = rewardedAd.addAdEventListener(
          RewardedAdEventType.EARNED_REWARD,
          (reward) => {
            // User earned reward
            console.log("User earned reward:", reward);
            if (type === "palmitry") {
              setIsPalmitryUnlocked(true);
            } else {
              setIsDreamsUnlocked(true);
            }
            Alert.alert(
              t("profile.alerts.successTitle"),
              t("profile.palmitry.unlocked")
            );
            unsubscribeEarned();
          }
        );

        rewardedAd.show();
      } else {
        Alert.alert(
          t("profile.alerts.errorTitle"),
          "Failed to load ad. Please try again."
        );
      }

      // OPTION 2: Simulated ad for development/testing
      // Remove this in production
    } catch (error) {
      console.error("Error loading ad:", error);
      Alert.alert(
        t("profile.alerts.errorTitle"),
        "Failed to load ad. Please try again."
      );
    } finally {
      setIsLoadingAd(false);
    }
  };

  const pickAndUploadImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          t("profile.permission.title"),
          t("profile.permission.message")
        );
        return;
      }

      // Launch image picker WITHOUT editing
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false, // Disable built-in editing
        quality: 1.0,
      });

      if (result.canceled || !result.assets[0]) return;

      // Show our custom crop modal instead
      setSelectedImageForCrop(result.assets[0].uri);
      setShowCropModal(true);
    } catch (error) {
      console.error("Error selecting image:", error);
      Toast.error(
        t("profile.alerts.errorUpload") || "Failed to select image."
      );
    }
  };

  // Helper function to convert image URI to base64
  const uriToBase64 = async (uri: string): Promise<string> => {
    try {
      // Use expo-file-system to read the file as base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error) {
      console.error("Error converting URI to base64:", error);
      throw error;
    }
  };

  // Handle cropped image save
  const handleCroppedImageSave = async (croppedUri: string) => {
    setShowCropModal(false);
    setLocalImageUri(croppedUri);
    setUploading(true);

    try {
      const uploadUrl = await generateUploadUrl();
      const response = await fetch(croppedUri);
      const blob = await response.blob();

      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": blob.type },
        body: blob,
      });

      if (!uploadResponse.ok) {
        throw new Error(t("profile.alerts.errorUploadGeneric"));
      }

      const { storageId } = await uploadResponse.json();

      await updateProfilePicture({
        clerkId: user?.id ?? "",
        profilePictureId: storageId,
      });

      // Convert image URI to base64 for Clerk
      try {
        const base64Image = await uriToBase64(croppedUri);
        await user?.setProfileImage({ file: base64Image });
      } catch (clerkError) {
        console.log("Could not update Clerk profile:", clerkError);
      }

      Toast.success(
        t("profile.alerts.successMessage") || "Profile picture updated successfully!"
      );
    } catch (error) {
      console.error("Error uploading image:", error);
      Toast.error(
        t("profile.alerts.errorUpload") || "Failed to upload profile picture."
      );
      setLocalImageUri(null);
    } finally {
      setUploading(false);
      setSelectedImageForCrop(null);
    }
  };

  // Handle crop cancel
  const handleCropCancel = () => {
    setShowCropModal(false);
    setSelectedImageForCrop(null);
  };

  if (!userDetails) {
    return <LoadingProfile />;
  }

  const getProfileImageSource = () => {
    if (localImageUri) return { uri: localImageUri };
    if (userDetails?.imageUrl) return { uri: userDetails.imageUrl };
    return userDetails.gender === "male"
      ? require("@/assets/images/horoscope/manPlaceHolder.png")
      : require("@/assets/images/horoscope/womanPlaceHolder.png");
  };

  const profileImageSource = getProfileImageSource();

  const renderZodiac = (labelKey: string, value: string, delayVal: number) => (
    <Animated.View
      style={styles.signContainer}
      entering={FadeInLeft.delay(delayVal).springify()}
    >
      <Text style={styles.textT} numberOfLines={1} adjustsFontSizeToFit>
        {t(`profile.user.${labelKey}`)}
      </Text>
      <View style={styles.signBox}>
        <Text style={styles.textDesc} numberOfLines={1} adjustsFontSizeToFit>
          {translateZodiacSign(value)}
        </Text>
        <MaterialCommunityIcons
          size={hp(2.4)}
          name={`zodiac-${value.toLowerCase()}` as any}
          color={Colors.purpleColorBlack}
        />
      </View>
    </Animated.View>
  );

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderUnlockedContent = (type: "palmitry" | "dreams") => {
    const data = type === "palmitry" ? pastPalmistries : pastDreams;

    if (data === undefined) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    if (!data || data.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {type === "palmitry"
              ? t("profile.palmitry.noPastReadings") ||
                "No past palm readings yet"
              : t("profile.palmitry.noPastDreams") ||
                "No past dream interpretations yet"}
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.unlockedContent}>
        {data.map((item, index) => {
          const itemDate = formatDate(item.createdAt);
          const itemTitle =
            type === "palmitry"
              ? `${t("profile.palmitry.reading") || "Reading"} ${index + 1} - ${itemDate}`
              : `${t("profile.palmitry.dream") || "Dream"} ${index + 1} - ${itemDate}`;

          return (
            <TouchableOpacity
              key={item._id}
              style={styles.contentItem}
              onPress={() => {
                if (type === "palmitry") {
                  router.push({
                    pathname: "/(auth)/(modal)/viewPalmistry",
                    params: { palmistryId: item._id },
                  });
                } else {
                  router.push({
                    pathname: "/(auth)/(modal)/viewDream",
                    params: { dreamId: item._id },
                  });
                }
              }}
            >
              <Text style={styles.contentItemText}>{itemTitle}</Text>
              <Ionicons name="chevron-forward" size={hp(2.5)} color="#fff" />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBarContainer}>
        <TouchableOpacity onPress={() => router.back()}>
          <Animated.View entering={FadeInLeft.delay(100).springify()}>
            <Ionicons name="chevron-back" color={"gray"} size={hp(3.4)} />
          </Animated.View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.navigate("/(auth)/(modal)/settings")}
        >
          <Animated.View entering={FadeInRight.delay(100).springify()}>
            <Ionicons
              name="cog-sharp"
              color={Colors.purpleColorBlack}
              size={hp(3.8)}
            />
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Name */}
      <View style={styles.nameContainer}>
        <Text style={styles.usersName} numberOfLines={1} adjustsFontSizeToFit>
          {userDetails?.firstName}
        </Text>
        <Text
          style={styles.usersSurName}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {userDetails?.lastName}
        </Text>

        {/* Subscription Badge */}
        {(isUserGold || isUserPlatinum) && (
          <Animated.View
            entering={FadeInDown.delay(150).springify()}
            style={[
              styles.subscriptionBadge,
              isUserPlatinum ? styles.platinumBadge : styles.goldBadge,
            ]}
          >
            <Ionicons
              name={isUserPlatinum ? "diamond" : "medal"}
              size={hp(2.5)}
              color={isUserPlatinum ? "#E5E4E2" : "#FFD700"}
              style={styles.badgeIcon}
            />
            <Text
              style={[
                styles.badgeText,
                isUserPlatinum
                  ? styles.platinumBadgeText
                  : styles.goldBadgeText,
              ]}
            >
              {isUserPlatinum ? "Platinum" : "Gold"}
            </Text>
          </Animated.View>
        )}

        {/* Horoscope Info with Background */}
        <View style={styles.userDetailsContainer}>
          {/* Background Image with Purple Tint */}
          <Image
            source={require("@/assets/images/horoscope/starsBg.png")}
            style={styles.backgroundImage}
            resizeMode="cover"
          />

          <View style={styles.userDetailsL}>
            {renderZodiac("sunSign", userDetails.sunSign, 100)}
            {renderZodiac("moonSign", userDetails.moonSign, 200)}
            {renderZodiac("ascendant", userDetails.ascendant, 300)}
          </View>

          <View style={styles.userImageBox}>
            <View style={styles.userImage}>
              <Animated.Image
                source={profileImageSource}
                style={styles.imageStyle}
                resizeMode="cover"
                entering={FadeIn.delay(100).springify()}
              />
            </View>

            {!uploading && (
              <TouchableOpacity
                style={styles.editOverlay}
                onPress={pickAndUploadImage}
                disabled={uploading}
              >
                <Ionicons name="camera" size={hp(3.5)} color={"#fff"} />
              </TouchableOpacity>
            )}

            {uploading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={"#fff"} />
              </View>
            )}
          </View>

          <Animated.View style={styles.userDetailsR}>
            <Animated.View
              style={styles.signContainer}
              entering={FadeInRight.delay(100).springify()}
            >
              <Text style={styles.textT} numberOfLines={1} adjustsFontSizeToFit>
                {t("profile.user.element")}
              </Text>
              <View style={styles.signBox}>
                <Text
                  style={styles.textDesc}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {translateElement(userDetails.element)}
                </Text>
                <Ionicons
                  size={hp(2.4)}
                  name="triangle-outline"
                  color={Colors.purpleColorBlack}
                />
              </View>
            </Animated.View>

            <Animated.View
              style={styles.signContainer}
              entering={FadeInRight.delay(200).springify()}
            >
              <Text style={styles.textT} numberOfLines={1} adjustsFontSizeToFit>
                {t("profile.user.polarity")}
              </Text>
              <View style={styles.signBox}>
                <Text
                  style={styles.textDesc}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {translatePolarity(userDetails.polarity)}
                </Text>
              </View>
            </Animated.View>

            <Animated.View
              style={styles.signContainer}
              entering={FadeInRight.delay(300).springify()}
            >
              <Text style={styles.textT} numberOfLines={1} adjustsFontSizeToFit>
                {t("profile.user.modality")}
              </Text>
              <View style={styles.signBox}>
                <Text
                  style={styles.textDesc}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {translateModality(userDetails.modality)}
                </Text>
              </View>
            </Animated.View>
          </Animated.View>
        </View>
      </View>

      <View style={styles.sectionBorder}>
        <Text style={styles.dateTitle} numberOfLines={2} adjustsFontSizeToFit>
          {userDetails.birthDate} {userDetails.birthTime}
        </Text>
      </View>

      <View style={styles.sectionBorderRow}>
        <Text style={styles.dateTitle} numberOfLines={1} adjustsFontSizeToFit>
          {t("profile.location")}: {userDetails.city}
        </Text>
        <Entypo
          name="location-pin"
          size={hp(3.4)}
          color={Colors.purpleColorBlack}
          style={{ paddingHorizontal: hp(1) }}
        />
      </View>

      <Animated.View entering={FadeInDown.delay(100).springify()}>
        <PagerView
          initialPage={0}
          style={{ height: hp(40), width: wp(100), paddingVertical: hp(1) }}
          onPageScroll={(e) => {
            const { position, offset } = e.nativeEvent;
            scrollX.setValue(position + offset);
          }}
          onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
        >
          {/* Palmitry Page */}
          <View style={styles.palmitryBox} key="page0">
            <LinearGradient
              colors={["#8e61fe", "rgba(142, 97, 254, 0)"]}
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            >
              <View style={styles.palmitryTopBox}>
                <Text
                  style={styles.palmitryTitle}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                >
                  {t("profile.palmitry.pastPalmitries")}
                </Text>
                <Entypo color={"#fff"} size={hp(4)} name="back-in-time" />
              </View>

              {isPalmitryUnlocked ? (
                renderUnlockedContent("palmitry")
              ) : (
                <View style={styles.adsButtonContainer}>
                  <TouchableOpacity
                    style={styles.adsButton}
                    onPress={() => handleWatchAd("palmitry")}
                    disabled={isLoadingAd}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 20,
                        alignItems: "center",
                      }}
                    >
                      {isLoadingAd ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Text style={styles.adsText} numberOfLines={1}>
                            {t("profile.palmitry.watchAds")}
                          </Text>
                          <Ionicons
                            name="logo-youtube"
                            color={"#fff"}
                            size={hp(3)}
                          />
                        </>
                      )}
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.unlockButton}
                    onPress={() => {
                      router.push("/(auth)/(modal)/Plans");
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 10,
                        alignItems: "center",
                      }}
                    >
                      <Text style={styles.unlockText} numberOfLines={1}>
                        {t("profile.palmitry.unlockForever")}
                      </Text>
                      <Ionicons
                        name="lock-open"
                        color={Colors.purpleColorBlack}
                        size={hp(3)}
                      />
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            </LinearGradient>
          </View>

          {/* Dreams Page */}
          <View style={styles.palmitryBox} key="page1">
            <LinearGradient
              colors={["#8e61fe", "rgba(142, 97, 254, 0)"]}
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            >
              <View style={styles.palmitryTopBox}>
                <Text
                  style={styles.palmitryTitle}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                >
                  {t("profile.palmitry.pastDreams")}
                </Text>
                <Entypo color={"#fff"} size={hp(4)} name="back-in-time" />
              </View>

              {isDreamsUnlocked ? (
                renderUnlockedContent("dreams")
              ) : (
                <View style={styles.adsButtonContainer}>
                  <TouchableOpacity
                    style={styles.adsButton}
                    onPress={() => handleWatchAd("dreams")}
                    disabled={isLoadingAd}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 20,
                        alignItems: "center",
                      }}
                    >
                      {isLoadingAd ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Text style={styles.adsText} numberOfLines={1}>
                            {t("profile.palmitry.watchAds")}
                          </Text>
                          <Ionicons
                            name="logo-youtube"
                            color={"#fff"}
                            size={hp(3)}
                          />
                        </>
                      )}
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.unlockButton}
                    onPress={() => {
                      router.push("/(auth)/(modal)/Plans");
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 10,
                        alignItems: "center",
                      }}
                    >
                      <Text style={styles.unlockText} numberOfLines={1}>
                        {t("profile.palmitry.unlockForever")}
                      </Text>
                      <Ionicons
                        name="lock-open"
                        color={Colors.purpleColorBlack}
                        size={hp(3)}
                      />
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            </LinearGradient>
          </View>
        </PagerView>

        <View style={styles.sliderBox}>
          {Array.from({ length: 2 }).map((_, index) => {
            const dotWidth = scrollX.interpolate({
              inputRange: [index - 1, index, index + 1],
              outputRange: [wp(2), wp(8), wp(2)],
              extrapolate: "clamp",
            });
            return (
              <anim.View
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
      </Animated.View>

      {/* Custom Crop Modal */}
      {showCropModal && selectedImageForCrop && (
        <View style={styles.cropModalContainer}>
          <ImageCropRotate
            imageUri={selectedImageForCrop}
            onSave={handleCroppedImageSave}
            onCancel={handleCropCancel}
          />
        </View>
      )}

      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: hp(3.8),
    alignItems: "center",
    paddingBottom: hp(3.2),
    paddingHorizontal: wp(5),
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: hp(5),
    color: "#fff",
  },
  topBarContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: wp(90),
  },
  nameContainer: {
    width: wp(90),
    alignItems: "center",
  },
  usersName: {
    textAlign: "center",
    fontSize: hp(3.2),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
    marginBottom: hp(-1),
    textTransform: "capitalize",
    paddingHorizontal: wp(2),
    flexShrink: 1,
  },
  usersSurName: {
    textAlign: "center",
    fontSize: hp(3.2),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
    marginTop: hp(-1),
    textTransform: "capitalize",
    paddingHorizontal: wp(2),
    flexShrink: 1,
  },
  subscriptionBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.8),
    borderRadius: 20,
    marginTop: hp(1),
    marginBottom: hp(0.5),
    borderWidth: 2,
    gap: wp(2),
  },
  goldBadge: {
    backgroundColor: "#FFF9E6",
    borderColor: "#FFD700",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  platinumBadge: {
    backgroundColor: "#F5F5F5",
    borderColor: "#E5E4E2",
    shadowColor: "#C0C0C0",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  badgeIcon: {
    marginRight: wp(1),
  },
  badgeText: {
    fontSize: hp(1.8),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  goldBadgeText: {
    color: "#B8860B",
  },
  platinumBadgeText: {
    color: "#6B6B6B",
  },
  userDetailsContainer: {
    flexDirection: "row",
    paddingVertical: wp(2),
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  backgroundImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    tintColor: Colors.purpleColor,
    opacity: 1,
  },
  userDetailsL: {
    width: wp(30),
    alignItems: "flex-end",
    paddingHorizontal: wp(1),
  },
  userDetailsR: {
    width: wp(30),
    alignItems: "flex-start",
    paddingHorizontal: wp(1),
  },
  signContainer: {
    paddingVertical: hp(0.2),
    alignItems: "flex-start",
    maxWidth: wp(28),
  },
  signBox: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    maxWidth: "100%",
  },
  textT: {
    color: Colors.grayColor,
    fontSize: hp(1.6),
    fontFamily: "Rubik_500Medium",
    fontWeight: "500",
    paddingHorizontal: wp(1),
    flexShrink: 1,
  },
  textDesc: {
    color: Colors.purpleColorBlack,
    fontSize: hp(1.8),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: wp(1),
    flexShrink: 1,
  },
  userImageBox: {
    width: wp(35),
    height: wp(35),
    position: "relative",
    marginHorizontal: wp(1),
  },
  userImage: {
    width: wp(33),
    height: wp(33),
    borderWidth: 3,
    borderColor: Colors.purpleColorBlack,
    borderRadius: wp(16.5),
    overflow: "hidden",
    position: "relative",
    marginHorizontal: wp(1),
  },
  imageStyle: {
    width: wp(33),
    height: wp(33),
  },
  editOverlay: {
    position: "absolute",
    bottom: -hp(1.5),
    right: -wp(1.5),
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 999,
    padding: hp(1.1),
    alignItems: "center",
    justifyContent: "center",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionBorder: {
    borderBottomWidth: 2,
    borderColor: Colors.border,
    paddingTop: hp(2),
    paddingBottom: hp(1),
    width: wp(90),
  },
  sectionBorderRow: {
    borderBottomWidth: 2,
    borderColor: Colors.border,
    paddingTop: hp(2),
    paddingBottom: hp(1),
    flexDirection: "row",
    alignItems: "center",
    width: wp(90),
    justifyContent: "center",
  },
  dateTitle: {
    fontSize: hp(2.2),
    fontFamily: "Rubik_600SemiBold",
    color: Colors.grayColor,
    fontWeight: "600",
    textAlign: "center",
    textTransform: "uppercase",
    flexShrink: 1,
    paddingHorizontal: wp(2),
  },
  palmitryBox: {
    position: "relative",
    paddingHorizontal: wp(10),
    marginTop: hp(2),
    alignItems: "center",
  },
  gradient: {
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    width: wp(80),
    height: hp(40),
  },
  palmitryTopBox: {
    flexDirection: "row",
    paddingHorizontal: wp(8),
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: hp(1),
  },
  palmitryTitle: {
    color: "#fff",
    fontSize: hp(2.3),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "800",
    flexShrink: 1,
    flex: 1,
    marginRight: wp(2),
  },
  adsButtonContainer: {
    paddingTop: hp(8),
    alignItems: "center",
    gap: hp(3),
  },
  adsButton: {
    width: wp(60),
    minHeight: hp(4.8),
    backgroundColor: Colors.adsButtonColor,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
  },
  unlockButton: {
    width: wp(60),
    minHeight: hp(4.8),
    backgroundColor: "#ffffff66",
    borderWidth: 2,
    borderColor: Colors.purplePalmitryBg,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
  },
  adsText: {
    fontSize: hp(1.9),
    color: "#fff",
    textTransform: "uppercase",
    flexShrink: 1,
  },
  unlockText: {
    fontSize: hp(1.9),
    color: Colors.purpleColorBlack,
    textTransform: "uppercase",
    flexShrink: 1,
  },
  sliderBox: {
    flexDirection: "row",
    alignSelf: "center",
    marginBottom: hp(4),
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
  unlockedContent: {
    flex: 1,
    paddingHorizontal: wp(8),
    paddingTop: hp(2),
  },
  contentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: hp(2),
    borderRadius: 15,
    marginBottom: hp(1.5),
  },
  contentItemText: {
    color: "#fff",
    fontSize: hp(2),
    fontFamily: "Rubik_500Medium",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: hp(10),
  },
  emptyText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: hp(2),
    fontFamily: "Rubik_400Regular",
    textAlign: "center",
  },
  editorFullScreen: {
    flex: 1,
    backgroundColor: "#000",
  },
  editorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: hp(6),
    paddingHorizontal: wp(5),
    paddingBottom: hp(2),
    backgroundColor: "#000",
  },
  editorHeaderTitle: {
    color: "#fff",
    fontSize: hp(2.2),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
  },
  editorHeaderButton: {
    minWidth: wp(20),
    paddingVertical: hp(1),
  },
  editorHeaderButtonText: {
    color: "#999",
    fontSize: hp(1.9),
    fontFamily: "Rubik_500Medium",
  },
  editorHeaderButtonTextActive: {
    color: Colors.purpleColorBlack,
  },
  editorCropContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  cropOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  cropOverlayTop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  cropOverlayMiddle: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  cropOverlayLeft: {
    backgroundColor: "rgba(0,0,0,0.7)",
    flex: 1,
  },
  cropOverlayRight: {
    backgroundColor: "rgba(0,0,0,0.7)",
    flex: 1,
  },
  cropAreaFrame: {
    borderWidth: 2,
    borderColor: "#fff",
    borderRadius: 2,
  },
  cropOverlayBottom: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  editorCropImage: {
    position: "absolute",
    zIndex: 0,
  },
  editorLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  editorBottomControls: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    backgroundColor: "#000",
    alignItems: "center",
  },
  editorControlButton: {
    alignItems: "center",
    paddingVertical: hp(1),
    marginBottom: hp(1),
  },
  editorControlButtonText: {
    color: "#fff",
    fontSize: hp(1.6),
    fontFamily: "Rubik_500Medium",
    marginTop: hp(0.5),
  },
  editorInstructions: {
    paddingTop: hp(1),
  },
  editorInstructionText: {
    color: "#666",
    fontSize: hp(1.5),
    fontFamily: "Rubik_400Regular",
    textAlign: "center",
  },
  cropModalContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
});
