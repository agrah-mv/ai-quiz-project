import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// NOTE: Set this to your local machine IP replacing localhost when testing on physical device
const API_BASE = 'http://localhost:8000';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (loading) return;
    setErrorMsg('');
    setLoading(true);
    try {
      if (isLogin) {
        const res = await axios.post(`${API_BASE}/login`, { email, password });
        if (res.status === 200) {
          await AsyncStorage.setItem('userToken', res.data.access_token);
          // Login response decides if user should reattempt quiz or go to dashboard.
          const nextScreen = res.data?.next_screen === 'Quiz' ? 'Quiz' : 'Dashboard';
          navigation.navigate(nextScreen);
        }
      } else {
        const res = await axios.post(`${API_BASE}/signup`, { email, password });
        if (res.status === 200) {
          // OTP flow: do not auto-login; send user to email verification screen
          navigation.navigate('EmailVerify', { email });
        }
      }
    } catch (error) {
      console.log('Error:', error);
      setErrorMsg(error.response?.data?.detail || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{isLogin ? 'Log In' : 'Create Account'}</Text>

      {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
      
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, loading && styles.inputDisabled]}
          placeholder="Email Address"
          placeholderTextColor="#C4B5FD"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          editable={!loading}
        />
        <TextInput
          style={[styles.input, loading && styles.inputDisabled]}
          placeholder="Password"
          placeholderTextColor="#C4B5FD"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!loading}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonLoading]}
        onPress={handleSubmit}
        disabled={loading}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityState={{ busy: loading }}
      >
        <View style={styles.buttonContent}>
          {loading ? (
            <>
              <ActivityIndicator color="#FFF" size="small" style={styles.spinner} />
              <Text style={styles.buttonText}>
                {isLogin ? 'Signing you in…' : 'Sending verification…'}
              </Text>
            </>
          ) : (
            <Text style={styles.buttonText}>{isLogin ? 'LOG IN' : 'REGISTER'}</Text>
          )}
        </View>
        {loading ? <View style={styles.buttonShimmerEdge} pointerEvents="none" /> : null}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setIsLogin(!isLogin)}
        disabled={loading}
        style={loading ? styles.switchDisabled : null}
      >
        <Text style={[styles.switchText, loading && styles.switchTextMuted]}>
          {isLogin ? "Don't have an account? Register" : "Already have an account? Log In"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#08002E',
    justifyContent: 'center',
  },
  header: {
    fontSize: 28,
    color: '#FFF',
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    color: '#FFF',
  },
  button: {
    backgroundColor: '#F59E0B',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonLoading: {
    opacity: 0.96,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 22,
  },
  spinner: {
    marginRight: 10,
  },
  /** Thin highlight strip suggesting activity (static, works on web + native) */
  buttonShimmerEdge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  inputDisabled: {
    opacity: 0.55,
  },
  switchText: {
    color: '#C4B5FD',
    textAlign: 'center',
    marginTop: 10,
  },
  switchTextMuted: {
    opacity: 0.45,
  },
  switchDisabled: {
    opacity: 1,
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 15,
  }
});
