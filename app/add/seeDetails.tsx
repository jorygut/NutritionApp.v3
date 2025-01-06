import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Text, FlatList, Button, Animated } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import BackButton from '../backButton';
import { useRouter } from 'expo-router';
import axios from 'axios';
import CaloriePieChart from './caloriePieChart';

const SeeDetails: React.FC = () => {
  //Declare routes and routers
  const route = useRoute();
  const router = useRouter();
  
  // Fetch meal data
  const [mealData, setMealData] = useState(route.params?.mealData);

  // Initialize state for total macros
  const [totalCalories, setTotalCalories] = useState(0);
  const [totalProtein, setTotalProtein] = useState(0);
  const [totalFat, setTotalFat] = useState(0);
  const [totalCarbs, setTotalCarbs] = useState(0);

  // Calculate total macros when mealData changes
  useEffect(() => {
    if (mealData && mealData.foods) {
      const totalCalories = mealData.foods.reduce((sum, food) => sum + (food.calories || 0), 0);
      const totalProtein = mealData.foods.reduce((sum, food) => sum + (food.protein || 0), 0);
      const totalFat = mealData.foods.reduce((sum, food) => sum + (food.fat || 0), 0);
      const totalCarbs = mealData.foods.reduce((sum, food) => sum + (food.carbohydrates || 0), 0);

      // Set the calculated totals to state
      setTotalCalories(totalCalories);
      setTotalProtein(totalProtein);
      setTotalFat(totalFat);
      setTotalCarbs(totalCarbs);
    }
  }, [mealData]);

  //Remove food
  const RemoveFood = async (food, onComplete) => {
    try {
      await axios.post('https://nutritionapi-zivc.onrender.com/remove', {
        food: food,
      });
      onComplete();
    } catch (error) {
      console.log(error);
    }
  };

  //Load each food item
  const renderFoodItem = ({ item }) => {
    return (
      <FoodItem 
        food={item} 
        onRemove={() => {
          setMealData({
            ...mealData,
            foods: mealData.foods.filter((food) => food !== item)
          });
        }}
        removeFood={RemoveFood}
      />
    );
  };

  // Render food data and total macros
  return (
    <View style={styles.container}>
      <View style={styles.totalsContainer}>
            <Text style={styles.totalsText}>Calories: {totalCalories.toFixed(1)}</Text>
            <Text style={styles.totalsText}>Protein: {totalProtein.toFixed(1)}g</Text>
            <Text style={styles.totalsText}>Fat: {totalFat.toFixed(1)}g</Text>
            <Text style={styles.totalsText}>Carbohydrates: {totalCarbs.toFixed(1)}g</Text>
      </View>
      <View style={styles.pie}>
        <CaloriePieChart
            protein={totalProtein}
            carbs={totalFat}
            fat={totalCarbs}
        />
      </View>
      
      {mealData && mealData.foods ? (
        <>
          <FlatList
            data={mealData.foods}
            renderItem={renderFoodItem}
            keyExtractor={(item, index) => index.toString()}
          />
        </>
      ) : (
        <Text>No meal data available.</Text>
      )}
    </View>
  );
};

//Define food item and animation
const FoodItem = ({ food, onRemove, removeFood }) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleRemove = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => removeFood(food, onRemove));
  };

  return (
    <Animated.View style={[styles.foodItem, { opacity: fadeAnim }]}>
    <Text style={styles.foodName}>{food.description}</Text>
    <Text>Servings: {food.selected_servings || '0'}</Text>
    <Text>Calories: {(food.calories ? food.calories.toFixed(1) : '0')}</Text>
    <Text>Carbohydrates: {food.carbohydrates || '0'}</Text>
    <Text>Fat: {(food.fat ? food.fat.toFixed(1) : '0')}</Text>
    <Text>Protein: {(food.protein ? food.protein.toFixed(1) : '0')}</Text>
    <Text>Saturated Fat: {(food.saturated_fat ? food.saturated_fat.toFixed(1) : '0')}</Text>
    <Text>Trans Fats: {(food.trans_fat ? food.trans_fat.toFixed(1) : '0')}</Text>
    <Text>Sugar: {(food.sugars ? food.sugars.toFixed(1) : '0')}</Text>
    <Text>Sodium: {(food.sodium ? food.sodium.toFixed(1) : '0')}</Text>
    <Text>Calcium: {(food.calcium ? food.calcium.toFixed(1) : '0')}</Text>
    <Text>Iron: {(food.iron ? food.iron.toFixed(1) : '0')}</Text>

      {food.ingredients && (
        <Text>Ingredients: {food.ingredients}</Text>
      )}
      <View style={styles.remove}>
        <Button title='REMOVE' onPress={handleRemove} color='red' />
      </View>
    </Animated.View>
  );
};

//Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  foodItem: {
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  foodName: {
    fontWeight: 'bold',
    fontSize: 24,
  },
  totalsContainer: {
    marginTop: 5,
  },
  totalsText: {
    fontSize: 16,
    fontWeight: 'bold',
    flexDirection: 'row',
    margin: 4,
  },
  remove: {
    position: 'relative',
    left: 130,
    fontSize: 12,
  },
  pie: {
    position: 'relative',
  }
});

export default SeeDetails;
