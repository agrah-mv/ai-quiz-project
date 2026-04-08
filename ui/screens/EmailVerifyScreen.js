import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'http://localhost:8000';

export default function EmailVerifyScreen({ route, navigation }) {
  const { email } = route.params || {};
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputsRef = useRef([]);

  const handleChange = (index, value) => {
    const sanitized = value.replace(/[^0-9]/g, '');
    const nextDigits = [...digits];
    nextDigits[index] = sanitized;
    setDigits(nextDigits);

    if (sanitized && index < 5 && inputsRef.current[index + 1]) {
      inputsRef.current[index + 1].focus();
    }
  };

  const handleKeyPress = (index, e) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      const prev = inputsRef.current[index - 1];
      if (prev) prev.focus();
    }
  };

  const code = digits.join('');
  const isComplete = code.length === 6;

  const handleVerify = async () => {
    if (!email) {
      Alert.alert('Missing email', 'Please go back and register again.');
      return;
    }
    if (!isComplete || isVerifying) return;
    setIsVerifying(true);
    try {
      const res = await axios.post(`${API_BASE}/verify-otp`, {
        email,
        code,
      });
      await AsyncStorage.setItem('userToken', res.data.access_token);
      navigation.navigate('Quiz');
    } catch (err) {
      console.log('OTP Verify Error:', err);
      const detail = err.response?.data?.detail || 'Invalid code. Please try again.';
      Alert.alert('Verification failed', detail);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email || isResending) return;
    setIsResending(true);
    try {
      const res = await axios.post(`${API_BASE}/resend-otp`, { email });
      Alert.alert('Code resent', res.data?.message || 'A new verification code has been sent to your email.');
    } catch (err) {
      console.log('Resend OTP Error:', err);
      const detail = err.response?.data?.detail || 'Please try again later.';
      Alert.alert('Cannot resend', detail);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.icon}>
        <Text style={styles.iconText}>✉️</Text>
      </View>
      <Text style={styles.title}>Verify Your Email</Text>
      <Text style={styles.desc}>A verification code has been sent to your email address.</Text>
      <Text style={styles.hint}>{email || ''}</Text>

      <Text style={styles.label}>Enter 6-digit verification code</Text>
      <View style={styles.otpGroup}>
        {digits.map((d, idx) => (
          <TextInput
            key={idx}
            ref={el => (inputsRef.current[idx] = el)}
            style={styles.otpDigit}
            keyboardType="number-pad"
            maxLength={1}
            value={d}
            onChangeText={val => handleChange(idx, val)}
            onKeyPress={e => handleKeyPress(idx, e)}
          />
        ))}
      </View>

      <TouchableOpacity
        style={[styles.verifyBtn, (!isComplete || isVerifying) && styles.verifyBtnDisabled]}
        disabled={!isComplete || isVerifying}
        onPress={handleVerify}
      >
        <Text style={styles.verifyBtnText}>{isVerifying ? 'Verifying...' : 'Verify →'}</Text>
      </TouchableOpacity>

      <View style={styles.resendContainer}>
        <Text style={styles.resendPrompt}>Did not receive the code?</Text>
        <TouchableOpacity onPress={handleResend} disabled={isResending}>
          <Text style={[styles.resendText, isResending && styles.resendTextDisabled]}>
            {isResending ? 'Resending...' : 'Resend Code'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.warnBox}>
        <Text style={styles.warnTitle}>📧 Check your spam folder</Text>
        <Text style={styles.warnBody}>
          If you don't see the email within 2 minutes. The code is valid for a short time.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08002E',
    paddingHorizontal: 24,
    paddingTop: 80,
    alignItems: 'center',
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconText: {
    fontSize: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  desc: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
  },
  hint: {
    color: '#F59E0B',
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 24,
  },
  label: {
    alignSelf: 'flex-start',
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  otpGroup: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  otpDigit: {
    width: 46,
    height: 56,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginHorizontal: 4,
  },
  verifyBtn: {
    width: '100%',
    backgroundColor: '#F97316',
    borderRadius: 50,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 12,
  },
  verifyBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  verifyBtnText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 16,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  resendPrompt: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  resendText: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '700',
    marginTop: 4,
    textDecorationLine: 'underline',
  },
  resendTextDisabled: {
    opacity: 0.6,
    textDecorationLine: 'none',
  },
  warnBox: {
    marginTop: 20,
    width: '100%',
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
    padding: 12,
  },
  warnTitle: {
    color: 'rgba(255,220,100,0.9)',
    fontWeight: '700',
    marginBottom: 4,
  },
  warnBody: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
});
