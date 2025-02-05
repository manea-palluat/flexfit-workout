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

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
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
    const navigation = useNavigation();
    const { exerciseName, totalSets, plannedReps, restDuration } = sessionData;
    const [currentSet, setCurrentSet] = useState<number>(1);
    const [phase, setPhase] = useState<'work' | 'rest'>('work');
    const [timer, setTimer] = useState<number>(restDuration);
    const [results, setResults] = useState<SetResult[]>(Array(totalSets).fill({}));
    const [isEditingModalVisible, setIsEditingModalVisible] = useState<boolean>(false);
    const [editingSetIndex, setEditingSetIndex] = useState<number>(0);
    const [tempReps, setTempReps] = useState<string>('');
    const [tempWeight, setTempWeight] = useState<string>('');
    // New state to track end state of last set.
    const [isEnded, setIsEnded] = useState<boolean>(false);
    const [isMinimized, setIsMinimized] = useState<boolean>(false);

    const progressAnim = useRef(new Animated.Value(restDuration)).current;

    useEffect(() => {
        Animated.timing(progressAnim, {
            toValue: timer,
            duration: 500,
            easing: Easing.linear,
            useNativeDriver: false,
        }).start();
    }, [timer, progressAnim]);

    useEffect(() => {
        let interval: NodeJS.Timeout | undefined;
        if (phase === 'rest' && currentSet < totalSets) {
            // For non-last sets, count down the timer.
            interval = setInterval(() => {
                setTimer(prev => {
                    if (prev <= 1) {
                        if (interval) clearInterval(interval);
                        handleRestComplete();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        // For last set, we do not start a rest timer.
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [phase, restDuration, currentSet, totalSets]);

    // For non-last sets: when rest timer expires, move to next set.
    const handleRestComplete = () => {
        setPhase('work');
        setTimer(restDuration);
        if (currentSet < totalSets) {
            setCurrentSet(prev => prev + 1);
        }
    };

    // finishCurrentSet: when user taps "Série terminée"
    const finishCurrentSet = () => {
        if (currentSet === totalSets) {
            // Last set: do NOT start rest timer; open modal immediately.
            setEditingSetIndex(currentSet - 1);
            setTempReps('');
            setTempWeight('');
            setIsEditingModalVisible(true);
        } else {
            // Non-last set: start rest phase so progress bar and timer show, then open modal.
            setPhase('rest');
            setTimer(restDuration);
            setTimeout(() => {
                setEditingSetIndex(currentSet - 1);
                setTempReps('');
                setTempWeight('');
                setIsEditingModalVisible(true);
            }, 500);
        }
    };

    // In saveSetData, update results immediately.
    const saveSetData = () => {
        const repsNum = parseInt(tempReps, 10);
        const weightNum = parseFloat(tempWeight);
        if (isNaN(repsNum) || isNaN(weightNum) || repsNum <= 0 || weightNum <= 0) {
            Alert.alert('Erreur', 'Veuillez entrer des valeurs valides.');
            return;
        }
        const updated = [...results];
        updated[editingSetIndex] = { reps: repsNum, weight: weightNum };
        setResults(updated);
        setIsEditingModalVisible(false);
        // If we are editing the current new set...
        if (editingSetIndex === currentSet - 1) {
            // For the last set, enter end state:
            if (currentSet === totalSets) {
                setIsEnded(true);
            }
            // For non-last sets, update history instantly (history now shows completed data)
            // and let the rest timer continue.
        }
    };

    const finishSession = () => {
        if (onComplete) onComplete(results);
        if (onClose) {
            onClose();
        } else {
            navigation.goBack();
        }
    };

    const skipRest = () => {
        setPhase('work');
        setTimer(restDuration);
        if (currentSet < totalSets) {
            setCurrentSet(prev => prev + 1);
        } else {
            finishSession();
        }
    };

    const abandonExercise = () => {
        Alert.alert(
            'Abandonner l\'exercice',
            'Es-tu sûr de vouloir abandonner l\'exercice ? Les séries complétées seront sauvegardées.',
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
                <Text style={[
                    styles.historyText,
                    entry.status === 'completed'
                        ? styles.historyCompleted
                        : entry.status === 'inProgress'
                            ? styles.historyInProgress
                            : styles.historyUpcoming,
                ]}>
                    {entry.text}
                </Text>
            </TouchableOpacity>
        ));
    };

    const progressBarWidth = progressAnim.interpolate({
        inputRange: [0, restDuration],
        outputRange: [0, COOLDOWN_BAR_WIDTH],
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
            <View style={styles.header}>
                <Text style={styles.exerciseTitle}>{exerciseName}</Text>
            </View>
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
                    // For the last set in work phase:
                    currentSet === totalSets ? (
                        isEnded ? (
                            // If the last set has been saved and we are in end state, show green "Terminer l'exercice" button.
                            <TouchableOpacity style={[styles.actionButton, styles.terminateButton]} onPress={finishSession}>
                                <Text style={styles.actionButtonText}>Terminer l'exercice</Text>
                            </TouchableOpacity>
                        ) : (
                            // Otherwise, show "Série terminée" button.
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

                {/* For non-last sets, show the "Abandonner l'exercice" button */}
                {currentSet < totalSets && (
                    <TouchableOpacity style={styles.endButton} onPress={abandonExercise}>
                        <Text style={styles.endButtonText}>Abandonner l'exercice</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.minimizeButton} onPress={() => setIsMinimized(true)}>
                    <Text style={styles.minimizeButtonText}>Minimiser</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Modal for entering/editing set data */}
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
                                placeholder="Poids"
                                keyboardType="numeric"
                                value={tempWeight}
                                onChangeText={setTempWeight}
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
    header: {
        paddingTop: 40,
        alignItems: 'center',
    },
    exerciseTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    contentContainer: {
        flexGrow: 1,
        justifyContent: 'center', // Center vertically
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 20,
    },
    setIndicator: {
        fontSize: 26,
        marginBottom: 20,
    },
    statusText: {
        fontSize: 22,
        marginBottom: 20,
    },
    timerText: {
        fontSize: 20,
        marginBottom: 10,
    },
    progressContainer: {
        width: COOLDOWN_BAR_WIDTH,
        height: 20,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 20,
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#28A745',
    },
    actionButton: {
        backgroundColor: '#007BFF',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 8,
        marginBottom: 30,
    },
    terminateButton: {
        backgroundColor: 'green',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
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
        fontSize: 18,
        marginBottom: 10,
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
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 8,
        marginBottom: 20,
    },
    endButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    minimizeButton: {
        backgroundColor: '#6C757D',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginBottom: 20,
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
    },
    inputGroup: {
        width: '100%',
        marginBottom: 12,
        alignItems: 'center',
    },
    inputLabel: {
        fontSize: 18,
        marginBottom: 8,
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
        borderRadius: 8,
    },
    saveModalButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default WorkoutSessionScreen;
