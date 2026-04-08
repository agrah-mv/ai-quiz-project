import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRoute, useIsFocused, useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'http://localhost:8000';

export default function QuizScreen({ navigation }) {
  const route = useRoute();
  const isFocused = useIsFocused();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [answers, setAnswers] = useState({});
  const [attemptsRemaining, setAttemptsRemaining] = useState(null);
  const [maxAttempts, setMaxAttempts] = useState(10);
  const [timeoutHandled, setTimeoutHandled] = useState(false);

  const fetchQuiz = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await axios.get(`${API_BASE}/quiz`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuestions(res.data.questions || []);
      setAttemptsRemaining(res.data.attempts_remaining ?? null);
      setMaxAttempts(res.data.max_attempts ?? 10);
    } catch (err) {
      console.log("Quiz Fetch Error:", err);
      const detail = err.response?.data?.detail || "Could not load quiz.";
      Alert.alert("Quiz Unavailable", detail, [
        { text: "OK", onPress: () => navigation.navigate('Landing') }
      ]);
    }
  }, [navigation]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  // "Add another entry" / retry: reset state and reload questions without double-counting
  useFocusEffect(
    useCallback(() => {
      if (!route.params?.restart) return;
      navigation.setParams({ restart: undefined });
      setCurrentIndex(0);
      setTimeLeft(30);
      setAnswers({});
      setTimeoutHandled(false);
      setQuestions([]);
      fetchQuiz();
    }, [route.params?.restart, navigation, fetchQuiz])
  );

  useEffect(() => {
    // While this screen is covered (e.g. QuizIncorrect), do not count down or POST /quiz-timeout.
    if (!isFocused || questions.length === 0) return;

    if (timeLeft === 0) {
      const handleTimeout = async () => {
        if (timeoutHandled) return;
        setTimeoutHandled(true);
        try {
          const token = await AsyncStorage.getItem('userToken');
          await axios.post(`${API_BASE}/quiz-timeout`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (err) {
          console.log("Timeout Record Error:", err);
        } finally {
          navigation.navigate('QuizTimeout');
        }
      };
      handleTimeout();
      return;
    }

    const intervalId = setInterval(() => {
      setTimeLeft(t => t - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timeLeft, questions, isFocused, navigation]);

  const handleAnswer = async (optionKey) => {
    const q = questions[currentIndex];
    
    try {
      const token = await AsyncStorage.getItem('userToken');
      // Verify the answer immediately
      const verifyRes = await axios.post(`${API_BASE}/verify-answer`, { 
        id: q.id, 
        answer: optionKey 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!verifyRes.data.correct) {
        // Immediate failure screen
        navigation.navigate('QuizIncorrect');
        return;
      }

      const newAnswers = { ...answers, [q.id]: optionKey };
      setAnswers(newAnswers);

      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setTimeLeft(30); // reset timer
        setTimeoutHandled(false);
      } else {
        // All correct! Submit the final quiz attempt
        const res = await axios.post(`${API_BASE}/submit-quiz`, { answers: newAnswers }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.passed) {
          navigation.navigate('Creative');
        } else {
          navigation.navigate('QuizIncorrect');
        }
      }
    } catch (err) {
      console.log("Quiz Error:", err);
      const detail = err.response?.data?.detail || "";
      if (detail === "Maximum attempts reached") {
        Alert.alert("Maximum attempts reached", "You have used all 10 quiz attempts.");
        navigation.navigate('Landing');
      } else if (err.response && err.response.status === 400) {
        navigation.navigate('QuizIncorrect');
      } else {
        Alert.alert("Connection Error", "Could not verify answer. Please check your internet.");
      }
    }
  };

  if (questions.length === 0) {
    return <View style={styles.container}><Text style={styles.text}>Loading...</Text></View>;
  }

  const currentQ = questions[currentIndex];

  return (
    <View style={styles.container}>
      <Text style={styles.timer}>Time left: {timeLeft}s</Text>
      {attemptsRemaining !== null ? (
        <Text style={styles.attempts}>Attempts remaining: {attemptsRemaining}/{maxAttempts}</Text>
      ) : null}
      <Text style={styles.progress}>Question {currentIndex + 1} of {questions.length}</Text>
      
      <Text style={styles.question}>{currentQ.question}</Text>
      
      {Object.entries(currentQ.options).map(([key, value]) => (
        <TouchableOpacity 
          key={key} 
          style={styles.optionBtn}
          onPress={() => handleAnswer(key)}
        >
          <Text style={styles.optionText}>{key}. {value}</Text>
        </TouchableOpacity>
      ))}
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
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  progress: {
    color: '#C4B5FD',
    textAlign: 'center',
    marginBottom: 30,
  },
  attempts: {
    color: '#FBBF24',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '700',
  },
  question: {
    fontSize: 24,
    color: '#FFF',
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  optionBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  optionText: {
    color: '#FFF',
    fontSize: 16,
  },
  text: {
    color: '#FFF',
    textAlign: 'center',
  }
});
