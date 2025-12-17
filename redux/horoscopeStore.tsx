import { configureStore } from "@reduxjs/toolkit";
import horoscopeReducer from "./horoscopeSlicer";

export const store = configureStore({
  reducer: {
    horoscope: horoscopeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
