import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type ExecutionState = {
  [campaignId: string]: boolean;
};

const initialState: ExecutionState = {};

const executionSlice = createSlice({
  name: "execution",
  initialState,
  reducers: {
    startExecution: (state, action: PayloadAction<string>) => {
      state[action.payload] = true;
    },
    stopExecution: (state, action: PayloadAction<string>) => {
      state[action.payload] = false;
    },
    resetAllExecutions: () => {
      return {};
    },
  },
});

export const { startExecution, stopExecution, resetAllExecutions } =
  executionSlice.actions;

export default executionSlice.reducer;
