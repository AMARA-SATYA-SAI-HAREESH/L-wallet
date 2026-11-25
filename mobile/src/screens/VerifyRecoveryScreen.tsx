// mobile/src/screens/VerifyRecoveryScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView,
} from 'react-native';
import { getMnemonic, getPin } from '../services/storageService';
import { Skeleton } from '../components/Skeleton';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { COLORS } from '../constants/theme';

export default function VerifyRecoveryScreen({ navigation }: any) {
  const [fullPhrase, setFullPhrase] = useState<string[]>([]);
  const [shuffled, setShuffled] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loadingPhrase, setLoadingPhrase] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    getMnemonic()
      .then((phrase) => {
        if (!phrase) return;
        const words = phrase.split(' ');
        setFullPhrase(words);
        setShuffled([...words].sort(() => Math.random() - 0.5));
      })
      .finally(() => setLoadingPhrase(false));
  }, []);

  const pickWord = (word: string) => {
    if (selected.includes(word)) return;
    setErrorMessage('');
    setSelected([...selected, word]);
  };

  const removeWord = (idx: number) => {
    setErrorMessage('');
    setSelected(selected.filter((_, i) => i !== idx));
  };

  const onVerify = () => {
    setErrorMessage('');
    setVerifying(true);
    setTimeout(async () => {
      const correct = selected.join(' ') === fullPhrase.join(' ');
      setVerifying(false);
      if (correct) {
        const pin = await getPin();
        if (pin) {
          navigation.replace('Home');
        } else {
          navigation.navigate('SetupPin');
        }
      } else {
        setErrorMessage('Incorrect word order. Please re-enter the words in the exact order you wrote down.');
        setSelected([]);
      }
    }, 150);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <LoadingOverlay visible={verifying} message="Verifying recovery phrase…" />

      <Text style={styles.title}>Verify Recovery Phrase</Text>
      <Text style={styles.subtitle}>
        Tap the words in the correct order to verify you have written them down.
      </Text>

      {/* Inline Red Error Message */}
      {errorMessage ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
        </View>
      ) : null}

      {/* Selected words */}
      <View style={styles.selectedBox}>
        <View style={styles.phraseRow}>
          {selected.map((w, i) => (
            <TouchableOpacity key={i} style={styles.selectedChip} onPress={() => removeWord(i)}>
              <Text style={styles.chipText}>{i + 1}. {w}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Shuffled word bank */}
      {loadingPhrase ? (
        <View style={styles.wordBank}>
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} width={82} height={36} borderRadius={8} />
          ))}
        </View>
      ) : (
        <View style={styles.wordBank}>
          {shuffled.map((word, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.wordChip, selected.includes(word) && styles.wordChipUsed]}
              onPress={() => pickWord(word)}
              disabled={selected.includes(word)}
            >
              <Text style={[styles.wordText, selected.includes(word) && styles.wordTextUsed]}>
                {word}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={[styles.primaryBtn, (selected.length !== 12 || verifying) && styles.disabledBtn]}
        onPress={onVerify}
        disabled={selected.length !== 12 || verifying}
      >
        <Text style={styles.primaryBtnText}>Confirm →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: COLORS.background, padding: 24, paddingTop: 56, flexGrow: 1 },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22, marginBottom: 20 },
  errorBox: {
    backgroundColor: '#2D0A0A', borderWidth: 1, borderColor: COLORS.error,
    borderRadius: 10, padding: 12, marginBottom: 16,
  },
  errorText: { color: '#FF6B6B', fontSize: 13, lineHeight: 18, textAlign: 'center' },
  selectedBox: {
    minHeight: 100, backgroundColor: COLORS.card, borderRadius: 12,
    padding: 12, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border,
  },
  phraseRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selectedChip: {
    backgroundColor: COLORS.primary, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  chipText: { color: '#fff', fontSize: 13 },
  wordBank: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  wordChip: {
    backgroundColor: COLORS.card, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.border,
  },
  wordChipUsed: { opacity: 0.3 },
  wordText: { color: COLORS.textPrimary, fontSize: 14 },
  wordTextUsed: { color: COLORS.textSecondary },
  primaryBtn: {
    backgroundColor: COLORS.primary, paddingVertical: 16,
    borderRadius: 12, alignItems: 'center',
  },
  disabledBtn: { opacity: 0.5 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
