import { Colors } from "@/constants/Colors";
import { api } from "@/convex/_generated/api";
import { useAppSelector } from "@/redux/hooks";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import PagerView from "react-native-pager-view";
import Purchases, {
  PurchasesOffering,
  PurchasesPackage,
} from "react-native-purchases";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";

const Plans = () => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user } = useUser();
  const [currentPage, setCurrentPage] = useState(0);
  const [purchasing, setPurchasing] = useState(false);
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [selectedPackage, setSelectedPackage] =
    useState<PurchasesPackage | null>(null);
  const pagerRef = useRef<PagerView>(null);
  const currentUser = useAppSelector((state) => state.horoscope.userData);

  const updateSubscription = useMutation(api.users.updateSubscription);

  // Fetch RevenueCat offerings on mount
  useEffect(() => {
    fetchOfferings();
    checkCurrentSubscription();
  }, []);

  const fetchOfferings = async () => {
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current && offerings.current.availablePackages.length > 0) {
        setOfferings(offerings.current);

        const premiumPackage = offerings.current.availablePackages[0];
        setSelectedPackage(premiumPackage);

        console.log("✅ Offerings loaded:", offerings.current);
        console.log("📦 Product ID:", premiumPackage.product.identifier);
        console.log(
          "💰 Price (localized):",
          premiumPackage.product.priceString
        );
        console.log("💵 Price (numeric):", premiumPackage.product.price);
        console.log("🌍 Currency Code:", premiumPackage.product.currencyCode);
        console.log("📦 Package Type:", premiumPackage.packageType);
      } else {
        console.warn("⚠️ No offerings available");
      }
    } catch (error) {
      console.error("❌ Error fetching offerings:", error);
    }
  };

  const checkCurrentSubscription = async () => {
    if (!user?.id) return;

    try {
      await Purchases.logIn(user.id);
      const customerInfo = await Purchases.getCustomerInfo();
      console.log("data of user ----------->", customerInfo);

      const isPremium =
        typeof customerInfo.entitlements.active["Premium"] !== "undefined";

      if (isPremium) {
        const expirationDate =
          customerInfo.entitlements.active["Premium"]?.expirationDate;

        await updateSubscription({
          clerkId: user.id,
          userType: "premium",
          subscriptionStatus: "active",
          revenueCatUserId: customerInfo.originalAppUserId,
          subscriptionEndDate: expirationDate
            ? new Date(expirationDate).getTime()
            : undefined,
        });
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  };

  const handlePurchase = async () => {
    if (!user?.id) {
      Alert.alert(t("plans.errors.notSignedIn"), t("plans.errors.signInFirst"));
      return;
    }

    if (!selectedPackage) {
      Alert.alert(t("plans.errors.noOfferings"), t("plans.errors.tryAgain"));
      return;
    }

    setPurchasing(true);

    try {
      console.log("🛒 Starting purchase flow...");
      console.log("📦 Package:", selectedPackage.product.identifier);
      console.log("👤 User ID:", user.id);

      await Purchases.logIn(user.id);
      console.log("✅ Logged in to RevenueCat");

      const purchaseResult = await Purchases.purchasePackage(selectedPackage);
      const { customerInfo } = purchaseResult;

      console.log("✅ Purchase completed!");
      console.log("📋 Customer Info:", JSON.stringify(customerInfo, null, 2));
      console.log(
        "🎫 Active Entitlements:",
        Object.keys(customerInfo.entitlements.active)
      );
      console.log("🎫 All Entitlements:", customerInfo.entitlements);

      const isPremium =
        typeof customerInfo.entitlements.active["Premium"] !== "undefined";

      console.log("🔍 Premium check result:", isPremium);
      console.log(
        "🔍 Premium entitlement:",
        customerInfo.entitlements.active["Premium"]
      );

      if (isPremium) {
        const expirationDate =
          customerInfo.entitlements.active["Premium"]?.expirationDate;

        console.log("📅 Expiration Date:", expirationDate);

        try {
          await updateSubscription({
            clerkId: user.id,
            userType: "premium",
            subscriptionStatus: "active",
            revenueCatUserId: customerInfo.originalAppUserId,
            subscriptionEndDate: expirationDate
              ? new Date(expirationDate).getTime()
              : undefined,
          });
          console.log("✅ Subscription updated in database");
        } catch (updateError) {
          console.error(
            "❌ Error updating subscription in database:",
            updateError
          );
          // Still show success even if DB update fails - RevenueCat has the purchase
        }

        Alert.alert(t("plans.success.title"), t("plans.success.message"), [
          {
            text: t("plans.success.ok"),
            onPress: () => {
              console.log("✅ User acknowledged success, navigating back");
              router.back();
            },
          },
        ]);
      } else {
        // Purchase succeeded but premium entitlement not found - might be a delay
        console.warn(
          "⚠️ Purchase completed but premium entitlement not found immediately"
        );
        console.warn("⚠️ This might be a timing issue. Checking again...");

        // Try to refresh customer info
        try {
          const refreshedInfo = await Purchases.getCustomerInfo();
          const refreshedIsPremium =
            typeof refreshedInfo.entitlements.active["Premium"] !== "undefined";

          console.log(
            "🔄 Refreshed customer info - Premium:",
            refreshedIsPremium
          );

          if (refreshedIsPremium) {
            const expirationDate =
              refreshedInfo.entitlements.active["Premium"]?.expirationDate;

            await updateSubscription({
              clerkId: user.id,
              userType: "premium",
              subscriptionStatus: "active",
              revenueCatUserId: refreshedInfo.originalAppUserId,
              subscriptionEndDate: expirationDate
                ? new Date(expirationDate).getTime()
                : undefined,
            });

            Alert.alert(t("plans.success.title"), t("plans.success.message"), [
              {
                text: t("plans.success.ok"),
                onPress: () => router.back(),
              },
            ]);
          } else {
            // Purchase succeeded but entitlement still not available
            console.error(
              "❌ Purchase succeeded but premium entitlement still not available"
            );
            Alert.alert(
              t("plans.success.title") || "Purchase Successful",
              "Your purchase was successful! The premium features will be activated shortly. Please refresh the app if needed.",
              [
                {
                  text: t("plans.success.ok") || "OK",
                  onPress: () => router.back(),
                },
              ]
            );
          }
        } catch (refreshError) {
          console.error("❌ Error refreshing customer info:", refreshError);
          // Still show success - purchase went through
          Alert.alert(
            t("plans.success.title") || "Purchase Successful",
            "Your purchase was successful! The premium features will be activated shortly.",
            [
              {
                text: t("plans.success.ok") || "OK",
                onPress: () => router.back(),
              },
            ]
          );
        }
      }
    } catch (error: any) {
      console.error("❌ Purchase error:", error);
      console.error("❌ Error details:", JSON.stringify(error, null, 2));

      if (error.userCancelled) {
        console.log("ℹ️ User cancelled the purchase");
        // Don't show error for user cancellation
      } else if (
        error.code === "6" ||
        error.readableErrorCode === "ProductAlreadyPurchasedError" ||
        error.message?.includes("already active") ||
        error.message?.includes("already purchased")
      ) {
        // User already has an active subscription - treat as success
        console.log(
          "ℹ️ Product already purchased - checking current subscription"
        );
        try {
          const customerInfo = await Purchases.getCustomerInfo();
          const isPremium =
            typeof customerInfo.entitlements.active["Premium"] !== "undefined";

          if (isPremium) {
            const expirationDate =
              customerInfo.entitlements.active["Premium"]?.expirationDate;

            // Update database
            try {
              await updateSubscription({
                clerkId: user.id,
                userType: "premium",
                subscriptionStatus: "active",
                revenueCatUserId: customerInfo.originalAppUserId,
                subscriptionEndDate: expirationDate
                  ? new Date(expirationDate).getTime()
                  : undefined,
              });
              console.log("✅ Subscription updated in database");
            } catch (updateError) {
              console.error(
                "❌ Error updating subscription in database:",
                updateError
              );
            }

            // Show success message
            Alert.alert(
              t("plans.success.title") || "Subscription Active",
              t("plans.success.alreadyActive") ||
                "You already have an active premium subscription!",
              [
                {
                  text: t("plans.success.ok") || "OK",
                  onPress: () => router.back(),
                },
              ]
            );
          } else {
            // Subscription exists but not premium - show info message
            Alert.alert(
              t("plans.success.title") || "Subscription Found",
              t("plans.success.subscriptionFound") ||
                "A subscription was found but premium features are not active. Please try restoring purchases.",
              [{ text: t("plans.success.ok") || "OK" }]
            );
          }
        } catch (checkError) {
          console.error("❌ Error checking subscription:", checkError);
          Alert.alert(
            t("plans.success.title") || "Subscription Active",
            t("plans.success.alreadyActive") ||
              "You already have an active subscription!",
            [{ text: t("plans.success.ok") || "OK" }]
          );
        }
      } else {
        const errorMessage =
          error.message || error.toString() || "Unknown error";
        console.error("❌ Purchase failed:", errorMessage);
        Alert.alert(t("plans.errors.purchaseFailed"), errorMessage);
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    if (!user?.id) return;

    setPurchasing(true);
    try {
      await Purchases.logIn(user.id);
      const customerInfo = await Purchases.restorePurchases();

      const isPremium =
        typeof customerInfo.entitlements.active["Premium"] !== "undefined";

      if (isPremium) {
        const expirationDate =
          customerInfo.entitlements.active["Premium"]?.expirationDate;

        await updateSubscription({
          clerkId: user.id,
          userType: "premium",
          subscriptionStatus: "active",
          revenueCatUserId: customerInfo.originalAppUserId,
          subscriptionEndDate: expirationDate
            ? new Date(expirationDate).getTime()
            : undefined,
        });

        Alert.alert(t("plans.restore.success"), t("plans.restore.restored"));
      } else {
        Alert.alert(
          t("plans.restore.notFound"),
          t("plans.restore.noSubscription")
        );
      }
    } catch (error) {
      console.error("Restore error:", error);
      Alert.alert(t("plans.errors.restoreFailed"));
    } finally {
      setPurchasing(false);
    }
  };

  const getPriceInfo = () => {
    if (!selectedPackage) {
      return {
        price: t("plans.premium.price"),
        period: t("plans.premium.period"),
        currency: "",
      };
    }

    const product = selectedPackage.product;
    let period = t("plans.premium.period");

    return {
      price: product.priceString,
      period: period,
      currency: product.currencyCode,
    };
  };

  const priceInfo = getPriceInfo();

  const plans = [
    {
      id: "free",
      name: t("plans.free.name"),
      price: t("plans.free.price"),
      period: t("plans.free.period"),
      color: Colors.purpleColorBlack || "#6B4CE6",
      features: [
        {
          icon: "hourglass-outline",
          text: t("plans.features.horoscope"),
          available: true,
        },
        {
          icon: "moon-outline",
          text: t("plans.features.dream"),
          available: true,
        },
        {
          icon: "hand-left-outline",
          text: t("plans.features.palmistry"),
          available: true,
        },
        {
          icon: "eye-outline",
          text: t("plans.features.unlimited"),
          available: false,
        },
        {
          icon: "time-outline",
          text: t("plans.features.tracking"),
          available: false,
        },
        {
          icon: "analytics-outline",
          text: t("plans.features.adFree"),
          available: false,
        },
      ],
      note: t("plans.notes.ads"),
      current: currentUser?.userType === "normal",
    },
    {
      id: "premium",
      name: t("plans.premium.name"),
      price: priceInfo.price,
      period: priceInfo.period,
      color: "#FFD700",
      features: [
        {
          icon: "hourglass",
          text: t("plans.features.horoscope"),
          available: true,
        },
        { icon: "moon", text: t("plans.features.dream"), available: true },
        {
          icon: "hand-left",
          text: t("plans.features.palmistry"),
          available: true,
        },
        { icon: "eye", text: t("plans.features.unlimited"), available: true },
        { icon: "time", text: t("plans.features.tracking"), available: true },
        {
          icon: "analytics",
          text: t("plans.features.adFree"),
          available: true,
        },
      ],
      note: t("plans.notes.cancel"),
      current: currentUser?.userType === "premium",
    },
  ];

  const handlePageSelected = (e: any) => {
    setCurrentPage(e.nativeEvent.position);
  };

  const PlanCard = ({
    plan,
    index,
  }: {
    plan: (typeof plans)[0];
    index: number;
  }) => {
    const isPremium = plan.id === "premium";

    return (
      <ScrollView
        style={styles.pageScrollView}
        contentContainerStyle={styles.pageScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageContainer}>
          <View style={[styles.card, isPremium && styles.premiumCard]}>
            {plan.current && (
              <View style={styles.currentBadge}>
                <Text style={styles.currentBadgeText}>
                  {t("plans.currentPlan")}
                </Text>
              </View>
            )}

            {isPremium && (
              <View style={styles.premiumBadge}>
                <Ionicons name="star" size={hp(2)} color="#FFD700" />
                <Text style={styles.premiumBadgeText}>
                  {t("plans.premium.name")}
                </Text>
              </View>
            )}

            <View style={styles.cardHeader}>
              <Text style={styles.planName}>{plan.name}</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.price}>{plan.price}</Text>
                <Text style={styles.period}>{plan.period}</Text>
              </View>
            </View>

            <View style={styles.featuresContainer}>
              {plan.features.map((feature, idx) => (
                <View key={idx} style={styles.featureRow}>
                  <View
                    style={[
                      styles.iconCircle,
                      feature.available
                        ? styles.iconCircleActive
                        : styles.iconCircleInactive,
                    ]}
                  >
                    <Ionicons
                      name={feature.icon as any}
                      size={hp(2.2)}
                      color={
                        feature.available
                          ? isPremium
                            ? "#FFD700"
                            : Colors.purpleColorBlack
                          : "#999"
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.featureText,
                      !feature.available && styles.featureTextInactive,
                    ]}
                  >
                    {feature.text}
                  </Text>
                  {feature.available ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={hp(2.5)}
                      color="#4CAF50"
                    />
                  ) : (
                    <Ionicons name="close-circle" size={hp(2.5)} color="#ddd" />
                  )}
                </View>
              ))}
            </View>

            <View style={styles.noteContainer}>
              <Ionicons
                name="information-circle-outline"
                size={hp(2)}
                color={Colors.purpleColorBlack || "#666"}
              />
              <Text style={styles.noteText}>{plan.note}</Text>
            </View>

            {!plan.current && (
              <TouchableOpacity
                style={[styles.selectButton, isPremium && styles.premiumButton]}
                onPress={() => {
                  if (isPremium) {
                    handlePurchase();
                  } else {
                    Alert.alert(
                      t("plans.downgrade.title"),
                      t("plans.downgrade.message")
                    );
                  }
                }}
                disabled={purchasing || (isPremium && !selectedPackage)}
              >
                {purchasing ? (
                  <ActivityIndicator color={isPremium ? "#000" : "#fff"} />
                ) : (
                  <>
                    <Text
                      style={[
                        styles.selectButtonText,
                        isPremium && styles.premiumButtonText,
                      ]}
                    >
                      {isPremium
                        ? t("plans.buttons.upgrade")
                        : t("plans.buttons.downgrade")}
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={hp(2.2)}
                      color={isPremium ? "#000" : "#fff"}
                    />
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButtonContainer}
          onPress={() => router.dismiss()}
        >
          <Ionicons
            color={Colors.purpleColorBlack}
            size={hp(3.4)}
            name="chevron-back"
          />
        </TouchableOpacity>

        <Text style={styles.title}>{t("plans.title")}</Text>
        <Text style={styles.subtitle}>{t("plans.subtitle")}</Text>
      </View>

      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={0}
        onPageSelected={handlePageSelected}
      >
        {plans.map((plan, index) => (
          <PlanCard key={plan.id} plan={plan} index={index} />
        ))}
      </PagerView>

      <View style={styles.footer}>
        <View style={styles.paginationContainer}>
          {plans.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.paginationDot,
                currentPage === index && styles.paginationDotActive,
              ]}
              onPress={() => pagerRef.current?.setPage(index)}
            />
          ))}
        </View>

        {/* Restore Purchases Button */}
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={purchasing}
        >
          <Text style={styles.restoreButtonText}>
            {t("plans.restore.button")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Loading Overlay */}
      {purchasing && (
        <View style={styles.purchasingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.purchasingText}>{t("plans.processing")}</Text>
        </View>
      )}

      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
    </View>
  );
};

