import { useSignIn, useUser } from "@clerk/clerk-expo";
import { AntDesign, Entypo, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
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
import LinearGradient from "react-native-linear-gradient";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import ToastManager, { Toast } from "toastify-react-native";

type FormTypes = {
  userName: string;
  userPassword: string;
};

const Login: React.FC = () => {
  const { t } = useTranslation();
  const { isLoaded, setActive, signIn } = useSignIn();
  const { user, isLoaded: isUserLoaded } = useUser();
  const [loading, setLoading] = useState<boolean>(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FormTypes>({
    defaultValues: {
      userName: "",
      userPassword: "",
    },
  });

  const [showPassword, setShowPassword] = useState(false);

  // If user is already signed in, redirect to app
  useEffect(() => {
    if (isUserLoaded && user) {
      router.replace("/(public)/(account)/loading");
    }
  }, [isUserLoaded, user]);

  const onSubmit = async (data: FormTypes) => {
    setLoading(true);

    if (!isLoaded) {
      // Clerk not ready — show generic toast and bail out
      Toast.error(t("login.validation.invalidCredentials"));
      setLoading(false);
      return;
    }

    try {
      const signInAttempt = await signIn.create({
        identifier: data.userName,
        password: data.userPassword,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        reset();
        setLoading(false);
        // Redirect to loading page to check user profile and premium status
        router.replace("/(public)/(account)/loading");
      } else {
        // other statuses (e.g. needs second factor) can be handled here
        setLoading(false);
        Toast.error(t("login.toasts.signinError"));
      }
    } catch (error: any) {
      // Check if error is "already signed in"
      if (error?.errors?.[0]?.code === "form_identifier_exists" || 
          error?.message?.includes("already signed in") ||
          error?.toString()?.includes("already signed in")) {
        // User is already signed in, redirect to app
        console.log("User already signed in, redirecting...");
        router.replace("/(public)/(account)/loading");
        return;
      }
      
      // Localized toast & console for debugging
      Toast.error(t("login.toasts.signinError"));
      console.error("Sign-in error:", error);
      setLoading(false);
      // clear only password field, preserve email
      setValue("userPassword", "");
    }
  };

  return (
    <ImageBackground
      style={{ flex: 1 }}
      source={require("../../assets/images/horoscope/regBg.png")}
      resizeMode="cover"
    >
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="gray" />
          </TouchableOpacity>

          <Text style={styles.title}>{t("login.title")}</Text>

          <View style={styles.inputContainer}>
            <Controller
              control={control}
              rules={{ required: t("login.validation.required") }}
              name="userName"
              render={({ field: { onChange, onBlur, value } }) => (
                <>
                  <Text style={styles.label}>
                    {t("login.labels.emailOrUsername")}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t("login.placeholders.emailOrUsername")}
                    placeholderTextColor="#999"
                    autoCapitalize="none"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    autoComplete="email" // Suggests email addresses
                    textContentType="emailAddress" // iOS: Enables email suggestions
                    keyboardType="email-address" // Shows @ and . on keyboard
                    autoCorrect={false} // Disables autocorrect for emails
                    importantForAutofill="yes" // Android: Prioritizes for autofill
                  />
                  {errors.userName && (
                    <Text style={styles.errorText}>
                      {String(errors.userName.message)}
                    </Text>
                  )}
                </>
              )}
            />
          </View>

          <View style={styles.inputContainer}>
            <Controller
              control={control}
              rules={{ required: t("login.validation.required") }}
              name="userPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <>
                  <Text style={styles.label}>{t("login.labels.password")}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t("login.placeholders.password")}
                    placeholderTextColor="#999"
                    secureTextEntry={!showPassword}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    autoCapitalize="none"
                  />
                  {errors.userPassword && (
                    <Text style={styles.errorText}>
                      {String(errors.userPassword.message)}
                    </Text>
                  )}

                  {/*
                    Eye icon is positioned absolutely relative to parent.
                    Keep icons accessible by adding accessible props if needed.
                  */}
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
          </View>

          <TouchableOpacity
            style={styles.buttonContainer}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
          >
            <LinearGradient
              colors={["#616FFE", "#7F1FE2"]}
              style={styles.gradient}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator size="large" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {t("login.buttons.login")}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.forgetPasswordLink}
            onPress={() => router.push("/(public)/(account)/forgetPassword")}
          >
            <Text style={styles.forgetPasswordText}>
              {t("login.links.forgetPassword") || "Forget my password"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <ToastManager
        theme="dark"
        backgroundColor="#7F1FE2"
        textColor="#FFFFFF"
      />
    </ImageBackground>
  );
};

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
  input: {
    width: "100%",
    height: hp(6),
    borderRadius: 12,
    paddingHorizontal: wp(4),
    backgroundColor: "#0000004D",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    fontSize: hp(1.8),
    color: "white",
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
  forgetPasswordLink: {
    alignSelf: "flex-end",
    marginTop: hp(3),
    marginBottom: hp(1),
  },
  forgetPasswordText: {
    color: "#fff",
    fontSize: hp(1.6),
    fontFamily: "Rubik_400Regular",
  },
});

export default Login;
