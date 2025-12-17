import { useSignUp } from "@clerk/clerk-expo";
import { AntDesign, Entypo, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  ImageBackground,
  KeyboardAvoidingView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";

type formTypes = {
  userMail: string;
  userPassword: string;
};

const Register: React.FC = () => {
  const { t } = useTranslation();
  const { isLoaded, setActive, signUp } = useSignUp();
  const [loading, setLoading] = useState<Boolean>(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<formTypes>({
    defaultValues: {
      userMail: "",
      userPassword: "",
    },
  });

  const [showPassword, setShowPassword] = useState(false);

  // Watch password field for real-time validation
  const password = watch("userPassword", "");

  // Password validation checks
  const hasMinLength = password.length >= 6;
  const hasUpperCase = /[A-Z]/.test(password);

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const onSubmit = async (data: formTypes) => {
    setLoading(true);
    if (!isLoaded) {
      // Clerk not ready
      setLoading(false);
      return;
    }
    try {
      const signUpAttempt = await signUp.create({
        emailAddress: data.userMail,
        password: data.userPassword,
      });

      if (signUpAttempt.status === "complete") {
        reset();
        // Activate session if provided
        if (signUpAttempt.createdSessionId) {
          await setActive({
            session: signUpAttempt.createdSessionId,
            redirectUrl: "",
          });
        }
        setLoading(false);
        router.push("/(public)/(account)/registerDetails");
      } else {
        // handle other statuses (email_verification, needs_more, etc.) if needed
        setLoading(false);
      }
    } catch (error: any) {
      // localize toast / error handling as needed
      console.error("Sign up error:", error);
      setLoading(false);
      reset({ userPassword: "" });
      // show toast or alert — kept console + (optional) toast
      // Toast.error(t("register.toasts.signupError"));
    }
  };

  return (
    <ImageBackground
      style={{ flex: 1 }}
      source={require("@/assets/images/horoscope/regBg.png")}
    >
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" color={"gray"} size={24} />
          </TouchableOpacity>

          <Text style={styles.title}>{t("register.title")}</Text>

          <View style={styles.inputContainer}>
            <Controller
              control={control}
              rules={{
                required: t("register.validation.required"),
                pattern: {
                  value: emailRegex,
                  message: t("register.validation.invalidEmail"),
                },
              }}
              name="userMail"
              render={({ field: { onChange, onBlur, value } }) => (
                <>
                  <Text style={styles.label}>{t("register.labels.email")}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t("register.placeholders.email")}
                    placeholderTextColor="#999"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    autoCapitalize="none"
                    textContentType="emailAddress"
                    keyboardType="email-address"
                  />
                  {errors.userMail && (
                    <Text style={styles.errorText}>
                      {String(errors.userMail.message)}
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
                required: t("register.validation.required"),
                minLength: {
                  value: 6,
                  message: t("register.validation.minLength"),
                },
                validate: {
                  hasUpperCase: (value) =>
                    /[A-Z]/.test(value) || t("register.validation.uppercase"),
                },
              }}
              name="userPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <>
                  <Text style={styles.label}>
                    {t("register.labels.password")}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t("register.placeholders.password")}
                    placeholderTextColor="#999"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  {errors.userPassword && (
                    <Text style={styles.errorText}>
                      {String(errors.userPassword.message)}
                    </Text>
                  )}

                  {!showPassword ? (
                    <AntDesign
                      style={{
                        position: "absolute",
                        top: hp(4.5),
                        right: wp(1.6),
                      }}
                      name="eye"
                      size={24}
                      color="gray"
                      onPress={() => setShowPassword((prev) => !prev)}
                    />
                  ) : (
                    <Entypo
                      name="eye-with-line"
                      size={24}
                      color="gray"
                      onPress={() => setShowPassword((prev) => !prev)}
                      style={{
                        position: "absolute",
                        top: hp(4.5),
                        right: wp(1.6),
                      }}
                    />
                  )}
                </>
              )}
            />

            {/* Password Requirements Indicators */}
            <View style={styles.requirementsContainer}>
              <Text
                style={[
                  styles.requirementText,
                  password.length > 0 &&
                    (hasMinLength
                      ? styles.requirementMet
                      : styles.requirementNotMet),
                ]}
              >
                • {t("register.requirements.minLength")}
              </Text>
              <Text
                style={[
                  styles.requirementText,
                  password.length > 0 &&
                    (hasUpperCase
                      ? styles.requirementMet
                      : styles.requirementNotMet),
                ]}
              >
                • {t("register.requirements.uppercase")}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.buttonContainer}
            onPress={handleSubmit(onSubmit)}
          >
            <LinearGradient
              style={styles.gradient}
              colors={["#616FFE", "#7F1FE2"]}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size={"large"} />
              ) : (
                <Text style={styles.buttonText}>
                  {t("register.buttons.create")}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
    </ImageBackground>
  );
};

export default Register;

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingTop: hp(3.8),
    justifyContent: "center",
    paddingHorizontal: wp(5),
    paddingBottom: hp(3),
  },
  backButton: {
    position: "absolute",
    top: hp(4),
    left: wp(4),
  },
  title: {
    fontSize: hp(4.5),
    color: "#fff",
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
    marginBottom: hp(4),
    paddingHorizontal: hp(2),
  },
  inputContainer: { marginBottom: hp(2) },
  label: {
    fontSize: hp(1.6),
    fontFamily: "Rubik_400Regular",
    color: "#DDD",
    marginBottom: hp(1),
  },
  input: {
    width: "100%",
    height: hp(6),
    borderRadius: 12,
    paddingHorizontal: wp(4),
    backgroundColor: "#0000004D",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    fontSize: hp(1.8),
    color: "#fff",
    position: "relative",
  },
  buttonContainer: {
    marginTop: hp(3),
    borderRadius: 35,
    overflow: "hidden",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    elevation: 3,
  },
  gradient: {
    paddingVertical: hp(1.8),
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: hp(2.3),
    fontFamily: "Rubik_600SemiBold",
  },
  errorText: {
    color: "red",
    fontSize: hp(1.4),
    marginTop: hp(0.8),
  },
  requirementsContainer: {
    marginTop: hp(1),
  },
  requirementText: {
    fontSize: hp(1.5),
    fontFamily: "Rubik_400Regular",
    color: "#DDD",
    marginBottom: hp(0.5),
  },
  requirementMet: {
    color: "#4ade80",
  },
  requirementNotMet: {
    color: "#ef4444",
  },
});
