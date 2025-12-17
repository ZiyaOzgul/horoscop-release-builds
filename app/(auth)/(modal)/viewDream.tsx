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

const ViewDream: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { dreamId } = useLocalSearchParams<{ dreamId: string }>();

  const dream = useQuery(
    api.dreams.getDreamById,
    dreamId ? { dreamId: dreamId as any } : "skip"
  );

  if (!dream) {
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
            {t("dreamResult.text") || "Dream Interpretation"}
          </Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.dateText}>
            {formatDate(dream.createdAt)}
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Dream</Text>
            <Text style={styles.sectionText}>
              {dream.dreamDescription}
            </Text>
          </View>

          {dream.symbols && dream.symbols.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Symbols & Meanings</Text>
              {dream.symbols.map((symbol, index) => (
                <View key={index} style={styles.symbolItem}>
                  <Text style={styles.symbolName}>{symbol.symbol}</Text>
                  {symbol.meanings && symbol.meanings.length > 0 && (
                    <View style={styles.meaningsContainer}>
                      {symbol.meanings.map((meaning, meaningIndex) => (
                        <Text key={meaningIndex} style={styles.meaningText}>
                          • {meaning}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overall Message</Text>
            <Text style={styles.sectionText}>
              {dream.overallMessage}
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
  symbolItem: {
    marginBottom: hp(2),
  },
  symbolName: {
    fontSize: hp(2),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
    color: "#fff",
    marginBottom: hp(0.5),
  },
  meaningsContainer: {
    marginLeft: wp(2),
  },
  meaningText: {
    fontSize: hp(1.8),
    fontFamily: "Rubik_400Regular",
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: hp(2.5),
    marginBottom: hp(0.5),
  },
  loadingText: {
    fontSize: hp(2),
    color: "#000",
    textAlign: "center",
    marginTop: hp(50),
  },
});

export default ViewDream;

