import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity, ScrollView, Button, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import CaloriePieChart from './caloriePieChart';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import BackButton from '../backButton';
import axios from 'axios';
import { Dropdown } from 'react-native-element-dropdown';
import Icon from 'react-native-vector-icons/MaterialIcons';

const AddDetails: React.FC = () => {
  const route = useRoute();
  const router = useRouter();
  const navigation = useNavigation();

  const food = route.params?.res;
  const meal = route.params?.meal;
  const query = route.params?.query;
  
  const selectedDate = route.params?.date;
  console.log(food)

  if (!food) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No food item selected</Text>
      </View>
    );
  }

  const [servings, setServings] = useState('1');
  const [selectedOption, setSelectedOption] = useState(1);
  const [servingMultiplier, setServingMultiplier] = useState(1);
  const [showIngredients, setShowIngredients] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [avoiding, setAvoiding] = useState([]);
  const [including, setIncluding] = useState([]);
  const [numericServing, setNumericServing] = useState(() => {
    const serving = food.servingSize || food.serving_size || "1 unit";
    if (typeof serving === "string") {
      return parseInt(serving.split(" ")[0], 10);
    }
    return 1; // Default value
  });
  
  const displayedServing = `${food.servingSize}`;

  const servingData = [
    { label: `${food.servingSize} ${food.servingSizeUnit}`, value: 1 },
    { label: `1 ${food.servingSizeUnit}`, value: 2 }
  ];

  const handleServingChange = () => {
    if (selectedOption === 1){
      return(`${food.servingSize}`)
    }
    else if (selectedOption === 2){
      return(`1 ${food.servingSizeUnit}`)
    }
  };

  const handleAdd = async () => {
    const servingsNumber = parseFloat(servings);
    if (isNaN(servingsNumber) || servingsNumber <= 0) {
      console.error('Invalid servings value');
      return;
    }

    let multiplier = 1;
    if (selectedOption === 2) {
      multiplier = servingsNumber / numericServing;
    } else if (selectedOption === 1) {
      multiplier = servingsNumber;
    }

    const requestBody = {
      servings: servingsNumber,
      foodId: food.id,
      meal: meal,
      date: selectedDate,
      servingMultiplier: multiplier,
      selectedServings: `${multiplier * numericServing} ${food.servingSizeUnit}`,
      foodDetails: {
        description: food.description,
        calories: food.calories * multiplier,
        protein: food.protein * multiplier,
        saturatedFat: food.saturatedFat * multiplier,
        transFat: food.transFat * multiplier,
        fat: food.fat * multiplier,
        carbohydrates: food.carbohydrates * multiplier,
        fiber: food.fiber * multiplier,
        sugars: food.sugars * multiplier,
        sodium: food.sodium * multiplier,
        cholesterol: food.cholesterol * multiplier,
        iron: food.iron * multiplier,
        calcium: food.calcium * multiplier,
        ingredients: food.ingredients,
      }
    };

    try {
      const storedToken = await SecureStore.getItemAsync('userToken');
      if (!storedToken) {
        console.error('Token not found in SecureStore');
        return;
      }

      const response = await fetch('https://nutritionapi-zivc.onrender.com/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedToken}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      console.log('Response Data:', data);

      router.push('/');
    } catch (error) {
      console.error('Error:', error);
    }
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
      }
      if (avoiding.length > 0){
        showAlert();
      }
    }
    catch (error) {
      console.log(error)
    }
  };

  const IdentifyAvoidingIngredient = (ingredient) => {
    const trimmedIngredient = ingredient.trim();
    if (avoiding.map(item => item.trim()).includes(trimmedIngredient)) {
      return true;
    } else {
      return false;
    }
  }
  const IdentifyIncludingIngredient = (ingredient) => {
    const trimmedIngredient = ingredient.trim();
    if (including.map(item => item.trim()).includes(trimmedIngredient)) {
      return true;
    } else {
      return false;
    }
  };

  const showAlert = () => {
    Alert.alert(
      "Avoiding Ingredient Alert",
      "This item may contain an ingredient you are looking to avoid",
      [
        { text: "Cancel", onPress: () => router.push('./addFood'), style: "cancel" },
        { text: "OK", onPress: () => console.log("OK Pressed") }
      ],
      { cancelable: false }
    );
  };
  

  useEffect(() => {
    const servingsNumber = parseFloat(servings);
    if (selectedOption === 2) {
      setServingMultiplier(servingsNumber / numericServing);
    } else if (selectedOption === 1) {
      setServingMultiplier(servingsNumber);
    }
  }, [selectedOption, servings, food.servingSize]);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('userToken');
        if (storedToken) {
          setToken(storedToken);
        } else {
          console.log('Token not found in SecureStore');
        }
      } catch (error) {
        console.error('Error fetching token:', error);
      }
    };

    fetchToken();
  }, []);

  useEffect(() => {
    if (food.ingredients) {
      CheckIngredients(food.ingredients)
    }
  }, [])

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>

      <View style={styles.servingContainer}>
        <Text style={styles.servingLabel}>Servings</Text>
        <View style={styles.inputDropdownContainer}>
          <TextInput
            style={styles.servingInput}
            keyboardType="numeric"
            value={servings}
            onChangeText={text => setServings(text)}
            placeholder="Enter servings"
          />
          <Dropdown
            style={styles.dropdown}
            data={servingData}
            labelField="label"
            valueField="value"
            placeholder={handleServingChange(selectedOption)}
            searchPlaceholder="Search..."
            onChange={item => setSelectedOption(item.value)}
          />
        </View>
      </View>

      <View style={styles.foodItem}>
      <Text style={styles.foodName}>{food.description}</Text>
      <Text style={styles.foodDetails}>Calories: {(food.calories ? (food.calories * servingMultiplier).toFixed(1) : '0')}</Text>
      <Text style={styles.foodDetails}>Protein: {(food.protein ? (food.protein * servingMultiplier).toFixed(1) : '0')}g</Text>
      <Text style={styles.foodDetails}>Saturated Fat: {(food.saturatedFat ? (food.saturatedFat * servingMultiplier).toFixed(1) : '0')}g</Text>
      <Text style={styles.foodDetails}>Trans Fats: {(food.transFat ? (food.transFat * servingMultiplier).toFixed(1) : '0')}g</Text>
      <Text style={styles.foodDetails}>Fat: {(food.fat ? (food.fat * servingMultiplier).toFixed(1) : '0')}g</Text>
      <Text style={styles.foodDetails}>Carbs: {(food.carbohydrates ? (food.carbohydrates * servingMultiplier).toFixed(1) : '0')}g</Text>
      <Text style={styles.foodDetails}>Fiber: {(food.fiber ? (food.fiber * servingMultiplier).toFixed(1) : '0')}g</Text>
      <Text style={styles.foodDetails}>Sugar: {(food.sugars ? (food.sugars * servingMultiplier).toFixed(1) : '0')}g</Text>
      <Text style={styles.foodDetails}>Sodium: {(food.sodium ? (food.sodium * servingMultiplier).toFixed(1) : '0')}mg</Text>
      <Text style={styles.foodDetails}>Cholesterol: {(food.cholesterol ? (food.cholesterol * servingMultiplier).toFixed(1) : '0')}mg</Text>
      <Text style={styles.foodDetails}>Iron: {(food.iron ? (food.iron * servingMultiplier).toFixed(1) : '0')}mg</Text>
      <Text style={styles.foodDetails}>Calcium: {(food.calcium ? (food.calcium * servingMultiplier).toFixed(1) : '0')}mg</Text>


        <Button
          title={showIngredients ? 'Hide Ingredients' : 'Show Ingredients'}
          onPress={() => setShowIngredients(!showIngredients)}
        />
        {showIngredients && (
          <View style={styles.ingredientsContainer}>
            <Text style={styles.ingredientsTitle}>Ingredients:</Text>
            {food.ingredients && food.ingredients.split(', ').map((ingredient, index) => {
              const isAvoiding = IdentifyAvoidingIngredient(ingredient);
              const isIncluding = IdentifyIncludingIngredient(ingredient);
              return (
                <View key={index} style={styles.ingredientRow}>
                  <Text style={styles.ingredientsText}>{ingredient}</Text>
                  {isAvoiding && <Icon name="warning" size={20} color="red" style={styles.icon} />}
                  {isIncluding && <Icon name="check-circle-outline" size={20} color="green" style={styles.icon} />}
                </View>
              );
            })}
          </View>
        )}

        <CaloriePieChart
          protein={food.protein * servingMultiplier}
          carbs={food.carbohydrates * servingMultiplier}
          fat={food.fat * servingMultiplier}
        />
      </View>
    </ScrollView>
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
  servingContainer: {
    marginTop: 10,
  },
  servingLabel: {
    fontSize: 16,
    marginBottom: 10,
  },
  inputDropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  servingInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    flex: 1,
    marginRight: 10,
  },
  dropdown: {
    width: 150,
  },
  foodItem: {
    marginTop: 20,
  },
  foodName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  foodDetails: {
    fontSize: 16,
    marginVertical: 2,
  },
  ingredientsContainer: {
    marginTop: 10,
  },
  ingredientsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  ingredientsText: {
    fontSize: 16,
    marginVertical: 2,
  },
  addButton: {
    position: 'relative',
    left: 300,
    bottom: 10,
    backgroundColor: '#007bff',
    borderRadius: 50,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 30,
    color: '#fff',
  },
  icon: {
    marginLeft: 8,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
});

export default AddDetails;
