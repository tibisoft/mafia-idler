import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useGameStore } from './store/gameStore';
import { ResourceBar } from './components/ResourceBar';
import { HeatMeter } from './components/HeatMeter';
import { StreetsTab } from './components/StreetsTab';
import { FamilyTab } from './components/FamilyTab';
import { BooksTab } from './components/BooksTab';
import { WireTab } from './components/WireTab';
import { FavorsTab } from './components/FavorsTab';
import { FallScreen } from './components/FallScreen';
import { Colors } from './theme/colors';

const Tab = createBottomTabNavigator();

function MainApp() {
  const { tick, notifications } = useGameStore();
  const tickRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const newNotifCount = notifications.slice(0, 3).length;

  useEffect(() => {
    tickRef.current = setInterval(tick, 100);
    return () => clearInterval(tickRef.current);
  }, [tick]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" backgroundColor={Colors.black} />
      <FallScreen />
      <ResourceBar />
      <HeatMeter />
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
              options={{ tabBarIcon: () => null, tabBarLabel: '🗺️ Streets' }}
            />
            <Tab.Screen
              name="Family"
              component={FamilyTab}
              options={{ tabBarIcon: () => null, tabBarLabel: '👥 Family' }}
            />
            <Tab.Screen
              name="Books"
              component={BooksTab}
              options={{ tabBarIcon: () => null, tabBarLabel: '📒 Books' }}
            />
            <Tab.Screen
              name="Wire"
              component={WireTab}
              options={{
                tabBarIcon: () => null,
                tabBarLabel: '📡 Wire',
                tabBarBadge: newNotifCount > 0 ? newNotifCount : undefined,
              }}
            />
            <Tab.Screen
              name="Favors"
              component={FavorsTab}
              options={{ tabBarIcon: () => null, tabBarLabel: '📞 Favors' }}
            />
          </Tab.Navigator>
        </NavigationContainer>
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
    height: 60,
    paddingBottom: 8,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
