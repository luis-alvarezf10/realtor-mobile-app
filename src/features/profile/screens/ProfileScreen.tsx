import { View, Text, StyleSheet } from 'react-native';
import { ScreenHeader } from '../../../shared/components/ScreenHeader';

export function ProfileScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <ScreenHeader title="Perfil" onNotifications={() => navigation.navigate('Notifications')} />
      <View style={styles.content}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>U</Text>
        </View>
        <Text style={styles.name}>Usuario</Text>
        <Text style={styles.email}>usuario@email.com</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAF9',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#cc2d19',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  email: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
});
