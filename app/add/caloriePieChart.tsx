import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const CaloriePieChart = ({ protein, carbs, fat }) => {
  const proteinCalories = Math.round(protein * 4);
  const carbCalories = Math.round(carbs * 4);
  const fatCalories = Math.round(fat * 9);

  const data = [
    { name: 'Calories from Protein', population: proteinCalories, color: '#FF6384' },
    { name: 'Calories from Carbs', population: carbCalories, color: '#36A2EB' },
    { name: 'Calories from Fat', population: fatCalories, color: '#FFCE56' },
  ];

  return (
    <View style={styles.container}>
      <PieChart
        data={data}
        width={screenWidth} 
        height={180} 
        chartConfig={{
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        }}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CaloriePieChart;