export default Plans;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    paddingTop: hp(4),
    paddingBottom: hp(1),
    backgroundColor: "#f8f9fa",
  },
  backButtonContainer: {
    position: "absolute",
    top: hp(3.8),
    left: wp(4),
    zIndex: 10,
    backgroundColor: "#fff",
    borderRadius: hp(2),
    padding: hp(1),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: hp(3.5),
    color: Colors.purpleColorBlack || "#333",
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
    marginBottom: hp(1),
    paddingHorizontal: wp(5),
    textAlign: "center",
  },
  subtitle: {
    fontSize: hp(2),
    color: "#666",
    fontFamily: "Rubik_400Regular",
    marginBottom: hp(1),
    paddingHorizontal: wp(5),
    textAlign: "center",
  },
  pagerView: {
    flex: 1,
  },
  pageScrollView: {
    flex: 1,
  },
  pageScrollContent: {
    flexGrow: 1,
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
  },
  pageContainer: {
    flex: 1,
    justifyContent: "center",
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: hp(3),
    padding: hp(3),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    position: "relative",
  },
  premiumCard: {
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  currentBadge: {
    position: "absolute",
    top: hp(2),
    right: wp(5),
    backgroundColor: "#4CAF50",
    paddingHorizontal: hp(1.5),
    paddingVertical: hp(0.5),
    borderRadius: hp(1),
    zIndex: 1,
  },
  currentBadgeText: {
    color: "#fff",
    fontSize: hp(1.5),
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: hp(0.5),
    marginBottom: hp(1),
  },
  premiumBadgeText: {
    color: "#FFD700",
    fontSize: hp(1.8),
    fontFamily: "Rubik_700Bold",
    fontWeight: "700",
    letterSpacing: 1,
  },
  cardHeader: {
    marginBottom: hp(2),
  },
  planName: {
    fontSize: hp(3),
    color: Colors.purpleColorBlack || "#333",
    fontFamily: "Rubik_700Bold",
    fontWeight: "700",
    marginBottom: hp(1),
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: hp(0.5),
  },
  price: {
    fontSize: hp(4),
    color: Colors.purpleColorBlack || "#333",
    fontFamily: "Rubik_700Bold",
    fontWeight: "700",
  },
  period: {
    fontSize: hp(1.8),
    color: "#666",
    fontFamily: "Rubik_400Regular",
  },
  featuresContainer: {
    marginBottom: hp(2),
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp(1.5),
    gap: hp(1.5),
  },
  iconCircle: {
    width: hp(4),
    height: hp(4),
    borderRadius: hp(2),
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleActive: {
    backgroundColor: "#f0f0ff",
  },
  iconCircleInactive: {
    backgroundColor: "#f5f5f5",
  },
  featureText: {
    flex: 1,
    fontSize: hp(1.9),
    color: "#333",
    fontFamily: "Rubik_400Regular",
  },
  featureTextInactive: {
    color: "#999",
  },
  noteContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: hp(0.8),
    backgroundColor: "#f8f9fa",
    padding: hp(1.5),
    borderRadius: hp(1),
    marginBottom: hp(2),
  },
  noteText: {
    fontSize: hp(1.7),
    color: "#666",
    fontFamily: "Rubik_400Regular",
    flex: 1,
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: hp(1),
    backgroundColor: Colors.purpleColorBlack || "#6B4CE6",
    paddingVertical: hp(2),
    borderRadius: hp(1.5),
    marginTop: hp(1),
  },
  premiumButton: {
    backgroundColor: "#FFD700",
  },
  selectButtonText: {
    fontSize: hp(2),
    color: "#fff",
    fontFamily: "Rubik_600SemiBold",
    fontWeight: "600",
  },
  premiumButtonText: {
    color: "#000",
  },
  footer: {
    backgroundColor: "#f8f9fa",
    paddingBottom: hp(2),
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: hp(1),
    paddingVertical: hp(2),
  },
  paginationDot: {
    width: hp(1),
    height: hp(1),
    borderRadius: hp(0.5),
    backgroundColor: "#ddd",
  },
  paginationDotActive: {
    backgroundColor: Colors.purpleColorBlack || "#6B4CE6",
    width: hp(3),
  },
  restoreButton: {
    paddingVertical: hp(1),
    alignItems: "center",
  },
  restoreButtonText: {
    fontSize: hp(1.8),
    color: Colors.purpleColorBlack || "#6B4CE6",
    fontFamily: "Rubik_600SemiBold",
  },
  purchasingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  purchasingText: {
    color: "#fff",
    fontSize: hp(2),
    fontFamily: "Rubik_600SemiBold",
    marginTop: hp(2),
  },
  debugContainer: {
    backgroundColor: "#f0f0f0",
    padding: hp(1),
    marginHorizontal: wp(5),
    marginTop: hp(1),
    borderRadius: hp(1),
    borderWidth: 1,
    borderColor: "#ddd",
  },
  debugText: {
    fontSize: hp(1.6),
    color: "#666",
    fontFamily: "Rubik_400Regular",
  },
});
