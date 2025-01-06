import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TextInput, FlatList, TouchableOpacity, Button } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import BackButton from '../backButton';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const Kitchen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const router = useRouter();

  const meal = route.params?.meal;
  const selectedDate = route.params?.date;
  const startQuery = route.params?.startQuery;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isHistory, setIsHistory] = useState(false);
  const [isAll, setIsAll] = useState(true);
  const [isMyfood, setIsMyFood] = useState(false);

  const [recentLogs, setRecentLogs] = useState(null);

  const [searchLength, setSearchLength] = useState(10);

  const [avoiding, setAvoiding] = useState([]);
  const [including, setIncluding] = useState([]);



  const SubmitQuery = () =>{
    if (query && isHistory) {
      fetchFoodDataHistory();
    }
    else if (query && isAll) {
      fetchFoodData();
    }
    else if (query && isMyfood){
      fetchFoodDataCustom();
    }
    console.log(results)
  }

  const fetchFoodData = async () => {
    const token = await SecureStore.getItemAsync('userToken')
    fetch(`https://nutritionapi-zivc.onrender.com/foodKitchen?query=${encodeURIComponent(query)}&searchLength=${searchLength}&token=${(token)}`)
      .then((response) => response.json())
      .then((data) => {
        const formattedData = data.map(item => ({
          description: item.Name,
          calories: item.Calories,
          protein: item.Protein,
          fat: item.Fat,
          carbohydrates: item.Carb,
          saturatedFat: item.Saturated_Fat,
          transFat: item.Trans_Fat,
          servingSize: item.Serving_G,
          servingSizeUnit: "g", 
          ingredients: item.Ingredients,
          sodium: item.Sodium,
          sugars: item.Sugar,
          fiber: item.Fiber,
          cholesterol: item.Cholesterol,
          calcium: item.Micronutrients?.Calcium || 0, 
          iron: item.Micronutrients?.Iron || 0,
          avoiding: item.Avoiding,
          including: item.Including, 
          verified: item.verified,
        }));

        setResults(formattedData);
      })
      .catch((error) => console.error('Error fetching food data:', error));
  };
  const fetchFoodDataHistory = async () => {
    const token = await SecureStore.getItemAsync('userToken')
    fetch(`https://nutritionapi-zivc.onrender.com/foodHistoryKitchen?query=${encodeURIComponent(query)}&token=${encodeURIComponent(token)}&searchLength=${searchLength}`)
      .then((response) => response.json())
      .then((data) => {
        const formattedData = data.map(item => ({
          description: item.description,
          calories: item.calories,
          protein: item.protein,
          fat: item.fat,
          carbohydrates: item.carbohydrates,
          saturatedFat: item.saturated_fat,
          transFat: item.trans_fat,
          servingSize: item.serving_size,
          servingSizeUnit: "g", 
          ingredients: item.ingredients,
          sodium: item.sodium,
          sugars: item.sugars,
          fiber: item.fiber,
          cholesterol: item.cholesterol,
          calcium: item.calcium, 
          iron: item.iron,
          avoiding: item.avoiding,
          including: item.including    
        }));

        setResults(formattedData);
      })
      .catch((error) => console.error('Error fetching food data:', error));
  };

  const handleSearch = (text: string) => {
    setQuery(text);
  };

  const RetreiveRecentLogs = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.get('https://nutritionapi-zivc.onrender.com/retreiveRecentHistoryKitchen', config);
  
      if (response.status === 200) {
        const formattedData = response.data.map(item => ({
          description: item.description,
          calories: item.calories,
          protein: item.protein,
          fat: item.fat,
          carbohydrates: item.carbohydrates,
          saturatedFat: item.saturated_fat,
          transFat: item.trans_fat,
          servingSize: item.serving_size,
          servingSizeUnit: "g",  
          ingredients: item.ingredients,
          sodium: item.sodium,
          sugars: item.sugars,
          fiber: item.fiber,
          cholesterol: item.cholesterol,
          calcium: item.calcium,
          iron: item.iron,
          meal: item.meal,
          date: item.date,
          selectedServings: item.selected_servings,
          loggedServings: item.logged_servings,
          avoiding: item.avoiding,
          including: item.including
        }));
  
        setRecentLogs(formattedData);
        console.log(formattedData);
      }
    } catch (error) {
      console.log('Error retrieving recent logs:', error);
    }
  };

  const RetrieveMyFood = async () => {

    try {
      const token = await SecureStore.getItemAsync('userToken')
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.get('https://nutritionapi-zivc.onrender.com/retrieveCustomKitchen', config)
      if (response.status === 200){
        const data = response.data
        console.log(response.data)
        const formattedData = data.map(item => ({
          description: item.name,  
          calories: item.calories,
          protein: item.protein,
          fat: item.fat,
          carbohydrates: item.carb,
          saturatedFat: item.saturated_fat,
          transFat: item.trans_fat,
          servingSize: item.serving_g,
          servingSizeUnit: "g", 
          ingredients: item.ingredients,
          sodium: item.sodium,
          sugars: item.sugar,
          fiber: item.fiber,
          cholesterol: item.cholesterol,
          calcium: item.calcium, 
          iron: item.iron,
          avoiding: item.avoiding,
          including: item.including    
      }));

      setRecentLogs(formattedData);
      }
    }
    catch(error){
      console.log(error)
    }
  }

  const fetchFoodDataCustom = async () => {
    try {
        const token = await SecureStore.getItemAsync('userToken');
        const response = await fetch(`https://nutritionapi-zivc.onrender.com/foodCustomKitchen?query=${encodeURIComponent(query)}&token=${encodeURIComponent(token)}&searchLength=${searchLength}`);
        const data = await response.json();
        
        const formattedData = data.map(item => ({
            description: item.name, 
            calories: item.calories,
            protein: item.protein,
            fat: item.fat,
            carbohydrates: item.carb,
            saturatedFat: item.saturated_fat,
            transFat: item.trans_fat,
            servingSize: item.serving_g,
            servingSizeUnit: "g", 
            ingredients: item.ingredients,
            sodium: item.sodium,
            sugars: item.sugar,
            fiber: item.fiber,
            cholesterol: item.cholesterol,
            calcium: item.calcium, 
            iron: item.iron,
            avoiding: item.avoiding,
            including: item.including    
        }));

        setResults(formattedData);
    } catch (error) {
        console.error('Error fetching food data:', error);
    }
};

  const handleFoodPress = (food) => {
    console.log('Food item pressed:', food);
    navigation.navigate('add/addDetails', { res: food, meal: meal, date: selectedDate, query: query });
  };

  const handleAddFood = async (food) => {
    const servingMultiplier = 1;
    const servingsNumber = 1;
    const requestBody = {
      servings: servingsNumber,
      foodId: food.id, 
      meal: meal,
      date: selectedDate,
      servingMultiplier: servingMultiplier,
      selectedServings: `${food.servingSize}`,
      foodDetails: {
        description: food.description,
        calories: food.calories * servingMultiplier,
        protein: food.protein * servingMultiplier,
        saturatedFat: food.saturatedFat * servingMultiplier,
        transFat: food.transFat * servingMultiplier,
        fat: food.fat * servingMultiplier,
        carbohydrates: food.carbohydrates * servingMultiplier,
        fiber: food.fiber * servingMultiplier,
        sugars: food.sugars * servingMultiplier,
        sodium: food.sodium * servingMultiplier,
        cholesterol: food.cholesterol * servingMultiplier,
        iron: food.iron * servingMultiplier,
        calcium: food.calcium * servingMultiplier,
        ingredients: food.ingredients,
      }
    };

    try {
      const storedToken = await SecureStore.getItemAsync('userToken');
      if (!storedToken) {
        throw new Error('Token not found in SecureStore');
      }

      const response = await fetch('https://nutritionapi-zivc.onrender.com/logKitchen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedToken}`, 
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response:', response);
    } catch (error) {
      console.error('Error:', error);
    }
    console.log(`${food.description} Added`)
  };

  const CheckIngredients = async (ingredients) => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const data = {ingredients: ingredients}
      const response = await axios.post('https://nutritionapi-zivc.onrender.com/checkIngredients', data, config);
      if (response.status === 200) {
        setAvoiding(response.data[0]);
        setIncluding(response.data[1]);
        return response.data[0]
      }
    }
    catch (error) {
      console.log(error)
      return []
    }
  };


  const IdentifyAvoidingIngredient = (ingredient) => {
    if (!ingredient) {
      return false; // If ingredient is null, undefined, or empty, return false
    }
    const trimmedIngredient = ingredient.trim();
    return avoiding.map(item => item.trim()).includes(trimmedIngredient);
  };
  
  const IdentifyIncludingIngredient = (ingredient) => {
    if (!ingredient || ingredient.length === 0) {
      return false; // If ingredient is null, undefined, or empty, return false
    }
    const trimmedIngredient = ingredient.trim();
    return including.map(item => item.trim()).includes(trimmedIngredient);
  };

  const ManageSearch = (param) =>{
    if (param === 'History'){
      setIsHistory(true);
      setIsAll(false);
      setIsMyFood(false);
      SubmitQuery(); 
    }
    else if (param === 'All'){
      setIsHistory(false);
      setIsAll(true);
      setIsMyFood(false);
      SubmitQuery(); 
    }
    else if (param === 'My Food'){
      RetrieveMyFood();
      setIsHistory(false);
      setIsAll(false);
      setIsMyFood(true);
      SubmitQuery(); 
    }

  }

  const renderFoodItem = ({ item }) => (
    <View>
      <TouchableOpacity onPress={() => handleFoodPress(item)} style={styles.foodItem}>
        <Text style={styles.foodName}>{item.description}</Text>
        <Text style={styles.foodDetails}>Calories: {item.calories}</Text>
        <Text style={styles.foodDetails}>Protein: {item.protein}g</Text>
        <Text style={styles.foodDetails}>Fat: {item.fat}g</Text>
        <Text style={styles.foodDetails}>Carbs: {item.carbohydrates}g</Text>
        <Text style={styles.foodDetails}>Serving: {item.servingSize}</Text>
        {(item.avoiding.length > 0) && (
        <Text style={styles.foodDetailsWarning}>Contains {item.avoiding}</Text>
        )}
        {(item.including.length > 0 && (
        <Text style={styles.foodDetailsInclude}>Contains {item.including}</Text>
        ))}
        <Button
          title="Add"
          onPress={() => handleAddFood(item)}
        />
        {(item.verified && (
          <Icon style={styles.verified} name="check-bold" size={24} color="green" />
        ))}
      </TouchableOpacity>
    </View>
  );

  useEffect(() => {
    if (startQuery){
      setQuery(startQuery)
      SubmitQuery();
    }
    RetreiveRecentLogs();
  }, [])
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.barcode} onPress={() => navigation.navigate('tools/labelScanner')}>
        <Icon name="barcode-scan" size={24} color="blue" />
      </TouchableOpacity>
      <TextInput
        style={styles.searchInput}
        placeholder="Search for food..."
        value={query}
        onChangeText={handleSearch}
        onSubmitEditing={SubmitQuery}
      />
      <View style={styles.buttonContainer}>
        <View style={[styles.button, isAll && styles.selectedButton]}>
          <Button title='All' onPress={() => ManageSearch('All')} />
        </View>
        <View style={[styles.button, isHistory && styles.selectedButton]}>
          <Button title='History' onPress={() => ManageSearch('History')} />
        </View>
        <View style={[styles.button, isMyfood && styles.selectedButton]}>
          <Button title='My Food' onPress={() => ManageSearch('My Food')} />
        </View>
      </View>
      {isMyfood && (
        <TouchableOpacity style={styles.createFood} onPress={() => navigation.navigate('add/createFood')}>
          <Text>Create Food Item</Text>
        </TouchableOpacity>
      )}
      {(query.length > 0) && (
        <FlatList
        data={results}
        keyExtractor={(item) => item.description}
        renderItem={renderFoodItem}
      />
      )}
      {(query.length === 0) && (
        <FlatList
        data={recentLogs}
        keyExtractor={(item) => item.description}
        renderItem={renderFoodItem}
      />
      )}
  <Button
    title="See More"
    onPress={() => {
      setSearchLength(prevLength => prevLength + 5);
      SubmitQuery(); 
    }}
  />    
  </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 10,
    marginBottom: 20,
    borderRadius: 5,
  },
  foodItem: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  foodName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  foodDetails: {
    fontSize: 14,
  },
  foodDetailsWarning:{
    fontSize: 14,
    color: 'red',
    marginTop: 5,
  },
  foodDetailsInclude:{
    fontSize: 14,
    color: 'green',
    marginTop: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button:{
    borderWidth: 1,
  },
  selectedButton: {
    borderWidth: 1,
    backgroundColor: '#7cc6f7',
  },
  barcode:{
    position: 'relative',
    left: 325,
  },
  createFood:{
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    alignSelf: 'center'
  },
  verified:{
    position: 'relative',
    left: 300,
  }
});

export default Kitchen;
