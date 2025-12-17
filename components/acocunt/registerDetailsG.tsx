import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Image,
  ImageBackground,
  KeyboardAvoidingView,
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

import { Colors } from "@/constants/Colors";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { updateRegisterData } from "@/redux/horoscopeSlicer";
import { useUser } from "@clerk/clerk-expo";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import LinearGradient from "react-native-linear-gradient";

type FormTypes = {
  dateOfBirth: string;
};

const RegisterDetailsG: React.FC = () => {
  const { t, i18n } = useTranslation();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormTypes>({
    defaultValues: {
      dateOfBirth: "",
    },
  });
  const router = useRouter();

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");

  // expects "DD.MM.YYYY"
  const isValidDateObject = (dateString: string) => {
    if (!dateString) return false;
    const parts = dateString.split(".");
    if (parts.length !== 3) return false;
    const [day, month, year] = parts.map((p) => Number(p));
    if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year))
      return false;
    const date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  };

  const registerData = useAppSelector((state) => state.horoscope.registerData);
  const [selectedGender, setSelectedGender] = useState<string>(
    registerData?.gender || ""
  );
  const dispatch = useAppDispatch();
  const { user } = useUser();

  const onSubmit = (data: FormTypes) => {
    const clerkId = user?.id;
    const userEmail = user?.emailAddresses?.[0]?.emailAddress;
    dispatch(
      updateRegisterData({
        birthTime: registerData?.birthTime,
        gender: selectedGender,
        birthDate: data.dateOfBirth,
        clerkId: clerkId,
        email: userEmail,
        city: registerData?.userCountry,
        firstName: registerData?.firstName,
        lastName: registerData?.lastName,
      })
    );
    router.push("/(public)/(account)/registerDetailsAddProfileP");
  };

  // Date formatting helper -> "DD.MM.YYYY"
  const formatDateToDDMMYYYY = (date: Date) => {
    const d = date.getDate().toString().padStart(2, "0");
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const y = date.getFullYear();
    return `${d}.${m}.${y}`;
  };

  // locale for DateTimePicker (may be used on some platforms)
  const pickerLocale = i18n.language;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior="padding"
      keyboardVerticalOffset={20}
    >
      <ImageBackground
        style={styles.container}
        source={require("../../assets/images/horoscope/regBg.png")}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="gray" />
        </TouchableOpacity>

        <Text style={styles.titleT}>{t("registerDetailsG.congrats")}</Text>
        <Text style={styles.title}>{t("registerDetailsG.subtitle")}</Text>

        <View style={styles.inputContainer}>
          <Controller
            control={control}
            rules={{
              required: t("registerDetailsG.validation.required"),
              validate: (value: string) =>
                (isValidDateObject(value) && true) ||
                t("registerDetailsG.validation.invalidDate"),
            }}
            name="dateOfBirth"
            render={({ field: { onChange }, fieldState: { error } }) => (
              <>
                <Text style={styles.label}>
                  {t("registerDetailsG.labels.dateOfBirth")}
                </Text>

                <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                  <TextInput
                    style={styles.input}
                    placeholder={t("registerDetailsG.placeholders.selectDate")}
                    placeholderTextColor="#999"
                    editable={false}
                    value={selectedDate}
                  />
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={new Date()}
                    mode="date"
                    display="calendar"
                    onChange={(event, date) => {
                      // hide picker
                      setShowDatePicker(false);
                      if (date) {
                        const formattedDate = formatDateToDDMMYYYY(date);
                        setSelectedDate(formattedDate);
                        onChange(formattedDate);
                      }
                    }}
                  />
                )}

                {error && (
                  <Text style={styles.errorText}>{String(error.message)}</Text>
                )}
              </>
            )}
          />
        </View>

        <Text style={styles.label}>{t("registerDetailsG.labels.gender")}</Text>
        <View style={styles.genderBox}>
          <TouchableOpacity
            style={styles.genderView}
            onPress={() => setSelectedGender("male")}
          >
            <LinearGradient
              colors={
                selectedGender === "male"
                  ? ["#0c0694", "#423bf5"]
                  : ["#3b26e1", "#5b68ff"]
              }
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientBox}
            >
              {selectedGender === "male" ? (
                <Image
                  source={require("@/assets/images/horoscope/maleSelect.png")}
                  style={styles.genderImage}
                />
              ) : (
                <Image
                  source={require("@/assets/images/horoscope/male.png")}
                  style={styles.genderImage}
                />
              )}
            </LinearGradient>
            <Text
              style={[
                styles.genderText,
                selectedGender === "male" && styles.selectedTextM,
              ]}
            >
              {t("registerDetailsG.labels.male")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.genderView}
            onPress={() => setSelectedGender("female")}
          >
            <LinearGradient
              colors={
                selectedGender === "female"
                  ? ["#7b25e5", "#efa4ff"]
                  : ["#a756fe", "#eca5ff"]
              }
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.gradientBox,
                selectedGender === "female" && styles.selectedGradient,
              ]}
            >
              {selectedGender === "female" ? (
                <Image
                  source={require("@/assets/images/horoscope/femenineSelect.png")}
                  style={styles.genderImage}
                />
              ) : (
                <Image
                  source={require("@/assets/images/horoscope/femenine.png")}
                  style={styles.genderImage}
                />
              )}
            </LinearGradient>
            <Text
              style={[
                styles.genderText,
                selectedGender === "female" && styles.selectedTextF,
              ]}
            >
              {t("registerDetailsG.labels.female")}
            </Text>
          </TouchableOpacity>
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
              {t("registerDetailsG.buttons.next")}
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

        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="light-content"
        />
      </ImageBackground>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: hp(3.8),
    justifyContent: "center",
    paddingHorizontal: wp(5),
  },
  backButton: {
    position: "absolute",
    top: hp(4),
    left: wp(4),
  },
  titleT: {
    fontSize: hp(4.5),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
    marginBottom: hp(1),
    color: "#fff",
    textAlign: "center",
  },
  title: {
    fontSize: hp(3.5),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
    marginBottom: hp(4),
    color: "#fff",
    paddingHorizontal: hp(1),
    paddingTop: hp(4),
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
    shadowOffset: { width: 1, height: 2 },
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
  genderBox: {
    paddingVertical: hp(5),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: hp(4),
  },
  genderView: {},
  gradientBox: {
    borderRadius: 999,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    width: hp(15),
    height: hp(15),
  },
  genderImage: {
    width: hp(10),
    height: hp(10),
  },
  genderText: {
    color: Colors.border,
    fontSize: hp(1.8),
    fontFamily: "Rubik_600SemiBold",
    paddingTop: hp(2),
    fontWeight: "600",
    textAlign: "center",
  },
  selectedGradient: {},
  selectedTextF: {
    color: Colors.purpleColor,
  },
  selectedTextM: {
    color: "#4f3fff",
  },
});

export default RegisterDetailsG;
