import React from 'react';
import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Button, ScrollView, TouchableOpacity, LayoutAnimation, Platform, UIManager, Modal, ActionSheetIOS, Switch } from 'react-native';
import axios from 'axios';
import BackButton from '../backButton';
import { useRouter } from 'expo-router';

const Goal1: React.FC = () => {
  const router = useRouter();

  const [budget, setBudget] = useState(0)

  return (
    <View style={styles.container}>
      <View style={styles.back}>
        <BackButton onPress={() => router.push('/')}/>
      </View>
      <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="Enter budget"
          value={budget}
          onChangeText={setBudget}
        />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
  },
  back: {
    position: 'relative',
    bottom: 350,
    right: 150,
  },
  input: {
    borderBlockColor: "black"
  }
});

export default Goal1;
