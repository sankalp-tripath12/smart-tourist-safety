import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from '../screens/HomeScreen';
import TouristIDScreen from '../screens/TouristIDScreen';
import LocationScreen from '../screens/LocationScreen';
import SafetyScreen from '../screens/SafetyScreen';
import IncidentsScreen from '../screens/IncidentsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: '#147D78',
          tabBarInactiveTintColor: '#8290A2',
          tabBarStyle: {
            height: 65,
            paddingBottom: 8,
            paddingTop: 8,
            backgroundColor: '#FFFFFF',
            borderTopColor: '#E5EAF0',
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '700',
          },
          tabBarIcon: ({ color }) => {
            let icon = '●';
            if (route.name === 'Home') icon = '⌂';
            else if (route.name === 'Tourist ID') icon = '▣';
            else if (route.name === 'Location') icon = '⌖';
            else if (route.name === 'Safety') icon = '🛡';
            else if (route.name === 'Incidents') icon = '◈';
            else if (route.name === 'Profile') icon = '👤';

            return <Text style={{ fontSize: 16, color }}>{icon}</Text>;
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Tourist ID" component={TouristIDScreen} />
        <Tab.Screen name="Location" component={LocationScreen} />
        <Tab.Screen name="Safety" component={SafetyScreen} />
        <Tab.Screen name="Incidents" component={IncidentsScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
