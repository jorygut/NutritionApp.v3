import React, { useEffect, useState } from 'react';
import { View, Text, Dimensions, Button, TouchableOpacity, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { format, subDays, isWithinInterval } from 'date-fns';
import { useRouter } from 'expo-router';

const LineGraph = () => {
  const router = useRouter();
  const [weightData, setWeightData] = useState({ labels: [], data: [], unit: [] });
  const [timeframe, setTimeframe] = useState(7);

  const handleTimeRange = (range: string) => {
    const range_num = Number(range.split(' ')[0]);
    const range_time = range.split(' ')[1];
    let days = 0;

    if (range_time === 'month' || range_time === 'months') {
      days = range_num * 30;
    } else if (range_time === 'week') {
      days = range_num * 7;
    } else if (range_time === 'All time') {
      days = 0;
    }

    setTimeframe(days);
  };

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
      const { weights } = response.data;

      if (Array.isArray(weights)) {
        const sortedWeights = weights.sort((a, b) => new Date(a.date) - new Date(b.date));

        const endDate = new Date();
        const startDate = timeframe > 0 ? subDays(endDate, timeframe) : new Date(0);

        const filteredWeights = sortedWeights.filter(weight =>
          isWithinInterval(new Date(weight.date), { start: startDate, end: endDate })
        );

        const dailyWeights = filteredWeights.reduce((acc, weight) => {
          const date = format(new Date(weight.date), 'MMM dd');
          if (!acc[date]) {
            acc[date] = { totalWeight: 0, count: 0 };
          }
          acc[date].totalWeight += weight.weight;
          acc[date].count += 1;
          return acc;
        }, {});

        const averagedWeights = Object.keys(dailyWeights).map(date => {
          const { totalWeight, count } = dailyWeights[date];
          return { date, averageWeight: totalWeight / count };
        });

        const labels = averagedWeights.map(entry => entry.date);
        const data = averagedWeights.map(entry => entry.averageWeight);
        const unit = filteredWeights.length > 0 ? filteredWeights[0].unit : '';

        setWeightData({ labels, data, unit });
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
  }, [timeframe]);

  return (
    <View>
      <LineChart
        data={{
          labels: weightData.labels,
          datasets: [
            {
              data: weightData.data,
            },
          ],
        }}
        width={Dimensions.get('window').width - 16}
        height={220}
        yAxisLabel=""
        yAxisSuffix={weightData.unit}
        yAxisInterval={1}
        chartConfig={{
          backgroundColor: '#e26a00',
          backgroundGradientFrom: '#fb8c00',
          backgroundGradientTo: '#ffa726',
          decimalPlaces: 1,
          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: '6',
            strokeWidth: '2',
            stroke: '#ffa726',
          },
        }}
        bezier
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
      />
      <View style={styles.timeRangeContainer}>
        {['1 week', '1 month', '3 months', '6 months', '12 months', 'All time'].map((range) => (
          <TouchableOpacity
            key={range}
            style={styles.timeRangeButton}
            onPress={() => handleTimeRange(range)}
          >
            <Text style={styles.timeRangeText}>{range}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Button
        title="See All"
        onPress={() =>
          router.push({
            pathname: '/stats/weightLogs',
            params: { weightData: JSON.stringify(weightData) },
          })
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  timeRangeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginVertical: 20,
  },
  timeRangeButton: {
    width: '30%',
    backgroundColor: '#4682B4',
    padding: 10,
    margin: 5,
    borderRadius: 5,
    alignItems: 'center',
  },
  timeRangeText: {
    color: 'white',
    fontSize: 14,
  },
});

export default LineGraph;
