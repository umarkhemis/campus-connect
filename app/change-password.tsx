

import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Text,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const Toast = ({ message, type, visible, onHide }) => {
  const [fadeAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(3000),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => onHide());
    }
  }, [visible, fadeAnim, onHide]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          opacity: fadeAnim,
          backgroundColor: type === 'success' ? '#4CAF50' : '#F44336',
        },
      ]}
    >
      <Icon
        name={type === 'success' ? 'check-circle' : 'error'}
        size={20}
        color="white"
        style={styles.toastIcon}
      />
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
};

const ChangePasswordScreen = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [errors, setErrors] = useState({});

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast({ visible: false, message: '', type: 'success' });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!oldPassword.trim()) {
      newErrors.oldPassword = 'Current password is required';
    }

    if (!newPassword.trim()) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      newErrors.newPassword = 'Password must contain uppercase, lowercase, and number';
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (oldPassword === newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    return strength;
  };

  const getStrengthColor = (strength) => {
    if (strength <= 2) return '#F44336';
    if (strength <= 3) return '#FF9800';
    return '#4CAF50';
  };

  const getStrengthText = (strength) => {
    if (strength <= 2) return 'Weak';
    if (strength <= 3) return 'Medium';
    return 'Strong';
  };

  const handleChange = async () => {
    if (!validateForm()) {
      showToast('Please fix the errors below', 'error');
      return;
    }

    setLoading(true);
    try {
      await axios.put('http://10.22.3.34:8000/api/change-password/', {
        old_password: oldPassword,
        new_password: newPassword,
      }, { 
        withCredentials: true,
        timeout: 10000 
      });

      showToast('Password changed successfully!', 'success');
      
      // Clear form after successful change
      setTimeout(() => {
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setErrors({});
      }, 1000);

    } catch (err) {
      let errorMessage = 'Password change failed';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 400) {
        errorMessage = 'Invalid current password';
      } else if (err.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.';
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Please try again.';
      } else if (!err.response) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({ 
    placeholder, 
    value, 
    onChangeText, 
    secureTextEntry, 
    showPassword, 
    toggleShowPassword, 
    error,
    icon 
  }) => (
    <View style={styles.inputContainer}>
      <View style={[styles.inputWrapper, error && styles.inputError]}>
        <Icon name={icon} size={20} color="#6B7280" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !showPassword}
          autoCapitalize="none"
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={toggleShowPassword}
            style={styles.eyeButton}
          >
            <Icon
              name={showPassword ? 'visibility-off' : 'visibility'}
              size={20}
              color="#6B7280"
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1F2937" />
      
      <LinearGradient
        colors={['#1F2937', '#374151']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Icon name="security" size={32} color="white" />
          <Text style={styles.headerTitle}>Change Password</Text>
          <Text style={styles.headerSubtitle}>
            Keep your account secure with a strong password
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.formContainer}>
        <Toast
          message={toast.message}
          type={toast.type}
          visible={toast.visible}
          onHide={hideToast}
        />

        <InputField
          placeholder="Current Password"
          value={oldPassword}
          onChangeText={setOldPassword}
          secureTextEntry
          showPassword={showOldPassword}
          toggleShowPassword={() => setShowOldPassword(!showOldPassword)}
          error={errors.oldPassword}
          icon="lock-outline"
        />

        <InputField
          placeholder="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          showPassword={showNewPassword}
          toggleShowPassword={() => setShowNewPassword(!showNewPassword)}
          error={errors.newPassword}
          icon="lock"
        />

        {newPassword.length > 0 && (
          <View style={styles.strengthContainer}>
            <View style={styles.strengthHeader}>
              <Text style={styles.strengthLabel}>Password Strength:</Text>
              <Text style={[styles.strengthText, { color: getStrengthColor(passwordStrength) }]}>
                {getStrengthText(passwordStrength)}
              </Text>
            </View>
            <View style={styles.strengthBar}>
              {[1, 2, 3, 4, 5].map((level) => (
                <View
                  key={level}
                  style={[
                    styles.strengthSegment,
                    {
                      backgroundColor: level <= passwordStrength 
                        ? getStrengthColor(passwordStrength) 
                        : '#E5E7EB'
                    }
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        <InputField
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          showPassword={showConfirmPassword}
          toggleShowPassword={() => setShowConfirmPassword(!showConfirmPassword)}
          error={errors.confirmPassword}
          icon="lock-outline"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleChange}
          disabled={loading}
        >
          <LinearGradient
            colors={loading ? ['#9CA3AF', '#6B7280'] : ['#3B82F6', '#1D4ED8']}
            style={styles.buttonGradient}
          >
            {loading ? (
              <View style={styles.buttonContent}>
                <Icon name="sync" size={20} color="white" style={styles.loadingIcon} />
                <Text style={styles.buttonText}>Updating...</Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Icon name="security" size={20} color="white" />
                <Text style={styles.buttonText}>Update Password</Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.securityTips}>
          <Text style={styles.tipsTitle}>Security Tips:</Text>
          <Text style={styles.tip}>• Use at least 8 characters</Text>
          <Text style={styles.tip}>• Include uppercase and lowercase letters</Text>
          <Text style={styles.tip}>• Add numbers and special characters</Text>
          <Text style={styles.tip}>• Avoid common words or personal information</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#D1D5DB',
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  toastIcon: {
    marginRight: 8,
  },
  toastText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  inputError: {
    borderColor: '#F87171',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  eyeButton: {
    padding: 4,
  },
  errorText: {
    color: '#F87171',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  strengthContainer: {
    marginBottom: 20,
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  strengthLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  strengthText: {
    fontSize: 14,
    fontWeight: '600',
  },
  strengthBar: {
    flexDirection: 'row',
    gap: 4,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  button: {
    marginTop: 10,
    marginBottom: 30,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonDisabled: {
    elevation: 1,
    shadowOpacity: 0.1,
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingIcon: {
    marginRight: 8,
  },
  securityTips: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  tip: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
});

export default ChangePasswordScreen;





































// import React, { useState } from 'react';
// import { View, TextInput, Button, Alert } from 'react-native';
// import axios from 'axios';

// const ChangePasswordScreen = () => {
//   const [oldPassword, setOldPassword] = useState('');
//   const [newPassword, setNewPassword] = useState('');

//   const handleChange = async () => {
//     try {
//       await axios.put('http://127.0.0.1:8000/api/change-password/', {
//         old_password: oldPassword,
//         new_password: newPassword,
//       }, { withCredentials: true });

//       Alert.alert('Password changed!');
//     } catch (err) {
//       Alert.alert('Password change failed');
//     }
//   };

//   return (
//     <View style={{ padding: 20 }}>
//       <TextInput placeholder="Old Password" value={oldPassword} onChangeText={setOldPassword} secureTextEntry />
//       <TextInput placeholder="New Password" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
//       <Button title="Change Password" onPress={handleChange} />
//     </View>
//   );
// };

// export default ChangePasswordScreen;
