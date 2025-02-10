// src/components/WorkoutSessionScreenWrapper.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import WorkoutSessionScreen from '../screens/WorkoutSessionScreen';
import type { RootStackParamList } from '../types/NavigationTypes';

type WorkoutSessionRouteProp = RouteProp<RootStackParamList, 'WorkoutSession'>;

const WorkoutSessionScreenWrapper: React.FC = () => {
    const route = useRoute<WorkoutSessionRouteProp>();

    // Type assert that route.params may also include an optional onClose property.
    const { sessionData, onComplete, onClose } = route.params as {
        sessionData: RootStackParamList['WorkoutSession']['sessionData'];
        onComplete: (results: any[]) => void;
        onClose?: () => void;
    };

    return <WorkoutSessionScreen sessionData={sessionData} onComplete={onComplete} onClose={onClose} />;
};

const styles = StyleSheet.create({
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    errorText: {
        fontSize: 18,
        color: 'red',
        textAlign: 'center',
    },
});

export default WorkoutSessionScreenWrapper;
