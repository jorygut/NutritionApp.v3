import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity, ScrollView, Button } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { format } from 'date-fns';
import BackButton from '../backButton';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialIcons';

const NutritionTrends: React.FC = () => {
    const router = useRouter();

    const [responseData, setResponseData] = useState(null);
    const [dayLogs, setDayLogs] = useState(7);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedMacro, setSelectedMacro] = useState('calories');
    const [selectedDayRange, setSelectedDayRange] = useState(7);
    const [finalGroupedMeals, setFinalGroupedMeals] = useState({});
    const [coachMessages, setCoachMessages] = useState([])
    const [selectedDateForInsights, setSelectedDateForInsights] = useState("")
    const [selectedInsightMessage, setSelectedInsightMessage] = useState(0)

    const FetchLogs = async (days) => {
        setLoading(true);
        setError(null);
        const token = await SecureStore.getItemAsync('userToken');
        try {
            const response = await axios.get('https://nutritionapi-zivc.onrender.com/updateHistory', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                params: {
                    days: days,
                },
            });
            console.log('API Response:', response.data);
            setResponseData(response.data);
            if (response.data.meals) {
                const groupedMeals = groupMealsByDate(response.data.meals);
                const finalMeals = handleMealMacros(groupedMeals);
                setFinalGroupedMeals(finalMeals);
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
            setError('Error fetching data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        FetchLogs(dayLogs);
    }, [dayLogs]);
    

    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return format(date, 'MM/dd');
        } catch {
            return dateString;
        }
    };

    const getChartData = () => {
        if (!responseData) return {};
        const labels = responseData.meals.map(meal => formatDate(meal.date));
        const data = responseData.meals.map(meal => meal[selectedMacro]);
        return {
            labels,
            datasets: [
                {
                    data,
                    color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
                    strokeWidth: 2, // Optional: Customize the line width
                },
            ],
        };
    };

    const renderAverage = () => {
        if (!responseData || !responseData.averages) return null;
        const averages = responseData.averages;
        return (
            <View style={styles.averagesContainer}>
                <Text style={styles.averageText}>Average Calories: {averages.average_calories.toFixed(2)}</Text>
                <Text style={styles.averageText}>Average Protein: {averages.average_protein.toFixed(2)}</Text>
                <Text style={styles.averageText}>Average Fat: {averages.average_fat.toFixed(2)}</Text>
                <Text style={styles.averageText}>Average Carbs: {averages.average_carbohydrates.toFixed(2)}</Text>
            </View>
        );
    };

    const handleDayRangeChange = (days) => {
        setDayLogs(days);
        setSelectedDayRange(days); 
        FetchLogs(days);
    };

    const handleMealMacros = (meals) => {
        const result = {};
    
        Object.entries(meals).forEach(([date, foods]) => {
            const meals = {};
    
            foods.forEach((food) => {
                if (!meals[food.meal]) {
                    meals[food.meal] = {
                        calories: 0,
                        protein: 0,
                        carbohydrates: 0,
                        fat: 0
                    };
                }
    
                meals[food.meal].calories += food.calories;
                meals[food.meal].protein += food.protein || 0;
                meals[food.meal].carbohydrates += food.carbohydrates || 0;
                meals[food.meal].fat += food.fat || 0;
            });
    
            const totalMacros = foods.reduce((totals, food) => {
                totals.calories += food.calories;
                totals.protein += food.protein || 0;
                totals.carbohydrates += food.carbohydrates || 0;
                totals.fat += food.fat || 0;
                return totals;
            }, { calories: 0, protein: 0, carbohydrates: 0, fat: 0 });
    
            // Store the results for the current date
            result[date] = {
                meals,
                totalMacros
            };
        });
        console.log(result)
        return result;
    };

    const groupMealsByDate = (meals) => {
        const formatDateOnly = (dateString) => {
            try {
                const date = new Date(dateString);
                return date.toISOString().split('T')[0];
            } catch {
                return dateString;
            }
        };
    
        const grouped = meals.reduce((acc, meal) => {
            const formattedDate = formatDateOnly(meal.date);
            if (!acc[formattedDate]) {
                acc[formattedDate] = [];
            }
            acc[formattedDate].push(meal);
            return acc;
        }, {});
    
        const sortedDates = Object.keys(grouped).sort((a, b) => {
            const dateA = new Date(a);
            const dateB = new Date(b);
            return dateB - dateA;
        });
    
        const sortedGrouped = sortedDates.reduce((acc, date) => {
            acc[date] = grouped[date];
            return acc;
        }, {});
    
        return sortedGrouped;
    };

    const GetCoach = async () =>{
        try{
            const token = await SecureStore.getItemAsync('userToken');
            const config = {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            };
            const response = await axios.get('https://nutritionapi-zivc.onrender.com/nutritionTrendsCoach', config)
            if (response.status === 200){
                console.log(response.data)
            }
        }
        catch(error){
            console.log(error)
        }
    }

    const GetGoals = async () =>{
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

    const CoachInsights = async (cals, fat, protein, carbs, formDate) => {
        try {
            const token = await SecureStore.getItemAsync('userToken');
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };
    
            console.log(config);
    
            const url = `https://nutritionapi-zivc.onrender.com/nutritionTrendsCoach?cals=${encodeURIComponent(cals)}&fat=${encodeURIComponent(fat)}&protein=${encodeURIComponent(protein)}&carbs=${encodeURIComponent(carbs)}&seldate=${encodeURIComponent(formDate)}`;
    
            const response = await axios.get(url, config);
            setCoachMessages(response.data)
            setSelectedDateForInsights(formDate)
    
            if (response.status === 200) {
                console.log(response.data);
            }
        } catch (error) {
            console.log(error);
        }
    };

    const ChangeMessage = (dir) =>{
        if (dir == "forward" && ((selectedInsightMessage + 1) < coachMessages.length)){
            setSelectedInsightMessage(selectedInsightMessage + 1)
        }
        else if (dir == "backward" && ((selectedInsightMessage - 1)  > 0)){
            setSelectedInsightMessage(selectedInsightMessage - 1)
        }
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Nutrition Trends</Text>
            {loading && <ActivityIndicator size="large" color="#0000ff" />}
            {error && <Text style={styles.error}>{error}</Text>}
            {renderAverage()}
            <View style={styles.toggleContainer}>
                <TouchableOpacity
                    style={[styles.toggleButton, selectedMacro === 'calories' && styles.activeButton]}
                    onPress={() => setSelectedMacro('calories')}
                >
                    <Text style={styles.buttonText}>Calories</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.toggleButton, selectedMacro === 'protein' && styles.activeButton]}
                    onPress={() => setSelectedMacro('protein')}
                >
                    <Text style={styles.buttonText}>Protein</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.toggleButton, selectedMacro === 'carbohydrates' && styles.activeButton]}
                    onPress={() => setSelectedMacro('carbohydrates')}
                >
                    <Text style={styles.buttonText}>Carbs</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.toggleButton, selectedMacro === 'fat' && styles.activeButton]}
                    onPress={() => setSelectedMacro('fat')}
                >
                    <Text style={styles.buttonText}>Fat</Text>
                </TouchableOpacity>
            </View>
            {responseData && (
                <View style={styles.chartContainer}>
                    <LineChart
                        data={getChartData()}
                        width={320}
                        height={220}
                        chartConfig={{
                            backgroundColor: "#ffffff",
                            backgroundGradientFrom: "#ffffff",
                            backgroundGradientTo: "#ffffff",
                            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                            style: {
                                borderRadius: 16,
                            },
                            propsForLabels: {
                                fontSize: 10,
                                rotation: 90,
                            },
                            propsForHorizontalLabels: {
                                rotation: 0, 
                                textAnchor: 'middle',
                            },
                        }}
                        style={styles.chart}
                    />
                </View>
            )}
           <View style={styles.buttonsContainer}>
                <TouchableOpacity
                    style={[
                        styles.dayButton,
                        selectedDayRange === 7 && styles.activeButton
                    ]}
                    onPress={() => handleDayRangeChange(7)}
                >
                    <Text style={styles.buttonText}>7 Days</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.dayButton,
                        selectedDayRange === 14 && styles.activeButton
                    ]}
                    onPress={() => handleDayRangeChange(14)}
                >
                    <Text style={styles.buttonText}>14 Days</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.dayButton,
                        selectedDayRange === 30 && styles.activeButton
                    ]}
                    onPress={() => handleDayRangeChange(30)}
                >
                    <Text style={styles.buttonText}>30 Days</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.dayButton,
                        selectedDayRange === 360 && styles.activeButton
                    ]}
                    onPress={() => handleDayRangeChange(360)}
                >
                    <Text style={styles.buttonText}>360 Days</Text>
                </TouchableOpacity>
            </View>
            {Object.entries(finalGroupedMeals).map(([date, { meals, totalMacros }]) => (
    <View key={date} style={styles.dateContainer}>
        <Text style={styles.dateText}>{formatDate(date)}</Text>
        <TouchableOpacity onPress={() => CoachInsights(totalMacros.calories, totalMacros.fat, totalMacros.protein, totalMacros.carbohydrates, formatDate(date))}>
            <Text style={styles.coachInsights}>Coach Insights</Text>
        </TouchableOpacity>
        {selectedDateForInsights === formatDate(date) && coachMessages.length > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ marginRight: 10 }}>{coachMessages[selectedInsightMessage]}</Text>
                <TouchableOpacity style={styles.rightArrow} onPress={() => ChangeMessage("forward")}>
                    <Icon
                        name="arrow-forward"
                        size={20}
                        color="#000"
                    />
                </TouchableOpacity>
                <TouchableOpacity style={styles.leftArrow} onPress={() => ChangeMessage("backward")}>
                    <Icon
                        name="arrow-back"
                        size={20}
                        color="#000"
                    />
                </TouchableOpacity>
            </View>
        )}
        {Object.entries(meals).map(([mealName, macros]) => (
            <View key={mealName} style={styles.mealContainer}>
                <Text style={styles.mealText}>{mealName}</Text>
                <View style={styles.table}>
                    <View style={styles.tableHeaderRow}>
                        <View style={styles.tableHeader}>
                            <Text style={styles.tableHeaderText}>Calories</Text>
                        </View>
                        <View style={styles.tableHeader}>
                            <Text style={styles.tableHeaderText}>Protein</Text>
                        </View>
                        <View style={styles.tableHeader}>
                            <Text style={styles.tableHeaderText}>Fat</Text>
                        </View>
                        <View style={styles.tableHeader}>
                            <Text style={styles.tableHeaderText}>Carbs</Text>
                        </View>
                    </View>
                    <View style={styles.tableValueRow}>
                        <Text style={styles.tableValue}>{macros.calories.toFixed(2)}</Text>
                        <Text style={styles.tableValue}>{macros.protein.toFixed(2)}</Text>
                        <Text style={styles.tableValue}>{macros.fat.toFixed(2)}</Text>
                        <Text style={styles.tableValue}>{macros.carbohydrates.toFixed(2)}</Text>
                    </View>
                </View>
            </View>
        ))}
        <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
                <View style={styles.tableHeader}>
                    <Text style={styles.tableHeaderText}>Total Calories</Text>
                </View>
                <View style={styles.tableHeader}>
                    <Text style={styles.tableHeaderText}>Total Protein</Text>
                </View>
                <View style={styles.tableHeader}>
                    <Text style={styles.tableHeaderText}>Total Fat</Text>
                </View>
                <View style={styles.tableHeader}>
                    <Text style={styles.tableHeaderText}>Total Carbs</Text>
                </View>
            </View>
            <View style={styles.tableValueRow}>
                <Text style={styles.tableValue}>{totalMacros.calories.toFixed(2)}</Text>
                <Text style={styles.tableValue}>{totalMacros.protein.toFixed(2)}</Text>
                <Text style={styles.tableValue}>{totalMacros.fat.toFixed(2)}</Text>
                <Text style={styles.tableValue}>{totalMacros.carbohydrates.toFixed(2)}</Text>
            </View>
        </View>
    </View>
))}
</ScrollView>
);};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    chartContainer: {
        alignItems: 'center',
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    toggleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
    },
    toggleButton: {
        padding: 8,
        backgroundColor: '#dcdcdc',
        borderRadius: 8,
    },
    activeButton: {
        backgroundColor: '#87ceeb',
    },
    buttonText: {
        fontSize: 16,
        textAlign: 'center',
    },
    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
    },
    dayButton: {
        padding: 8,
        backgroundColor: '#dcdcdc',
        borderRadius: 8,
    },
    averagesContainer: {
        marginBottom: 16,
    },
    averageText: {
        fontSize: 16,
        marginBottom: 4,
    },
    tableContainer: {
        marginTop: 16,
    },
    dateHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    tableCell: {
        flex: 1,
        textAlign: 'center',
    },
    cell: {
        flex: 1,
        textAlign: 'center',
    },
    error: {
        color: 'red',
    },
    dateText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    mealContainer: {
        marginVertical: 8,
    },
    mealText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    dateContainer: {
        marginVertical: 16,
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 3,
    },
    table: {
        marginTop: 8,
        paddingHorizontal: 8,
        borderRadius: 8,
        backgroundColor: '#fff',
        elevation: 1,
    },
    tableHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        paddingBottom: 4,
        marginBottom: 4,
    },
    tableHeader: {
        flex: 1,
        alignItems: 'center',
    },
    tableHeaderText: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#333',
    },
    tableValueRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingBottom: 8,
    },
    tableValue: {
        flex: 1,
        textAlign: 'center',
        fontSize: 14,
        color: '#333',
    },
    coachInsights: {
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 1,
        paddingVertical: 3,
        alignSelf: 'center',
        position: 'relative',
        left: 100,
        bottom: 30,
    },
    rightArrow: {
        position: 'relative',
        right: 5
    },
    leftArrow: {
        position: 'relative',
        right: 350,
    }
});

export default NutritionTrends;
