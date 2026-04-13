import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'http://localhost:8000';

export default function DashboardScreen({ navigation }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [maxAttempts, setMaxAttempts] = useState(10);
  const [attemptsRemaining, setAttemptsRemaining] = useState(0);

  const loadDashboard = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [leaderboardRes, attemptsRes] = await Promise.all([
        axios.get(`${API_BASE}/leaderboard`),
        axios.get(`${API_BASE}/my-quiz-attempts`, { headers }),
      ]);

      setLeaderboard(leaderboardRes.data.leaderboard || []);
      setAttemptsUsed(attemptsRes.data.attempts_used ?? 0);
      setMaxAttempts(attemptsRes.data.max_attempts ?? 10);
      setAttemptsRemaining(attemptsRes.data.attempts_remaining ?? 0);
    } catch (err) {
      setLeaderboard([
         { email: "te***@gmail.com", score: 92 },
         { email: "lu***@yahoo.com", score: 88 }
      ]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['userToken', 'latestAiResult']);
    navigation.reset({
      index: 0,
      routes: [{ name: 'Landing' }],
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>My Dashboard</Text>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Latest Entry</Text>
        <Text style={styles.cardText}>You submitted 1 entry for the £250,000 Dream Home.</Text>
        <Text style={styles.attemptsText}>
          {attemptsUsed} of {maxAttempts} entries used · {attemptsRemaining} remaining
        </Text>

        {attemptsRemaining > 0 ? (
          <TouchableOpacity
            style={styles.addEntryBtn}
            onPress={() => navigation.navigate('Quiz', { restart: true })}
          >
            <Text style={styles.addEntryBtnText}>ADD ANOTHER ENTRY →</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.noRetryBox}>
            <Text style={styles.noRetryText}>Maximum entries reached. No reattempts available.</Text>
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => navigation.navigate('Result')}
        >
          <Text style={styles.actionBtnText}>VIEW AI RESULT</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subhead}>Global Leaderboard (Top 10)</Text>
      <View style={styles.leaderboardBox}>
        {leaderboard.map((item, index) => (
          <View key={index} style={styles.lbRow}>
            <Text style={styles.lbRank}>#{index + 1}</Text>
            <Text style={styles.lbEmail}>{item.email}</Text>
            <Text style={styles.lbScore}>{item.score} / 100</Text>
          </View>
        ))}
        {leaderboard.length === 0 && <Text style={{color:'#FFF'}}>No entries yet.</Text>}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutBtnText}>LOG OUT</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08002E',
    padding: 20,
    paddingTop: 50,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 30,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 20,
    borderRadius: 15,
    marginBottom: 30,
  },
  cardTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  cardText: {
    color: '#C4B5FD',
    marginBottom: 20,
  },
  attemptsText: {
    color: '#FBBF24',
    marginBottom: 14,
    fontWeight: '700',
  },
  addEntryBtn: {
    backgroundColor: '#F59E0B',
    padding: 15,
    borderRadius: 50,
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
  },
  noRetryText: {
    color: '#FCA5A5',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
  },
  actionBtn: {
    backgroundColor: '#EA580C',
    padding: 15,
    borderRadius: 50,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  subhead: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 15,
  },
  leaderboardBox: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 50,
  },
  lbRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  lbRank: {
    color: '#F59E0B',
    fontWeight: 'bold',
    width: 30,
  },
  lbEmail: {
    color: '#FFF',
    flex: 1,
  },
  lbScore: {
    color: '#4ADE80',
    fontWeight: 'bold',
  },
  logoutBtn: {
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(248, 113, 113, 0.3)',
    borderRadius: 50,
    padding: 13,
    alignItems: 'center',
    marginBottom: 30,
  },
  logoutBtnText: {
    color: '#F87171',
    fontSize: 15,
    fontWeight: '700',
  }
});
