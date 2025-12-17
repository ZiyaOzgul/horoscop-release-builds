import { Id } from "@/convex/_generated/dataModel";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ImageSourcePropType } from "react-native";

interface RegisterData {
  clerkId?: string;
  email?: string;
  gender?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  city?: string;
  userCountry?: string;
  birthTime?: string;
}

interface LuckCategory {
  percentage: number;
  explanation: string;
}

interface HoroscopePeriod {
  sunSign: string;
  love: LuckCategory;
  career: LuckCategory;
  luck: LuckCategory;
  health: LuckCategory;
}

interface HoroscopeData {
  daily: HoroscopePeriod;
  weekly: HoroscopePeriod;
  monthly: HoroscopePeriod;
}

interface FortuneResponse {
  status: number;
  horoscope: HoroscopeData;
}

interface UserAstroProfile {
  _creationTime: number;
  _id: string;
  ascendant: string;
  birthDate: string;
  birthTime: string;
  city: string;
  clerkId: string;
  element: string;
  email: string;
  firstName: string;
  gender: string;
  lastName: string;
  modality: string;
  moonSign: string;
  polarity: string;
  sunSign: string;
  imageUrl: string;
  userType: string;
  subscriptionStatus?: string;
  revenueCatUserId?: string;
  subscriptionStartDate?: number;
  subscriptionEndDate?: number;
  lastSubscriptionCheck?: number;
}
interface SelectedLoveMatch {
  photoData: ImageSourcePropType;
  zodiacName: string;
}
interface LoveMatch {
  status: number;
  loveMatch: {
    percentage: string;
    categories: {
      love: {
        percentage: number;
        explanation: string;
      };
      business: {
        percentage: number;
        explanation: string;
      };
      sex: {
        percentage: number;
        explanation: string;
      };
      friendship: {
        percentage: number;
        explanation: string;
      };
    };
  };
}
interface initialState {
  userId?: Id<"users">;
  clerkId?: string;
  registerData: RegisterData | null;
  userData: UserAstroProfile | undefined;
  selectedLoveMatch: SelectedLoveMatch[] | undefined;
  dreamReqData: string;
  horoscopeResultData: HoroscopeData | undefined;
  loveMatchResults: LoveMatch | undefined;
}

const initialState: initialState = {
  clerkId: undefined,
  userId: undefined,
  registerData: null,
  userData: undefined,
  selectedLoveMatch: undefined,
  dreamReqData: "",
  horoscopeResultData: undefined,
  loveMatchResults: undefined,
};

export const horoscopeSlice = createSlice({
  name: "horoscope",
  initialState: initialState,
  reducers: {
    setUserId: (state, action) => {
      state.userId = action.payload.userId;
    },
    setRegisterData(state, action: PayloadAction<RegisterData>) {
      state.registerData = action.payload;
    },
    updateRegisterData(state, action: PayloadAction<Partial<RegisterData>>) {
      if (state.registerData) {
        state.registerData = { ...state.registerData, ...action.payload };
      }
    },
    setUserData: (state, action) => {
      state.userData = action.payload;
    },
    setSelectedLoveMatch: (state, action) => {
      state.selectedLoveMatch = action.payload;
    },
    setDreamReqData: (state, action) => {
      state.dreamReqData = action.payload;
    },
    setHoroscopeData: (state, action) => {
      state.horoscopeResultData = action.payload;
    },
    setLoveMatch: (state, action) => {
      state.loveMatchResults = action.payload;
    },
  },
});

export default horoscopeSlice.reducer;
export const {
  setUserId,
  setRegisterData,
  updateRegisterData,
  setUserData,
  setSelectedLoveMatch,
  setDreamReqData,
  setHoroscopeData,
  setLoveMatch,
} = horoscopeSlice.actions;
