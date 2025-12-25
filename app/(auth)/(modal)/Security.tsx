import {
  AntDesign,
  FontAwesome,
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

type IconLibrary = "AntDesign" | "MaterialIcons" | "FontAwesome" | "Ionicons";

interface DataCollectedItem {
  iconLib: IconLibrary;
  iconName: string;
  title: string;
  items: string[];
  purpose: string;
}

interface Section {
  title: string;
  content: string;
}

interface KeyPoint {
  iconLib: IconLibrary;
  iconName: string;
  text: string;
}

const PrivacyPolicyScreen = () => {
  const { t } = useTranslation();

  const dataCollected = [
    {
      iconLib: "AntDesign",
      iconName: "calendar",
      title: t("privacyPolicy.dataCollected.birthInformation.title"),
      items: t("privacyPolicy.dataCollected.birthInformation.items", {
        returnObjects: true,
      }) as string[],
      purpose: t("privacyPolicy.dataCollected.birthInformation.purpose"),
    },
    {
      iconLib: "Ionicons",
      iconName: "image-outline",
      title: t("privacyPolicy.dataCollected.profilePhotos.title"),
      items: t("privacyPolicy.dataCollected.profilePhotos.items", {
        returnObjects: true,
      }) as string[],
      purpose: t("privacyPolicy.dataCollected.profilePhotos.purpose"),
    },
    {
      iconLib: "Ionicons",
      iconName: "hand-left-outline",
      title: t("privacyPolicy.dataCollected.handPhotos.title"),
      items: t("privacyPolicy.dataCollected.handPhotos.items", {
        returnObjects: true,
      }) as string[],
      purpose: t("privacyPolicy.dataCollected.handPhotos.purpose"),
    },
    {
      iconLib: "AntDesign",
      iconName: "user",
      title: t("privacyPolicy.dataCollected.accountInformation.title"),
      items: t("privacyPolicy.dataCollected.accountInformation.items", {
        returnObjects: true,
      }) as string[],
      purpose: t("privacyPolicy.dataCollected.accountInformation.purpose"),
    },
    {
      iconLib: "AntDesign",
      iconName: "credit-card",
      title: t("privacyPolicy.dataCollected.paymentInformation.title"),
      items: t("privacyPolicy.dataCollected.paymentInformation.items", {
        returnObjects: true,
      }) as string[],
      purpose: t("privacyPolicy.dataCollected.paymentInformation.purpose"),
    },
  ];

  const sections = [
    {
      title: t("privacyPolicy.sections.informationWeCollect.title"),
      content: t("privacyPolicy.sections.informationWeCollect.content"),
    },
    {
      title: t("privacyPolicy.sections.howWeUse.title"),
      content: t("privacyPolicy.sections.howWeUse.content"),
    },
    {
      title: t("privacyPolicy.sections.dataSecurity.title"),
      content: t("privacyPolicy.sections.dataSecurity.content"),
    },
    {
      title: t("privacyPolicy.sections.premiumSubscriptions.title"),
      content: t("privacyPolicy.sections.premiumSubscriptions.content"),
    },
    {
      title: t("privacyPolicy.sections.dataRetention.title"),
      content: t("privacyPolicy.sections.dataRetention.content"),
    },
    {
      title: t("privacyPolicy.sections.yourRights.title"),
      content: t("privacyPolicy.sections.yourRights.content"),
    },
    {
      title: t("privacyPolicy.sections.thirdPartyServices.title"),
      content: t("privacyPolicy.sections.thirdPartyServices.content"),
    },
    {
      title: t("privacyPolicy.sections.childrensPrivacy.title"),
      content: t("privacyPolicy.sections.childrensPrivacy.content"),
    },
    {
      title: t("privacyPolicy.sections.changesToPolicy.title"),
      content: t("privacyPolicy.sections.changesToPolicy.content"),
    },
  ];

  const keyPoints = [
    {
      iconLib: "AntDesign",
      iconName: "lock",
      text: t("privacyPolicy.keyPoints.encryption"),
    },
    {
      iconLib: "AntDesign",
      iconName: "eye",
      text: t("privacyPolicy.keyPoints.noDataSelling"),
    },
    {
      iconLib: "AntDesign",
      iconName: "check-circle",
      text: t("privacyPolicy.keyPoints.fullControl"),
    },
  ];

  const handleContactPress = () => {
    Linking.openURL("mailto:ziya.d.ozgul@gmail.com");
  };

  const renderIcon = (
    iconLib: string,
    iconName: any,
    size: number,
    color: string
  ) => {
    const iconProps = { name: iconName, size, color };
    switch (iconLib) {
      case "AntDesign":
        return <AntDesign {...iconProps} />;
      case "MaterialIcons":
        return <MaterialIcons {...iconProps} />;
      case "FontAwesome":
        return <FontAwesome {...iconProps} />;
      case "Ionicons":
        return <Ionicons {...iconProps} />;
      default:
        return <AntDesign {...iconProps} />;
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={["#724cf2", "#b93bf3"]}
          style={styles.iconContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <AntDesign name="safety" size={40} color="#fff" />
        </LinearGradient>
        <Text style={styles.title}>{t("privacyPolicy.title")}</Text>
        <Text style={styles.date}>{t("privacyPolicy.lastUpdated")}</Text>
        <Text style={styles.subtitle}>{t("privacyPolicy.subtitle")}</Text>
      </View>

      {/* Data We Collect Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t("privacyPolicy.dataWeCollect")}
        </Text>
        {dataCollected.map((item, index) => (
          <View key={index} style={styles.dataCard}>
            <View style={styles.dataCardHeader}>
              <View style={styles.dataIconContainer}>
                {renderIcon(item.iconLib, item.iconName, 24, "#7b25e5")}
              </View>
              <View style={styles.dataCardContent}>
                <Text style={styles.dataCardTitle}>{item.title}</Text>
                {item.items.map((subItem, i) => (
                  <View key={i} style={styles.listItem}>
                    <View style={styles.bullet} />
                    <Text style={styles.listItemText}>{subItem}</Text>
                  </View>
                ))}
                <Text style={styles.purposeText}>{item.purpose}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Policy Sections */}
      <View style={styles.section}>
        {sections.map((section, index) => (
          <View key={index} style={styles.policyCard}>
            <View style={styles.policyHeader}>
              <View style={styles.policyBullet} />
              <Text style={styles.policyTitle}>{section.title}</Text>
            </View>
            <Text style={styles.policyContent}>{section.content}</Text>
          </View>
        ))}
      </View>

      {/* Key Points Highlight */}
      <LinearGradient
        colors={["#724cf2", "#b93bf3"]}
        style={styles.highlightCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <AntDesign
          name="lock"
          size={48}
          color="#fff"
          style={styles.highlightIcon}
        />
        <Text style={styles.highlightTitle}>
          {t("privacyPolicy.keyPoints.title")}
        </Text>
        <View style={styles.keyPointsContainer}>
          {keyPoints.map((item, i) => (
            <View key={i} style={styles.keyPoint}>
              {renderIcon(item.iconLib, item.iconName, 32, "#fff")}
              <Text style={styles.keyPointText}>{item.text}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* Contact Section */}
      <View style={styles.contactCard}>
        <Text style={styles.contactTitle}>
          {t("privacyPolicy.contact.title")}
        </Text>
        <Text style={styles.contactSubtitle}>
          {t("privacyPolicy.contact.subtitle")}
        </Text>
        <TouchableOpacity onPress={handleContactPress}>
          <LinearGradient
            colors={["#724cf2", "#b93bf3"]}
            style={styles.contactButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.contactButtonText}>
              {t("privacyPolicy.contact.button")}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDF8FF",
  },
  header: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 30,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#7b25e5",
    marginBottom: 8,
    textAlign: "center",
  },
  date: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#7b25e5",
    textAlign: "center",
    marginBottom: 20,
  },
  dataCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dataCardHeader: {
    flexDirection: "row",
  },
  dataIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  dataCardContent: {
    flex: 1,
  },
  dataCardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#7b25e5",
    marginBottom: 8,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#7b25e5",
    marginRight: 8,
  },
  listItemText: {
    fontSize: 13,
    color: "#666",
  },
  purposeText: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
    marginTop: 8,
  },
  policyCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  policyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  policyBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#7b25e5",
    marginRight: 12,
  },
  policyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#7b25e5",
    flex: 1,
  },
  policyContent: {
    fontSize: 14,
    color: "#333",
    lineHeight: 22,
  },
  highlightCard: {
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
  },
  highlightIcon: {
    marginBottom: 16,
  },
  highlightTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 24,
    textAlign: "center",
  },
  keyPointsContainer: {
    width: "100%",
  },
  keyPoint: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  keyPointText: {
    color: "#fff",
    fontWeight: "600",
    marginTop: 8,
    fontSize: 14,
  },
  contactCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 20,
    marginTop: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  contactTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#7b25e5",
    marginBottom: 12,
    textAlign: "center",
  },
  contactSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  contactButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
  },
  contactButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomSpacer: {
    height: 40,
  },
});

export default PrivacyPolicyScreen;
