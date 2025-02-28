import React from 'react';
import { StyleSheet } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import WorkoutSessionScreen from '../screens/WorkoutSessionScreen';
import type { RootStackParamList } from '../types/NavigationTypes';

//TYPE DE ROUTE:Définit le type de la route pour "WorkoutSession"
type WorkoutSessionRouteProp = RouteProp<RootStackParamList, 'WorkoutSession'>;

const WorkoutSessionScreenWrapper: React.FC = () => {
    const route = useRoute<WorkoutSessionRouteProp>(); //récupère les paramètres de la route

    //EXTRACTION DES PARAMÈTRES:On extrait sessionData, onComplete et onClose depuis la route
    const { sessionData, onComplete, onClose } = route.params;

    return (
        <WorkoutSessionScreen
            sessionData={sessionData} //données de la session
            onComplete={onComplete} //callback déclenché à la fin de la session
            onClose={onClose} //callback pour fermer la session
        />
    );
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
