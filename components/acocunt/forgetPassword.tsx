import { useAuth, useSignIn } from "@clerk/clerk-expo";
import { AntDesign, Entypo, Ionicons } from "@expo/vector-icons";
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
import LinearGradient from "react-native-linear-gradient";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import ToastManager, { Toast } from "toastify-react-native";

type EmailFormTypes = {
  email: string;
};

type CodeFormTypes = {
  code: string;
};

type PasswordFormTypes = {
  newPassword: string;
  confirmPassword: string;
};

type Step = "email" | "code" | "password" | "success";

const ForgetPassword: React.FC = () => {
  const { t } = useTranslation();
  const { isLoaded, signIn } = useSignIn();
  const { signOut } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<Step>("email");
  const [userEmail, setUserEmail] = useState<string>("");

  const emailForm = useForm<EmailFormTypes>({
    defaultValues: {
      email: "",
    },
  });

  const codeForm = useForm<CodeFormTypes>({
    defaultValues: {
      code: "",
    },
  });

  const passwordForm = useForm<PasswordFormTypes>({
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const onSubmitEmail = async (data: EmailFormTypes) => {
    if (!isLoaded) {
      Toast.error(
        t("forgetPassword.validation.clerkNotReady") ||
          "Service not ready. Please try again."
      );
      return;
    }

    setLoading(true);

    try {
      // Create a password reset attempt using Clerk's reset password flow
      const resetAttempt = await signIn.create({
        strategy: "reset_password_email_code",
        identifier: data.email,
      });

      // Clerk will send an email with a reset code
      if (resetAttempt.status === "needs_first_factor") {
        setUserEmail(data.email);
        setCurrentStep("code");
        Toast.success(
          t("forgetPassword.success.emailSent") ||
            "Password reset code sent! Check your inbox."
        );
        emailForm.reset();
      } else {
        setUserEmail(data.email);
        setCurrentStep("code");
        Toast.success(
          t("forgetPassword.success.emailSent") ||
            "Password reset code sent! Check your inbox."
        );
        emailForm.reset();
      }
    } catch (error: any) {
      console.error("Password reset error:", error);

      let errorMessage =
        t("forgetPassword.error.generic") ||
        "Failed to send reset email. Please try again.";

      if (error?.errors && error.errors.length > 0) {
        const clerkError = error.errors[0];
        if (clerkError.code === "form_identifier_not_found") {
          errorMessage =
            t("forgetPassword.error.emailNotFound") ||
            "Email address not found.";
        } else if (clerkError.code === "form_identifier_invalid") {
          errorMessage =
            t("forgetPassword.error.invalidEmail") || "Invalid email address.";
        } else {
          errorMessage =
            clerkError.longMessage || clerkError.message || errorMessage;
        }
      }

      Toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onSubmitCode = async (data: CodeFormTypes) => {
    if (!isLoaded || !signIn) {
      Toast.error(
        t("forgetPassword.validation.clerkNotReady") ||
          "Service not ready. Please try again."
      );
      return;
    }

    setLoading(true);

    try {
      // Attempt to verify the code
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: data.code,
      });

      if (result.status === "needs_new_password") {
        setCurrentStep("password");
        Toast.success(
          t("forgetPassword.success.codeVerified") ||
            "Code verified! Please enter your new password."
        );
        codeForm.reset();
      } else {
        Toast.error(
          t("forgetPassword.error.invalidCode") ||
            "Invalid code. Please try again."
        );
      }
    } catch (error: any) {
      console.error("Code verification error:", error);

      let errorMessage =
        t("forgetPassword.error.invalidCode") ||
        "Invalid code. Please try again.";

      if (error?.errors && error.errors.length > 0) {
        const clerkError = error.errors[0];
        errorMessage =
          clerkError.longMessage || clerkError.message || errorMessage;
      }

      Toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onSubmitPassword = async (data: PasswordFormTypes) => {
    if (!isLoaded || !signIn) {
      Toast.error(
        t("forgetPassword.validation.clerkNotReady") ||
          "Service not ready. Please try again."
      );
      return;
    }

    if (data.newPassword !== data.confirmPassword) {
      Toast.error(
        t("forgetPassword.error.passwordsDoNotMatch") ||
          "Passwords do not match."
      );
      return;
    }

    if (data.newPassword.length < 8) {
      Toast.error(
        t("forgetPassword.error.passwordTooShort") ||
          "Password must be at least 8 characters long."
      );
      return;
    }

    setLoading(true);

    try {
      // Reset the password
      const result = await signIn.resetPassword({
        password: data.newPassword,
      });

      if (result.status === "complete") {
        // Password reset successful - sign out user so they need to login again
        try {
          // Sign out any existing session
          await signOut();
        } catch (signOutError) {
          console.error(
            "Error signing out after password reset:",
            signOutError
          );
          // Continue even if sign out fails
        }

        // Show success message
        Toast.success(
          t("forgetPassword.success.passwordReset") ||
            "Password reset successfully! Please login with your new password."
        );
        passwordForm.reset();

        // Wait 0.5 seconds for user to read the message, then redirect to login page
        setTimeout(() => {
          router.replace("/(public)/(account)/login");
        }, 500);
      } else {
        Toast.error(
          t("forgetPassword.error.resetFailed") ||
            "Failed to reset password. Please try again."
        );
      }
    } catch (error: any) {
      console.error("Password reset error:", error);

      let errorMessage =
        t("forgetPassword.error.resetFailed") ||
        "Failed to reset password. Please try again.";

      if (error?.errors && error.errors.length > 0) {
        const clerkError = error.errors[0];
        if (clerkError.code === "form_password_pwned") {
          errorMessage =
            t("forgetPassword.error.passwordPwned") ||
            "This password has been compromised. Please choose a different one.";
        } else if (clerkError.code === "form_password_validation_failed") {
          errorMessage =
            t("forgetPassword.error.passwordValidationFailed") ||
            "Password does not meet requirements.";
        } else {
          errorMessage =
            clerkError.longMessage || clerkError.message || errorMessage;
        }
      }

      Toast.error(errorMessage);
    } finally {
      setLoading(false);
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

          <Text style={styles.title}>
            {t("forgetPassword.title") || "Forget Password"}
          </Text>

          {currentStep === "email" && (
            <>
              <Text style={styles.description}>
                {t("forgetPassword.description") ||
                  "Enter your email address and we'll send you a code to reset your password."}
              </Text>

              <View style={styles.inputContainer}>
                <Controller
                  control={emailForm.control}
                  rules={{
                    required:
                      t("forgetPassword.validation.required") ||
                      "Email is required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message:
                        t("forgetPassword.validation.invalidEmail") ||
                        "Invalid email address",
                    },
                  }}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <>
                      <Text style={styles.label}>
                        {t("forgetPassword.labels.email") || "Email Address"}
                      </Text>
                      <TextInput
                        style={styles.input}
                        placeholder={
                          t("forgetPassword.placeholders.email") ||
                          "Enter your email"
                        }
                        placeholderTextColor="#999"
                        autoCapitalize="none"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        autoComplete="email"
                        textContentType="emailAddress"
                        keyboardType="email-address"
                        autoCorrect={false}
                        importantForAutofill="yes"
                      />
                      {emailForm.formState.errors.email && (
                        <Text style={styles.errorText}>
                          {String(emailForm.formState.errors.email.message)}
                        </Text>
                      )}
                    </>
                  )}
                />
              </View>

              <TouchableOpacity
                style={styles.buttonContainer}
                onPress={emailForm.handleSubmit(onSubmitEmail)}
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
                      {t("forgetPassword.buttons.sendCode") ||
                        "Send Reset Code"}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

          {currentStep === "code" && (
            <>
              <Text style={styles.description}>
                {t("forgetPassword.codeDescription", { email: userEmail }) ||
                  `We've sent a verification code to ${userEmail}. Please enter the code below.`}
              </Text>

              <View style={styles.inputContainer}>
                <Controller
                  control={codeForm.control}
                  rules={{
                    required:
                      t("forgetPassword.validation.codeRequired") ||
                      "Code is required",
                  }}
                  name="code"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <>
                      <Text style={styles.label}>
                        {t("forgetPassword.labels.code") || "Verification Code"}
                      </Text>
                      <TextInput
                        style={styles.input}
                        placeholder={
                          t("forgetPassword.placeholders.code") ||
                          "Enter the code"
                        }
                        placeholderTextColor="#999"
                        autoCapitalize="none"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        keyboardType="number-pad"
                        maxLength={6}
                      />
                      {codeForm.formState.errors.code && (
                        <Text style={styles.errorText}>
                          {String(codeForm.formState.errors.code.message)}
                        </Text>
                      )}
                    </>
                  )}
                />
              </View>

              <TouchableOpacity
                style={styles.buttonContainer}
                onPress={codeForm.handleSubmit(onSubmitCode)}
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
                      {t("forgetPassword.buttons.verifyCode") || "Verify Code"}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

          {currentStep === "password" && (
            <>
              <Text style={styles.description}>
                {t("forgetPassword.passwordDescription") ||
                  "Please enter your new password."}
              </Text>

              <View style={styles.inputContainer}>
                <Controller
                  control={passwordForm.control}
                  rules={{
                    required:
                      t("forgetPassword.validation.passwordRequired") ||
                      "Password is required",
                    minLength: {
                      value: 8,
                      message:
                        t("forgetPassword.error.passwordTooShort") ||
                        "Password must be at least 8 characters",
                    },
                  }}
                  name="newPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <>
                      <Text style={styles.label}>
                        {t("forgetPassword.labels.newPassword") ||
                          "New Password"}
                      </Text>
                      <View style={styles.passwordInputContainer}>
                        <TextInput
                          style={styles.passwordInput}
                          placeholder={
                            t("forgetPassword.placeholders.newPassword") ||
                            "Enter new password"
                          }
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
                            <Entypo
                              name="eye-with-line"
                              size={24}
                              color="gray"
                            />
                          )}
                        </TouchableOpacity>
                      </View>
                      {passwordForm.formState.errors.newPassword && (
                        <Text style={styles.errorText}>
                          {String(
                            passwordForm.formState.errors.newPassword.message
                          )}
                        </Text>
                      )}
                    </>
                  )}
                />
              </View>

              <View style={styles.inputContainer}>
                <Controller
                  control={passwordForm.control}
                  rules={{
                    required:
                      t("forgetPassword.validation.confirmPasswordRequired") ||
                      "Please confirm your password",
                    validate: (value) =>
                      value === passwordForm.getValues("newPassword") ||
                      t("forgetPassword.error.passwordsDoNotMatch") ||
                      "Passwords do not match",
                  }}
                  name="confirmPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <>
                      <Text style={styles.label}>
                        {t("forgetPassword.labels.confirmPassword") ||
                          "Confirm Password"}
                      </Text>
                      <View style={styles.passwordInputContainer}>
                        <TextInput
                          style={styles.passwordInput}
                          placeholder={
                            t("forgetPassword.placeholders.confirmPassword") ||
                            "Confirm new password"
                          }
                          placeholderTextColor="#999"
                          secureTextEntry={!showConfirmPassword}
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                          autoCapitalize="none"
                        />
                        <TouchableOpacity
                          style={styles.eyeIcon}
                          onPress={() =>
                            setShowConfirmPassword((prev) => !prev)
                          }
                        >
                          {!showConfirmPassword ? (
                            <AntDesign name="eye" size={24} color="gray" />
                          ) : (
                            <Entypo
                              name="eye-with-line"
                              size={24}
                              color="gray"
                            />
                          )}
                        </TouchableOpacity>
                      </View>
                      {passwordForm.formState.errors.confirmPassword && (
                        <Text style={styles.errorText}>
                          {String(
                            passwordForm.formState.errors.confirmPassword
                              .message
                          )}
                        </Text>
                      )}
                    </>
                  )}
                />
              </View>

              <TouchableOpacity
                style={styles.buttonContainer}
                onPress={passwordForm.handleSubmit(onSubmitPassword)}
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
                      {t("forgetPassword.buttons.resetPassword") ||
                        "Reset Password"}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

          {currentStep === "success" && (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>
                {t("forgetPassword.success.passwordResetMessage") ||
                  "Your password has been reset successfully! You can now login with your new password."}
              </Text>
              <TouchableOpacity
                style={styles.buttonContainer}
                onPress={() => router.back()}
              >
                <LinearGradient
                  colors={["#616FFE", "#7F1FE2"]}
                  style={styles.gradient}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.buttonText}>
                    {t("forgetPassword.buttons.backToLogin") || "Back to Login"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <ToastManager />
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
    marginBottom: hp(2),
    color: "#fff",
    paddingHorizontal: hp(2),
  },
  description: {
    fontSize: hp(1.8),
    fontFamily: "Rubik_400Regular",
    color: "#ddd",
    marginBottom: hp(3),
    paddingHorizontal: hp(2),
    lineHeight: hp(2.5),
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
  successContainer: {
    marginTop: hp(2),
  },
  successText: {
    fontSize: hp(1.8),
    fontFamily: "Rubik_400Regular",
    color: "#fff",
    marginBottom: hp(3),
    paddingHorizontal: hp(2),
    lineHeight: hp(2.5),
    textAlign: "center",
  },
  passwordInputContainer: {
    position: "relative",
    width: "100%",
  },
  passwordInput: {
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
    right: wp(4),
    top: hp(1.5),
  },
});

export default ForgetPassword;
