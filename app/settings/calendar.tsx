import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { Calendar } from 'react-native-calendars';
import BackButton from '../backButton';
import { useRouter } from 'expo-router';
import { useNavigation, useRoute } from '@react-navigation/native';


const CalendarPage = () => {
  const router = useRouter();
  const route = useRoute();
  const navigation = useNavigation();
  const { page } = route.params;

  const handleDateChange = (day) => {
    console.log(day);
    if (page != "weightLogs"){
      const [year, month, date] = day.dateString.split('-');
  
      const formattedDate = `${date}-${month}-${year}`;
    
      router.push({
        pathname: '/',
        params: { calendarDate: formattedDate },
      });
    }
    else{
      const [year, month, date] = day.dateString.split('-');
  
      const formattedDate = `${date}-${month}-${year}`;
    
      router.push({
        pathname: '/goals/goal2',
        params: { calendarDate: formattedDate },
      });
    }
  };

  return (
    <View style={styles.container}>
      <BackButton onPress={() => router.push('/')}/>
      <Button title='test' onPress={() => console.log(page)}/>
      <Text style={styles.header}>Calendar</Text>
      <Calendar
        current={new Date().toISOString().split('T')[0]}
        minDate={'2020-05-10'}
        maxDate={'2025-05-30'}
        monthFormat={'yyyy MM'}
        hideArrows={false}
        renderHeader={(date) => {
          const month = date.toLocaleString('en-US', { month: 'long' });
          const year = date.getFullYear();
          return (
            <View style={styles.headerContainer}>
              <Text style={styles.headerText}>{`${month} ${year}`}</Text>
            </View>
          );
        }}
        onDayPress={(day) => {
          handleDateChange(day);
        }}
        theme={{
          selectedDayBackgroundColor: 'blue',
          selectedDayTextColor: 'white',
          todayTextColor: 'red',
          dayTextColor: 'black',
          monthTextColor: 'blue',
          arrowColor: 'blue',
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  headerContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default CalendarPage;
