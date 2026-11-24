import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from './screens/SplashScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import CreateWalletScreen from './screens/CreateWalletScreen';
import ImportWalletScreen from './screens/ImportWalletScreen';
import VerifyRecoveryScreen from './screens/VerifyRecoveryScreen';
import PinSetupScreen from './screens/PinSetupScreen';
import PinLoginScreen from './screens/PinLoginScreen';
import HomeScreen from './screens/HomeScreen';
import SendScreen from './screens/SendScreen';
import ReceiveScreen from './screens/ReceiveScreen';
import SwapScreen from './screens/SwapScreen';
import HistoryScreen from './screens/HistoryScreen';
import TransactionDetailScreen from './screens/TransactionDetailScreen';
import SettingsScreen from './screens/SettingsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        {/* Add other screens here */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({});
