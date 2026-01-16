import { Colors } from "@/constants/Colors";
import { api } from "@/convex/_generated/api";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setUserData } from "@/redux/horoscopeSlicer";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
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
  const dispatch = useAppDispatch();
  const [currentPage, setCurrentPage] = useState(0);
  const [purchasing, setPurchasing] = useState(false);
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [selectedPackage, setSelectedPackage] =
    useState<PurchasesPackage | null>(null);
  const [goldPackage, setGoldPackage] = useState<PurchasesPackage | null>(null);
  const [platinumPackage, setPlatinumPackage] =
    useState<PurchasesPackage | null>(null);
  const pagerRef = useRef<PagerView>(null);
  const currentUser = useAppSelector((state) => state.horoscope.userData);

  const updateSubscription = useMutation(api.users.updateSubscription);
  const getUserData = useQuery(
    api.users.getUserWithClerkID,
    user?.id ? { clerkId: user.id } : "skip"
  );

  useEffect(() => {
    if (getUserData) {
      dispatch(setUserData(getUserData));
    }
  }, [getUserData, dispatch]);

  useEffect(() => {
    fetchOfferings();
  }, []);

  const fetchOfferings = async () => {
    try {
      const offerings = await Purchases.getOfferings();

      // Collect all packages from all offerings (current + others)
      let allPackages: PurchasesPackage[] = [];

      // First, log all offerings
      console.log("🔍 All offerings:");
      if (offerings.current) {
        console.log(
          `  - Current: ${offerings.current.identifier} (${offerings.current.availablePackages.length} packages)`
        );
        allPackages.push(...offerings.current.availablePackages);
      }

      // Check all other offerings too
      if (offerings.all && Object.keys(offerings.all).length > 0) {
        Object.entries(offerings.all).forEach(([key, offering]) => {
          if (key !== offerings.current?.identifier) {
            console.log(
              `  - ${key}: ${offering.identifier} (${offering.availablePackages.length} packages)`
            );
            allPackages.push(...offering.availablePackages);
          }
        });
      }

      // Set current offering for display (or first available)
      if (offerings.current) {
        setOfferings(offerings.current);
      } else if (offerings.all && Object.keys(offerings.all).length > 0) {
        const firstOffering = Object.values(offerings.all)[0];
        setOfferings(firstOffering);
      }

      if (allPackages.length > 0) {
        // Debug: Log all packages with details
        console.log(
          `🔍 Total packages from all offerings: ${allPackages.length}`
        );
        allPackages.forEach((pkg, index) => {
          console.log(`  Package ${index + 1}:`);
          console.log(`    - Package Identifier: ${pkg.identifier}`);
          console.log(`    - Product Identifier: ${pkg.product.identifier}`);
          console.log(`    - Product Title: ${pkg.product.title}`);
          console.log(`    - Price: ${pkg.product.priceString}`);
        });

        // Find gold_monthly and platinum_monthly packages from ALL offerings
        // Product identifiers: gold_monthly:base-gold and platinum_monthly:base-platinum
        // Priority: exact match first, then flexible matching
        const goldPkg = allPackages.find((pkg) => {
          const productId = pkg.product.identifier.toLowerCase();
          const packageId = pkg.identifier.toLowerCase();
          const title = pkg.product.title?.toLowerCase() || "";

          // Priority 1: Exact match for gold_monthly:base-gold
          if (
            productId === "gold_monthly:base-gold" ||
            productId.includes("gold_monthly:base-gold")
          ) {
            return true;
          }
          // Priority 2: Contains gold_monthly (but not platinum)
          if (
            productId.includes("gold_monthly") &&
            !productId.includes("platinum")
          ) {
            return true;
          }
          // Priority 3: Contains "gold" (but not "platinum")
          if (
            (productId.includes("gold") ||
              packageId.includes("gold") ||
              title.includes("gold")) &&
            !productId.includes("platinum") &&
            !packageId.includes("platinum") &&
            !title.includes("platinum")
          ) {
            return true;
          }
          return false;
        });

        const platinumPkg = allPackages.find((pkg) => {
          const productId = pkg.product.identifier.toLowerCase();
          const packageId = pkg.identifier.toLowerCase();
          const title = pkg.product.title?.toLowerCase() || "";

          // Priority 1: Exact match for platinum_monthly:base-platinum
          if (
            productId === "platinum_monthly:base-platinum" ||
            productId.includes("platinum_monthly:base-platinum")
          ) {
            return true;
          }
          // Priority 2: Contains platinum_monthly (but not gold)
          if (
            productId.includes("platinum_monthly") &&
            !productId.includes("gold")
          ) {
            return true;
          }
          // Priority 3: Contains "platinum" (but not "gold")
          if (
            (productId.includes("platinum") ||
              packageId.includes("platinum") ||
              title.includes("platinum")) &&
            !productId.includes("gold") &&
            !packageId.includes("gold") &&
            !title.includes("gold")
          ) {
            return true;
          }
          return false;
        });

        if (goldPkg) {
          setGoldPackage(goldPkg);
          console.log("✅ Gold package found!");
          console.log("   - Product ID:", goldPkg.product.identifier);
          console.log("   - Package ID:", goldPkg.identifier);
          console.log("   - Product Title:", goldPkg.product.title);
          console.log("   - Price:", goldPkg.product.priceString);

          // Verify it's not platinum
          const productId = goldPkg.product.identifier.toLowerCase();
          if (productId.includes("platinum")) {
            console.error(
              "❌ WARNING: Gold package seems to be Platinum! Check RevenueCat configuration."
            );
          }
        } else {
          console.warn("⚠️ Gold package NOT found in any offering");
          console.warn(
            "   Make sure you've added gold package to a RevenueCat offering"
          );
        }

        if (platinumPkg) {
          setPlatinumPackage(platinumPkg);
          console.log("✅ Platinum package found!");
          console.log("   - Product ID:", platinumPkg.product.identifier);
          console.log("   - Package ID:", platinumPkg.identifier);
          console.log("   - Product Title:", platinumPkg.product.title);
          console.log("   - Price:", platinumPkg.product.priceString);

          // Verify it's not gold
          const productId = platinumPkg.product.identifier.toLowerCase();
          if (productId.includes("gold") && !productId.includes("platinum")) {
            console.error(
              "❌ WARNING: Platinum package seems to be Gold! Check RevenueCat configuration."
            );
          }
        } else {
          console.warn("⚠️ Platinum package NOT found in any offering");
          console.warn(
            "   Make sure you've added platinum package to a RevenueCat offering"
          );
        }

        // Set default selected package to gold if available, otherwise platinum
        if (goldPkg) {
          setSelectedPackage(goldPkg);
        } else if (platinumPkg) {
          setSelectedPackage(platinumPkg);
        }

        if (offerings.current) {
          console.log(
            "✅ Current offering loaded:",
            offerings.current.identifier
          );
        }
        console.log(`📦 Total packages found: ${allPackages.length}`);
      } else {
        console.warn("⚠️ No packages available in any offering");
        console.warn(
          "   Check RevenueCat dashboard - make sure you have packages in your offerings"
        );
      }
    } catch (error) {
      console.error("❌ Error fetching offerings:", error);
    }
  };

  // Helper function to get active entitlement (Gold or Platinum)
  const getActiveEntitlement = (
    customerInfo: any
  ): {
    entitlement: any;
    userType: string;
  } | null => {
    const activeEntitlements = customerInfo.entitlements.active || {};
    const activeKeys = Object.keys(activeEntitlements);

    console.log("🔍 Checking active entitlements:", activeKeys);

    // Check all possible Platinum identifiers (case-insensitive and with/without underscore)
    const platinumKeys = [
      "Platinum",
      "platinum",
      "platinum_plan",
      "Platinum_Plan",
      "PLATINUM",
    ];
    for (const key of platinumKeys) {
      if (activeEntitlements[key]) {
        console.log(`✅ Found Platinum entitlement with exact key: ${key}`);
        return {
          entitlement: activeEntitlements[key],
          userType: "platinum",
        };
      }
    }

    // Check all possible Gold identifiers (case-insensitive and with/without underscore)
    const goldKeys = ["Gold", "gold", "gold_plan", "Gold_Plan", "GOLD"];
    for (const key of goldKeys) {
      if (activeEntitlements[key]) {
        return {
          entitlement: activeEntitlements[key],
          userType: "gold",
        };
      }
    }

    // Fallback to Premium for backward compatibility
    const premiumKeys = [
      "Premium",
      "premium",
      "premium_plan",
      "Premium_Plan",
      "PREMIUM",
    ];
    for (const key of premiumKeys) {
      if (activeEntitlements[key]) {
        return {
          entitlement: activeEntitlements[key],
          userType: "premium",
        };
      }
    }

    // If no exact match, check if any active entitlement contains "platinum" or "gold" in its identifier
    const allActiveKeys = Object.keys(activeEntitlements);
    for (const key of allActiveKeys) {
      const keyLower = key.toLowerCase();
      if (keyLower.includes("platinum")) {
        console.log(
          `✅ Found Platinum entitlement with partial match key: ${key}`
        );
        return {
          entitlement: activeEntitlements[key],
          userType: "platinum",
        };
      }
      if (keyLower.includes("gold") && !keyLower.includes("platinum")) {
        console.log(`✅ Found Gold entitlement with key: ${key}`);
        return {
          entitlement: activeEntitlements[key],
          userType: "gold",
        };
      }
    }

    console.warn("⚠️ No matching entitlement found. Active keys:", activeKeys);
    return null;
  };

  // Helper function to update subscription with retry
  const updateSubscriptionWithRetry = async (
    clerkId: string,
    customerInfo: any,
    maxRetries = 3
  ): Promise<boolean> => {
    const activeEntitlement = getActiveEntitlement(customerInfo);

    if (!activeEntitlement) {
      console.warn("⚠️ No active entitlement found");
      return false;
    }

    let expirationTimestamp: number | undefined;
    const expirationDate = activeEntitlement.entitlement?.expirationDate;

    if (expirationDate) {
      try {
        expirationTimestamp = new Date(expirationDate).getTime();
        if (isNaN(expirationTimestamp)) {
          console.warn("Invalid expiration date format:", expirationDate);
          expirationTimestamp = undefined;
        }
      } catch (dateError) {
        console.error("Error parsing expiration date:", dateError);
        expirationTimestamp = undefined;
      }
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await updateSubscription({
          clerkId: clerkId,
          userType: activeEntitlement.userType,
          subscriptionStatus: "active",
          revenueCatUserId: customerInfo.originalAppUserId,
          subscriptionEndDate: expirationTimestamp,
        });
        console.log(
          `✅ Subscription updated in database (attempt ${attempt}) - ${activeEntitlement.userType}`
        );
        return true;
      } catch (updateError) {
        console.error(
          `❌ Error updating subscription (attempt ${attempt}/${maxRetries}):`,
          updateError
        );
        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
    return false;
  };

  const handlePurchase = async (
    packageToPurchase?: PurchasesPackage | null
  ) => {
    if (!user?.id) {
      Alert.alert(t("plans.errors.notSignedIn"), t("plans.errors.signInFirst"));
      return;
    }

    // Use provided package or fallback to selectedPackage state
    const packageToUse = packageToPurchase || selectedPackage;

    if (!packageToUse) {
      Alert.alert(t("plans.errors.noOfferings"), t("plans.errors.tryAgain"));
      return;
    }

    setPurchasing(true);

    try {
      console.log("🛒 Starting purchase flow...");
      console.log("📦 Package Product ID:", packageToUse.product.identifier);
      console.log("📦 Package ID:", packageToUse.identifier);
      console.log("📦 Package Title:", packageToUse.product.title);
      console.log("👤 User ID:", user.id);

      await Purchases.logIn(user.id);
      console.log("✅ Logged in to RevenueCat");

      const purchaseResult = await Purchases.purchasePackage(packageToUse);
      const { customerInfo } = purchaseResult;

      console.log("✅ Purchase completed!");
      console.log("📋 Customer Info:", JSON.stringify(customerInfo, null, 2));
      console.log(
        "🎫 Active Entitlements:",
        Object.keys(customerInfo.entitlements.active)
      );
      console.log("🎫 All Entitlements:", customerInfo.entitlements);

      const activeEntitlement = getActiveEntitlement(customerInfo);

      console.log("🔍 Active entitlement check result:", activeEntitlement);
      console.log(
        "🔍 All entitlements:",
        Object.keys(customerInfo.entitlements.active)
      );

      if (activeEntitlement) {
        const expirationDate = activeEntitlement.entitlement?.expirationDate;

        console.log("📅 Expiration Date:", expirationDate);
        console.log("📦 User Type:", activeEntitlement.userType);

        // Update subscription with retry mechanism
        const updateSuccess = await updateSubscriptionWithRetry(
          user.id,
          customerInfo
        );

        if (!updateSuccess) {
          console.warn(
            "⚠️ Database update failed but RevenueCat has the purchase. Will sync on next check."
          );
        }

        // Wait for database update - Convex queries are reactive and will auto-update
        // Give enough time for the mutation to propagate and query to refresh
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Force Redux update by checking getUserData again
        // The useEffect will handle updating Redux when getUserData changes
        console.log(
          "✅ Purchase successful, waiting for Convex query to refresh user data"
        );

        // Determine subscription type for success message
        const subscriptionType =
          activeEntitlement.userType === "gold"
            ? "gold"
            : activeEntitlement.userType === "premium"
              ? "platinum"
              : "platinum";
        Alert.alert(
          t(`plans.success.${subscriptionType}.title`),
          t(`plans.success.${subscriptionType}.message`),
          [
            {
              text: t(`plans.success.${subscriptionType}.ok`),
              onPress: () => {
                console.log("✅ User acknowledged success, navigating back");
                // Small delay before navigating to ensure state is updated
                setTimeout(() => {
                  router.back();
                }, 100);
              },
            },
          ]
        );
      } else {
        // Purchase succeeded but entitlement not found - might be a delay
        console.warn(
          "⚠️ Purchase completed but entitlement not found immediately"
        );
        console.warn("⚠️ This might be a timing issue. Retrying with delay...");

        // Retry mechanism with delay
        let retryCount = 0;
        const maxRetries = 3;
        let refreshedEntitlement: {
          entitlement: any;
          userType: string;
        } | null = null;
        let refreshedInfo: any = null;

        while (retryCount < maxRetries && !refreshedEntitlement) {
          // Wait before retry (2 seconds, 3 seconds, 4 seconds)
          await new Promise((resolve) =>
            setTimeout(resolve, 2000 + retryCount * 1000)
          );
          retryCount++;

          try {
            refreshedInfo = await Purchases.getCustomerInfo();
            refreshedEntitlement = getActiveEntitlement(refreshedInfo);

            console.log(
              `🔄 Retry ${retryCount}/${maxRetries} - Entitlement:`,
              refreshedEntitlement
            );
          } catch (refreshError) {
            console.error(
              `❌ Error refreshing customer info (retry ${retryCount}):`,
              refreshError
            );
          }
        }

        if (refreshedEntitlement && refreshedInfo) {
          const updateSuccess = await updateSubscriptionWithRetry(
            user.id,
            refreshedInfo
          );

          if (!updateSuccess) {
            console.warn(
              "⚠️ Database update failed but RevenueCat has the purchase."
            );
          }

          // Wait for database update - Convex queries are reactive and will auto-update
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Determine subscription type for success message
          const subscriptionType =
            refreshedEntitlement.userType === "gold"
              ? "gold"
              : refreshedEntitlement.userType === "premium"
                ? "platinum"
                : "platinum";
          Alert.alert(
            t(`plans.success.${subscriptionType}.title`),
            t(`plans.success.${subscriptionType}.message`),
            [
              {
                text: t(`plans.success.${subscriptionType}.ok`),
                onPress: () => {
                  setTimeout(() => {
                    router.back();
                  }, 100);
                },
              },
            ]
          );
        } else {
          // Purchase succeeded but entitlement still not available after retries
          console.error(
            "❌ Purchase succeeded but premium entitlement still not available after retries"
          );
          // Try to determine subscription type from selected package
          const subscriptionType = selectedPackage?.product.identifier
            ?.toLowerCase()
            .includes("gold")
            ? "gold"
            : "platinum";
          Alert.alert(
            t(`plans.success.${subscriptionType}.title`) ||
              "Purchase Successful",
            "Your purchase was successful! The features will be activated shortly. Please refresh the app if needed.",
            [
              {
                text: t(`plans.success.${subscriptionType}.ok`) || "OK",
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
          const activeEntitlement = getActiveEntitlement(customerInfo);

          if (activeEntitlement) {
            const updateSuccess = await updateSubscriptionWithRetry(
              user.id,
              customerInfo
            );

            if (!updateSuccess) {
              console.warn(
                "⚠️ Database update failed but RevenueCat has the purchase."
              );
            }

            // Wait for database update - Convex queries are reactive and will auto-update
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Determine subscription type for success message
            const subscriptionType =
              activeEntitlement.userType === "gold"
                ? "gold"
                : activeEntitlement.userType === "premium"
                  ? "platinum"
                  : "platinum";
            // Show success message
            Alert.alert(
              t(`plans.success.${subscriptionType}.title`) ||
                "Subscription Active",
              t(`plans.success.${subscriptionType}.alreadyActive`) ||
                "You already have an active subscription!",
              [
                {
                  text: t(`plans.success.${subscriptionType}.ok`) || "OK",
                  onPress: () => {
                    setTimeout(() => {
                      router.back();
                    }, 100);
                  },
                },
              ]
            );
          } else {
            // Subscription exists but not active - show info message
            // Try to determine subscription type from package if available
            const subscriptionType = selectedPackage?.product.identifier
              ?.toLowerCase()
              .includes("gold")
              ? "gold"
              : "platinum";
            Alert.alert(
              t(`plans.success.${subscriptionType}.title`) ||
                "Subscription Found",
              t(`plans.success.${subscriptionType}.subscriptionFound`) ||
                "A subscription was found but features are not active. Please try restoring purchases.",
              [{ text: t(`plans.success.${subscriptionType}.ok`) || "OK" }]
            );
          }
        } catch (checkError) {
          console.error("❌ Error checking subscription:", checkError);
          // Fallback to platinum if we can't determine subscription type
          const subscriptionType = selectedPackage?.product.identifier
            ?.toLowerCase()
            .includes("gold")
            ? "gold"
            : "platinum";
          Alert.alert(
            t(`plans.success.${subscriptionType}.title`) ||
              "Subscription Active",
            t(`plans.success.${subscriptionType}.alreadyActive`) ||
              "You already have an active subscription!",
            [{ text: t(`plans.success.${subscriptionType}.ok`) || "OK" }]
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

  const getPriceInfo = (planId: string) => {
    let packageToUse: PurchasesPackage | null = null;

    if (planId === "gold") {
      packageToUse = goldPackage;
    } else if (planId === "platinum") {
      packageToUse = platinumPackage;
    }

    if (!packageToUse) {
      return {
        price:
          planId === "gold" ? t("plans.gold.price") : t("plans.platinum.price"),
        period: t("plans.gold.period"),
        currency: "",
      };
    }

    const product = packageToUse.product;
    let period = t("plans.gold.period");

    return {
      price: product.priceString,
      period: period,
      currency: product.currencyCode,
    };
  };

  const goldPriceInfo = getPriceInfo("gold");
  const platinumPriceInfo = getPriceInfo("platinum");

  // Use getUserData as primary source, fallback to currentUser from Redux
  const activeUserType = getUserData?.userType || currentUser?.userType;

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
      current: activeUserType === "normal",
    },
    {
      id: "gold",
      name: t("plans.gold.name"),
      price: goldPriceInfo.price,
      period: goldPriceInfo.period,
      color: "#FFD700",
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
          icon: "analytics",
          text: t("plans.features.adFree"),
          available: true,
        },
      ],
      note: t("plans.notes.cancel"),
      current: activeUserType === "gold",
    },
    {
      id: "platinum",
      name: t("plans.platinum.name"),
      price: platinumPriceInfo.price,
      period: platinumPriceInfo.period,
      color: "#E0E0E0", // Metallic silver - lighter and more premium
      features: [
        {
          icon: "hourglass",
          text: t("plans.features.detailedHoroscope"),
          available: true,
        },
        {
          icon: "moon",
          text: t("plans.features.dream"),
          available: true,
        },
        {
          icon: "hand-left",
          text: t("plans.features.palmistry"),
          available: true,
        },
        {
          icon: "eye",
          text: t("plans.features.unlimited"),
          available: true,
        },
        {
          icon: "time",
          text: t("plans.features.tracking"),
          available: true,
        },
        {
          icon: "analytics",
          text: t("plans.features.adFree"),
          available: true,
        },
        {
          icon: "albums",
          text: t("plans.features.unlimitedTarot"),
          available: true,
        },
      ],
      note: t("plans.notes.cancel"),
      current: activeUserType === "platinum",
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
    const isGold = plan.id === "gold";
    const isPlatinum = plan.id === "platinum";
    const isPaidPlan = isGold || isPlatinum;

    // Get the appropriate package for this plan
    const getPlanPackage = () => {
      if (isGold) return goldPackage;
      if (isPlatinum) return platinumPackage;
      return null;
    };

    const planPackage = getPlanPackage();

    return (
      <ScrollView
        style={styles.pageScrollView}
        contentContainerStyle={styles.pageScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageContainer}>
          <View
            style={[
              styles.card,
              isPaidPlan && styles.premiumCard,
              isGold && { borderColor: "#FFD700" },
              isPlatinum && { borderColor: "#C8C8C8", borderWidth: 2 }, // Metallic silver border - lighter
            ]}
          >
            {plan.current && (
              <View style={styles.currentBadge}>
                <Text style={styles.currentBadgeText}>
                  {t("plans.currentPlan")}
                </Text>
              </View>
            )}

            {isGold && (
              <View style={styles.premiumBadge}>
                <Ionicons name="star" size={hp(2)} color="#FFD700" />
                <Text style={[styles.premiumBadgeText, { color: "#FFD700" }]}>
                  {t("plans.gold.name")}
                </Text>
              </View>
            )}

            {isPlatinum && (
              <View
                style={[styles.premiumBadge, { backgroundColor: "#F0F0F0" }]}
              >
                <Ionicons name="diamond" size={hp(2)} color="#A5A5A5" />
                <Text
                  style={[
                    styles.premiumBadgeText,
                    { color: "#2C2C2C", fontWeight: "600" },
                  ]}
                >
                  {t("plans.platinum.name")}
                </Text>
              </View>
            )}

            <View style={styles.cardHeader}>
              {isPaidPlan && (
                <View style={styles.discountBadgeRibbon}>
                  <Text style={styles.discountBadgeRibbonText}>-%30</Text>
                </View>
              )}
              <View style={styles.planNameRow}>
                <Text style={styles.planName}>{plan.name}</Text>
              </View>
              <View style={styles.priceContainer}>
                <View style={styles.priceRow}>
                  <Text style={styles.price}>{plan.price}</Text>
                  {isPaidPlan && (
                    <View
                      style={[styles.discountBadge, styles.discountBadgeSmall]}
                    >
                      <Text
                        style={[
                          styles.discountBadgeText,
                          styles.discountBadgeTextSmall,
                        ]}
                      >
                        -%30
                      </Text>
                    </View>
                  )}
                </View>
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
                          ? isPaidPlan
                            ? isGold
                              ? "#FFD700"
                              : "#A5A5A5" // Metallic silver for platinum icons - lighter
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
                style={[
                  styles.selectButton,
                  isPaidPlan && styles.premiumButton,
                  isGold && { backgroundColor: "#FFD700" },
                  isPlatinum && {
                    backgroundColor: "#E0E0E0",
                    shadowColor: "#A5A5A5",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                    elevation: 5,
                  },
                ]}
                onPress={async () => {
                  if (isPaidPlan) {
                    // Get the appropriate package based on the plan
                    let packageToPurchase: PurchasesPackage | null = null;

                    if (isGold && goldPackage) {
                      packageToPurchase = goldPackage;
                      console.log("🛒 Selecting GOLD package for purchase:");
                      console.log("   - Plan ID:", plan.id);
                      console.log(
                        "   - Package Product ID:",
                        goldPackage.product.identifier
                      );
                      console.log("   - Package ID:", goldPackage.identifier);
                    } else if (isPlatinum && platinumPackage) {
                      packageToPurchase = platinumPackage;
                      console.log(
                        "🛒 Selecting PLATINUM package for purchase:"
                      );
                      console.log("   - Plan ID:", plan.id);
                      console.log(
                        "   - Package Product ID:",
                        platinumPackage.product.identifier
                      );
                      console.log(
                        "   - Package ID:",
                        platinumPackage.identifier
                      );
                    }

                    if (packageToPurchase) {
                      // Update state for UI consistency, but pass package directly to handlePurchase
                      setSelectedPackage(packageToPurchase);
                      // Pass package directly to avoid state timing issues
                      handlePurchase(packageToPurchase);
                    } else {
                      Alert.alert(
                        t("plans.errors.noOfferings"),
                        isGold
                          ? "Gold package not available. Please try again later."
                          : "Platinum package not available. Please try again later."
                      );
                    }
                  } else {
                    Alert.alert(
                      t("plans.downgrade.title"),
                      t("plans.downgrade.message")
                    );
                  }
                }}
                disabled={purchasing || (isPaidPlan && !planPackage)}
              >
                {purchasing ? (
                  <ActivityIndicator
                    color={
                      isPaidPlan ? (isPlatinum ? "#2C2C2C" : "#000") : "#fff"
                    }
                  />
                ) : (
                  <>
                    <Text
                      style={[
                        styles.selectButtonText,
                        isPaidPlan && styles.premiumButtonText,
                        isPlatinum && { color: "#2C2C2C", fontWeight: "600" },
                      ]}
                    >
                      {isPaidPlan
                        ? isGold
                          ? t("plans.buttons.getGold")
                          : isPlatinum
                            ? t("plans.buttons.getPlatinum")
                            : t("plans.buttons.upgrade")
                        : t("plans.buttons.downgrade")}
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={hp(2.2)}
                      color={
                        isPaidPlan ? (isPlatinum ? "#2C2C2C" : "#000") : "#fff"
                      }
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
    overflow: "visible",
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
    position: "relative",
    marginBottom: hp(2),
  },
  planNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: hp(1),
    marginBottom: hp(1),
    flexWrap: "wrap",
  },
  planName: {
    fontSize: hp(3),
    color: Colors.purpleColorBlack || "#333",
    fontFamily: "Rubik_700Bold",
    fontWeight: "700",
  },
  discountBadgeRibbon: {
    position: "absolute",
    top: -hp(3.5),
    right: -hp(1),
    backgroundColor: Colors.purpleColorBlack || "#7b25e5",
    paddingHorizontal: hp(2),
    paddingVertical: hp(0.8),
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.purpleColorBlack || "#7b25e5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
    transform: [{ rotate: "15deg" }],
    borderRadius: hp(1),
  },
  discountBadgeRibbonText: {
    color: "#fff",
    fontSize: hp(1.6),
    fontFamily: "Rubik_700Bold",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  priceContainer: {
    flexDirection: "column",
    gap: hp(0.5),
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: hp(1),
    flexWrap: "wrap",
  },
  price: {
    fontSize: hp(4),
    color: Colors.purpleColorBlack || "#333",
    fontFamily: "Rubik_700Bold",
    fontWeight: "700",
  },
  discountBadge: {
    backgroundColor: Colors.purpleColorBlack || "#7b25e5",
    paddingHorizontal: hp(1.2),
    paddingVertical: hp(0.6),
    borderRadius: hp(1),
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.purpleColorBlack || "#7b25e5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  discountBadgeSmall: {
    paddingHorizontal: hp(0.9),
    paddingVertical: hp(0.4),
    borderRadius: hp(0.7),
  },
  discountBadgeText: {
    color: "#fff",
    fontSize: hp(1.8),
    fontFamily: "Rubik_700Bold",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  discountBadgeTextSmall: {
    fontSize: hp(1.4),
    letterSpacing: 0.3,
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
});
