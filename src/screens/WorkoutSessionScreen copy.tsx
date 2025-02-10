// src/screens/WorkoutSessionScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Animated,
    Easing,
    Dimensions,
    Modal,
    TextInput,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { API, graphqlOperation, Auth } from 'aws-amplify';
import { createExerciseTracking } from '../graphql/mutations';
import { v4 as uuidv4 } from 'uuid';

import { ButtonStyles } from '../styles/ButtonStyles';
import { TextInputStyles } from '../styles/TextInputStyles';
import { TextStyles } from '../styles/TextStyles';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface SetResult {
    reps?: number;
    weight?: number;
}

export interface WorkoutSessionScreenProps {
    sessionData: {
        exerciseName: string;
        totalSets: number;
        plannedReps: number;
        restDuration: number; // in seconds
    };
    onComplete: (results: SetResult[]) => void;
    onClose?: () => void;
}

const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const WorkoutSessionScreen: React.FC<WorkoutSessionScreenProps> = ({
    sessionData,
    onComplete,
    onClose,
}) => {
    if (!sessionData) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>
                    Erreur: Les paramètres de session sont manquants.
                </Text>
            </View>
        );
    }

    const navigation = useNavigation();
    const { exerciseName, totalSets, plannedReps, restDuration } = sessionData;

    // Flag to indicate if the user has started the exercise.
    const [hasStarted, setHasStarted] = useState<boolean>(false);
    const [currentSet, setCurrentSet] = useState<number>(1);
    const [phase, setPhase] = useState<'work' | 'rest'>('work');
    // Absolute target time (in ms) for rest duration.
    const [targetTime, setTargetTime] = useState<number>(
        Date.now() + restDuration * 1000
    );
    const [timer, setTimer] = useState<number>(restDuration);
    const [results, setResults] = useState<SetResult[]>(Array(totalSets).fill({}));
    const [isEditingModalVisible, setIsEditingModalVisible] = useState<boolean>(false);
    const [editingSetIndex, setEditingSetIndex] = useState<number>(0);
    const [tempReps, setTempReps] = useState<string>('');
    const [tempWeight, setTempWeight] = useState<string>('');
    // (isEnded is no longer used in the button logic)
    const [isMinimized, setIsMinimized] = useState<boolean>(false);

    // Animated progress value for rest timer.
    const progressAnim = useRef(new Animated.Value(restDuration)).current;

    useEffect(() => {
        Animated.timing(progressAnim, {
            toValue: timer,
            duration: 500,
            easing: Easing.linear,
            useNativeDriver: false,
        }).start();
    }, [timer, progressAnim]);

    // Timer effect using absolute targetTime.
    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | undefined;
        if (phase === 'rest') {
            interval = setInterval(() => {
                const remaining = Math.max(
                    Math.ceil((targetTime - Date.now()) / 1000),
                    0
                );
                setTimer(remaining);
                if (remaining === 0) {
                    if (interval) clearInterval(interval);
                    handleRestComplete();
                }
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [phase, targetTime]);

    const handleRestComplete = () => {
        setPhase('work');
        setTimer(restDuration);
        setTargetTime(Date.now() + restDuration * 1000);
        if (currentSet < totalSets) {
            setCurrentSet(prev => prev + 1);
        } else {
            finishSession();
        }
    };

    const finishCurrentSet = () => {
        // For non-last sets, or if the last set data is not yet entered, open the pop-up.
        if (currentSet === totalSets) {
            if (!(results[currentSet - 1]?.reps && results[currentSet - 1]?.weight)) {
                setEditingSetIndex(currentSet - 1);
                setTempReps('');
                setTempWeight('');
                setIsEditingModalVisible(true);
            }
        } else {
            setPhase('rest');
            setTargetTime(Date.now() + restDuration * 1000);
            setTimer(restDuration);
            setTimeout(() => {
                setEditingSetIndex(currentSet - 1);
                setTempReps('');
                setTempWeight('');
                setIsEditingModalVisible(true);
            }, 500);
        }
    };

    const saveSetData = () => {
        const repsNum = parseInt(tempReps, 10);
        if (tempWeight === '') {
            Alert.alert('Erreur', 'Veuillez entrer un poids.');
            return;
        }
        if (tempWeight.includes(',')) {
            const parts = tempWeight.split(',');
            if (
                parts.length !== 2 ||
                !(parts[1] === '25' || parts[1] === '5' || parts[1] === '75')
            ) {
                Alert.alert(
                    'Erreur',
                    "Le poids doit être un entier ou un entier suivi d'une virgule et de 25, 5 ou 75."
                );
                return;
            }
        }
        const weightNum = parseFloat(tempWeight.replace(',', '.'));
        if (isNaN(repsNum) || isNaN(weightNum) || repsNum <= 0 || weightNum <= 0) {
            Alert.alert('Erreur', 'Veuillez entrer des valeurs valides.');
            return;
        }
        const updated = [...results];
        updated[editingSetIndex] = { reps: repsNum, weight: weightNum };
        setResults(updated);
        setIsEditingModalVisible(false);
    };

    const finishSession = async () => {
        const validResults = results.filter(
            set => set && set.reps && set.weight
        );
        if (validResults.length === 0) {
            console.log("No valid set data entered. Finishing session without saving.");
            if (onComplete) onComplete([]);
            if (onClose) {
                onClose();
            } else {
                navigation.goBack();
            }
            return;
        }
        try {
            const userObj = await Auth.currentAuthenticatedUser();
            const userId = userObj.attributes.sub;
            const trackingInput = {
                id: uuidv4(),
                userId,
                exerciseId: '', // include if available
                exerciseName,
                date: new Date().toISOString(),
                setsData: JSON.stringify(validResults),
            };
            await API.graphql(graphqlOperation(createExerciseTracking, { input: trackingInput }));
            console.log('Tracking saved:', trackingInput);
        } catch (error) {
            console.error('Error saving tracking:', error);
        }
        if (onComplete) onComplete(validResults);
        if (onClose) {
            onClose();
        } else {
            navigation.goBack();
        }
    };

    const skipRest = () => {
        setPhase('work');
        setTimer(restDuration);
        setTargetTime(Date.now() + restDuration * 1000);
        if (currentSet < totalSets) {
            setCurrentSet(prev => prev + 1);
        } else {
            finishSession();
        }
    };

    const abandonExercise = () => {
        Alert.alert(
            "Abandonner l'exercice",
            "Es-tu sûr de vouloir abandonner l'exercice ? Les séries complétées seront sauvegardées.",
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Abandonner',
                    style: 'destructive',
                    onPress: () => {
                        finishSession();
                    },
                },
            ]
        );
    };

    // Render the series list as rounded cards.
    const renderSetCards = (mode: 'pre' | 'active' | 'rest') => {
        return (
            <>
                {Array.from({ length: totalSets }).map((_, index) => {
                    let status = 'À venir';
                    if (results[index]?.reps && results[index]?.weight) {
                        status = `${results[index].reps} x ${results[index].weight} kg`;
                    } else if (mode !== 'pre' && index === currentSet - 1) {
                        status = 'En cours';
                    }
                    return (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.seriesCard,
                                (mode !== 'pre' && index === currentSet - 1) && styles.seriesCardActive,
                            ]}
                            onPress={() => {
                                if (results[index]?.reps && results[index]?.weight) {
                                    setEditingSetIndex(index);
                                    const existing = results[index] || {};
                                    setTempReps(existing.reps ? existing.reps.toString() : '');
                                    setTempWeight(existing.weight ? existing.weight.toString() : '');
                                    setIsEditingModalVisible(true);
                                }
                            }}
                        >
                            <View style={styles.circle}>
                                <Text style={styles.circleText}>{index + 1}</Text>
                            </View>
                            <Text style={styles.cardStatusText}>{status}</Text>
                        </TouchableOpacity>
                    );
                })}
            </>
        );
    };

    // Update tempWeight with proper formatting.
    const handleWeightChange = (value: string) => {
        if (value === '') {
            setTempWeight('');
            return;
        }
        const regex = /^[0-9]+(,[0-9]{0,2})?$/;
        if (regex.test(value)) {
            setTempWeight(value);
        }
    };

    // Animate progress width.
    const progressBarWidth = progressAnim.interpolate({
        inputRange: [0, restDuration],
        outputRange: ['0%', '100%'],
        extrapolate: 'clamp',
    });

    // Determine if the last set is completed.
    const lastSetCompleted =
        currentSet === totalSets &&
        results[currentSet - 1]?.reps &&
        results[currentSet - 1]?.weight;

    if (isMinimized) {
        return (
            <TouchableOpacity
                style={styles.minimizedContainer}
                onPress={() => setIsMinimized(false)}
            >
                <Text style={TextStyles.simpleText}>{exerciseName}</Text>
                <Text style={TextStyles.simpleText}>
                    Série {currentSet}/{totalSets}
                </Text>
                <Text style={TextStyles.simpleText}>
                    {phase === 'rest'
                        ? 'Repos'
                        : `${formatTime(timer)} : ${plannedReps} reps`}
                </Text>
            </TouchableOpacity>
        );
    }

    return (
        <View style={styles.fullScreenContainer}>
            <ScrollView contentContainerStyle={styles.contentContainer}>
                {/* Common Header */}
                <Text style={[TextStyles.title, { textAlign: 'center', marginBottom: 40 }]}>
                    {exerciseName}
                </Text>

                {!hasStarted ? (
                    // State 1: Pre-Workout
                    <>
                        <Text style={[TextStyles.subTitle, { textAlign: 'center', marginBottom: 20 }]}>
                            Prêt ?
                        </Text>
                        <View style={styles.seriesListContainer}>
                            {renderSetCards('pre')}
                        </View>
                        <TouchableOpacity
                            style={ButtonStyles.container}
                            onPress={() => setHasStarted(true)}
                        >
                            <Text style={ButtonStyles.text}>Démarrer l'exercice</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    // Active Workout / Rest Period
                    <>
                        {phase === 'work' ? (
                            // State 2: Active Workout
                            <>
                                <Text style={[TextStyles.subTitle, { textAlign: 'center', marginBottom: 20 }]}>
                                    {plannedReps} reps
                                </Text>
                                <View style={styles.seriesListContainer}>
                                    {renderSetCards('active')}
                                </View>
                                <TouchableOpacity
                                    style={ButtonStyles.container}
                                    onPress={lastSetCompleted ? finishSession : finishCurrentSet}
                                >
                                    <Text style={ButtonStyles.text}>
                                        {lastSetCompleted ? "Terminer l'exercice" : "Série terminée"}
                                    </Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            // State 3: Rest Period
                            <>
                                <View style={styles.progressWrapper}>
                                    <Text style={TextStyles.simpleText}>Repos</Text>
                                    <View style={styles.progressContainer}>
                                        <Animated.View style={[styles.progressBar, { width: progressBarWidth }]} />
                                    </View>
                                    <Text style={styles.timerText}>{formatTime(timer)}</Text>
                                </View>
                                <View style={styles.seriesListContainer}>
                                    {renderSetCards('rest')}
                                </View>
                                <TouchableOpacity style={ButtonStyles.container} onPress={skipRest}>
                                    <Text style={ButtonStyles.text}>Passer le repos</Text>
                                </TouchableOpacity>
                            </>
                        )}
                        {/* Abandon button */}
                        {(currentSet < totalSets ||
                            (currentSet === totalSets && !lastSetCompleted)) && (
                                <TouchableOpacity style={ButtonStyles.invertedContainer} onPress={abandonExercise}>
                                    <Text style={ButtonStyles.invertedText}>Abandonner l'exercice</Text>
                                </TouchableOpacity>
                            )}
                    </>
                )}
            </ScrollView>

            {/* Set Completion / Editing Modal */}
            <Modal visible={isEditingModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={[TextStyles.subTitle, { marginBottom: 20 }]}>
                            {editingSetIndex === currentSet - 1
                                ? `Repos – Série ${editingSetIndex + 1}`
                                : `Modifier la Série ${editingSetIndex + 1}`}
                        </Text>
                        <View style={TextInputStyles.container}>
                            <Text style={[TextStyles.simpleText, { marginBottom: 5 }]}>
                                Répétitions effectuées
                            </Text>
                            <TextInput
                                style={[TextInputStyles.input, { backgroundColor: '#F8F0E6' }]}
                                keyboardType="numeric"
                                value={tempReps}
                                onChangeText={setTempReps}
                                textAlign="center"
                            />
                        </View>
                        <View style={TextInputStyles.container}>
                            <Text style={[TextStyles.simpleText, { marginBottom: 5 }]}>
                                Poids effectué (kg)
                            </Text>
                            <TextInput
                                style={[TextInputStyles.input, { backgroundColor: '#F8F0E6' }]}
                                keyboardType="numeric"
                                value={tempWeight}
                                onChangeText={handleWeightChange}
                                textAlign="center"
                            />
                        </View>
                        <TouchableOpacity style={ButtonStyles.container} onPress={saveSetData}>
                            <Text style={ButtonStyles.text}>Enregistrer</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Minimized view */}
            {isMinimized && (
                <TouchableOpacity style={styles.minimizedContainer} onPress={() => setIsMinimized(false)}>
                    <Text style={TextStyles.simpleText}>{exerciseName}</Text>
                    <Text style={TextStyles.simpleText}>
                        Série {currentSet}/{totalSets}
                    </Text>
                    <Text style={TextStyles.simpleText}>
                        {phase === 'rest'
                            ? 'Repos'
                            : `${formatTime(timer)} : ${plannedReps} reps`}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    fullScreenContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    contentContainer: {
        flexGrow: 1,
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 20,
    },
    // The progressWrapper now holds the "Repos" label, the thicker progress bar, and the timer.
    progressWrapper: {
        width: '100%',
        alignSelf: 'center',
        marginBottom: 20,
    },
    progressContainer: {
        width: '100%',
        height: 8,
        backgroundColor: '#e0dce5',
        borderRadius: 6,
        overflow: 'hidden',
        marginVertical: 10,
        alignSelf: 'center',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#141118',
    },
    timerText: {
        fontSize: 16,
        color: '#141118',
        marginTop: 5,
        alignSelf: 'flex-start',
    },
    seriesListContainer: {
        width: '100%',
        marginVertical: 20,
    },
    seriesCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F0E6',
        borderRadius: 10,
        padding: 10,
        marginVertical: 5,
        width: '100%',
    },
    seriesCardActive: {
        borderWidth: 2,
        borderColor: '#b21ae5',
    },
    circle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#b21ae5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    circleText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    cardStatusText: {
        fontSize: 16,
        color: '#141118',
    },
    minimizedContainer: {
        position: 'absolute',
        bottom: 70,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        paddingVertical: 10,
        alignItems: 'center',
        borderTopWidth: 1,
        borderColor: '#ccc',
    },
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 20,
        alignItems: 'center',
    },
});

export default WorkoutSessionScreen;
