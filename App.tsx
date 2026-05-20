import './global.css';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, TouchableOpacity, StyleSheet, Animated as RNAnimated, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useRef, useEffect } from 'react';
import { supabase } from './src/lib/supabase';
import { AuthProvider } from './src/shared/context/AuthContext';

// Screens - Auth
import { LoginScreen } from './src/features/auth/screens/LoginScreen';
import { RegisterScreen } from './src/features/auth/screens/RegisterScreen';

// Screens - Main Features
import { HomeScreen } from './src/features/home/screens/HomeScreen';
import { PropertiesListScreen } from './src/features/properties/screens/PropertiesListScreen';
import { PropertyDetailScreen } from './src/features/properties/screens/PropertyDetailScreen';
import { AgendaScreen } from './src/features/agenda/screens/AgendaScreen';
import { AllAppointmentsScreen } from './src/features/agenda/screens/AllAppointmentsScreen';
import { MenuScreen } from './src/features/menu/screens/MenuScreen';
import { NotificationsScreen } from './src/features/notifications/screens/NotificationsScreen';
import { SettingsScreen } from './src/features/settings/screens/SettingsScreen';
import { ChatScreen } from './src/features/chat/screens/ChatScreen';

// Components
import { AddMenu } from './src/shared/components/AddMenu';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const [addMenuVisible, setAddMenuVisible] = useState(false);
  const rotation = useRef(new RNAnimated.Value(0)).current;

  const tabBarItems = [
    { routeKey: 'Home', icon: 'home-outline', activeIcon: 'home', label: 'Inicio' },
    { routeKey: 'Properties', icon: 'albums-outline', activeIcon: 'albums', label: 'Inventario' },
    { routeKey: 'Chat', icon: 'chatbubble-ellipses-outline', activeIcon: 'chatbubble-ellipses', label: 'Hunterito' },
    { routeKey: 'Agenda', icon: 'calendar-outline', activeIcon: 'calendar', label: 'Agenda' },
    { routeKey: 'Profile', icon: 'grid-outline', activeIcon: 'grid', label: 'Menú' },
  ];

  const isFocused = (index: number) => state.index === index;

  useEffect(() => {
    const toValue = addMenuVisible ? 45 : 0;
    RNAnimated.timing(rotation, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [addMenuVisible]);

  const toggleMenu = () => {
    setAddMenuVisible(prev => !prev);
  };

  const iconRotationStyle = {
    transform: [{
      rotate: rotation.interpolate({
        inputRange: [0, 45],
        outputRange: ['0deg', '45deg'],
      })
    }],
  };

  return (
    <View style={[styles.tabBarWrapper, { bottom: insets.bottom + 8 }]}>
      <TouchableOpacity
        style={styles.fabButton}
        onPress={toggleMenu}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['#ef4444', '#b91c1c']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.fabGradient}
        >
          <RNAnimated.View style={iconRotationStyle}>
            <Ionicons name="add" size={30} color="#fff" />
          </RNAnimated.View>
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.floatingBar}>
        <BlurView
          intensity={85}
          tint="dark"
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
        onUseAI={() => navigation.getParent()?.navigate('Chat')}
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
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Agenda" component={AgendaScreen} />
      <Tab.Screen name="Profile" component={MenuScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: stakeholder } = await supabase
          .from('stakeholders')
          .select('role')
          .eq('id', session.user.id)
          .single();

        setIsAuthenticated(stakeholder?.role === 'realtor');
      } else {
        setIsAuthenticated(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: stakeholder } = await supabase
          .from('stakeholders')
          .select('role')
          .eq('id', user.id)
          .single();

        setIsAuthenticated(stakeholder?.role === 'realtor');
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#cc2d19" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="AllAppointments" component={AllAppointmentsScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
      <StatusBar style="light" />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
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
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
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
