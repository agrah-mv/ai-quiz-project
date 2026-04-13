import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'http://localhost:8000';

export default function ResultScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  const loadResult = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setSubmitted(false);
        setResult(null);
        return;
      }
      const res = await axios.get(`${API_BASE}/my-creative-result`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.submitted && res.data.scores) {
        setSubmitted(true);
        setResult(res.data.scores);
        await AsyncStorage.setItem('latestAiResult', JSON.stringify(res.data.scores));
      } else {
        setSubmitted(false);
        setResult(null);
        await AsyncStorage.removeItem('latestAiResult');
      }
    } catch (e) {
      console.error('Failed to load creative result', e);
      setSubmitted(false);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadResult();
    }, [loadResult])
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4ADE80" />
      </View>
    );
  }

  if (!submitted || !result) {
    return (
      <ScrollView style={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backTxt}>← Back to Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.header}>AI Evaluation Result</Text>
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>No creative submission yet</Text>
          <Text style={styles.emptyBody}>
            Complete the quiz, then submit your 25-word entry. Your AI scores will appear here for your
            account only.
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backTxt}>← Back to Dashboard</Text>
      </TouchableOpacity>

      <Text style={styles.header}>AI Evaluation Result</Text>

      <View style={styles.scoreCircle}>
        <Text style={styles.scoreNum}>{result.total_score}</Text>
        <Text style={styles.scoreMax}>/ 100</Text>
      </View>

      <Text style={styles.rubricHead}>Rubric Breakdown</Text>

      <View style={styles.rubricBox}>
        <RubricRow title="Relevance (25)" score={result.relevance} />
        <RubricRow title="Creativity (25)" score={result.creativity} />
        <RubricRow title="Clarity (25)" score={result.clarity} />
        <RubricRow title="Impact (25)" score={result.impact} />
      </View>
    </ScrollView>
  );
}

function RubricRow({ title, score }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowTitle}>{title}</Text>
      <Text style={styles.rowScore}>{score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08002E',
    padding: 20,
    paddingTop: 50,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtn: {
    marginBottom: 20,
  },
  backTxt: {
    color: '#F59E0B',
    fontSize: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 30,
    textAlign: 'center',
  },
  emptyBox: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 15,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(196, 181, 253, 0.2)',
  },
  emptyTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyBody: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  scoreCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 5,
    borderColor: '#4ADE80',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
  },
  scoreNum: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFF',
  },
  scoreMax: {
    fontSize: 18,
    color: '#C4B5FD',
  },
  rubricHead: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 15,
  },
  rubricBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 50,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  rowTitle: {
    color: '#C4B5FD',
    fontSize: 16,
  },
  rowScore: {
    color: '#4ADE80',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
