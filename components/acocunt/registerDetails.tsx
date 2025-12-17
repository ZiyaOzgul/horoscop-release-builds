import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setRegisterData } from "@/redux/horoscopeSlicer";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
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

type FormTypes = {
  userName: string;
  userSurname: string;
  userCountry: string;
  birthTime: string;
};

const RegisterDetails: React.FC = () => {
  const { t, i18n } = useTranslation();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormTypes>({
    defaultValues: {
      userName: "",
      userSurname: "",
      birthTime: "",
      userCountry: "",
    },
  });

  const isValidTime = (time: string) => {
    return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
  };

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState("");
  const currentData = useAppSelector((state) => state.horoscope.registerData);
  const dispatch = useAppDispatch();

  const onSubmit = (data: FormTypes) => {
    dispatch(
      setRegisterData({
        firstName: data.userName,
        lastName: data.userSurname,
        birthTime: data.birthTime,
        userCountry: data.userCountry,
      })
    );

    router.push("/(public)/(account)/registerDetailsGender");
  };

  const pickerLocale = i18n.language || undefined;

  return (
    <ImageBackground
      style={{ flex: 1 }}
      source={require("../../assets/images/horoscope/regBg.png")}
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

          <Text style={styles.title}>{t("registerDetails.title")}</Text>

          {/* Name */}
          <View style={styles.inputContainer}>
            <Controller
              control={control}
              rules={{ required: t("registerDetails.validation.required") }}
              name="userName"
              render={({ field: { onChange, onBlur, value } }) => (
                <>
                  <Text style={styles.label}>
                    {t("registerDetails.labels.name")}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t("registerDetails.placeholders.name")}
                    placeholderTextColor="#999"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
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

          {/* Surname */}
          <View style={styles.inputContainer}>
            <Controller
              control={control}
              rules={{ required: t("registerDetails.validation.required") }}
              name="userSurname"
              render={({ field: { onChange, onBlur, value } }) => (
                <>
                  <Text style={styles.label}>
                    {t("registerDetails.labels.surname")}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t("registerDetails.placeholders.surname")}
                    placeholderTextColor="#999"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                  {errors.userSurname && (
                    <Text style={styles.errorText}>
                      {String(errors.userSurname.message)}
                    </Text>
                  )}
                </>
              )}
            />
          </View>

          {/* Country/City */}
          <View style={styles.inputContainer}>
            <Controller
              control={control}
              rules={{ required: t("registerDetails.validation.required") }}
              name="userCountry"
              render={({ field: { onChange, onBlur, value } }) => (
                <>
                  <Text style={styles.label}>
                    {t("registerDetails.labels.country")}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t("registerDetails.placeholders.country")}
                    placeholderTextColor="#999"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                  {errors.userCountry && (
                    <Text style={styles.errorText}>
                      {String(errors.userCountry.message)}
                    </Text>
                  )}
                </>
              )}
            />
          </View>

          {/* Birth Time */}
          <View style={styles.inputContainer}>
            <Controller
              control={control}
              rules={{
                required: t("registerDetails.validation.required"),
                validate: (value) =>
                  isValidTime(value) ||
                  t("registerDetails.validation.invalidTime"),
              }}
              name="birthTime"
              render={({ field: { onChange }, fieldState: { error } }) => (
                <>
                  <Text style={styles.label}>
                    {t("registerDetails.labels.birthTime")}
                  </Text>

                  <TouchableOpacity onPress={() => setShowTimePicker(true)}>
                    <TextInput
                      style={styles.input}
                      placeholder={t("registerDetails.placeholders.birthTime")}
                      placeholderTextColor="#999"
                      editable={false}
                      value={selectedTime}
                    />
                  </TouchableOpacity>

                  {showTimePicker && (
                    <DateTimePicker
                      value={new Date()}
                      mode="time"
                      is24Hour={true}
                      display="spinner"
                      locale={pickerLocale}
                      onChange={(event, date) => {
                        setShowTimePicker(false);
                        if (date) {
                          // Format to HH:MM (24h) reliably across locales
                          const hours = date
                            .getHours()
                            .toString()
                            .padStart(2, "0");
                          const minutes = date
                            .getMinutes()
                            .toString()
                            .padStart(2, "0");
                          const formattedTime = `${hours}:${minutes}`;
                          setSelectedTime(formattedTime);
                          onChange(formattedTime);
                        }
                      }}
                    />
                  )}

                  {error && (
                    <Text style={styles.errorText}>
                      {String(error.message)}
                    </Text>
                  )}
                </>
              )}
            />
          </View>

          <TouchableOpacity
            style={styles.buttonContainer}
            onPress={handleSubmit(onSubmit)}
          >
            <LinearGradient
              colors={["#616FFE", "#7F1FE2"]}
              style={styles.gradient}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.buttonText}>
                {t("registerDetails.buttons.next")}
              </Text>
              <Ionicons
                name="chevron-forward"
                color={"white"}
                size={24}
                style={{
                  position: "absolute",
                  top: hp(1.8),
                  right: wp(4),
                }}
              />
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
    marginBottom: hp(0.8),
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
    flexDirection: "row",
    marginTop: hp(3),
    borderRadius: 35,
    overflow: "hidden",
    width: wp(80),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    elevation: 3,
  },
  gradient: {
    paddingVertical: hp(1.8),
    alignItems: "center",
    width: wp(80),
    flexDirection: "row",
    justifyContent: "center",
    position: "relative",
  },
  buttonText: {
    color: "white",
    fontSize: hp(2.3),
    fontFamily: "Rubik_600SemiBold",
  },
  errorText: {
    color: "red",
    fontSize: hp(1.4),
    marginTop: hp(0.5),
  },
});

export default RegisterDetails;
