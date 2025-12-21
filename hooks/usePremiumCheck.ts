import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setUserData } from "@/redux/horoscopeSlicer";
import { useUser } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import Purchases from "react-native-purchases";
import { api } from "../convex/_generated/api";

// Global flag to prevent concurrent subscription checks
let isSubscriptionCheckInProgress = false;

export const usePremiumStatus = () => {
  const { user } = useUser();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.horoscope.userData);
  const updateSubscription = useMutation(api.users.updateSubscription);
  const getUserData = useQuery(
    api.users.getUserWithClerkID,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const checkInProgressRef = useRef(false);

  // Update Redux when getUserData changes
  useEffect(() => {
    if (getUserData) {
      dispatch(setUserData(getUserData));
    }
  }, [getUserData, dispatch]);

  // Check subscription validity on mount and when user changes
  // Always check, not just when userType is premium, to catch sync issues
  useEffect(() => {
    if (user?.id && !checkInProgressRef.current) {
      checkSubscriptionStatus();
    }
  }, [user?.id]);

  const checkSubscriptionStatus = async () => {
    if (!user?.id || isChecking || checkInProgressRef.current || isSubscriptionCheckInProgress) {
      return;
    }

    setIsChecking(true);
    checkInProgressRef.current = true;
    isSubscriptionCheckInProgress = true;

    try {
      // First, sync with RevenueCat (source of truth for subscriptions)
      await Purchases.logIn(user.id);
      const customerInfo = await Purchases.getCustomerInfo();

      // Check for active entitlements (Platinum > Gold > Premium for backward compatibility)
      const platinumEntitlement = customerInfo.entitlements.active["Platinum"];
      const goldEntitlement = customerInfo.entitlements.active["Gold"];
      const premiumEntitlement = customerInfo.entitlements.active["Premium"]; // backward compatibility

      const activeEntitlement = platinumEntitlement || goldEntitlement || premiumEntitlement;
      const activeUserType = platinumEntitlement ? "platinum" : goldEntitlement ? "gold" : premiumEntitlement ? "premium" : null;

      let expirationTimestamp: number | undefined;
      const expirationDate = activeEntitlement?.expirationDate;

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

      // If RevenueCat says user has subscription but DB doesn't match, sync it
      if (activeUserType && currentUser?.userType !== activeUserType) {
        console.log(`🔄 Syncing: RevenueCat says ${activeUserType}, updating database...`);

        await updateSubscription({
          clerkId: user.id,
          userType: activeUserType,
          subscriptionStatus: "active",
          revenueCatUserId: customerInfo.originalAppUserId,
          subscriptionEndDate: expirationTimestamp,
        });
        console.log(`✅ Database synced with RevenueCat ${activeUserType} status`);
        
        // Wait a bit for database to update, then refresh Redux
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // If RevenueCat says no subscription but DB says user has one, sync it
      if (!activeUserType && currentUser?.userType && currentUser.userType !== "normal") {
        console.log("🔄 Syncing: RevenueCat says no subscription, updating database...");
        await updateSubscription({
          clerkId: user.id,
          userType: "normal",
          subscriptionStatus: "expired",
          revenueCatUserId: customerInfo.originalAppUserId,
        });
        console.log("✅ Database synced with RevenueCat (downgraded to normal)");
        
        // Wait a bit for database to update, then refresh Redux
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Check expiration only if subscription is active in RevenueCat
      // RevenueCat is the source of truth, so we just need to sync DB
      // Expiration is handled by RevenueCat itself
      if (activeUserType && expirationTimestamp) {
        const now = Date.now();
        if (expirationTimestamp < now) {
          // Subscription expired in RevenueCat but still marked as active
          console.warn("⚠️ Subscription expired according to expiration date");
          await updateSubscription({
            clerkId: user.id,
            userType: "normal",
            subscriptionStatus: "expired",
            revenueCatUserId: customerInfo.originalAppUserId,
          });
        }
      }

      setLastChecked(new Date());
    } catch (error) {
      console.error("Error checking subscription status:", error);
    } finally {
      setIsChecking(false);
      checkInProgressRef.current = false;
      isSubscriptionCheckInProgress = false;
    }
  };

  const isPremium = currentUser?.userType === "premium" || currentUser?.userType === "gold" || currentUser?.userType === "platinum";
  const isGold = currentUser?.userType === "gold";
  const isPlatinum = currentUser?.userType === "platinum";
  const isFree = currentUser?.userType === "normal" || !currentUser?.userType;

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
    isGold,
    isPlatinum,
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
