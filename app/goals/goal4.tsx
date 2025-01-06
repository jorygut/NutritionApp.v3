import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
const router = useRouter();
const Goal4: React.FC = () => (
  
  <View style={styles.container}>
    <Text style={styles.text}>Your Kitchen</Text>
    <TouchableOpacity onPress={() => router.push('/goals/addKitchen')}>
      <Text style={styles.add}>Add Food</Text>
    </TouchableOpacity>
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
  add: {
    position: 'relative',
    top: 20,
  }
});

export default Goal4;
