// src/navigation/index.ts
import { createNativeStackNavigator } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  CreateWallet: undefined;
  ImportWallet: undefined;
  VerifyRecovery: undefined;
  SetupPin: undefined;
  Home: undefined;
  Send: undefined;
  Receive: undefined;
  Swap: undefined;
  History: undefined;
  TransactionDetail: { txHash: string };
  Settings: undefined;
};

export const Stack = createNativeStackNavigator<RootStackParamList>();
