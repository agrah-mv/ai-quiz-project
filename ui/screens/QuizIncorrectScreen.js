import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'http://localhost:8000';

export default function QuizIncorrectScreen({ navigation }) {
  const [attemptsRemaining, setAttemptsRemaining] = useState(null);

  const loadAttempts = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setAttemptsRemaining(0);
        return;
      }
      const res = await axios.get(`${API_BASE}/my-quiz-attempts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAttemptsRemaining(res.data.attempts_remaining ?? 0);
    } catch (e) {
      setAttemptsRemaining(0);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAttempts();
    }, [loadAttempts])
  );

  const handleReturnHome = () => {
    navigation.navigate('Dashboard');
  };

  const handleLogout = () => {
    navigation.navigate('Landing');
  };

  const handleAddAnotherEntry = () => {
    navigation.navigate('Quiz', { restart: true });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.errorIconBox}>
        <Text style={styles.errorIconText}>✗</Text>
      </View>
      
      <Text style={styles.header}>Incorrect Answer</Text>
      <Text style={styles.subtext}>Unfortunately, your last answer was incorrect.</Text>
      <Text style={styles.subtextBold}>A perfect score is required to proceed.</Text>
      
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>What happens next:</Text>
        <View style={styles.infoItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.infoText}>Your current attempt has ended</Text>
        </View>
       
        <View style={styles.infoItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.infoText}>Maximum 10 entries per competition</Text>
        </View>
        
      </View>

      {attemptsRemaining !== null && attemptsRemaining > 0 ? (
        <TouchableOpacity style={styles.addEntryBtn} onPress={handleAddAnotherEntry}>
          <Text style={styles.addEntryBtnText}>ADD ANOTHER ENTRY →</Text>
        </TouchableOpacity>
      ) : attemptsRemaining === 0 ? (
        <View style={styles.noRetryBox}>
          <Text style={styles.noRetryText}>Maximum attempts reached. No reattempts available.</Text>
        </View>
      ) : null}

      <TouchableOpacity style={styles.homeBtn} onPress={handleReturnHome}>
        <Text style={styles.btnText}>Return to Competition Home</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutBtnText}>Log Out</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>Pure skill. One prize. One winner.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#08002E',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    elevation: 10,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  errorIconText: {
    color: '#FFF',
    fontSize: 36,
    fontWeight: '900',
  },
  header: {
    fontSize: 28,
    fontWeight: '900',
    color: '#F87171',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtext: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtextBold: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
  },
  infoBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.2)',
    borderRadius: 18,
    padding: 16,
    width: '100%',
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 10,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bullet: {
    color: '#F87171',
    marginRight: 10,
    fontSize: 13,
  },
  infoText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
    lineHeight: 20,
    flexShrink: 1,
  },
  addEntryBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 50,
    padding: 15,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 8,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
  },
  addEntryBtnText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 15,
  },
  noRetryBox: {
    backgroundColor: 'rgba(248,113,113,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.35)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    width: '100%',
  },
  noRetryText: {
    color: '#FCA5A5',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
  },
  homeBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 50,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 8,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
  },
  btnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
  logoutBtn: {
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    borderRadius: 50,
    padding: 13,
    width: '100%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(248, 113, 113, 0.3)',
    marginBottom: 30,
  },
  logoutBtnText: {
    color: '#F87171',
    fontSize: 15,
    fontWeight: '700',
  },
  footer: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  }
});
