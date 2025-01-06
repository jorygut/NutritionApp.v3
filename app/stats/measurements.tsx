import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Animated, TouchableOpacity, Button } from 'react-native';
import BackButton from '../backButton';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

const Measurements: React.FC = () => {
    const router = useRouter();
    const [maintenanceCalories, setMaintenanceCalories] = useState('');
    const [currentWeight, setCurrentWeight] = useState('');
    const [previousWeight, setPreviousWeight] = useState(null)
    const [weightGoal, setWeightGoal] = useState('Maintain');
    const [rate, setRate] = useState('');
    const [calorieGoal, setCalorieGoal] = useState('');
    const [estimatedIntake, setEstimatedIntake] = useState('')
    const [estimatedSurplusDeficit, setEstimatedSurplusDeficit] = useState('')

    const [showDetails1, setShowDetails1] = useState(false);
    const [showDetails2, setShowDetails2] = useState(false);
    const [showDetails3, setShowDetails3] = useState(false);

    const slideAnim1 = useRef(new Animated.Value(-200)).current;
    const slideAnim2 = useRef(new Animated.Value(-200)).current;
    const slideAnim3 = useRef(new Animated.Value(-200)).current;

    const slideIn = (anim) => {
        Animated.timing(anim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
        }).start();
    };

    const FetchLogs = async () => {
        try {
            const token = await SecureStore.getItemAsync('userToken');
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };
            const response = await axios.get('https://nutritionapi-zivc.onrender.com/bodyMeasurements', config);
            if (response.status === 200) {
                console.log(response.data);
                setMaintenanceCalories(response.data[0]);
                setEstimatedIntake(response.data[1])
                if (response.data[2] > 0){
                    setEstimatedSurplusDeficit(`${Number(response.data[2]).toFixed(1)} calorie surplus`)
                }
                else if (response.data[2] < 0){
                    setEstimatedSurplusDeficit(`${Number(response.data[2]).toFixed(1)} calorie deficit`)
                }
                else{
                    setEstimatedSurplusDeficit('0 calorie surplus/deficit')
                }
            }
        } catch (error) {
            console.log(error);
        }
    };

    const FetchGoals = async () => {
        try {
            const token = await SecureStore.getItemAsync('userToken');
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };
            const response = await axios.get('https://nutritionapi-zivc.onrender.com/fetchNutrientGoals', config);
            if (response.status === 200) {
                console.log(response.data);
                setWeightGoal(response.data.selected_weight_goal);
                setRate(response.data.selected_rate);
            }
        } catch (error) {
            console.log(error);
        }
    };

    const GetAverageWeight = async () => {
        try {
            const token = await SecureStore.getItemAsync('userToken');
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };
            const response = await axios.get('https://nutritionapi-zivc.onrender.com/getCurrentWeight', config);
            if (response.status === 200) {
                setCurrentWeight(response.data[0]);
                setPreviousWeight(response.data[1]);
            }
        } catch (error) {
            console.log(error);
        }
    };

    const CalculateCalorieGoal = () => {
        if (rate && weightGoal === 'Gain' && rate.includes('%')) {
            setCalorieGoal(
                maintenanceCalories +
                (Number(currentWeight) * (Number(rate.split('')[0]) / 100) * 3500) / 7
            );
        } else if (rate && weightGoal === 'Lose' && rate.includes('%')) {
            setCalorieGoal(
                maintenanceCalories -
                (Number(currentWeight) * (Number(rate.split('')[0]) / 100) * 3500) / 7
            );
        } else if (rate && weightGoal === 'Gain' && rate.includes('lb')) {
            setCalorieGoal(
                maintenanceCalories +
                (Number(rate.split(' ')[0]) * 3500) / 7
            );
        } else if (rate && weightGoal === 'Lose' && rate.includes('lb')) {
            setCalorieGoal(
                maintenanceCalories -
                (Number(rate.split(' ')[0]) * 3500) / 7
            );
        } else {
            setCalorieGoal(maintenanceCalories);
        }
    };

    useEffect(() => {
        FetchLogs();
        GetAverageWeight();
        FetchGoals();
    }, []);

    useEffect(() => {
        CalculateCalorieGoal();
        slideIn(slideAnim1);
        slideIn(slideAnim2);
        slideIn(slideAnim3);
    }, [maintenanceCalories, currentWeight, calorieGoal]);

    return (
        <View style={styles.container}>
            <View style={styles.recs}>
                <TouchableOpacity onPress={() => setShowDetails1(!showDetails1)}>
                <Animated.View style={{ ...styles.animatedView, transform: [{ translateX: slideAnim1 }] }}>
                    <Text>This Week's Average Weight: 
                        {currentWeight === "" ? ' Average weight is currently unknown. Log your weight to find out!' : `${Number(currentWeight).toFixed(1)} lb`}</Text>
                </Animated.View>

                </TouchableOpacity>
                {showDetails1 && (
                    <View style={styles.detailsView}>
                        {((currentWeight - previousWeight) > 0) && (
                            <Text>This is {(currentWeight - previousWeight).toFixed(1)} lbs higher than last weeks weight of {previousWeight.toFixed(1)}</Text>
                        )}
                        {((currentWeight - previousWeight) < 0) && (
                            <Text>This is {(currentWeight - previousWeight).toFixed(1)} lbs lower than last weeks weight of {previousWeight.toFixed(1)}</Text>
                        )}
                    </View>
                )}
                
                <TouchableOpacity onPress={() => setShowDetails2(!showDetails2)}>
                    <Animated.View style={{ ...styles.animatedView, transform: [{ translateX: slideAnim2 }] }}>
                        <Text>Estimated Maintenance Calories: { maintenanceCalories === "" ? "Cannot Calculate Maintenance Calories":parseFloat(maintenanceCalories).toFixed(1)}</Text>
                    </Animated.View>
                </TouchableOpacity>
                {showDetails2 && (
                    <View style={styles.detailsView}>
                        <Text>This is based on your estimated average calorie intake of {Number(estimatedIntake).toFixed(1)} and estimated {estimatedSurplusDeficit}
                        </Text>
                    </View>
                )}
                
                <TouchableOpacity onPress={() => setShowDetails3(!showDetails3)}>
                    <Animated.View style={{ ...styles.animatedView, transform: [{ translateX: slideAnim3 }] }}>
                        <Text>Recommended Caloric Intake: { maintenanceCalories === "" ? "Cannot Calculate Calorie Intake" : Number(calorieGoal).toFixed(1)}</Text>
                    </Animated.View>
                </TouchableOpacity>
                {showDetails3 && (
                    <View style={styles.detailsView}>
                        {((maintenanceCalories - Number(calorieGoal)) > 0) && (
                            <Text>{Math.abs(maintenanceCalories - Number(calorieGoal))} calorie deficit</Text>
                        )}
                        {((maintenanceCalories - Number(calorieGoal)) < 0) && (
                            <Text>{Math.abs(maintenanceCalories - Number(calorieGoal))} calorie surplus</Text>
                        )}
                    </View>
                )}
            </View>
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
    animatedView: {
        marginVertical: 10,
        backgroundColor: '#f8f8f8',
        padding: 15,
        borderRadius: 8,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    detailsView: {
        marginTop: 10,
        marginBottom: 20,
        padding: 10,
        backgroundColor: '#e0e0e0',
        borderRadius: 8,
    },
});

export default Measurements;
