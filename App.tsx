import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';

import { ScannerProvider } from './src/context/ScannerContext';
import ScannerScreen from './src/screens/ScannerScreen';
import SessionScreen from './src/screens/SessionScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import CollectionScreen from './src/screens/CollectionScreen';
import IntroAnimation from './src/components/IntroAnimation';

export type RootTabParamList = {
  Scanner: undefined;
  Session: undefined;
  History: undefined;
  Collection: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function App() {
  const [introComplete, setIntroComplete] = useState(false);

  if (!introComplete) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <StatusBar style="light" />
        <IntroAnimation onComplete={() => setIntroComplete(true)} />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ScannerProvider>
          <NavigationContainer>
            <StatusBar style="light" />
            <Tab.Navigator
              screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarActiveTintColor: '#E53935',
                tabBarInactiveTintColor: '#888',
                tabBarLabelStyle: styles.tabBarLabel,
                tabBarIcon: ({ focused, color, size }) => {
                  let iconName: keyof typeof Ionicons.glyphMap;

                  if (route.name === 'Scanner') {
                    iconName = focused ? 'camera' : 'camera-outline';
                  } else if (route.name === 'Session') {
                    iconName = focused ? 'list' : 'list-outline';
                  } else if (route.name === 'History') {
                    iconName = focused ? 'time' : 'time-outline';
                  } else {
                    iconName = focused ? 'layers' : 'layers-outline';
                  }

                  return <Ionicons name={iconName} size={size} color={color} />;
                },
              })}
            >
              <Tab.Screen
                name="Scanner"
                component={ScannerScreen}
                options={{ title: 'Scan' }}
              />
              <Tab.Screen
                name="Session"
                component={SessionScreen}
                options={{ title: 'Session' }}
              />
              <Tab.Screen
                name="History"
                component={HistoryScreen}
                options={{ title: 'History' }}
              />
              <Tab.Screen
                name="Collection"
                component={CollectionScreen}
                options={{ title: 'Collection' }}
              />
            </Tab.Navigator>
          </NavigationContainer>
        </ScannerProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  tabBar: {
    backgroundColor: '#1a1a1a',
    borderTopColor: '#2a2a2a',
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
