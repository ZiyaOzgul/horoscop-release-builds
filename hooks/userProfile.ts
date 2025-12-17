import { useQuery } from "convex/react";
import { useUser } from "@clerk/clerk-expo";
import { api } from "@/convex/_generated/api";
import { useAppDispatch } from "@/redux/hooks";
import { setUserId, updateRegisterData } from "@/redux/horoscopeSlicer";

export function useUserProfile() {
  const { user } = useUser();

  const dispatch = useAppDispatch();
  dispatch(setUserId(user?.id));
  const clerkId = user?.id;

  const userProfile = useQuery(api.users.getUserWithClerkID, { clerkId });

  return {
    userProfile,
    isLoading: userProfile === undefined,
    error: userProfile === null,
  };
}
