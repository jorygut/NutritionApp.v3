import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, TouchableOpacity, Button, Animated } from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import BackButton from '../backButton';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { format } from 'date-fns';

const LineGraph = () => {
  const router = useRouter();
  const [weightLogs, setWeightLogs] = useState({});
  const [weightAverages, setWeightAverages] = useState([]);

  // Function to handle log removal
  const removeLog = async (log) => {
    const token = await SecureStore.getItemAsync('userToken');
    const config = {
      headers: {
        Authorization: token,
      },
    };

    try {
      const response = await axios.post(
        'https://nutritionapi-zivc.onrender.com/removeWeight',
        { logs: log },
        config
      );

      if (response.status === 200) {
        // Update state to remove the log from the UI
        setWeightLogs(prevLogs => {
          const updatedLogs = { ...prevLogs };
          for (let key in updatedLogs) {
            updatedLogs[key] = updatedLogs[key].filter(item => item.index !== log.index);
          }
          return updatedLogs;
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Retrieve weights and format data
  const retrieveWeights = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.get('https://nutritionapi-zivc.onrender.com/retreiveWeight', config);

      if (response.status === 200) {
        const { weights, averages } = response.data;

        if (Array.isArray(weights)) {
          const sortedWeights = weights.sort((a, b) => new Date(b.date) - new Date(a.date));
          const organizedLogs = sortedWeights.reduce((acc, weight, index) => {
            const date = new Date(weight.date);
            const monthYear = format(date, 'MMM yyyy');
            
            if (!acc[monthYear]) {
              acc[monthYear] = [];
            }

            acc[monthYear].push({
              dateTime: format(date, 'MMM dd, yyyy HH:mm:ss'),
              weight: weight.weight,
              unit: weight.unit,
              index: weight.index !== undefined ? weight.index : index,
              movingAvg: averages.find(avg => avg.date === weight.date)?.moving_avg_change || 0,
            });

            return acc;
          }, {});

          const sortedMonthYears = Object.keys(organizedLogs).sort((a, b) => {
            const dateA = new Date(`${a} 01`);
            const dateB = new Date(`${b} 01`);
            return dateB - dateA;
          });

          const sortedLogs = sortedMonthYears.reduce((acc, monthYear) => {
            acc[monthYear] = organizedLogs[monthYear];
            return acc;
          }, {});

          setWeightLogs(sortedLogs);
        } else {
          console.log('Weights is not an array:', weights);
        }
      } else {
        console.log('Failed to retrieve weights:', response.status);
      }
    } catch (error) {
      console.error('Error retrieving weights:', error);
    }
  };

  useEffect(() => {
    retrieveWeights();
  }, []);

  const renderItem = ({ item }) => {
    const fadeAnim = new Animated.Value(1); 

    const handleRemove = () => {
      // Animate item
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        removeLog(item);
      });
    };
    const movingAvgColor = item.movingAvg > 0 ? 'movingAvgTextGreen': 'movingAvgTextRed';
    const movingAvgText = item.movingAvg !== null ? item.movingAvg.toFixed(3) : '0.000';

    return (
      <Animated.View style={[styles.logRow, { opacity: fadeAnim }]}>
        <Text style={styles.logText}>{item.dateTime}</Text>
        <Text style={styles.logText}>{item.weight.toFixed(3)} {item.unit}</Text>
        {item.movingAvg !== null && (
          <Text style={styles[movingAvgColor]}>{movingAvgText}</Text>
        )}
        <TouchableOpacity onPress={handleRemove} style={styles.removeButton}>
          <Icon name="cancel" size={24} color="red" />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {Object.keys(weightLogs).map((monthYear) => (
          <View key={monthYear} style={styles.monthContainer}>
            <Text style={styles.monthHeader}>{monthYear}</Text>
            <FlatList
              data={weightLogs[monthYear]}
              renderItem={renderItem}
              keyExtractor={(item) => item.index.toString()}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  monthContainer: {
    marginBottom: 20,
  },
  monthHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  logText: {
    fontSize: 14,
  },
  movingAvgTextGreen: {
    fontSize: 14,
    color: 'green',
  },
  movingAvgTextRed: {
    fontSize: 14,
    color: 'red',
  },
  removeButton: {
    paddingHorizontal: 5,
  },
  date:{
    position: 'relative',
    left: 100,
  }
});

export default LineGraph;
