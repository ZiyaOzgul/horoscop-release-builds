import { useUser } from "@clerk/clerk-expo";
import { AntDesign, Entypo, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";

type FormTypes = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const ChangePassword = () => {
  const { t } = useTranslation();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<FormTypes>({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPassword = watch("newPassword");

  const onSubmit = async (data: FormTypes) => {
    if (!user) {
      Alert.alert(t("changePassword.alerts.userNotFound"));
      return;
    }

    if (data.newPassword !== data.confirmPassword) {
      Alert.alert(t("changePassword.alerts.passwordsDoNotMatch"));
      return;
    }

    if (data.newPassword.length < 8) {
      Alert.alert(t("changePassword.alerts.passwordTooShort"));
      return;
    }

    setLoading(true);

    try {
      await user.updatePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      Alert.alert(t("changePassword.alerts.changeSuccess"), undefined, [
        {
          text: "OK",
          onPress: () => {
            reset();
            router.back();
          },
        },
      ]);
    } catch (error: any) {
      console.error("Password change error:", error);

      let errorMessage = t("changePassword.alerts.changeFailed");

      if (error?.errors && error.errors.length > 0) {
        const clerkError = error.errors[0];
        if (clerkError.code === "form_password_incorrect") {
          errorMessage = t("changePassword.alerts.currentIncorrect");
        } else if (clerkError.code === "form_password_pwned") {
          errorMessage = t("changePassword.alerts.pwned");
        } else if (clerkError.code === "form_password_validation_failed") {
          errorMessage = t("changePassword.alerts.validationFailed");
        } else {
          errorMessage =
            clerkError.longMessage || clerkError.message || errorMessage;
        }
      }

      Alert.alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const validatePasswordMatch = (value: string) => {
    return (
      value === newPassword || t("changePassword.validation.confirmMismatch")
    );
  };

  const requirementItems = useMemo(() => {
    const items = t("changePassword.requirements.items", {
      returnObjects: true,
    });
    // runtime guard
    if (Array.isArray(items)) return items as string[];
    // if it's a single string, split by newline or return single-element array:
    if (typeof items === "string") return [items];
    return [];
  }, [t]);
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior="padding"
      keyboardVerticalOffset={20}
    >
      <ImageBackground
        style={styles.container}
        source={require("@/assets/images/horoscope/regBg.png")}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="gray" />
        </TouchableOpacity>

        <Text style={styles.title}>{t("changePassword.title")}</Text>

        <View style={styles.inputContainer}>
          <Controller
            control={control}
            rules={{ required: t("changePassword.validation.requiredCurrent") }}
            name="currentPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <>
                <Text style={styles.label}>
                  {t("changePassword.labels.currentPassword")}
                </Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder={t(
                      "changePassword.placeholders.currentPassword"
                    )}
                    placeholderTextColor="#999"
                    secureTextEntry={!showCurrentPassword}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowCurrentPassword((prev) => !prev)}
                  >
                    {!showCurrentPassword ? (
                      <AntDesign name="eye" size={24} color="gray" />
                    ) : (
                      <Entypo name="eye-with-line" size={24} color="gray" />
                    )}
                  </TouchableOpacity>
                </View>
                {errors.currentPassword && (
                  <Text style={styles.errorText}>
                    {String(errors.currentPassword.message)}
                  </Text>
                )}
              </>
            )}
          />
        </View>

        <View style={styles.inputContainer}>
          <Controller
            control={control}
            rules={{
              required: t("changePassword.validation.requiredNew"),
              minLength: {
                value: 8,
                message: t("changePassword.validation.minLengthNew"),
              },
            }}
            name="newPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <>
                <Text style={styles.label}>
                  {t("changePassword.labels.newPassword")}
                </Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder={t("changePassword.placeholders.newPassword")}
                    placeholderTextColor="#999"
                    secureTextEntry={!showNewPassword}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowNewPassword((prev) => !prev)}
                  >
                    {!showNewPassword ? (
                      <AntDesign name="eye" size={24} color="gray" />
                    ) : (
                      <Entypo name="eye-with-line" size={24} color="gray" />
                    )}
                  </TouchableOpacity>
                </View>
                {errors.newPassword && (
                  <Text style={styles.errorText}>
                    {String(errors.newPassword.message)}
                  </Text>
                )}
              </>
            )}
          />
        </View>

        <View style={styles.inputContainer}>
          <Controller
            control={control}
            rules={{
              required: t("changePassword.validation.confirmRequired"),
              validate: validatePasswordMatch,
            }}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <>
                <Text style={styles.label}>
                  {t("changePassword.labels.confirmPassword")}
                </Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder={t(
                      "changePassword.placeholders.confirmPassword"
                    )}
                    placeholderTextColor="#999"
                    secureTextEntry={!showConfirmPassword}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowConfirmPassword((prev) => !prev)}
                  >
                    {!showConfirmPassword ? (
                      <AntDesign name="eye" size={24} color="gray" />
                    ) : (
                      <Entypo name="eye-with-line" size={24} color="gray" />
                    )}
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword && (
                  <Text style={styles.errorText}>
                    {String(errors.confirmPassword.message)}
                  </Text>
                )}
              </>
            )}
          />
        </View>

        <TouchableOpacity
          style={[styles.buttonContainer, loading && styles.disabledButton]}
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
        >
          <LinearGradient
            colors={loading ? ["#999", "#666"] : ["#5d6dfe", "#7b25e5"]}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.buttonText}>
              {loading
                ? t("changePassword.buttons.changing")
                : t("changePassword.buttons.change")}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.passwordRequirements}>
          <Text style={styles.requirementsTitle}>
            {t("changePassword.requirements.title")}
          </Text>

          {requirementItems.map((item, idx) => (
            <Text key={idx} style={styles.requirementText}>
              • {item}
            </Text>
          ))}
        </View>
      </ImageBackground>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: wp(5),
  },
  backButton: {
    position: "absolute",
    top: hp(4),
    left: wp(4),
  },
  title: {
    fontSize: hp(4.5),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
    marginBottom: hp(4),
    color: "#fff",
    paddingHorizontal: hp(2),
  },
  inputContainer: {
    marginBottom: hp(2),
  },
  label: {
    fontSize: hp(1.6),
    fontFamily: "Rubik_400Regular",
    color: "#ddd",
    marginBottom: hp(1),
  },
  passwordInputContainer: {
    position: "relative",
  },
  input: {
    width: "100%",
    height: hp(6),
    borderRadius: 12,
    paddingHorizontal: wp(4),
    paddingRight: wp(12),
    backgroundColor: "#0000004D",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    fontSize: hp(1.8),
    color: "white",
  },
  eyeIcon: {
    position: "absolute",
    top: hp(1.5),
    right: wp(4),
    padding: wp(1),
  },
  buttonContainer: {
    marginTop: hp(3),
    borderRadius: 35,
    overflow: "hidden",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.7,
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
  errorText: {
    color: "red",
    fontSize: hp(1.4),
    marginTop: hp(0.5),
  },
  passwordRequirements: {
    marginTop: hp(3),
    paddingHorizontal: wp(2),
  },
  requirementsTitle: {
    fontSize: hp(1.6),
    fontFamily: "Rubik_600SemiBold",
    color: "#ddd",
    marginBottom: hp(1),
  },
  requirementText: {
    fontSize: hp(1.4),
    fontFamily: "Rubik_400Regular",
    color: "#bbb",
    marginBottom: hp(0.5),
  },
});

export default ChangePassword;
