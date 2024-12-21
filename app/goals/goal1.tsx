import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Button, ScrollView, TouchableOpacity, LayoutAnimation, Platform, UIManager, Modal, ActionSheetIOS, Switch } from 'react-native';
import BackButton from '../backButton';
import { useRouter } from 'expo-router';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';

const Goal1: React.FC = () => {
  const router = useRouter();
  const navigation = useNavigation()

  const [currentGoals, setCurrentGoals] = useState({});
  const [avoidingIngredients, setAvoidingIngredients] = useState('');
  const [includingIngredients, setIncludingIngredients] = useState('');
  const [avoidingIngredientsTotal, setAvoidingIngredientsTotal] = useState([]);
  const [includingIngredientsTotal, setIncludingIngredientsTotal] = useState([]);

  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  const [alcohol, setAlcohol] = useState('');

  const [selectedWeightGoal, setSelectedWeightGoal] = useState('');
  const [selectedRate, setSelectedRate] = useState('');

  const weightGoals = ['Lose', 'Gain', 'Maintain'];
  const ratesLb = ['0.25 lb per week', '0.5 lb per week', '0.75 lb per week', '1 lb per week', 'Custom'];
  const ratesPercentage = ['0.25% per week', '0.5% per week', '1% per week', '1.5% per week', '2% per week', 'Custom']
  const [customeRatePercentage, setCustomRatePercentage] = useState('')
  const [customRateLb, setCustomRateLb] = useState('')
  const [rateChange, setRateChange] = useState(false)
  const [isEnabled, setIsEnabled] = useState(false);

  if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  const fetchNutrientGoals = async () => {
    const token = await SecureStore.getItemAsync('userToken');
    if (!token) {
      console.error('No token found');
      return null;
    }
    try {
      const response = await axios.get('https://nutritionapi-zivc.onrender.com/fetchNutrientGoals', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = response.data;
      console.log('Nutrient Goals:', data);
      return data;
    } catch (error) {
      console.error('Error fetching nutrient goals:', error);
      return null;
    }
  };
  const showActionSheet = (options, setter) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...options, 'Cancel'],
          cancelButtonIndex: options.length,
        },
        buttonIndex => {
          if (buttonIndex !== options.length) {
            setter(options[buttonIndex]);
          }
        }
      );
    } else {
      console.log('no action sheet')
    }
  };

  const fillMacros = (macro) => {
    const protCalories = parseFloat(protein) * 4;
    const carbCalories = parseFloat(carbs) * 4;
    const fatCalories = parseFloat(fats) * 9;
    const alcoholCalories = parseFloat(alcohol) * 7;
    const enteredCalories = protCalories + carbCalories + fatCalories + alcoholCalories;
    const realCalories = parseFloat(calories) - enteredCalories;
  
    if (macro === 'Protein') {
      setProtein((parseFloat(protein) + realCalories / 4).toString());
    } else if (macro === 'Carbs') {
      setCarbs((parseFloat(carbs) + realCalories / 4).toString());
    } else if (macro === 'Fat') {
      setFats((parseFloat(fats) + realCalories / 9).toString());
    } else if (macro === 'Alcohol') {
      setAlcohol((parseFloat(alcohol) + realCalories / 7).toString());
    }
  };

  const checkMacros = async () => {
    const protCalories = parseFloat(protein) * 4;
    const carbCalories = parseFloat(carbs) * 4;
    const fatCalories = parseFloat(fats) * 9;
    const alcoholCalories = parseFloat(alcohol) * 7;
    const enteredCalories = protCalories + carbCalories + fatCalories + alcoholCalories;

    if (Math.abs(enteredCalories - parseFloat(calories)) < 5) {
      console.log('Calories Match');
      const token = await SecureStore.getItemAsync('userToken');
      try {
        await axios.post('https://nutritionapi-zivc.onrender.com/setNutrientGoals', {
          calories, protein, carbs, fat: fats, alcohol,
          avoidingIngredientsTotal, includingIngredientsTotal,
          token, selectedWeightGoal, selectedRate
        });
        console.log('Nutrient goals saved');
      } catch (error) {
        console.error('Error setting nutrient goals:', error);
      }
    } else {
      console.log('Calories do not match');
    }
  };

  const updateAvoiding = () => {
    if (avoidingIngredients != ''){
      setAvoidingIngredientsTotal([...avoidingIngredientsTotal, avoidingIngredients]);
    }
    setAvoidingIngredients(''); // Clear the input after adding
  };
  const updateIncluding = () => {
    if (includingIngredients != ''){
      setIncludingIngredientsTotal([...includingIngredientsTotal, includingIngredients]);
    }
    setIncludingIngredients(''); // Clear the input after adding
  };

  const RemoveIngredient = async (ingredient, setting) =>{

    const token = await SecureStore.getItemAsync('userToken')
    try{
      const response = await axios.post('https://nutritionapi-zivc.onrender.com/removeIngredient', {
        ingredient, setting, token
      })
      if (response.status == 200){
        console.log('Ingredient Removed Successfully')

        // Trigger a layout animation
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

        // Update the state to remove the ingredient
        if (setting === 'avoid') {
          setAvoidingIngredientsTotal(prev => prev.filter(item => item !== ingredient));
        } else {
          setIncludingIngredientsTotal(prev => prev.filter(item => item !== ingredient));
        }
      }
    }
    catch(error){
      console.log(error);
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchNutrientGoals();
      if (data) {
        setCurrentGoals(data);
        setAvoidingIngredientsTotal(data.avoiding_ingredients);
        setIncludingIngredientsTotal(data.including_ingredients);
        setCalories(data.goal_calories.toFixed(1).toString());
        setProtein(data.goal_protein.toFixed(1).toString());
        setCarbs(data.goal_carbs.toFixed(1).toString());
        setFats(data.goal_fat.toFixed(1).toString());
        setAlcohol(data.goal_alcohol.toFixed(1).toString());
        setSelectedWeightGoal(data.selected_weight_goal);
        setSelectedRate(data.selected_weight)
      }
    };
  
    fetchData();
  }, []);  

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={() => router.push('/')} />
      </View>
      <TouchableOpacity onPress={() => navigation.navigate('goals/calculateCalories')}>
          <Text style={styles.unsure}>Unsure about your calorie and macronutrient intake? Click here</Text>
        </TouchableOpacity>
      <View style={styles.form}>
        <Text style={styles.label}>Calories</Text> 
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="Enter calories"
          value={calories}
          onChangeText={setCalories}
        />
        <Text style={styles.label}>Protein (g)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="Enter protein"
          value={protein}
          onChangeText={setProtein}
        />
        <Button
          title="Fill Protein"
          onPress={() => fillMacros('Protein')}
        />
        <Text style={styles.label}>Carbohydrates (g)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="Enter carbohydrates"
          value={carbs}
          onChangeText={setCarbs}
        />
        <Button
          title="Fill Carbs"
          onPress={() => fillMacros('Carbs')}
        />
        <Text style={styles.label}>Fats (g)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="Enter fats"
          value={fats}
          onChangeText={setFats}
        />
        <Button
          title="Fill Fats"
          onPress={() => fillMacros('Fat')}
        />
        <Text style={styles.label}>Alcohol (g)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="Enter alcohol"
          value={alcohol}
          onChangeText={setAlcohol}
        />
        <Button
          title="Fill Alcohol"
          onPress={() => fillMacros('Alcohol')}
        />
      </View>
      <View style={styles.form}>
        <Text style={styles.label}>Avoiding Ingredients</Text>
        <TextInput
          style={styles.input}
          placeholder="Add ingredient to avoid"
          value={avoidingIngredients}
          onChangeText={setAvoidingIngredients}
        />
        <Button
          title="Add Ingredient"
          onPress={updateAvoiding}
        />
        <View>
          {avoidingIngredientsTotal.map((ingredient, index) => (
            <View key={index} style={styles.ingredientContainer}>
              <Text style={styles.ingredientText}>{ingredient}</Text>
              <TouchableOpacity onPress={() => RemoveIngredient(ingredient, 'avoid')}>
                <Icon name="delete" size={24} color="red" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
        <Text style={styles.label}>Including Ingredients</Text>
        <TextInput
          style={styles.input}
          placeholder="Add ingredient to include"
          value={includingIngredients}
          onChangeText={setIncludingIngredients}
        />
        <Button
          title="Add Ingredient"
          onPress={updateIncluding}
        />
        <View>
          {includingIngredientsTotal.map((ingredient, index) => (
            <View key={index} style={styles.ingredientContainer}>
              <Text style={styles.ingredientText}>{ingredient}</Text>
              <TouchableOpacity onPress={() => RemoveIngredient(ingredient, 'include')}>
                <Icon name="delete" size={24} color="red" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.container}>
      <Button title="Select Weight Goal" onPress={() => showActionSheet(weightGoals, setSelectedWeightGoal)} />
      <Text style={styles.selectedText}>Selected Goal: {selectedWeightGoal}</Text>
      {!rateChange && (
        <Button title="Select Rate per Week" onPress={() => showActionSheet(ratesPercentage, setSelectedRate)} />
      )}
      {rateChange && (
        <Button title="Select Rate per Week" onPress={() => showActionSheet(ratesLb, setSelectedRate)} />
      )}
      <Text style={styles.switchLabelPercent}>%</Text>
      <Switch
        trackColor={{ false: "#767577", true: "#81b0ff" }}
        thumbColor={rateChange ? "#f5dd4b" : "#f4f3f4"}
        ios_backgroundColor="#3e3e3e"
        onValueChange={() => setRateChange(previousState => !previousState)}
        value={rateChange}
      />
      <Text style={styles.switchLabelLb}>Lb</Text>
      {rateChange && (
        <Text style={styles.selectedText}>Selected Rate: {(selectedRate === "Custom") ? `${customRateLb}lb per week`: selectedRate}</Text>
      )}
      {!rateChange && (
        <Text style={styles.selectedText}>Selected Rate: {(selectedRate === "Custom") ? `${customRateLb}% per week`: selectedRate}</Text>
      )}
      {selectedRate === 'Custom' && (
        <View style={styles.inputContainerGoal}>
          <Text>Enter Custom Rate per Week:</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter custom rate"
            keyboardType="numeric"
            value={customRateLb}
            onChangeText={(text) => setCustomRateLb(text)}
          />
        </View>
      )}

    </View>
      <Button title="Submit Goals" onPress={checkMacros} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  form: {
    marginTop: 24,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
  },
  ingredientContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ingredientText: {
    flex: 1,
    fontSize: 16,
  },
  unsure: {
    fontSize: 12,
  },
  selectedText: {
    fontSize: 16,
    marginVertical: 10,
  },
  inputContainerGoal: {
    marginVertical: 10,
  },
  switchLabelLb: {
    fontSize: 16,
    marginHorizontal: 8,
    position: 'relative',
    bottom: 25,
    left: 50,
  },
  switchLabelPercent: {
    fontSize: 16,
    marginHorizontal: 8,
    position: 'relative',
    top: 25,
    right: 30,
  },
});

export default Goal1;
