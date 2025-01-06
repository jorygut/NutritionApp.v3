import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Button, ScrollView, Switch, ActionSheetIOS, Platform } from 'react-native';
import BackButton from '../backButton';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';


const CoachSettings: React.FC = () => {
    const router = useRouter();
    const [coachEnabled, setCoachEnabled] = useState(true)
    const personalities = ['Total Asshole (not reccomended)', 'Strict', 'Neutral (reccomended)', 'Kind', 'Incredibly Kind']
    const [selectedPersonality, setSelectedPersonality] = useState('Neutral')
    const [notifications, setNotifcations] = useState(false)
    const [weightNotifications, setWeightNotifications] = useState(false);
    const [logReminders, setLogReminders] = useState(false);
    const [calorieReminders, setCalorieReminders] = useState(false);
    const [progressUpdates, setProgressUpdates] = useState(false);


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
    
    const RetreiveCoachSettings = async () =>{
        try{
            const token = await SecureStore.getItemAsync('userToken');
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };
            const response = await axios.get('https://nutritionapi-zivc.onrender.com/getGoals', config)
            if (response.status === 200){
                setCoachEnabled(response.data.coach_enabled);
                setSelectedPersonality(response.data.selected_personality);
                setNotifcations(response.data.notifications);
                setWeightNotifications(response.data.weight_notifications);
                setLogReminders(response.data.log_reminders);
                setCalorieReminders(response.data.calorie_reminders);
                setProgressUpdates(response.data.progress_updates);
            }
        }
        catch(error){
            console.log(error)
        }
    }

    const SaveCoachSettings = async () =>{
        try{
            const data = {
                coachEnabled,
                selectedPersonality,
                notifications,
                weightNotifications,
                logReminders,
                calorieReminders,
                progressUpdates
            }
            const token = await SecureStore.getItemAsync('userToken');
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };
            const response = await axios.post('https://nutritionapi-zivc.onrender.com/saveCoachSettings', data, config);

            if (response.status === 200){
                console.log(response.data)
            }
        }
        catch(error){
            console.log(error)
        }
    }
    useEffect(() => {
        RetreiveCoachSettings();
    }, [])
    return(
        <View>
            <View style={styles.switchContainer}>
                {coachEnabled && (
                    <Text style={styles.switchLabel}>Disable Virtual Coach</Text>
                )}
                {!coachEnabled && (
                    <Text style={styles.switchLabel}>Enable Virtual Coach</Text>
                )}
                <Switch
                        trackColor={{ false: "#767577", true: "#81b0ff" }}
                        ios_backgroundColor="#3e3e3e"
                        style={styles.switch}
                        value = {coachEnabled}
                        onValueChange={() => setCoachEnabled(previousState => !previousState)}
                    />
            </View>
            <View style={styles.switchContainer}>
                <Button title="Select Coach Personality" onPress={() => showActionSheet(personalities, setSelectedPersonality)}/>
                <Text style={styles.personality}>{selectedPersonality}</Text>
                {notifications && (
                    <Text style={styles.switchLabel}>Disable coaching notifications</Text>
                )}
                {!notifications && (
                    <Text style={styles.switchLabel}>Enable coaching notifications</Text>
                )}
                <Switch
                    trackColor={{ false: "#767577", true: "#81b0ff" }}
                    ios_backgroundColor="#3e3e3e"
                    style={styles.switch}
                    value = {notifications}
                    onValueChange={() => setNotifcations(previousState => !previousState)}
                />
                <View>
                {notifications && (
                    <View>
                        <Text style={styles.switchLabel}>Weight Updates</Text>
                        <Switch
                            trackColor={{ false: "#767577", true: "#81b0ff" }}
                            ios_backgroundColor="#3e3e3e"
                            style={styles.switch}
                            value = {weightNotifications}
                            onValueChange={() => setWeightNotifications(previousState => !previousState)}
                        />
                    </View>
                )}
                {notifications && (
                    <View>
                        <Text style={styles.switchLabel}>Meal and Tracking Reminders</Text>
                        <Switch
                            trackColor={{ false: "#767577", true: "#81b0ff" }}
                            ios_backgroundColor="#3e3e3e"
                            style={styles.switch}
                            value = {logReminders}
                            onValueChange={() => setLogReminders(previousState => !previousState)}
                        />
                    </View>
                )}
                {notifications && (
                    <View>
                        <Text style={styles.switchLabel}>Calorie and Macro Updates</Text>
                        <Switch
                            trackColor={{ false: "#767577", true: "#81b0ff" }}
                            ios_backgroundColor="#3e3e3e"
                            style={styles.switch}
                            value = {calorieReminders}
                            onValueChange={() => setCalorieReminders(previousState => !previousState)}
                        />
                    </View>
                )}
                {notifications && (
                    <View>
                        <Text style={styles.switchLabel}>Progress Updates</Text>
                        <Switch
                            trackColor={{ false: "#767577", true: "#81b0ff" }}
                            ios_backgroundColor="#3e3e3e"
                            style={styles.switch}
                            value = {progressUpdates}
                            onValueChange={() => setProgressUpdates(previousState => !previousState)}
                        />
                    </View>
                )}
                </View>
            </View>
            <TouchableOpacity style={styles.coachSave} onPress={() => SaveCoachSettings()}>
                <Text style={styles.coachSaveText}>Save Coach Settings</Text>
            </TouchableOpacity>
        </View>
    )
}
const styles = StyleSheet.create({
    switch: {
        alignSelf: 'center',

    },
    switchLabel: {
        alignSelf: 'center',
        fontSize: 16,
        padding: 10,
    },
    personality:{
        alignSelf: 'center',
        fontSize: 20,
        padding: 10,
    },
    switchContainer:{
    },
    coachSave:{
        alignSelf: 'center',
        marginTop: 30,
        borderWidth: 1,
        borderRadius: 10,
        width: 300,
    },
    coachSaveText:{
        fontSize: 24,
        alignSelf: 'center',
    }
  });
export default CoachSettings