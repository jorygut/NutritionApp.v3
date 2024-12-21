import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();

  const navigateToOption = (optionName: string) => {
    navigation.navigate(optionName); 
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <TouchableOpacity
        style={styles.optionContainer}
        onPress={() => navigateToOption('settings/login')}
      >
        <Text style={styles.optionText}>Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.optionContainer}
        onPress={() => navigateToOption('AccountSettings')}
      >
        <Text style={styles.optionText}>Account Settings</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  optionContainer: {
    width: '100%',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  optionText: {
    fontSize: 18,
  },
});

export default SettingsScreen;
