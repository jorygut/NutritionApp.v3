import React, { useState } from 'react';
import { View, StyleSheet, Text, TextInput, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import BackButton from '../backButton';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Icon from 'react-native-vector-icons/AntDesign';

const CreateFood = () => {
    const navigation = useNavigation();

    const [description, setDescription] = useState('');
    const [calories, setCalories] = useState('');
    const [protein, setProtein] = useState('');
    const [fat, setFat] = useState('');
    const [satFat, setSatFat] = useState('');
    const [transFat, setTransFat] = useState('');
    const [cholesterol, setCholesterol] = useState('');
    const [sodium, setSodium] = useState('');
    const [carbohydrates, setCarbohydrates] = useState('');
    const [sugar, setSugar] = useState('');
    const [addedSugar, setAddedSugar] = useState('')
    const [fiber, setFiber] = useState('');
    const [alcohol, setAlcohol] = useState('');
    const [caffeine, setCaffeine] = useState('');
    const [potassium, setPotassium] = useState('');
    const [iron, setIron] = useState('');
    const [calcium, setCalcium] = useState('');
    const [vitaminD, setVitaminD] = useState('');
    const [ingredients, setIngredients] = useState('');
    const [totalIngredients, setTotalIngredients] = useState([]);

    const [servingSize, setServingSize] = useState('');
    const [servingUnit, setServingUnit] = useState('')

    const CreateFood = async () => {
        try {
            const token = await SecureStore.getItemAsync('userToken');

            const data = {
                description,
                calories,
                protein,
                fat,
                satFat,
                transFat,
                cholesterol,
                sodium,
                carbohydrates,
                sugar,
                addedSugar,
                fiber,
                alcohol,
                caffeine,
                iron,
                calcium,
                vitaminD,
                potassium,
                servingSize,
                servingUnit,
                ingredients,
            };

            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };

            const response = await axios.post('https://nutritionapi-zivc.onrender.com/createFood', data, config);

            if (response.status === 200) {
                // Handle successful response
                console.log('Food created successfully', response.data);
            } else {
                // Handle non-200 responses
                console.log('Failed to create food', response.status);
            }
        } catch (error) {
            // Handle errors (e.g., network issues, backend errors)
            console.error('Error creating food:', error);
        }
    };

    const addIngredient = (newIngredient) => {
        setTotalIngredients((prevIngredients) => [
          ...prevIngredients,
          newIngredient,
        ]);
      };

    return (
        <ScrollView style={styles.container}>
            <TextInput 
                style={styles.description}
                placeholder="Food Name"
                value={description}
                onChangeText={setDescription}
            />

            <View style={styles.row}>
                <Text style={styles.label}>Serving Size</Text>
                <TextInput 
                    style={styles.input}
                    placeholder="0"
                    value={servingSize}
                    onChangeText={setServingSize}
                    keyboardType="numeric"
                />
            </View>
            <View style={styles.row}>
                <Text style={styles.label}>Serving Unit</Text>
                <TextInput 
                    style={styles.input}
                    placeholder="Example: Grams or G"
                    value={servingUnit}
                    onChangeText={setServingUnit}
                />
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>Calories</Text>
                <TextInput 
                    style={styles.input}
                    placeholder="0"
                    value={calories}
                    onChangeText={setCalories}
                    keyboardType="numeric"
                />
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>Fat (g)</Text>
                <TextInput 
                    style={styles.input}
                    placeholder="0"
                    value={fat}
                    onChangeText={setFat}
                    keyboardType="numeric"
                />
            </View>
            <View style={styles.row}>
                <Text style={styles.label}>Saturated Fat (g)</Text>
                <TextInput 
                    style={styles.input}
                    placeholder="0"
                    value={satFat}
                    onChangeText={setSatFat}
                    keyboardType="numeric"
                />
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>Trans Fat (g)</Text>
                <TextInput 
                    style={styles.input}
                    placeholder="0"
                    value={transFat}
                    onChangeText={setTransFat}
                    keyboardType="numeric"
                />
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>Cholesterol (mg)</Text>
                <TextInput 
                    style={styles.input}
                    placeholder="0"
                    value={cholesterol}
                    onChangeText={setCholesterol}
                    keyboardType="numeric"
                />
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>Sodium (mg)</Text>
                <TextInput 
                    style={styles.input}
                    placeholder="0"
                    value={sodium}
                    onChangeText={setSodium}
                    keyboardType="numeric"
                />
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>Carbohydrates (g)</Text>
                <TextInput 
                    style={styles.input}
                    placeholder="0"
                    value={carbohydrates}
                    onChangeText={setCarbohydrates}
                    keyboardType="numeric"
                />
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>Protein (g)</Text>
                <TextInput 
                    style={styles.input}
                    placeholder="0"
                    value={protein}
                    onChangeText={setProtein}
                    keyboardType="numeric"
                />
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>Fiber (g)</Text>
                <TextInput 
                    style={styles.input}
                    placeholder="0"
                    value={fiber}
                    onChangeText={setFiber}
                    keyboardType="numeric"
                />
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>Sugar (g)</Text>
                <TextInput 
                    style={styles.input}
                    placeholder="0"
                    value={sugar}
                    onChangeText={setSugar}
                    keyboardType="numeric"
                />
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>Added Sugar (g)</Text>
                <TextInput 
                    style={styles.input}
                    placeholder="0"
                    value={addedSugar}
                    onChangeText={setAddedSugar}
                    keyboardType="numeric"
                />
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>Alcohol (g)</Text>
                <TextInput 
                    style={styles.input}
                    placeholder="0"
                    value={alcohol}
                    onChangeText={setAlcohol}
                    keyboardType="numeric"
                />
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>Caffeine (mg)</Text>
                <TextInput 
                    style={styles.input}
                    placeholder="0"
                    value={caffeine}
                    onChangeText={setCaffeine}
                    keyboardType="numeric"
                />
            </View>
            <View style={styles.row}>
                <Text style={styles.label}>Vitamin D (mcg)</Text>
                <TextInput 
                    style={styles.input}
                    placeholder="0"
                    value={vitaminD}
                    onChangeText={setVitaminD}
                    keyboardType="numeric"
                />
            </View>
            <View style={styles.row}>
                <Text style={styles.label}>Calcium (mg)</Text>
                <TextInput 
                    style={styles.input}
                    placeholder="0"
                    value={calcium}
                    onChangeText={setCalcium}
                    keyboardType="numeric"
                />
            </View>
            <View style={styles.row}>
                <Text style={styles.label}>Iron (mg)</Text>
                <TextInput 
                    style={styles.input}
                    placeholder="0"
                    value={iron}
                    onChangeText={setIron}
                    keyboardType="numeric"
                />
            </View>
            <View style={styles.row}>
                <Text style={styles.label}>Potassium (mg)</Text>
                <TextInput 
                    style={styles.input}
                    placeholder="0"
                    value={potassium}
                    onChangeText={setPotassium}
                    keyboardType="numeric"
                />
            </View>
            <View style={styles.row}>
                <Text style={styles.label}>Ingredients</Text>
                <TextInput 
                    style={styles.input}
                    placeholder="Enter Ingredients Here"
                    value={ingredients}
                    onChangeText={setIngredients}
                />
                <TouchableOpacity onPress={() => addIngredient(ingredients)}>
                    <Icon name="pluscircle" size={24} color="green" />
                </TouchableOpacity>
            </View>
            <View>
                <FlatList
                    data={totalIngredients}
                    renderItem={({ item }) => <Text style={styles.ingredient}>{item},</Text>}
                    keyExtractor={(item, index) => index.toString()}
                />
            </View>
            <TouchableOpacity style={styles.create} onPress={() => CreateFood()}>
                <Text style={styles.createText}>Create Food</Text>
            </TouchableOpacity>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    description: {
        marginBottom: 16,
        padding: 10,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    label: {
        flex: 1,
        fontSize: 16,
    },
    input: {
        flex: 2,
        padding: 10,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
    },
    create:{
        paddingBottom: 10,
        alignSelf: 'center',
        borderWidth: 1,
        borderRadius: 10,
        width: 200,
        },
    createText:{
        fontSize: 26,
        alignSelf: 'center',
    },
    ingredient:{
        justifyContent: 'space-between',
        flex: 1,
    }
});

export default CreateFood;
