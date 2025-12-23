import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setUserData } from "@/redux/horoscopeSlicer";
import { useUser } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import Purchases from "react-native-purchases";
import { api } from "../convex/_generated/api";

// Global flag to prevent concurrent subscription checks
let isSubscriptionCheckInProgress = false;

export const usePlatinumStatus = () => {
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
  // Always check to catch sync issues
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

      // Helper function to find entitlement by multiple possible identifiers
      const findEntitlement = (possibleKeys: string[]) => {
        const activeEntitlements = customerInfo.entitlements.active || {};
        for (const key of possibleKeys) {
          if (activeEntitlements[key]) {
            return activeEntitlements[key];
          }
        }
        // Fallback: check if any active entitlement contains the keyword
        const allActiveKeys = Object.keys(activeEntitlements);
        for (const key of allActiveKeys) {
          const keyLower = key.toLowerCase();
          for (const searchKey of possibleKeys) {
            if (keyLower.includes(searchKey.toLowerCase())) {
              return activeEntitlements[key];
            }
          }
        }
        return null;
      };

      // Check for active entitlements (Platinum first, then Gold)
      // Support multiple identifier formats: "Platinum", "platinum", "platinum_plan", etc.
      const platinumEntitlement = findEntitlement(["Platinum", "platinum", "platinum_plan", "Platinum_Plan", "PLATINUM"]);
      const goldEntitlement = findEntitlement(["Gold", "gold", "gold_plan", "Gold_Plan", "GOLD"]);

      // Platinum takes priority over Gold
      const activeEntitlement = platinumEntitlement || goldEntitlement;
      const activeUserType = platinumEntitlement ? "platinum" : goldEntitlement ? "gold" : null;
      
      console.log("🔍 usePlatinumStatus - Active entitlements check:", {
        platinumFound: !!platinumEntitlement,
        goldFound: !!goldEntitlement,
        activeUserType,
        allActiveKeys: Object.keys(customerInfo.entitlements.active || {})
      });

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

  // Check for platinum and gold subscriptions
  const isPlatinum = currentUser?.userType === "platinum";
  const isGold = currentUser?.userType === "gold";
  const isFree = !isPlatinum && !isGold; // If not platinum or gold, user is free

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
    isPlatinum,
    isGold,
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
