import { useAppSelector } from "@/redux/hooks";
import { useUser } from "@clerk/clerk-expo";
import { useMutation } from "convex/react";
import { useEffect, useState } from "react";
import Purchases from "react-native-purchases";
import { api } from "../convex/_generated/api";

export const usePremiumStatus = () => {
  const { user } = useUser();
  const currentUser = useAppSelector((state) => state.horoscope.userData);
  const checkValidity = useMutation(api.users.checkSubscriptionValidity);
  const updateSubscription = useMutation(api.users.updateSubscription);

  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  // Check subscription validity on mount and when user changes
  // Always check, not just when userType is premium, to catch sync issues
  useEffect(() => {
    if (user?.id) {
      checkSubscriptionStatus();
    }
  }, [user?.id]);

  const checkSubscriptionStatus = async () => {
    if (!user?.id || isChecking) return;

    setIsChecking(true);
    try {
      // First, sync with RevenueCat (source of truth for subscriptions)
      await Purchases.logIn(user.id);
      const customerInfo = await Purchases.getCustomerInfo();

      const isPremiumActive =
        typeof customerInfo.entitlements.active["Premium"] !== "undefined";

      // If RevenueCat says premium but DB doesn't match, sync it
      if (isPremiumActive && currentUser?.userType !== "premium") {
        console.log("🔄 Syncing: RevenueCat says premium, updating database...");
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
        console.log("✅ Database synced with RevenueCat premium status");
      }

      // If RevenueCat says not premium but DB says premium, sync it
      if (!isPremiumActive && currentUser?.userType === "premium") {
        console.log("🔄 Syncing: RevenueCat says not premium, updating database...");
        await updateSubscription({
          clerkId: user.id,
          userType: "normal",
          subscriptionStatus: "expired",
          revenueCatUserId: customerInfo.originalAppUserId,
        });
        console.log("✅ Database synced with RevenueCat (downgraded to normal)");
      }

      // Then check with backend for validity (expiration, etc.)
      await checkValidity({ clerkId: user.id });

      setLastChecked(new Date());
    } catch (error) {
      console.error("Error checking subscription status:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const isPremium = currentUser?.userType === "premium";
  const isFree = !isPremium;

  // Subscription info
  const subscriptionEndDate = currentUser?.subscriptionEndDate
    ? new Date(currentUser.subscriptionEndDate)
    : null;

  const daysUntilExpiration = subscriptionEndDate
    ? Math.ceil(
        (subscriptionEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : null;

  const isExpiringSoon =
    daysUntilExpiration !== null && daysUntilExpiration <= 7;

  return {
    isPremium,
    isFree,
    userType: currentUser?.userType,
    subscriptionEndDate,
    daysUntilExpiration,
    isExpiringSoon,
    isChecking,
    lastChecked,
    refreshStatus: checkSubscriptionStatus,
  };
};
