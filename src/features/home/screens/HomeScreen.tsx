import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenHeader } from '../../../shared/components/ScreenHeader';
import { useAuth } from '../../../shared/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export function HomeScreen({ navigation }: any) {
  const { user } = useAuth();

  return (
    <LinearGradient
      colors={['#5A0001', '#000000']}
      start={{ x: 0.9, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.container}
    >
      <ScreenHeader
        userName={user?.name || 'Agente'}
        companyName="Century 21"
        onNotifications={() => navigation.navigate('Notifications')}
        theme="dark"
      />
      <View style={styles.welcomeHeaderSection}>
        <View style={styles.welcomeCard}>
          <View className='flex flex-row gap-2 items-center'>
            <View style={styles.welcomeIconContainer}>
              <LinearGradient
                colors={['#FF383C80', '#99222480']}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name="flame-sharp" size={24} color="#FFF" />
            </View>
            <Text className='text-white text-xl'>
              Dicta tus movimientos
            </Text>
          </View>
          <View className='flex flex-row gap-6 items-center'>
            <TouchableOpacity activeOpacity={0.1}>
              <Ionicons name="sparkles-outline" size={24} color="#FFF" />
            </TouchableOpacity>
            <View className='w-px h-6 bg-white/20' />
            <TouchableOpacity activeOpacity={0.1}>
              <Ionicons name="eye-off-outline" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeSection}>
          <Text style={styles.greeting}>Hola de nuevo! {user?.nickname || 'Agente'}</Text>
        </View>
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.mainStatCard]}>
            <LinearGradient
              colors={['#FF383Ccc', '#992224cc']}
              style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
            />
            <View style={styles.statCardHeader}>
              <View style={[styles.iconContainer, styles.mainIconContainer]}>
                <LinearGradient
                  colors={['#f8f8f8cc', '#f8f8f8cc']}
                  style={StyleSheet.absoluteFill}
                />
                <Ionicons name="layers" size={20} color="#FF383C" />
              </View>
              <Text style={[styles.statLabel, { color: 'rgba(255, 255, 255, 0.9)' }]} numberOfLines={2}>
                Total acumulado
              </Text>
            </View>
            <Text style={styles.statValue}>500</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statCardHeader}>
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={['#FF383C80', '#99222480']}
                  style={StyleSheet.absoluteFill}
                />
                <Ionicons name="cube-sharp" size={20} color="#FFF" />
              </View>
              <Text style={styles.statLabel} numberOfLines={2}>
                Total este mes
              </Text>
            </View>
            <Text style={styles.statValue}>5</Text>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  welcomeSection: {
    marginBottom: 30,
  },
  greeting: {
    fontSize: 25,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  subGreeting: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'space-between',
  },
  mainStatCard: {
    borderColor: '#FF383C80',
    shadowColor: '#FF383C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#FF383C80',
    borderWidth: 1,
    overflow: 'hidden',
  },
  mainIconContainer: {
    borderWidth: 0,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
  },
  statLabel: {
    flex: 1,
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  actionText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  // yo
  welcomeHeaderSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: 7,
  },
  welcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  welcomeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#FF383C80',
    borderWidth: 1,
    overflow: 'hidden',
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
