import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface HeaderProps {
  title: string;
  subtitle?: string;
  rightComponent?: React.ReactNode;
  onBack?: () => void;
}

export function Header({ title, subtitle, rightComponent, onBack }: HeaderProps) {
  return (
    <View className="bg-white px-4 py-4 border-b border-gray-200">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          {onBack && (
            <TouchableOpacity onPress={onBack} className="mr-2">
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
          )}
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-900">{title}</Text>
            {subtitle && <Text className="text-sm text-gray-600 mt-1">{subtitle}</Text>}
          </View>
        </View>
        {rightComponent}
      </View>
    </View>
  );
}
