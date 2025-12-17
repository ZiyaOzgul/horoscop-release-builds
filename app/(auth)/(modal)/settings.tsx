import { deleteUserFromClerk } from "@/api/deleteUser";
import { Colors } from "@/constants/Colors";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";

const UserOptions = () => {
  const { t } = useTranslation();
  const { signOut, userId } = useAuth();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteUser = useMutation(api.users.deleteUser);
  const deleteToken = process.env.CLERK_SECRET_KEY;
  const handleDeleteAccount = () => {
    Alert.alert(
      t("deleteAccount.deleteAccount"),
      t("deleteAccount.deleteAccountWarning"),
      [
        {
          text: t("deleteAccount.cancel"),
          style: "cancel",
        },
        {
          text: t("deleteAccount.delete"),
          style: "destructive",
          onPress: confirmDeleteAccount,
        },
      ]
    );
  };

  const confirmDeleteAccount = async () => {
    if (!userId) {
      Alert.alert(t("deleteAccount.error"), t("deleteAccount.userNotFound"));
      return;
    }
    try {
      setIsDeleting(true);

      const clerkDeleteResult = await deleteUserFromClerk(userId);

      if (!clerkDeleteResult.success) {
        Alert.alert(
          t("deleteAccount.error"),
          clerkDeleteResult.error || t("deleteAccount.deleteAccountError")
        );
        return;
      }
      await deleteUser({ clerkId: userId });
      await signOut();
      Alert.alert(
        t("deleteAccount.accountDeleted"),
        t("deleteAccount.accountDeletedMessage")
      );
    } catch (error) {
      console.error("Error deleting account:", error);
      Alert.alert(
        t("deleteAccount.error"),
        t("deleteAccount.deleteAccountError")
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View style={styles.container}>
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
      <Text style={styles.title}>{t("settings.title")}</Text>
      <View style={styles.accountTextBox}>
        <Ionicons
          name="person-circle-outline"
          color={Colors.purpleColorBlack}
          size={hp(4)}
        />
        <Text style={styles.accountText}>{t("settings.account")}</Text>
      </View>
      <View style={styles.buttonBox}>
        <TouchableOpacity
          style={styles.buttonCont}
          onPress={() => router.push("/(auth)/(modal)/changePassword")}
        >
          <Text style={styles.buttonText}>{t("settings.change")}</Text>
          <Ionicons color={"#acacac"} name="chevron-forward" size={hp(4)} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonCont}
          onPress={() => router.push("/(auth)/(modal)/Social")}
        >
          <Text style={styles.buttonText}>{t("settings.social")}</Text>
          <Ionicons color={"#acacac"} name="chevron-forward" size={hp(4)} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.buttonCont}
          onPress={() => router.push("/(auth)/(modal)/Languages")}
        >
          <Text style={styles.buttonText}>{t("settings.language")}</Text>
          <Ionicons color={"#acacac"} name="chevron-forward" size={hp(4)} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.buttonCont}
          onPress={() => router.push("/(auth)/(modal)/Security")}
        >
          <Text style={styles.buttonText}>{t("settings.privacy")}</Text>
          <Ionicons color={"#acacac"} name="chevron-forward" size={hp(4)} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.buttonCont}
          onPress={() => router.push("/(auth)/(modal)/Plans")}
        >
          <Text style={styles.buttonText}>{t("settings.plans")}</Text>
          <Ionicons color={"#acacac"} name="chevron-forward" size={hp(4)} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.buttonCont}
          onPress={() => router.push("/(auth)/(modal)/notifications")}
        >
          <Text style={styles.buttonText}>{t("settings.notifications")}</Text>
          <Ionicons color={"#acacac"} name="chevron-forward" size={hp(4)} />
        </TouchableOpacity>
      </View>
      <View
        style={{
          alignItems: "center",
          marginTop: hp(2),
        }}
      >
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={() => signOut()}
        >
          <Text style={styles.signOutText}>{t("settings.logout")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteAccount}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.deleteText}>
              {t("deleteAccount.deleteAccount")}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default UserOptions;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: hp(3.8),
    paddingHorizontal: wp(5),
    position: "relative",
  },
  backButtonContainer: {
    position: "absolute",
    top: hp(3.8),
    left: wp(4),
    zIndex: 10,
  },
  title: {
    fontSize: hp(4.6),
    color: Colors.purpleColorBlack,
    fontWeight: "600",
    fontFamily: "Rubik_600SemiBold",
    paddingTop: hp(4),
  },
  accountTextBox: {
    paddingHorizontal: wp(2),
    width: wp(80),
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    paddingTop: hp(6),
    paddingBottom: hp(1),
  },
  accountText: {
    fontSize: hp(2.6),
    color: "#000",
    fontWeight: "600",
    fontFamily: "Rubik_600SemiBold",
    paddingLeft: wp(1),
  },
  buttonBox: {
    marginTop: hp(4),
    gap: 16,
  },
  buttonCont: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: wp(80),
  },
  buttonText: {
    fontSize: hp(2.1),
    color: "#acacac",
    fontWeight: "600",
    fontFamily: "Rubik_600SemiBold",
  },
  signOutButton: {
    marginTop: hp(10),
    width: wp(60),
    height: hp(5),
    borderColor: Colors.adsButtonColor,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "transparent",
  },
  signOutText: {
    fontSize: hp(2.1),
    color: Colors.purpleColorBlack,
    fontWeight: "600",
    fontFamily: "Rubik_600SemiBold",
  },
  deleteButton: {
    marginTop: hp(2),
    width: wp(60),
    height: hp(5),
    backgroundColor: "#ff4444",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
  },
  deleteText: {
    fontSize: hp(2.1),
    color: "#fff",
    fontWeight: "600",
    fontFamily: "Rubik_600SemiBold",
  },
});
