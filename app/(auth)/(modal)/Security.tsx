import {
  AntDesign,
  FontAwesome,
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
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
  const dataCollected = [
    {
      iconLib: "AntDesign",
      iconName: "calendar",
      title: "Birth Information",
      items: ["Date of birth", "Time of birth", "Place of birth"],
      purpose:
        "To generate accurate horoscope readings and astrological charts",
    },
    {
      iconLib: "Ionicons",
      iconName: "image-outline",
      title: "Profile Photos",
      items: ["Optional profile picture"],
      purpose: "To personalize your account and enhance user experience",
    },
    {
      iconLib: "Ionicons",
      iconName: "hand-left-outline",
      title: "Hand Photos",
      items: ["Palm images for palmistry readings"],
      purpose: "To provide palm reading analysis and interpretations",
    },
    {
      iconLib: "AntDesign",
      iconName: "user",
      title: "Account Information",
      items: ["Email address", "Username", "Account preferences"],
      purpose: "To manage your account and communicate important updates",
    },
    {
      iconLib: "AntDesign",
      iconName: "creditcard",
      title: "Payment Information",
      items: ["Payment transactions for premium subscriptions"],
      purpose: "To process premium subscription purchases through Google Play",
    },
  ];

  const sections = [
    {
      title: "Information We Collect",
      content:
        "We collect information that you provide directly to us when using the Horoscope app. This includes personal data necessary for providing astrological services and enhancing your experience.",
    },
    {
      title: "How We Use Your Information",
      content:
        "Your birth information (date, time, and place) is used exclusively to generate personalized horoscopes, zodiac reports, and astrological insights. Profile photos are optional and stored securely on our servers. Hand photos submitted for palmistry readings are processed using our analysis algorithms and stored encrypted. We never share your personal photos with third parties.",
    },
    {
      title: "Data Security",
      content:
        "We implement industry-standard security measures to protect your personal information. All data is encrypted in transit and at rest. Hand photos and profile pictures are stored on secure servers with restricted access. We regularly update our security protocols to ensure your data remains protected.",
    },
    {
      title: "Premium Subscriptions",
      content:
        "Our premium subscription is processed through Google Play Store. We do not store your credit card or payment information directly. All payment processing is handled securely by Google Play. Your subscription information (active status, purchase date) is stored to manage your premium features access.",
    },
    {
      title: "Data Retention",
      content:
        "We retain your personal information for as long as your account is active or as needed to provide you services. You can request deletion of your account and all associated data at any time through the app settings or by contacting us. Upon deletion request, all your data including birth information, photos, and readings will be permanently removed within 30 days.",
    },
    {
      title: "Your Rights",
      content:
        "You have the right to access, update, or delete your personal information at any time. You can download a copy of your data, request corrections, or permanently delete your account. For premium subscribers, you can cancel your subscription through Google Play Store at any time.",
    },
    {
      title: "Third-Party Services",
      content:
        "We use Google Play Store for payment processing and may use analytics services to improve app performance. These services have their own privacy policies. We do not sell or share your personal information with third parties for marketing purposes.",
    },
    {
      title: "Children's Privacy",
      content:
        "Our app is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.",
    },
    {
      title: "Changes to Privacy Policy",
      content:
        "We may update this privacy policy from time to time. We will notify you of any significant changes through the app or via email. Continued use of the app after changes constitutes acceptance of the updated policy.",
    },
  ];

  const keyPoints = [
    { iconLib: "AntDesign", iconName: "lock", text: "End-to-end encryption" },
    { iconLib: "AntDesign", iconName: "eyeo", text: "No data selling" },
    {
      iconLib: "AntDesign",
      iconName: "checkcircleo",
      text: "Full control over your data",
    },
  ];

  const handleContactPress = () => {
    Linking.openURL("mailto:privacy@horoscopeapp.com");
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
          <AntDesign name="Safety" size={40} color="#fff" />
        </LinearGradient>
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.date}>Last updated: October 23, 2025</Text>
        <Text style={styles.subtitle}>
          Your privacy is important to us. This policy explains how we collect,
          use, and protect your personal information when you use the Horoscope
          app.
        </Text>
      </View>

      {/* Data We Collect Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data We Collect</Text>
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
        <Text style={styles.highlightTitle}>Your Data is Safe With Us</Text>
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
        <Text style={styles.contactTitle}>Questions About Privacy?</Text>
        <Text style={styles.contactSubtitle}>
          We're here to help. Contact our privacy team anytime.
        </Text>
        <TouchableOpacity onPress={handleContactPress}>
          <LinearGradient
            colors={["#724cf2", "#b93bf3"]}
            style={styles.contactButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.contactButtonText}>Contact Privacy Team</Text>
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
