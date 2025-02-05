// src/components/WorkoutSessionScreenWrapper.tsx
import React from 'react';
import { useRoute, RouteProp } from '@react-navigation/native';
import WorkoutSessionScreen from '../screens/WorkoutSessionScreen';
import type { RootStackParamList } from '../types/NavigationTypes';

type WorkoutSessionRouteProp = RouteProp<RootStackParamList, 'WorkoutSession'>;

const WorkoutSessionScreenWrapper: React.FC = () => {
    const route = useRoute<WorkoutSessionRouteProp>();
    // We assume that the route parameters are provided because they are required.
    const { sessionData, onComplete } = route.params;
    return (
        <WorkoutSessionScreen sessionData={sessionData} onComplete={onComplete} />
    );
};

export default WorkoutSessionScreenWrapper;
