// src/components/ExerciseSessionTrackingModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Animated,
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

const COOLDOWN_BAR_WIDTH = 200; // maximum width of the progress bar in pixels

const ExerciseSessionTrackingModal: React.FC<ExerciseSessionTrackingModalProps> = ({
    visible,
    exercise,
    userId,
    onClose,
}) => {
    // We'll reference exercise.name directly in our logic.
    const { sets, reps, restTime } = exercise;
    const [currentSet, setCurrentSet] = useState<number>(1);
    const [isResting, setIsResting] = useState<boolean>(false);
    const [timer, setTimer] = useState<number>(restTime);
    const [currentResult, setCurrentResult] = useState<SetResult>({ weight: 0, reps: 0 });
    const [results, setResults] = useState<SetResult[]>([]);

    // Create an Animated.Value to drive the progress bar.
    const progressAnim = useRef(new Animated.Value(restTime)).current;

    // Every time timer changes, animate the progressAnim to the new timer value.
    useEffect(() => {
        Animated.timing(progressAnim, {
            toValue: timer,
            duration: 500, // half a second for a smooth transition
            useNativeDriver: false,
        }).start();
    }, [timer, progressAnim]);

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
        // Ensure a non-empty exercise name.
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

    // Interpolate progressAnim to determine the width of the progress bar.
    const progressBarWidth = progressAnim.interpolate({
        inputRange: [0, restTime],
        outputRange: [0, COOLDOWN_BAR_WIDTH],
        extrapolate: 'clamp',
    });

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.container}>
                <View style={styles.modal}>
                    {!isResting ? (
                        <>
                            <Text style={styles.title}>
                                {currentSet}/{sets}
                                {"\n"}
                                {reps} reps
                            </Text>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Poids utilisé (kg)</Text>
                                <TextInput
                                    style={styles.input}
                                    keyboardType="numeric"
                                    value={currentResult.weight ? currentResult.weight.toString() : ''}
                                    onChangeText={(text) =>
                                        setCurrentResult({ ...currentResult, weight: parseFloat(text) || 0 })
                                    }
                                    textAlign="center"
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Répétitions réalisées</Text>
                                <TextInput
                                    style={styles.input}
                                    keyboardType="numeric"
                                    value={currentResult.reps ? currentResult.reps.toString() : ''}
                                    onChangeText={(text) =>
                                        setCurrentResult({ ...currentResult, reps: parseInt(text, 10) || 0 })
                                    }
                                    textAlign="center"
                                />
                            </View>
                            <TouchableOpacity style={styles.button} onPress={handleSetCompletion}>
                                <Text style={styles.buttonText}>Terminé</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <View style={styles.cooldownContainer}>
                            <Text style={styles.title}>Repos</Text>
                            <View style={styles.progressContainer}>
                                <Animated.View style={[styles.progressBar, { width: progressBarWidth }]} />
                            </View>
                            <Text style={styles.cooldownText}>Temps restant : {timer} sec</Text>
                        </View>
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
        textAlign: 'center',
    },
    inputGroup: {
        width: '100%',
        marginBottom: 12,
        alignItems: 'center',
    },
    inputLabel: {
        fontSize: 16,
        marginBottom: 4,
        color: '#555',
    },
    input: {
        width: '80%',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        fontSize: 16,
        color: '#000',
        textAlign: 'center',
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
        fontSize: 16,
    },
    cooldownContainer: {
        alignItems: 'center',
    },
    progressContainer: {
        width: COOLDOWN_BAR_WIDTH,
        height: 20,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#28A745',
    },
    cooldownText: {
        fontSize: 18,
        color: '#333',
    },
});

export default ExerciseSessionTrackingModal;
