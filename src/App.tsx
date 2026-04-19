import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform, AppState, AppStateStatus } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from './store/gameStore';
import { ResourceBar } from './components/ResourceBar';
import { HeatMeter } from './components/HeatMeter';
import { StreetsTab } from './components/StreetsTab';
import { FamilyTab } from './components/FamilyTab';
import { BooksTab } from './components/BooksTab';
import { WireTab } from './components/WireTab';
import { FavorsTab } from './components/FavorsTab';
import { SettingsTab } from './components/SettingsTab';
import { FallScreen } from './components/FallScreen';
import { ObjectivesFAB } from './components/ObjectivesFAB';
import { Colors } from './theme/colors';

const Tab = createBottomTabNavigator();

function MainApp() {
  const { tick, notifications } = useGameStore();
  const tickRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const [settingsVisible, setSettingsVisible] = React.useState(false);
  const newNotifCount = notifications.slice(0, 3).length;

  useEffect(() => {
    tickRef.current = setInterval(tick, 100);
    return () => clearInterval(tickRef.current);
  }, [tick]);

  // Fire an immediate tick when the app comes back to the foreground so that
  // offline earnings (and the raid check) are resolved as soon as the player
  // returns, rather than waiting for the next 100 ms interval.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appStateRef.current !== 'active' && nextState === 'active') {
        tick();
      }
      appStateRef.current = nextState;
    });
    return () => subscription.remove();
  }, [tick]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" backgroundColor={Colors.black} />
      <FallScreen />
      <ResourceBar onSettingsPress={() => setSettingsVisible(true)} />
      <HeatMeter />
      <SettingsTab visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
      <View style={styles.navContainer}>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={{
              headerShown: false,
              tabBarStyle: styles.tabBar,
              tabBarActiveTintColor: Colors.gold,
              tabBarInactiveTintColor: Colors.muted,
              tabBarLabelStyle: styles.tabLabel,
            }}
          >
            <Tab.Screen
              name="Streets"
              component={StreetsTab}
              options={{
                tabBarLabel: 'Streets',
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="map-outline" size={size} color={color} />
                ),
              }}
            />
            <Tab.Screen
              name="Family"
              component={FamilyTab}
              options={{
                tabBarLabel: 'Family',
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="people-outline" size={size} color={color} />
                ),
              }}
            />
            <Tab.Screen
              name="Books"
              component={BooksTab}
              options={{
                tabBarLabel: 'Books',
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="book-outline" size={size} color={color} />
                ),
              }}
            />
            <Tab.Screen
              name="Wire"
              component={WireTab}
              options={{
                tabBarLabel: 'Wire',
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="radio-outline" size={size} color={color} />
                ),
                tabBarBadge: newNotifCount > 0 ? newNotifCount : undefined,
              }}
            />
            <Tab.Screen
              name="Favors"
              component={FavorsTab}
              options={{
                tabBarLabel: 'Favors',
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="call-outline" size={size} color={color} />
                ),
              }}
            />
          </Tab.Navigator>
        </NavigationContainer>
        <ObjectivesFAB />
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MainApp />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  navContainer: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: Colors.dark,
    borderTopColor: Colors.border,
    height: Platform.OS === 'ios' ? 88 : 60,
    paddingBottom: Platform.OS === 'ios' ? 30 : 8,
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
