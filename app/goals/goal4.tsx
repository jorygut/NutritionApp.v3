// app/goals/goal1.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Goal4: React.FC = () => (
  <View style={styles.container}>
    <Text style={styles.text}>This is Goal 4</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
  },
});

export default Goal4;
