import React from 'react';
import { View, Button, StyleSheet, Text, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const HomeScreenStats: React.FC = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>      
      <View style={styles.buttonContainer}>
        <Button
          title="Nutrition Trends"
          onPress={() => navigation.navigate('stats/trends')}
          color="#3e5a9c"
        />
      </View>
      
      <View style={styles.buttonContainer}>
        <Button
          title="Measurements and Body Trends"
          onPress={() => navigation.navigate('stats/measurements')}
          color="#3e5a9c"
        />
      </View>
      <View style={styles.buttonContainer}>
        <Button
          title="Edit Budget"
          onPress={() => navigation.navigate('goals/goal3')}
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

export default HomeScreenStats;
