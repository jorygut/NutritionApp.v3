import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { useRouter } from 'expo-router';

const UpdateGoals: React.FC = () => {
    const router = useRouter();

    return (
        <View>
            <Text>Update Your Goals</Text>
        </View>
    );
};

export default UpdateGoals;
