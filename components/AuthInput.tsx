import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function AuthInput({
  label,
  secureTextEntry,
  value,
  onChangeText,
  placeholder,
  error,
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={{ marginVertical: 10 }}>
      <Text style={{ marginBottom: 4 }}>{label}</Text>
      <View
        style={{
          flexDirection: 'row',
          borderWidth: 1,
          borderColor: error ? 'red' : '#ccc',
          borderRadius: 8,
          alignItems: 'center',
          paddingHorizontal: 10,
        }}
      >
        <TextInput
          placeholder={placeholder}
          secureTextEntry={secureTextEntry && !showPassword}
          value={value}
          onChangeText={onChangeText}
          style={{ flex: 1, height: 45 }}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <MaterialIcons
              name={showPassword ? 'visibility' : 'visibility-off'}
              size={22}
              color="gray"
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={{ color: 'red', marginTop: 3 }}>{error}</Text>}
    </View>
  );
}