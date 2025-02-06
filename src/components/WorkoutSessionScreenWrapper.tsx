// src/components/WorkoutSessionScreenWrapper.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import WorkoutSessionScreen from '../screens/WorkoutSessionScreen';
import type { RootStackParamList } from '../types/NavigationTypes';

type WorkoutSessionRouteProp = RouteProp<RootStackParamList, 'WorkoutSession'>;

const WorkoutSessionScreenWrapper: React.FC = () => {
    const route = useRoute<WorkoutSessionRouteProp>();

    // Check if route and route.params exist
    if (!route || !route.params) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>
                    Erreur : Les paramètres de session sont manquants.
                </Text>
            </View>
        );
    }

    const { sessionData, onComplete } = route.params;
    return <WorkoutSessionScreen sessionData={sessionData} onComplete={onComplete} />;
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
