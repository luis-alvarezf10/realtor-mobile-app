import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, ViewStyle } from 'react-native';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  style?: ViewStyle;
}

export function GradientBackground({ children, style }: Props) {
  return (
    <LinearGradient
      colors={['#5A0001', '#000000']}
      start={{ x: 0.9, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[styles.container, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
