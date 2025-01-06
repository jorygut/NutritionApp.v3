import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Platform, FlatList, Button, TouchableOpacity, Animated, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Swipeable } from 'react-native-reanimated';

//Create food inteface
interface Food {
  description: string;
  calories: number;
  protein: number;
  fat: number;
  carbohydrates: number;
  alcohol: number;
  sugars: number;
  sodium: number;
  fiber: number;
  cholesterol: number;
  saturated_fat: number;
  trans_fat: number;
  iron: number;
  calcium: number;
  ingredients: string;
  serving_multiplier: number;
  logged_servings: number;
  selected_servings: string;
  user_id: string;
  date: string;
  animatedValue?: Animated.Value; // Add this property
}
//Create meal interface
interface Meal {
  name: string;
  foods: Food[];
}
// Create Progress Bar for calories
const ProgressBarIOS: React.FC<{ progress: number }> = ({ progress }) => {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const newWidth = progress * 100;
    setWidth(newWidth);
  }, [progress]);

  return (
    <View style={styles.progressBarContainer}>
      <View style={[styles.progressBar, { width: `${width}%` }]} />
    </View>
  );
};
// Create Progress Bar for calories 
const SmallProgressBarIOS: React.FC<{ progress: number; macro: string }> = ({ progress, macro }) => {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const newWidth = progress * 100;
    setWidth(newWidth);
  }, [progress]);

  let styleVar;

  if (macro === "Protein"){  
    styleVar = styles.progressBarSmallProtein;
  } else if (macro === "Carb"){
    styleVar = styles.progressBarSmallCarb;
  } else if (macro === "Fat"){
    styleVar = styles.progressBarSmallFat;
  }
  else if (macro === "Alcohol"){
    styleVar = styles.progressBarSmallAlc;
  }  
  else {
    styleVar = styles.progressBarSmall; 
  }

  return (
    <View style={styles.progressBarContainerSmall}>
      <View style={[styleVar, { width: `${width}%` }]} />
    </View>
  );
};
// Main screen
const HomeScreen: React.FC = () => {
  //Set macro and calorie goals
  const navigation = useNavigation();
  const [progress, setProgress] = useState<number>(0.1);
  const [mealsData, setMealsData] = useState<Meal[]>([]);
  const [goalProtein, setGoalProtein] = useState<number>(0);
  const [goalCarbs, setGoalCarbs] = useState<number>(0);
  const [goalFat, setGoalFat] = useState<number>(0);
  const [goalAlcohol, setGoalAlcohol] = useState<number>(0);
  const [goalAvoiding, setGoalAvoiding] = useState(null);
  const [goalIncluding, setGoalIncluding] = useState(null);
  const [goalCalories, setGoalCalories] = useState<number>(0);
  const [currentCalories, setCurrentCalories] = useState('')
  //Get current date
  const date = new Date();
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const currentDate = `${day}-${month}-${year}`;

  const { calendarDate } = useLocalSearchParams();

  const [dateView, setDateView] = useState(currentDate);

  const [macrosShown, setMacrosShow] = useState(true);
  //Round numbers
  const roundToDecimal = (value: number, decimals: number = 1): number => {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  };
  // Get meal data
  const retrieveMeals = async (date: string) => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const url = `https://nutritionapi-zivc.onrender.com/meals?activateDate=${encodeURIComponent(dateView)}&token=${token}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  };
  //Get nutrient goal data
  const fetchNutrientGoals = async () => {
    const token = await SecureStore.getItemAsync('userToken');
    if (!token) {
      console.error('No token found');
      return null;
    }
    try {
      const response = await axios.get('https://nutritionapi-zivc.onrender.com/fetchNutrientGoals', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = response.data;
      console.log('Nutrient Goals:', data);
      return data;
    } catch (error) {
      console.error('Error fetching nutrient goals:', error);
      return null;
    }
  };
  // Remove food data
  const removeFood = async (mealIndex: number, foodIndex: number) => {
    const updatedMeals = [...mealsData];
    const food = updatedMeals[mealIndex].foods[foodIndex];
    console.log(food)
    
    Animated.timing(food.animatedValue!, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(async () => {
      try {
        const response = await axios.post('https://nutritionapi-zivc.onrender.com/remove', {
          food: food
        });
        console.log(response.data);

        // Remove food from state after animation completes
        updatedMeals[mealIndex].foods.splice(foodIndex, 1);
        setMealsData(updatedMeals);
      } catch (error) {
        console.error('Error:', error);
      }
    });
  };
  // Update meals on date change
  const updateMealDates = async (date) => {
    const token = await SecureStore.getItemAsync('userToken');
    try {
        const response = await axios.post('https://nutritionapi-zivc.onrender.com/update_meals', {
            date: date,
            token: token
        });
        console.log(response.data.message);
    } catch (error) {
        console.error('Error updating meals:', error);
    }
};
  //Calculate macros
  const calculateTotalMacros = () => {
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalCal = 0;
    let totalAlcohol = 0;

    mealsData.forEach((meal) => {
      meal.foods.forEach((food) => {
        totalProtein += food.protein;
        totalCarbs += food.carbohydrates;
        totalFat += food.fat;
        totalCal += food.calories;
        totalAlcohol += food.alcohol;
      });
    });
    totalProtein = roundToDecimal(totalProtein);
    totalCarbs = roundToDecimal(totalCarbs);
    totalFat = roundToDecimal(totalFat);
    totalCal = roundToDecimal(totalCal);
    totalAlcohol = roundToDecimal(totalAlcohol);

    return { totalProtein, totalCarbs, totalFat, totalCal, totalAlcohol };
  };

  const { totalProtein, totalCarbs, totalFat, totalCal, totalAlcohol } = calculateTotalMacros();
  //Add new meals
  const addMeal = () => {
    const newMeal = {
      name: `Meal ${mealsData.length + 1}`,
      foods: [],
    };
    const updatedMeals = [...mealsData, newMeal];
    setMealsData(updatedMeals);
  };
  // Remove meals
  const removeMeal = async (index: number) => {
    await updateMealDates(dateView);

    try{
      const token = await SecureStore.getItemAsync('userToken');
      const response = await axios.post('https://nutritionapi-zivc.onrender.com/removemeal', {
        meal: `Meal ${index + 1}`,
        date: currentDate,
        token: token,
      });
          const updatedMeals = mealsData.filter((_, mealIndex) => mealIndex !== index);
    const renumberedMeals = updatedMeals.map((meal, i) => ({
      ...meal,
      name: `Meal ${i + 1}`,
    }));
    setMealsData(renumberedMeals);
    }
    catch(error){
      console.log(error);
    }
  };
  //Switch date view
  const ChangeDate = (dateToChange, direction) => {
    const [day, month, year] = dateToChange.split("-").map(Number);
  
    let date = new Date(year, month - 1, day); 
  
    if (isNaN(date)) {
      console.error("Invalid date passed to ChangeDate function.");
      return;
    }

    if (direction === 'backward'){
      date.setDate(date.getDate() - 1);
    }
    else if (direction === 'forward'){
      date.setDate(date.getDate() + 1);
    }

    const newDay = date.getDate();
    const newMonth = date.getMonth() + 1; 
    const newYear = date.getFullYear();
  
    const newDate = `${newDay}-${newMonth}-${newYear}`;
  
    setDateView(newDate);
    console.log(dateView);
  };
  //Hide/Show macronutrients
  const toggleMacrosShown = () =>{
    if (macrosShown === true){
      setMacrosShow(false)
    }
    else{
      setMacrosShow(true);
    }
  }
  //Fetch Coach messages
  const CoachUpdates = async () =>{
    try{
      const token = await SecureStore.getItemAsync('userToken');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.get('https://nutritionapi-zivc.onrender.com/getGoals', config)
      if (response.status === 200){
        console.log(response.data)
      }
    }
    catch(error){
      console.log(error)
    }
  }
  // Retrieve days meals
  useEffect(() => {
    const fetchData = async () => {
      try {
        const meals = await retrieveMeals(dateView);
  
        const groupedMeals: Meal[] = meals.reduce((acc: Meal[], food: Food) => {
          const mealName = food.meal;
          const existingMeal = acc.find((meal) => meal.name === mealName);
  
          if (existingMeal) {
            existingMeal.foods.push({ ...food, animatedValue: new Animated.Value(1) });
          } else {
            acc.push({ name: mealName, foods: [{ ...food, animatedValue: new Animated.Value(1) }] });
          }
  
          return acc;
        }, []);
  
        // Sort meals by name
        groupedMeals.sort((a, b) => a.name.localeCompare(b.name));
  
        setMealsData(groupedMeals);
      } catch (error) {
        console.error('Error fetching meals:', error);
      }
    };
  
    fetchData();
  }, [dateView]);
  //fetch nutrient goals on load
  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchNutrientGoals();
      if (data) {
        setGoalAvoiding(data.avoiding_ingredients);
        setGoalIncluding(data.including_ingredients);
        setGoalCalories(data.goal_calories.toFixed(1).toString());
        setGoalProtein(data.goal_protein.toFixed(1).toString());
        setGoalCarbs(data.goal_carbs.toFixed(1).toString());
        setGoalFat(data.goal_fat.toFixed(1).toString());
        setGoalAlcohol(data.goal_alcohol.toFixed(1).toString());
      }
    };
  
    fetchData();
  
  }, []);
  // Set date on load
  useEffect(() => {
    if (calendarDate) {
      setDateView(calendarDate);
    }
  }, [calendarDate]);
  // Fetch meals and log history
  const renderMealItem = ({ item, index }: { item: Meal, index: number }) => (
    <View style={[styles.mealContainer, index !== 0 && styles.mealSeparator]}>
      <View style={styles.mealHeader}>
        <Text style={styles.mealName}>{item.name}</Text>
        <View style={styles.mealButtons}>
          <Button
            title="See Details"
            onPress={() => { navigation.navigate('add/seeDetails', { mealData: item }) }}
          />
          <Button
            title="Remove Meal"
            color="red"
            onPress={() => removeMeal(index)}
          />
        </View>
      </View>
      <View style={styles.tableHeader}>
        <Text style={[styles.columnHeader, styles.columnHeaderName]}>Name</Text>
        <Text style={[styles.columnHeader, styles.columnHeaderSmallCals]}>Cals</Text>
        <Text style={[styles.columnHeader, styles.columnHeaderSmall]}>Serv</Text>
        <Text style={[styles.columnHeader, styles.columnHeaderSmallProt]}>P</Text>
        <Text style={[styles.columnHeader, styles.columnHeaderSmallFat]}>F</Text>
        <Text style={[styles.columnHeader, styles.columnHeaderSmallCarb]}>C</Text>
      </View>
      <FlatList
        data={item.foods}
        keyExtractor={(food, foodIndex) => `${food.description}_${foodIndex}`}
        renderItem={({ item: food, index: foodIndex }) => (
          <Animated.View style={{ opacity: food.animatedValue, transform: [{ scale: food.animatedValue }] }}>
            <View style={styles.tableRow}>
              <Text style={styles.columnFood}>{food.description}</Text>
              <View style={styles.verticalLine}></View>
              <Text style={styles.column}>{roundToDecimal(food.calories)}</Text>
              <View style={styles.verticalLine}></View>
              <View style={styles.verticalLine}></View>
              <Text style={styles.column}>{food.selected_servings}</Text>
              <View style={styles.verticalLine}></View>
              <Text style={styles.column}>{roundToDecimal(food.protein)}g</Text>
              <View style={styles.verticalLine}></View>
              <Text style={styles.column}>{roundToDecimal(food.fat)}g</Text>
              <View style={styles.verticalLine}></View>
              <Text style={styles.column}>{roundToDecimal(food.carbohydrates)}g</Text>
              <View style={styles.buttonContainer}>
              </View>
              <TouchableOpacity onPress={() => removeFood(index, foodIndex)} style={styles.removeButton}>
                  <Icon name="cancel" size={16} color="red" />
                </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      />
      <View style={styles.addFoodButton}>
        <Button
          title='Add Food'
          color="#841584"
          onPress={() => navigation.navigate('add/addFood', { meal: item.name, date: dateView })}
        />
      </View>
    </View>
  );
  //Main body
  return (
    <View style={styles.container}>
      <View style={styles.arrowContainer}>
      <TouchableOpacity style={styles.backDate} onPress={() => ChangeDate(dateView, 'backward')}>
        <Icon name={'arrow-back'} size={30} color="#000000" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.forwardDate} onPress={() => ChangeDate(dateView, 'forward')}>
        <Icon name={'arrow-forward'} size={30} color="#000000" />
      </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={() => navigation.navigate('settings/calendar', { data: dateView })}>
        <Text style={styles.dateText}>{dateView}</Text>
        </TouchableOpacity>
      <Text style={styles.calories}>Total Calories: {totalCal}</Text>
      <View style={styles.progressBarWrapper}>
        <ProgressBarIOS progress={totalCal / goalCalories} />
      </View>
      {macrosShown && (
              <View style={styles.macroTable}>
              <View style={styles.macroRow}>
                <Text style={styles.macroColumn}>Nutrient</Text>
                <Text style={styles.macroColumn}>Current</Text>
                <Text style={styles.macroColumn}>Goal</Text>
              </View>
              <View style={styles.macroRow}>
                <Text style={styles.macroColumn}>Protein</Text>
                <Text style={styles.macroColumn}>{totalProtein}g</Text>
                <Text style={styles.macroColumnInput}>{goalProtein.toString()}</Text>
              </View>
              <SmallProgressBarIOS progress={totalProtein / goalProtein} macro="Protein"/>
              <View style={styles.macroRow}>
                <Text style={styles.macroColumn}>Carbs</Text>
                <Text style={styles.macroColumn}>{totalCarbs}g</Text>
                <Text style={styles.macroColumnInput}>{goalCarbs.toString()}</Text>
              </View>
              <SmallProgressBarIOS progress={totalCarbs / goalCarbs} macro="Carb"/>
              <View style={styles.macroRow}>
                <Text style={styles.macroColumn}>Fat</Text>
                <Text style={styles.macroColumn}>{totalFat}g</Text>
                <Text style={styles.macroColumnInput}>{goalFat.toString()}</Text>
              </View>
              <SmallProgressBarIOS progress={totalFat / goalFat} macro="Fat"/>
              <View style={styles.macroRow}>
                <Text style={styles.macroColumn}>Alcohol</Text>
                <Text style={styles.macroColumn}>{totalAlcohol}g</Text>
                <Text style={styles.macroColumnInput}>{goalAlcohol.toString()}</Text>
              </View>
              <SmallProgressBarIOS progress={totalAlcohol / goalAlcohol} macro="Alcohol"/>
            </View>
      )}
      <TouchableOpacity onPress={() => toggleMacrosShown()} style={styles.toggleMacroBars}>
        <Text>{macrosShown ? 'Hide Macros' : 'Show Macros'}</Text>
      </TouchableOpacity>

      <FlatList
        data={mealsData}
        renderItem={renderMealItem}
        keyExtractor={(item, index) => `${item.name}_${index}`}
        contentContainerStyle={styles.listContentContainer}
      />
      <View style={styles.addButtonContainer}>
        <Button
          title="Add Meal"
          onPress={addMeal}
        />
      </View>
    </View>
  );
};
//Style page
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  calories: {
    fontSize: 24,
    marginBottom: 10,
  },
  progressBarWrapper: {
    marginBottom: 20,
  },
  progressBarContainer: {
    height: 20,
    width: '100%',
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBarContainerSmall: {
    height: 3,
    width: '100%',
    backgroundColor: '#b6d1fc',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3e9c56',
  },
  progressBarSmall: {
    height: '100%',
    backgroundColor: '#3b5998',
  },
  progressBarSmallProtein: {
    height: '100%',
    backgroundColor: '#d60f34',
  },
  progressBarSmallCarb: {
    height: '100%',
    backgroundColor: '#1e63f7',
  },
  progressBarSmallFat: {
    height: '100%',
    backgroundColor: '#5500c4',
  },
  progressBarSmallAlc: {
    height: '100%',
    backgroundColor: '#db21ad',
  },
  macroTable: {
    marginBottom: 20,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  macroColumn: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  macroColumnInput: {
    flex: 1,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  mealContainer: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
  },
  mealSeparator: {
    marginTop: 20,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  mealName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  mealButtons: {
    flexDirection: 'row',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#b6d1fc',
    paddingVertical: 5,
    borderRadius: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  columnHeader: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 12,
  },
  columnHeaderName: {
    flex: 2, 
  },
  columnHeaderSmall: {
    flex: 1,
    paddingHorizontal: 1, 
  },
  columnHeaderSmallCals: {
    flex: 1,
    paddingHorizontal: 1, 
    position: 'relative',
    left: 10,
  },
  columnHeaderSmallProt: {
    flex: 1,
    paddingHorizontal: 1, 
    position: 'relative',
    right: 15,
  },
  columnHeaderSmallFat: {
    flex: 1,
    paddingHorizontal: 1, 
    position: 'relative',
    right: 28,
  },
  columnHeaderSmallCarb: {
    flex: 1,
    paddingHorizontal: 1, 
    position: 'relative',
    right: 45,
  },
  columnFood: {
    flex: 3, 
    textAlign: 'left',
    paddingLeft: 10,
    fontSize: 10,
  },
  column: {
    flex: 1,  
    textAlign: 'center',
    fontSize: 10,
  },
  verticalLine: {
    width: 1,
    backgroundColor: '#ccc',
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    position: 'relative',
    left: 8,
  },
  addFoodButton: {
    marginTop: 10,
  },
  listContentContainer: {
    paddingBottom: 100,
  },
  addButtonContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  dateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  dateText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  backDate:{
    position: 'relative',
    top: 65,
    right: 40,
  },
  forwardDate: {
    position: 'relative',
    top: 65,
    left: 40,
  },
  arrowContainer:{
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 0, 
  },
  calendar: {
    borderWidth: 1,
    borderRadius: 5,
    position: 'relative',
    top: 10,
    right: 120,
  },
  toggleMacroBars:{
    fontSize: 10,
    alignItems: 'center'
  }
});

export default HomeScreen;
