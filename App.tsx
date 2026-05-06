import './global.css';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';

// Screens - Auth
import { LoginScreen } from './src/features/auth/screens/LoginScreen';
import { RegisterScreen } from './src/features/auth/screens/RegisterScreen';

// Screens - Main Features
import { HomeScreen } from './src/features/home/screens/HomeScreen';
import { PropertiesListScreen } from './src/features/properties/screens/PropertiesListScreen';
import { AgendaScreen } from './src/features/agenda/screens/AgendaScreen';
import { ProfileScreen } from './src/features/profile/screens/ProfileScreen';
import { NotificationsScreen } from './src/features/notifications/screens/NotificationsScreen';

// Components
import { AddMenu } from './src/shared/components/AddMenu';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const [addMenuVisible, setAddMenuVisible] = useState(false);

  const tabBarItems = [
    { routeKey: 'Home', icon: 'home-outline', activeIcon: 'home', label: 'Inicio' },
    { routeKey: 'Properties', icon: 'business-outline', activeIcon: 'business', label: 'Propiedades' },
    { routeKey: 'Agenda', icon: 'calendar-outline', activeIcon: 'calendar', label: 'Agenda' },
    { routeKey: 'Profile', icon: 'grid-outline', activeIcon: 'grid', label: 'Menú' },
  ];

  const isFocused = (index: number) => state.index === index;

  return (
    <View style={[styles.tabBarWrapper, { bottom: insets.bottom + 8 }]}>
      <TouchableOpacity
        style={styles.fabButton}
        onPress={() => setAddMenuVisible(true)}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['#ef4444', '#b91c1c']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={30} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.floatingBar}>
        <BlurView
          intensity={75}
          tint="light"
          style={styles.blurBackground}
        />
        <View style={styles.tabContent}>
          {tabBarItems.map((item, index) => {
            const focused = isFocused(index);
            const route = state.routes[index];
            const color = focused ? '#cc2d19' : '#8E8E93';

            return (
              <TouchableOpacity
                key={item.routeKey}
                style={styles.tabItem}
                onPress={() => navigation.navigate(route.name)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={(focused ? item.activeIcon : item.icon) as any}
                  size={26}
                  color={color}
                />
                <Text style={[styles.tabLabel, { color }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <AddMenu
        visible={addMenuVisible}
        onClose={() => setAddMenuVisible(false)}
        onAddProperty={() => console.log('Agregar propiedad')}
        onAddAppointment={() => console.log('Agregar cita')}
        onAddOfferStatus={() => console.log('Agregar status de oferta')}
      />
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Properties" component={PropertiesListScreen} />
      <Tab.Screen name="Agenda" component={AgendaScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
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
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
        </Stack.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fabButton: {
    position: 'absolute',
    right: 16,
    bottom: 72,
    zIndex: 10,
    shadowColor: '#cc2d19',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingBar: {
    flexDirection: 'row',
    borderRadius: 999,
    overflow: 'hidden',
    flex: 1,
    backgroundColor: 'rgba(245, 245, 247, 0.85)',
  },
  blurBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 8,
    width: '100%',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
});
