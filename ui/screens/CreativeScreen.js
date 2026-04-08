import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'http://localhost:8000';

export default function CreativeScreen({ navigation }) {
  const [response, setResponse] = useState('');
  const [timeLeft, setTimeLeft] = useState(120);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (timeLeft === 0) {
      Alert.alert("Time Expired");
      navigation.navigate('Landing');
      return;
    }
    const interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const wordCount = response.trim().split(/\s+/).filter(w => w.length > 0).length;

  const handleSubmit = async () => {
    if (wordCount !== 25) {
      Alert.alert("Rule Violation", "Response must be exactly 25 words.");
      return;
    }
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      const token = await AsyncStorage.getItem('userToken');
      const res = await axios.post(`${API_BASE}/submit-response`, { response }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await AsyncStorage.setItem('latestAiResult', JSON.stringify(res.data.scores));
      navigation.navigate('EntryAccepted');
    } catch (e) {
      console.log("Creative Submit Error:", e);
      const detail = e.response?.data?.detail || "Submission failed. Please try again.";
      Alert.alert("Submission failed", detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.timer}>Time remaning: {timeLeft}s</Text>
      <Text style={styles.header}>Creative Pitch</Text>
      <Text style={styles.instructions}>
        In EXACTLY 25 words, why should you win the £250,000 dream home?
      </Text>

      <TextInput
        style={styles.input}
        multiline
        numberOfLines={6}
        value={response}
        onChangeText={setResponse}
        placeholder="Type your response here..."
        placeholderTextColor="#C4B5FD"
      />
      
      <Text style={[styles.wordCount, wordCount === 25 ? styles.success : styles.error]}>
        Word count: {wordCount} / 25
      </Text>

      <TouchableOpacity 
        style={[styles.button, (wordCount !== 25 || isSubmitting) && styles.buttonDisabled]} 
        onPress={handleSubmit}
        disabled={wordCount !== 25 || isSubmitting}
      >
        {isSubmitting ? (
          <View style={styles.buttonInner}>
            <ActivityIndicator size="small" color="#FFF" style={styles.spinner} />
            <Text style={styles.buttonText}>SCORING...</Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>SUBMIT ENTRY</Text>
        )}
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
  timer: {
    color: '#F87171',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  header: {
    fontSize: 28,
    color: '#FFF',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  instructions: {
    color: '#C4B5FD',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    padding: 15,
    color: '#FFF',
    textAlignVertical: 'top',
    height: 150,
    fontSize: 16,
    marginBottom: 10,
  },
  wordCount: {
    textAlign: 'right',
    marginBottom: 30,
    fontWeight: 'bold',
  },
  success: { color: '#4ADE80' },
  error: { color: '#F87171' },
  button: {
    backgroundColor: '#F59E0B',
    padding: 15,
    borderRadius: 50,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: 'rgba(245, 158, 11, 0.5)',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    marginRight: 8,
  },
});
