import './global.css';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';

// Screens - Auth
import { LoginScreen } from './src/features/auth/screens/LoginScreen';
import { RegisterScreen } from './src/features/auth/screens/RegisterScreen';

// Screens - Main Features
import { PropertiesListScreen } from './src/features/properties/screens/PropertiesListScreen';
import { AppointmentsScreen } from './src/features/appointments/screens/AppointmentsScreen';
import { ClientsScreen } from './src/features/clients/screens/ClientsScreen';
import { ReportsScreen } from './src/features/reports/screens/ReportsScreen';
import { NotificationsScreen } from './src/features/notifications/screens/NotificationsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#6B7280',
      }}
    >
      <Tab.Screen
        name="Properties"
        component={PropertiesListScreen}
        options={{
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
          tabBarLabel: 'Propiedades',
        }}
      />
      <Tab.Screen
        name="Appointments"
        component={AppointmentsScreen}
        options={{
          tabBarIcon: ({ color }) => <Ionicons name="calendar" size={24} color={color} />,
          tabBarLabel: 'Citas',
        }}
      />
      <Tab.Screen
        name="Clients"
        component={ClientsScreen}
        options={{
          tabBarIcon: ({ color }) => <Ionicons name="people" size={24} color={color} />,
          tabBarLabel: 'Clientes',
        }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          tabBarIcon: ({ color }) => <Ionicons name="bar-chart" size={24} color={color} />,
          tabBarLabel: 'Reportes',
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarIcon: ({ color }) => <Ionicons name="notifications" size={24} color={color} />,
          tabBarLabel: 'Notif.',
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Main" component={MainTabs} />
        </Stack.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
