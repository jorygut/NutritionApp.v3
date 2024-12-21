import React, { useState, useEffect } from 'react';
import { View, Button, StyleSheet, Text, Modal, TouchableOpacity, TextInput, ScrollView, Switch, Platform, ActionSheetIOS } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import BackButton from '../backButton';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

const Measurements: React.FC = () => {
    const router = useRouter();
    const [maintenanceCalories, setMaintenanceCalories] = useState('');
    const [heightFeet, setHeightFeet] = useState(5);
    const [heightInches, setHeightInches] = useState(0);
    const [heightCm, setHeightCm] = useState(170);
    const [historyWeight, setHistoryWeight] = useState(0)
    const [useFeetInches, setUseFeetInches] = useState(true);
    const [showHeightPicker, setShowHeightPicker] = useState(false);
    const [showGenderPicker, setShowGenderPicker] = useState(false);
    const [activityLevel, setActivityLevel] = useState('Sedentary');
    const [showActivityPicker, setShowActivityPicker] = useState(false);
    const [weight, setWeight] = useState(''); 
    const [showWeightPicker, setShowWeightPicker] = useState(false);  
    const [gender, setGender] = useState('')
    const [showAgePicker, setShowAgePicker] = useState(false); 
    const [age, setAge] = useState('')
    const [calorieNeeds, setCalorieNeeds] = useState(0)

    const [proteinPercentage, setProteinPercentage] = useState(30)
    const [carbPercentage, setCarbPercentage] = useState(50)
    const [fatPercentage, setFatPercentage] = useState(20)
    const [proteinGrams, setProteinGrams] = useState(0)
    const [fatGrams, setFatGrams] = useState(0)
    const [carbGrams, setCarbGrams] = useState(0)

    const [selectedWeightGoal, setSelectedWeightGoal] = useState('');
    const [selectedRate, setSelectedRate] = useState('');
  
    const weightGoals = ['Lose', 'Gain', 'Maintain'];
    const ratesLb = ['0.25 lb per week', '0.5 lb per week', '0.75 lb per week', '1 lb per week', 'Custom'];
    const ratesPercentage = ['0.25% per week', '0.5% per week', '1% per week', '1.5% per week', '2% per week', 'Custom']
    const [customeRatePercentage, setCustomRatePercentage] = useState('')
    const [customRateLb, setCustomRateLb] = useState('')
    const [rateChange, setRateChange] = useState(false)
    const [isEnabled, setIsEnabled] = useState(false);
    const [weightChangeRate, setWeightChangeRate] = useState(0);
    const [adjustedCalorieNeeds, setAdjustedCalorieNeeds] = useState(0)

    const FetchWeight = async () => {
        try {
            const token = await SecureStore.getItemAsync('userToken');
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };
            const response = await axios.get('https://nutritionapi-zivc.onrender.com/getCurrentWeight', config);
            if (response.status === 200) {
                setWeight(response.data[0].toFixed(1)); // Ensure it's a valid number in the range
            }
        } catch (error) {
            console.log(error);
            // Optionally, you can set a fallback weight in case of error
            setWeight(150);
        }
    };
    const FetchUserData = async () =>{
        try{
            const token = await SecureStore.getItemAsync('userToken');
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };
            const response = await axios.get('https://nutritionapi-zivc.onrender.com/getStats', config)
            if (response.status === 200){
                const data = response.data
                setActivityLevel(data['activity_level'])
                setAge(data['age'])
                setGender(data['gender'])
                setHeightFeet(Math.floor(data['height'] / 12))
                setHeightInches((Math.floor(data['height'] / 12)) % 12)
            }
        }
        catch(error){
            console.log(error)
        }
    }
    const CalculateCalorieNeeds = async () => {
        try {
            const token = await SecureStore.getItemAsync('userToken');
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json', // Ensure the backend knows you're sending JSON
                },
            };
    
            const data = {
                heightFeet,
                heightInches,
                weight,
                activityLevel,
                age,
                gender
            };
    
            // Post request with data as the third argument and config as the second argument
            const response = await axios.post('https://nutritionapi-zivc.onrender.com/calculateCalorieNeeds', data, config);
            setCalorieNeeds(response.data)
            SetWeightChange();
            CalculateMacroNumbers();
        } catch (error) {
            console.log(error);
        }
    };

    const toggleHeightUnit = () => {
        setUseFeetInches(!useFeetInches);
    };

    const handleHeightChange = (value, unit) => {
        if (unit === 'feet') {
            setHeightFeet(value);
        } else if (unit === 'inches') {
            setHeightInches(value);
        } else {
            setHeightCm(value);
        }
    };

    const toggleHeightPickerVisibility = () => {
        setShowHeightPicker(!showHeightPicker);
    };

    const toggleAgePickerVisibility = () =>{
        setShowAgePicker(!showAgePicker)
    }

    const toggleActivityPickerVisibility = () => {
        setShowActivityPicker(!showActivityPicker);
    };

    const toggleGenderPickerVisibility = () => {
        setShowGenderPicker(!showGenderPicker);
    };

    const adjustMacroPercentage = (macro, change) => {
        if (macro === 'protein') {
            const totalPercentage = proteinPercentage + carbPercentage + fatPercentage
            if ((change < 0 && proteinPercentage > 0) || ( change > 0 && totalPercentage < 100)){
                setProteinPercentage(proteinPercentage + change);
            }
        } else if (macro === 'carbs') {
            const totalPercentage = proteinPercentage + carbPercentage + fatPercentage
            if ((change < 0 && carbPercentage > 0) || ( change > 0 && totalPercentage < 100)){
                setCarbPercentage(carbPercentage + change);
            }
        } else if (macro === 'fat') {
            const totalPercentage = proteinPercentage + carbPercentage + fatPercentage
            if ((change < 0 && fatPercentage > 0) || ( change > 0 && totalPercentage < 100)){
                setFatPercentage(fatPercentage + change);
            }
        }
        CalculateMacroNumbers();
    };
    const CalculateMacroNumbers = () =>{
        if (calorieNeeds > 0){
            setCarbGrams(((carbPercentage / 100) * adjustedCalorieNeeds ) / 4)
            setProteinGrams(((proteinPercentage / 100) * adjustedCalorieNeeds ) / 4)
            setFatGrams(((fatPercentage / 100) * adjustedCalorieNeeds ) / 9)
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

    const SetWeightChange = () =>{
        if (selectedRate.split(' ')[1] == 'lb' && selectedWeightGoal == 'Lose'){
            setAdjustedCalorieNeeds(Number(calorieNeeds) - ((3500 / 7) * Number(selectedRate.split(' ')[0])))
            console.log(adjustedCalorieNeeds)
        }
        else if (selectedRate.split(' ')[1] == 'lb' && selectedWeightGoal == 'Gain'){
            setAdjustedCalorieNeeds(Number(calorieNeeds) + ((3500 / 7) * Number(selectedRate.split(' ')[0])))
            console.log(adjustedCalorieNeeds)
        }
        else if (selectedRate.split('')[1] == '%' && selectedWeightGoal == 'Lose'){
            setAdjustedCalorieNeeds(Number(calorieNeeds) - ((3500 / 7) * (Number(weight) * (Number(selectedRate.split('')[0]) / 100))))
            console.log(adjustedCalorieNeeds)
        }
        else if (selectedRate.split('')[1] == '%' && selectedWeightGoal == 'Gain'){
            setAdjustedCalorieNeeds(Number(calorieNeeds) + ((3500 / 7) * (Number(weight) * (Number(selectedRate.split('')[0]) / 100))))
            console.log(adjustedCalorieNeeds)
        }
        else{
            setAdjustedCalorieNeeds(calorieNeeds)
        }
    }

    const SaveGoals = async () =>{
        try{
            const token = await SecureStore.getItemAsync('userToken');
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };
            const data = {
                heightFeet,
                heightInches,
                heightCm,
                gender,
                activityLevel,
                age,
                calorieNeeds,
                proteinGrams,
                carbGrams,
                fatGrams,
            }
            const response = await axios.post('https://nutritionapi-zivc.onrender.com/saveCalculatedMacros', data, config)
        }
        catch(error){
            console.log(error);
        }
    }

    useEffect(() => {
        FetchWeight();
        FetchUserData();
    }, [])

    return (
        <View style={styles.container}>
            <ScrollView>
            <BackButton onPress={() => router.push('/')} />
            <View style={styles.toggleModal}>
                <Button title="Enter Height" onPress={toggleHeightPickerVisibility} />
            </View>
            <Text style={styles.outputValue}>Height: {useFeetInches ? `${heightFeet} ft ${heightInches} in` : `${heightCm} cm`}</Text>
            <Modal
                visible={showHeightPicker}
                transparent={true}
                animationType="slide"
                onRequestClose={toggleHeightPickerVisibility}
            >
                <View style={styles.modalContainer}>
                    {useFeetInches ? (
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={heightFeet}
                                style={styles.picker}
                                onValueChange={(value) => handleHeightChange(value, 'feet')}
                            >
                                {Array.from({ length: 8 }, (_, i) => (
                                    <Picker.Item key={i} label={`${i + 4} ft`} value={i + 4} />
                                ))}
                            </Picker>
                            <Picker
                                selectedValue={heightInches}
                                style={styles.picker}
                                onValueChange={(value) => handleHeightChange(value, 'inches')}
                            >
                                {Array.from({ length: 12 }, (_, i) => (
                                    <Picker.Item key={i} label={`${i} in`} value={i} />
                                ))}
                            </Picker>
                        </View>
                    ) : (
                        <Picker
                            selectedValue={heightCm}
                            style={styles.picker}
                            onValueChange={(value) => handleHeightChange(value, 'cm')}
                        >
                            {Array.from({ length: 101 }, (_, i) => (
                                <Picker.Item key={i} label={`${i + 100} cm`} value={i + 100} />
                            ))}
                        </Picker>
                    )}
                    <Button title="Close" onPress={toggleHeightPickerVisibility} />
                </View>
            </Modal>
            <View style={styles.toggleModal}>
                <Button title="Select Activity Level" onPress={toggleActivityPickerVisibility} />
            </View>
            <Text style={styles.outputValue}>Activity Level: {activityLevel}</Text>
            <Modal
                visible={showActivityPicker}
                transparent={true}
                animationType="slide"
                onRequestClose={toggleActivityPickerVisibility}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={activityLevel}
                            style={styles.picker}
                            onValueChange={(value) => setActivityLevel(value)}
                        >
                            <Picker.Item label="Sedentary" value="Sedentary" />
                            <Picker.Item label="Light" value="Light" />
                            <Picker.Item label="Moderate" value="Moderate" />
                            <Picker.Item label="Heavy" value="Heavy" />
                            <Picker.Item label="Extreme" value="Extreme" />
                        </Picker>
                    </View>
                    <Button title="Close" onPress={toggleActivityPickerVisibility} />
                </View>
            </Modal>
            <View style={styles.toggleModal}>
                <Button title="Select Gender" onPress={toggleGenderPickerVisibility} />
            </View>
            <Text style={styles.outputValue}>Gender: {gender}</Text>
            <Modal
            visible={showGenderPicker}
            transparent={true}
            animationType="slide"
            onRequestClose={toggleGenderPickerVisibility}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={gender}
                            style={styles.picker}
                            onValueChange={(value) => setGender(value)}
                        >
                            <Picker.Item label="Male" value="Male" />
                            <Picker.Item label="Female" value="Female" />
                        </Picker>
                    </View>
                    <Button title="Close" onPress={toggleGenderPickerVisibility} />
                </View>
            </Modal>
            <View style={styles.toggleModal}>
                <Button title="Enter Age" onPress={toggleAgePickerVisibility} />
            </View>
            <Text style={styles.outputValue}>Age: {age}</Text>
            <Modal
            visible={showAgePicker}
            transparent={true}
            animationType="slide"
            onRequestClose={toggleAgePickerVisibility}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={age}
                            style={styles.picker}
                            onValueChange={(value) => setAge(value)}
                        >
                            {Array.from({ length: 101 }, (_, i) => (
                                <Picker.Item key={i} label={`${i} Years`} value={i} />
                            ))}
                        </Picker>
                    </View>
                    <Button title="Close" onPress={toggleAgePickerVisibility} />
                </View>
            </Modal>
            <Text style={styles.enterWeight}>Enter Weight</Text>
            <TextInput
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                style={styles.weightInput}
                placeholder='Enter Weight'
            />

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
                    style={styles.switch}
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

            <Button title="Calculate Calorie Needs" onPress={CalculateCalorieNeeds}/>
            <Text style={styles.calorieNeeds}>{adjustedCalorieNeeds.toFixed(1)} Calories</Text>

            <View style={styles.macroInputContainer}>
                <Text>Protein: {proteinPercentage}%</Text>
                <View style={styles.adjustButtons}>
                    <TouchableOpacity onPress={() => adjustMacroPercentage('protein', -5)}>
                        <Text style={styles.adjustButtonNeg}>-5%</Text>
                    </TouchableOpacity>
                    <Text>Protein: {proteinGrams.toFixed(1)} g</Text>
                    <TouchableOpacity onPress={() => adjustMacroPercentage('protein', 5)}>
                        <Text style={styles.adjustButtonPos}>+5%</Text>
                    </TouchableOpacity>
                </View>

                <Text>Carbs: {carbPercentage}%</Text>
                <View style={styles.adjustButtons}>
                    <TouchableOpacity onPress={() => adjustMacroPercentage('carbs', -5)}>
                        <Text style={styles.adjustButtonNeg}>-5%</Text>
                    </TouchableOpacity>
                    <Text>Carbs: {carbGrams.toFixed(1)} g</Text>
                    <TouchableOpacity onPress={() => adjustMacroPercentage('carbs', 5)}>
                        <Text style={styles.adjustButtonPos}>+5%</Text>
                    </TouchableOpacity>
                </View>

                <Text>Fat: {fatPercentage}%</Text>
                <View style={styles.adjustButtons}>
                    <TouchableOpacity onPress={() => adjustMacroPercentage('fat', -5)}>
                        <Text style={styles.adjustButtonNeg}>-5%</Text>
                    </TouchableOpacity>
                    <Text>Fat: {fatGrams.toFixed(1)} g</Text>
                    <TouchableOpacity onPress={() => adjustMacroPercentage('fat', 5)}>
                        <Text style={styles.adjustButtonPos}>+5%</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <Button title="Save as Goals" onPress={() => SaveGoals()}/>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 10,
    },
    recs: {
        marginTop: 20,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Darkens the background for the modal
    },
    pickerContainer: {
        justifyContent: 'center',
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        width: '80%',
    },
    picker: {
        height: 150,
        width: 250,
    },
    macroInputContainer: {
        marginTop: 20,
        marginBottom: 20,
    },
    adjustButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5,
        marginBottom: 15,
    },
    adjustButton: {
        fontSize: 16,
        padding: 10,
        color: 'blue',
    },
    adjustButtonPos: {
        fontSize: 16,
        padding: 10,
        color: 'green',
    },
    adjustButtonNeg: {
        fontSize: 16,
        padding: 10,
        color: 'red',
    },
    weightInput: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 20,
        padding: 10,
        width: 75,
        alignSelf: 'center',
        textAlign: 'center'
    },
    outputValue: {
        justifyContent: 'center',
        alignSelf: 'center',
        paddingBottom: 10,
        fontSize: 16,
    },
    toggleModal: {
        paddingBottom: 10,
        borderColor: 'black'
    },
    enterWeight: {
        paddingBottom: 10,
        alignSelf: 'center',
        fontSize: 16,
    },
    calorieNeeds: {
        alignSelf: 'center',
        fontSize: 16,
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
        left: 210,
      },
      switchLabelPercent: {
        fontSize: 16,
        marginHorizontal: 8,
        position: 'relative',
        top: 25,
        left: 130,
      },
      switch:{
        position: 'relative',
        left: 160 ,
      }
});

export default Measurements;