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

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
// (The progress container width is defined as a fixed pixel value for the demo; you may adapt as needed.)
const COOLDOWN_BAR_WIDTH = 200;

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
    const [currentSet, setCurrentSet] = useState<number>(1);
    const [phase, setPhase] = useState<'work' | 'rest'>('work');
    // Use an absolute target time (in ms) to keep track of rest duration.
    const [targetTime, setTargetTime] = useState<number>(
        Date.now() + restDuration * 1000
    );
    const [timer, setTimer] = useState<number>(restDuration);
    const [results, setResults] = useState<SetResult[]>(Array(totalSets).fill({}));
    const [isEditingModalVisible, setIsEditingModalVisible] = useState<boolean>(false);
    const [editingSetIndex, setEditingSetIndex] = useState<number>(0);
    const [tempReps, setTempReps] = useState<string>('');
    const [tempWeight, setTempWeight] = useState<string>('');
    const [isEnded, setIsEnded] = useState<boolean>(false);
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
                const remaining = Math.max(Math.ceil((targetTime - Date.now()) / 1000), 0);
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
        if (currentSet === totalSets) {
            setEditingSetIndex(currentSet - 1);
            setTempReps('');
            setTempWeight('');
            setIsEditingModalVisible(true);
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
        // Final validation for weight:
        if (tempWeight === '') {
            Alert.alert('Erreur', 'Veuillez entrer un poids.');
            return;
        }
        if (tempWeight.includes(',')) {
            const parts = tempWeight.split(',');
            // Ensure there's exactly one comma and the fractional part is exactly 25, 5, or 75.
            if (parts.length !== 2 || !(parts[1] === '25' || parts[1] === '5' || parts[1] === '75')) {
                Alert.alert('Erreur', "Le poids doit être un entier ou un entier suivi d'une virgule et de 25, 5 ou 75.");
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
        if (editingSetIndex === currentSet - 1 && currentSet === totalSets) {
            setIsEnded(true);
            setPhase('work');
        }
    };

    const finishSession = async () => {
        const validResults = results.filter(set => set && set.reps && set.weight);
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
                exerciseId: "", // include if available
                exerciseName,
                date: new Date().toISOString(),
                setsData: JSON.stringify(validResults),
            };
            await API.graphql(graphqlOperation(createExerciseTracking, { input: trackingInput }));
            console.log("Tracking saved:", trackingInput);
        } catch (error) {
            console.error("Error saving tracking:", error);
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

    const renderHistory = () => {
        const history = [];
        for (let i = 0; i < totalSets; i++) {
            if (results[i]?.reps && results[i]?.weight) {
                history.push({ text: `Série ${i + 1} : ${results[i].reps} x ${results[i].weight} kg`, status: 'completed' });
            } else if (i === currentSet - 1 && !isEnded) {
                history.push({ text: `Série ${i + 1} : En cours`, status: 'inProgress' });
            } else {
                history.push({ text: `Série ${i + 1} : À venir`, status: 'upcoming' });
            }
        }
        return history.map((entry, idx) => (
            <TouchableOpacity
                key={idx}
                onPress={() => {
                    if (entry.status === 'completed') {
                        setEditingSetIndex(idx);
                        const existing = results[idx] || {};
                        setTempReps(existing.reps ? existing.reps.toString() : '');
                        setTempWeight(existing.weight ? existing.weight.toString() : '');
                        setIsEditingModalVisible(true);
                    }
                }}
            >
                <Text
                    style={[
                        styles.historyText,
                        entry.status === 'completed'
                            ? styles.historyCompleted
                            : entry.status === 'inProgress'
                                ? styles.historyInProgress
                                : styles.historyUpcoming,
                    ]}
                >
                    {entry.text}
                </Text>
            </TouchableOpacity>
        ));
    };

    // Updated handler for weight input to allow intermediate input:
    const handleWeightChange = (value: string) => {
        // Allow an empty value
        if (value === '') {
            setTempWeight('');
            return;
        }
        // Allow digits, optionally followed by a comma and up to 2 digits.
        const regex = /^[0-9]+(,[0-9]{0,2})?$/;
        if (regex.test(value)) {
            setTempWeight(value);
        }
    };

    // Interpolate progress to a percentage string for rest timer.
    const progressBarWidth = progressAnim.interpolate({
        inputRange: [0, restDuration],
        outputRange: ['0%', '100%'],
        extrapolate: 'clamp',
    });

    if (isMinimized) {
        return (
            <TouchableOpacity style={styles.minimizedContainer} onPress={() => setIsMinimized(false)}>
                <Text style={styles.minimizedText}>{exerciseName}</Text>
                <Text style={styles.minimizedText}>Série {currentSet}/{totalSets}</Text>
                <Text style={styles.minimizedText}>
                    {phase === 'rest' ? `Repos : ${formatTime(timer)}` : `${plannedReps} reps`}
                </Text>
            </TouchableOpacity>
        );
    }

    return (
        <View style={styles.fullScreenContainer}>
            <ScrollView contentContainerStyle={styles.contentContainer}>
                <Text style={styles.setIndicator}>Série {currentSet}/{totalSets}</Text>
                <Text style={styles.statusText}>
                    {phase === 'work' ? `${plannedReps} reps` : 'Repos'}
                </Text>
                {phase === 'rest' && (
                    <>
                        <Text style={styles.timerText}>{formatTime(timer)}</Text>
                        <View style={styles.progressContainer}>
                            <Animated.View style={[styles.progressBar, { width: progressBarWidth }]} />
                        </View>
                    </>
                )}
                {phase === 'work' ? (
                    currentSet === totalSets ? (
                        isEnded ? (
                            <TouchableOpacity style={[styles.actionButton, styles.terminateButton]} onPress={finishSession}>
                                <Text style={styles.actionButtonText}>Terminer l'exercice</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={styles.actionButton} onPress={finishCurrentSet}>
                                <Text style={styles.actionButtonText}>Série terminée</Text>
                            </TouchableOpacity>
                        )
                    ) : (
                        <TouchableOpacity style={styles.actionButton} onPress={finishCurrentSet}>
                            <Text style={styles.actionButtonText}>Série terminée</Text>
                        </TouchableOpacity>
                    )
                ) : (
                    <TouchableOpacity style={styles.actionButton} onPress={skipRest}>
                        <Text style={styles.actionButtonText}>Série suivante</Text>
                    </TouchableOpacity>
                )}

                <View style={styles.historyContainer}>
                    {renderHistory()}
                </View>

                {(currentSet < totalSets || (currentSet === totalSets && !isEnded)) && (
                    <TouchableOpacity style={styles.endButton} onPress={abandonExercise}>
                        <Text style={styles.endButtonText}>Abandonner l'exercice</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.minimizeButton} onPress={() => setIsMinimized(true)}>
                    <Text style={styles.minimizeButtonText}>Minimiserr</Text>
                </TouchableOpacity>
            </ScrollView>

            <Modal visible={isEditingModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>
                            {editingSetIndex === currentSet - 1
                                ? `Repos - Série ${editingSetIndex + 1}`
                                : `Modifier la Série ${editingSetIndex + 1}`}
                        </Text>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Répétitions effectuées</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Répétitions"
                                keyboardType="numeric"
                                value={tempReps}
                                onChangeText={setTempReps}
                                textAlign="center"
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Poids utilisé (kg)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Poids (ex. 50,25)"
                                keyboardType="numeric"
                                value={tempWeight}
                                onChangeText={handleWeightChange}
                                textAlign="center"
                            />
                        </View>
                        <TouchableOpacity style={styles.saveModalButton} onPress={saveSetData}>
                            <Text style={styles.saveModalButtonText}>Enregistrer</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
        justifyContent: 'center', // Center content vertically
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 20,
    },
    setIndicator: {
        fontSize: 32,
        marginBottom: 20,
        fontWeight: 'bold',
        color: '#141118',
    },
    statusText: {
        fontSize: 22,
        marginBottom: 20,
        color: '#141118',
    },
    timerText: {
        fontSize: 20,
        marginBottom: 10,
        color: '#141118',
    },
    progressContainer: {
        width: '100%',
        height: 6,
        backgroundColor: '#e0dce5',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 20,
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#141118',
    },
    actionButton: {
        backgroundColor: '#8019e6',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 50, // pill shape
        marginBottom: 30,
        alignSelf: 'center',
    },
    terminateButton: {
        backgroundColor: 'green',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    historyContainer: {
        width: '100%',
        paddingVertical: 20,
        borderTopWidth: 1,
        borderColor: '#ccc',
        marginBottom: 20,
        alignItems: 'center',
    },
    historyText: {
        fontSize: 16,
        marginBottom: 8,
    },
    historyCompleted: {
        color: 'green',
    },
    historyInProgress: {
        color: 'orange',
    },
    historyUpcoming: {
        color: '#555',
    },
    endButton: {
        backgroundColor: '#DC3545',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 50,
        marginBottom: 20,
        alignSelf: 'center',
    },
    endButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    minimizeButton: {
        backgroundColor: '#6C757D',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 50,
        marginBottom: 20,
        alignSelf: 'center',
    },
    minimizeButtonText: {
        color: '#fff',
        fontSize: 16,
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
    minimizedText: {
        fontSize: 16,
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
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#141118',
    },
    inputGroup: {
        width: '90%',
        marginBottom: 12,
        alignItems: 'center',
    },
    inputLabel: {
        fontSize: 18,
        marginBottom: 8,
        color: '#141118',
    },
    input: {
        width: '80%',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 12,
        fontSize: 18,
        marginBottom: 12,
        textAlign: 'center',
    },
    saveModalButton: {
        backgroundColor: '#28A745',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 50,
    },
    saveModalButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 0.5,
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
});

export default WorkoutSessionScreen;
