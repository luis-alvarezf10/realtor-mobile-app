import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';

interface CustomFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string; // fix 1
}

export function CustomField({
  label,
  error,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}: CustomFieldProps) {
  return (
    <View className="mb-4">
      {label && (
        <Text className="mb-1 text-sm font-medium text-gray-700">{label}</Text>
      )}
      <View className={`flex-row items-center border px-3 ${error ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-gray-50'
        }`} style={{ borderRadius: 15 }}>
        {leftIcon && <View className="mr-2">{leftIcon}</View>}

        <TextInput
          className={`flex-1 py-5 ${className}`}
          style={{ backgroundColor: 'transparent', paddingHorizontal: 12, borderRadius: 30 }}
          placeholderTextColor="#9ca3af"
          {...props}
        />

        {rightIcon && <View className="ml-2">{rightIcon}</View>}
      </View>

      {error && (
        <Text className="mt-1 text-sm text-red-500">{error}</Text>
      )}
    </View>
  );
}