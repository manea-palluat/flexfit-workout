// src/components/ExerciseSessionTrackingModal.tsx
import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
} from 'react-native';
import { API, graphqlOperation } from 'aws-amplify';
import { createExerciseTracking } from '../graphql/mutations';
import { v4 as uuidv4 } from 'uuid';

export interface Exercise {
    exerciseId: string;
    name: string;  // expected to be non-null
    muscleGroup: string;
    restTime: number; // in seconds
    sets: number;
    reps: number;
}

export interface SetResult {
    weight: number;
    reps: number;
}

interface ExerciseSessionTrackingModalProps {
    visible: boolean;
    exercise: Exercise;
    userId: string; // passed from the caller (non-null)
    onClose: () => void;
}

const ExerciseSessionTrackingModal: React.FC<ExerciseSessionTrackingModalProps> = ({
    visible,
    exercise,
    userId,
    onClose,
}) => {
    // Instead of destructuring 'name' here, we’ll refer to it as exercise.name in our logic.
    const { sets, reps, restTime } = exercise;
    const [currentSet, setCurrentSet] = useState<number>(1);
    const [isResting, setIsResting] = useState<boolean>(false);
    const [timer, setTimer] = useState<number>(restTime);
    const [currentResult, setCurrentResult] = useState<SetResult>({ weight: 0, reps: 0 });
    const [results, setResults] = useState<SetResult[]>([]);

    // Countdown effect during rest period.
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isResting) {
            if (timer > 0) {
                interval = setInterval(() => {
                    setTimer(prev => prev - 1);
                }, 1000);
            } else {
                if (interval) clearInterval(interval);
                // Rest period finished; reset timer and move to next set.
                setIsResting(false);
                setTimer(restTime);
                if (currentSet < sets) {
                    setCurrentSet(currentSet + 1);
                } else {
                    // All sets completed: submit tracking data.
                    submitTrackingData();
                }
            }
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isResting, timer, currentSet]);

    const submitTrackingData = async () => {
        // Force a non-empty exercise name.
        const safeExerciseName =
            (typeof exercise.name === 'string' && exercise.name.trim().length > 0)
                ? exercise.name.trim()
                : 'Exercice Inconnu';
        const trackingInput = {
            id: uuidv4(),
            userId,
            exerciseId: exercise.exerciseId,
            exerciseName: safeExerciseName,
            date: new Date().toISOString(),
            setsData: JSON.stringify(results),
        };
        console.log('Submitting tracking record with input:', trackingInput);
        try {
            await API.graphql(graphqlOperation(createExerciseTracking, { input: trackingInput }));
            Alert.alert('Succès', 'Données de suivi enregistrées.');
            onClose();
        } catch (error) {
            console.error('Erreur lors de l’enregistrement des données de suivi', error);
            Alert.alert('Erreur', "Une erreur est survenue lors de l'enregistrement des données de suivi.");
        }
    };

    const handleSetCompletion = () => {
        if (currentResult.weight <= 0 || currentResult.reps <= 0) {
            Alert.alert('Erreur', 'Veuillez entrer un poids et un nombre de répétitions valides.');
            return;
        }
        setResults([...results, currentResult]);
        setCurrentResult({ weight: 0, reps: 0 });
        setIsResting(true);
    };

    const handleCancel = () => {
        setCurrentSet(1);
        setIsResting(false);
        setTimer(restTime);
        setResults([]);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.container}>
                <View style={styles.modal}>
                    {!isResting ? (
                        <>
                            <Text style={styles.title}>
                                Set {currentSet} sur {sets} (Planifié : {reps} répétitions)
                            </Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Poids utilisé (kg)"
                                keyboardType="numeric"
                                value={currentResult.weight ? currentResult.weight.toString() : ''}
                                onChangeText={(text) =>
                                    setCurrentResult({ ...currentResult, weight: parseFloat(text) || 0 })
                                }
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Répétitions réalisées"
                                keyboardType="numeric"
                                value={currentResult.reps ? currentResult.reps.toString() : ''}
                                onChangeText={(text) =>
                                    setCurrentResult({ ...currentResult, reps: parseInt(text, 10) || 0 })
                                }
                            />
                            <TouchableOpacity style={styles.button} onPress={handleSetCompletion}>
                                <Text style={styles.buttonText}>Terminé</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <Text style={styles.title}>Repos</Text>
                            <Text style={styles.info}>Temps de repos : {timer} sec</Text>
                        </>
                    )}
                    <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                        <Text style={styles.cancelButtonText}>Annuler</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modal: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        marginBottom: 10,
    },
    info: {
        fontSize: 18,
        marginBottom: 20,
    },
    input: {
        width: '80%',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
    },
    button: {
        backgroundColor: '#28A745',
        padding: 10,
        borderRadius: 5,
        width: '60%',
        alignItems: 'center',
        marginBottom: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
    },
    cancelButton: {
        marginTop: 10,
    },
    cancelButtonText: {
        color: 'red',
    },
});

export default ExerciseSessionTrackingModal;
