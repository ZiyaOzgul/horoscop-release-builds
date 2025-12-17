import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
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

const ViewPalmistry: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { palmistryId } = useLocalSearchParams<{ palmistryId: string }>();

  const palmistry = useQuery(
    api.palmistries.getPalmistryById,
    palmistryId ? { palmistryId: palmistryId as any } : "skip"
  );

  if (!palmistry) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#8e61fe", "rgba(142, 97, 254, 0)"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={hp(3)} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t("palmistry.result.pageTitle") || "Palm Reading"}
          </Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.dateText}>
            {formatDate(palmistry.createdAt)}
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t("palmistry.result.summary") || "Summary"}
            </Text>
            <Text style={styles.sectionText}>{palmistry.analysis.summary}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t("palmistry.result.details") || "Details"}
            </Text>
            <Text style={styles.sectionText}>
              {palmistry.analysis.details}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t("palmistry.result.result") || "Future Insights"}
            </Text>
            <Text style={styles.sectionText}>
              {palmistry.analysis.result}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t("palmistry.result.handType") || "Hand Type"}
            </Text>
            <Text style={styles.sectionText}>
              {palmistry.analysis.hand_type}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t("palmistry.result.lifeLine") || "Life Line"}
            </Text>
            <Text style={styles.sectionText}>
              {palmistry.analysis.life_line}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t("palmistry.result.heartLine") || "Heart Line"}
            </Text>
            <Text style={styles.sectionText}>
              {palmistry.analysis.heart_line}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t("palmistry.result.fateLine") || "Fate Line"}
            </Text>
            <Text style={styles.sectionText}>
              {palmistry.analysis.fate_line}
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>

      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  gradient: {
    flex: 1,
    paddingTop: hp(6),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: wp(5),
    paddingBottom: hp(2),
  },
  backButton: {
    width: wp(10),
  },
  headerTitle: {
    fontSize: hp(2.5),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
    color: "#fff",
    flex: 1,
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(4),
  },
  dateText: {
    fontSize: hp(1.8),
    fontFamily: "Rubik_500Medium",
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    marginBottom: hp(3),
  },
  section: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 15,
    padding: wp(4),
    marginBottom: hp(2),
  },
  sectionTitle: {
    fontSize: hp(2.2),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
    color: "#fff",
    marginBottom: hp(1),
  },
  sectionText: {
    fontSize: hp(1.9),
    fontFamily: "Rubik_400Regular",
    color: "#fff",
    lineHeight: hp(2.8),
  },
  loadingText: {
    fontSize: hp(2),
    color: "#000",
    textAlign: "center",
    marginTop: hp(50),
  },
});

export default ViewPalmistry;

