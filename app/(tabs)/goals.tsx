import React from 'react';
import { View, Button, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';

const HomeScreenGoals: React.FC = () => {
  const navigation = useNavigation();
  const router = useRouter();

  return (
    <View style={styles.container}>      
      <View style={styles.buttonContainer}>
        <Button
          title="Nutrition and Weight Goals"
          onPress={() => navigation.navigate('goals/goal1')}
          color="#3e5a9c"
        />
      </View>
      
      <View style={styles.buttonContainer}>
        <Button
          title="Log Weight"
          onPress={() => navigation.navigate('goals/goal2')}
          color="#3e5a9c"
        />
      </View>
      <View style={styles.buttonContainer}>
        <Button
          title="Virtual Coaching"
          onPress={() => navigation.navigate('goals/coachSettings')}
          color="#3e5a9c"
        />
      </View>
      <View style={styles.buttonContainer}>
        <Button
          title="Edit Kitchen"
          onPress={() => navigation.navigate('goals/goal4')}
          color="#3e5a9c"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
  },
  buttonContainer: {
    width: '90%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 5,
  },
});

export default HomeScreenGoals;
