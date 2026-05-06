import { View, Text, StyleSheet } from 'react-native';
import { ScreenHeader } from '../../../shared/components/ScreenHeader';

export function AgendaScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <ScreenHeader title="Agenda" onNotifications={() => navigation.navigate('Notifications')} />
      <View style={styles.content}>
        <Text style={styles.placeholder}>Agenda</Text>
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
    justifyContent: 'center',
  },
  placeholder: {
    fontSize: 16,
    color: '#9CA3AF',
  },
});
