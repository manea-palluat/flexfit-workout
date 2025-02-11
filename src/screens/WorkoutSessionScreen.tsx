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
    AppState,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { API, graphqlOperation, Auth } from 'aws-amplify';
import { createExerciseTracking } from '../graphql/mutations';
import { v4 as uuidv4 } from 'uuid';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ButtonStyles } from '../styles/ButtonStyles';
import { TextInputStyles } from '../styles/TextInputStyles';
import { TextStyles } from '../styles/TextStyles';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import Svg, { Rect } from 'react-native-svg';

// Configure notifications
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

// ----------------------------------------------------------------------------
// INTERFACES & HELPER FUNCTIONS

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

// ----------------------------------------------------------------------------
// AnimatedBorder Component
const AnimatedRect = Animated.createAnimatedComponent(Rect);

interface AnimatedBorderProps {
    size: number;
    borderRadius: number;
    strokeWidth: number;
}

const AnimatedBorder: React.FC<AnimatedBorderProps> = ({
    size,
    borderRadius,
    strokeWidth,
}) => {
    const straightLength = (size - strokeWidth) * 4 - 8 * borderRadius;
    const curvedLength = 2 * Math.PI * borderRadius;
    const perimeter = straightLength + curvedLength;
    const dashLength = perimeter * 0.2;
    const gapLength = perimeter - dashLength;
    const dashPattern = `${dashLength},${gapLength}`;
    const dashOffsetAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(dashOffsetAnim, {
                toValue: -perimeter,
                duration: 2000,
                easing: Easing.linear,
                useNativeDriver: false,
            })
        ).start();
    }, [perimeter]);

    return (
        <Svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0 }}>
            <AnimatedRect
                x={strokeWidth / 2}
                y={strokeWidth / 2}
                width={size - strokeWidth}
                height={size - strokeWidth}
                rx={borderRadius}
                ry={borderRadius}
                fill="none"
                stroke="#b21ae5"
                strokeWidth={strokeWidth}
                strokeDasharray={dashPattern}
                strokeDashoffset={dashOffsetAnim}
                strokeLinecap="round"
            />
        </Svg>
    );
};

// ----------------------------------------------------------------------------
// SetNumberIcon Component
interface SetNumberIconProps {
    number: number;
    active?: boolean;
}
const SetNumberIcon: React.FC<SetNumberIconProps> = ({ number, active }) => {
    return (
        <View style={styles.setNumberIconContainer}>
            <View style={styles.setNumberIcon}>
                <Text style={styles.setNumberIconText}>{number}</Text>
            </View>
            {active && <AnimatedBorder size={80} borderRadius={20} strokeWidth={3} />}
        </View>
    );
};

// ----------------------------------------------------------------------------
// WorkoutInputField Component
interface WorkoutInputFieldProps {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    onBlur?: () => void;
    error?: string;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
}
const WorkoutInputField: React.FC<WorkoutInputFieldProps> = ({
    label,
    value,
    onChangeText,
    onBlur,
    error,
    keyboardType = 'default',
}) => {
    return (
        <View style={[TextInputStyles.container, styles.inputContainer]}>
            <TextInput
                placeholder={label}
                placeholderTextColor="#999"
                value={value}
                onChangeText={onChangeText}
                onBlur={onBlur}
                style={TextInputStyles.input}
                keyboardType={keyboardType}
            />
            {error ? <Text style={TextInputStyles.errorText}>{error}</Text> : null}
        </View>
    );
};

// ----------------------------------------------------------------------------
// Main WorkoutSessionScreen Component
const WorkoutSessionScreen: React.FC<WorkoutSessionScreenProps> = ({
    sessionData,
    onComplete,
    onClose,
}) => {
    if (!sessionData) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Erreur: Les paramètres de session sont manquants.</Text>
            </View>
        );
    }

    const navigation = useNavigation();
    const { exerciseName, totalSets, plannedReps, restDuration } = sessionData;

    // STATE DECLARATIONS
    const [hasStarted, setHasStarted] = useState<boolean>(false);
    const [currentSet, setCurrentSet] = useState<number>(1);
    const [phase, setPhase] = useState<'work' | 'rest'>('work');
    const [targetTime, setTargetTime] = useState<number>(Date.now() + restDuration * 1000);
    const [timer, setTimer] = useState<number>(restDuration);
    const [results, setResults] = useState<SetResult[]>(Array(totalSets).fill({}));
    const [isEditingModalVisible, setIsEditingModalVisible] = useState<boolean>(false);
    const [editingSetIndex, setEditingSetIndex] = useState<number>(0);
    const [tempReps, setTempReps] = useState<string>('');
    const [tempWeight, setTempWeight] = useState<string>('');
    const [isMinimized, setIsMinimized] = useState<boolean>(false);
    const [repsError, setRepsError] = useState<string>('');
    const [weightError, setWeightError] = useState<string>('');

    // SOUND STATES
    const [countdownSound, setCountdownSound] = useState<Audio.Sound | null>(null);
    const [whistleSound, setWhistleSound] = useState<Audio.Sound | null>(null);

    // CONTROLS FOR SOUNDS & HAPTICS
    const [soundsEnabled, setSoundsEnabled] = useState<boolean>(true);
    const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(true);

    // APP STATE TRACKING
    const [appState, setAppState] = useState(AppState.currentState);

    // Request notification permissions on component mount
    useEffect(() => {
        (async () => {
            const { status } = await Notifications.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permission Required',
                    'Please enable notifications to receive rest timer alerts.',
                    [{ text: 'OK' }]
                );
            }
        })();
    }, []);

    // Set audio mode
    useEffect(() => {
        Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
        });
    }, []);

    // Load sounds
    useEffect(() => {
        const loadSounds = async () => {
            try {
                const { sound: loadedCountdown } = await Audio.Sound.createAsync(
                    require('../assets/sounds/beep.mp3')
                );
                setCountdownSound(loadedCountdown);
                const { sound: loadedWhistle } = await Audio.Sound.createAsync(
                    require('../assets/sounds/whistle.mp3')
                );
                setWhistleSound(loadedWhistle);
            } catch (error) {
                console.error('Error loading sounds:', error);
            }
        };
        loadSounds();
        return () => {
            if (countdownSound) countdownSound.unloadAsync();
            if (whistleSound) whistleSound.unloadAsync();
        };
    }, []);

    // Animated progress bar
    const progressAnim = useRef(new Animated.Value(restDuration)).current;
    useEffect(() => {
        Animated.timing(progressAnim, {
            toValue: timer,
            duration: 500,
            easing: Easing.linear,
            useNativeDriver: false,
        }).start();
    }, [timer]);

    // Modified rest timer effect with notification
    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | undefined;
        let notificationId: string | undefined;

        if (phase === 'rest') {
            // Immediately cancel any existing notifications and schedule a new one
            (async () => {
                await Notifications.cancelAllScheduledNotificationsAsync();
                notificationId = await Notifications.scheduleNotificationAsync({
                    content: {
                        title: "Au boulot !",
                        body: `Il est temps de faire la série ${currentSet + 1} de l'exercice ${exerciseName}`,
                        sound: true,
                    },
                    trigger: {
                        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                        seconds: restDuration,
                        repeats: false,
                    } as any,
                });
            })();

            interval = setInterval(async () => {
                const remaining = Math.max(Math.ceil((targetTime - Date.now()) / 1000), 0);
                setTimer(remaining);

                if (remaining > 0 && remaining <= 3) {
                    if (soundsEnabled && countdownSound) {
                        await countdownSound.replayAsync();
                    }
                    if (hapticsEnabled) {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    }
                }

                if (remaining === 0) {
                    if (interval) clearInterval(interval);
                    if (soundsEnabled && whistleSound) {
                        await whistleSound.replayAsync();
                    }
                    handleRestComplete();
                }
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
            if (notificationId) {
                Notifications.cancelScheduledNotificationAsync(notificationId);
            }
        };
    }, [phase, targetTime, countdownSound, whistleSound, soundsEnabled, hapticsEnabled]);

    // AppState listener: Cancel notifications when returning to foreground
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            setAppState(nextAppState);
            if (nextAppState === 'active') {
                Notifications.cancelAllScheduledNotificationsAsync();
            }
        });
        return () => {
            subscription.remove();
        };
    }, []);

    // When rest period ends, switch back to work phase
    const handleRestComplete = () => {
        setPhase('work');
        setTimer(restDuration);
        setTargetTime(Date.now() + restDuration * 1000);
        if (currentSet < totalSets) {
            setCurrentSet((prev) => prev + 1);
        } else {
            finishSession();
        }
    };

    // Called when the user finishes a set
    const finishCurrentSet = () => {
        if (currentSet === totalSets) {
            if (!(results[currentSet - 1]?.reps && results[currentSet - 1]?.weight)) {
                setEditingSetIndex(currentSet - 1);
                setTempReps('');
                setTempWeight('');
                setRepsError('');
                setWeightError('');
                setIsEditingModalVisible(true);
            }
        } else {
            // Switch to rest phase
            setPhase('rest');
            setTargetTime(Date.now() + restDuration * 1000);
            setTimer(restDuration);
            // (The notification is scheduled immediately by the rest timer effect.)
            setTimeout(() => {
                setEditingSetIndex(currentSet - 1);
                setTempReps('');
                setTempWeight('');
                setRepsError('');
                setWeightError('');
                setIsEditingModalVisible(true);
            }, 500);
        }
    };

    // Save set data
    const saveSetData = () => {
        const repsNum = parseInt(tempReps, 10);
        if (!/^\d+$/.test(tempReps)) {
            setRepsError("Veuillez entrer un entier pour les répétitions.");
            return;
        }
        if (tempWeight === '') {
            setWeightError("Veuillez entrer un poids.");
            return;
        }
        if (tempWeight.includes(',')) {
            const parts = tempWeight.split(',');
            if (parts.length !== 2 || !['25', '5', '75'].includes(parts[1])) {
                setWeightError("Le poids doit être un entier ou suivi d'une virgule et de 25, 5 ou 75.");
                return;
            }
        } else if (!/^\d+$/.test(tempWeight)) {
            setWeightError("Veuillez entrer un entier valide pour le poids.");
            return;
        }
        setRepsError('');
        setWeightError('');
        const weightNum = parseFloat(tempWeight.replace(',', '.'));
        const updated = [...results];
        updated[editingSetIndex] = { reps: repsNum, weight: weightNum };
        setResults(updated);
        setIsEditingModalVisible(false);
    };

    // Finish session
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
                exerciseId: '',
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

    // Modified skipRest: Cancel notifications and switch back to work phase
    const skipRest = async () => {
        await Notifications.cancelAllScheduledNotificationsAsync();
        setPhase('work');
        setTimer(restDuration);
        setTargetTime(Date.now() + restDuration * 1000);
        if (currentSet < totalSets) {
            setCurrentSet(prev => prev + 1);
        } else {
            finishSession();
        }
    };

    // Modified abandonExercise: Cancel notifications and finish session
    const abandonExercise = () => {
        Alert.alert(
            "Abandonner l'exercice",
            "Es-tu sûr de vouloir abandonner l'exercice ? Les séries complétées seront sauvegardées.",
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Abandonner',
                    style: 'destructive',
                    onPress: async () => {
                        await Notifications.cancelAllScheduledNotificationsAsync();
                        finishSession();
                    },
                },
            ]
        );
    };

    // Render set cards
    const renderSetCards = (mode: 'pre' | 'active' | 'rest') => {
        return (
            <>
                {Array.from({ length: totalSets }).map((_, index) => {
                    let status = 'À venir';
                    if (results[index]?.reps && results[index]?.weight) {
                        status = `Terminé : ${results[index].reps} x ${results[index].weight} kg`;
                    } else if (mode !== 'pre' && index === currentSet - 1) {
                        status = 'En cours';
                    }
                    return (
                        <TouchableOpacity
                            key={index}
                            style={styles.setContainer}
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
                            <SetNumberIcon number={index + 1} active={hasStarted && index === currentSet - 1} />
                            <View style={styles.setDetailsContainer}>
                                <Text style={styles.setTitleText}>{`Série ${index + 1}`}</Text>
                                <Text style={styles.setStatusText}>{status}</Text>
                            </View>
                            {results[index]?.reps && results[index]?.weight && (
                                <Ionicons name="checkmark-circle" size={24} color="#b21ae5" style={styles.checkIcon} />
                            )}
                        </TouchableOpacity>
                    );
                })}
            </>
        );
    };

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

    const progressBarWidth = progressAnim.interpolate({
        inputRange: [0, restDuration],
        outputRange: ['0%', '100%'],
        extrapolate: 'clamp',
    });

    const lastSetCompleted =
        currentSet === totalSets &&
        results[currentSet - 1]?.reps &&
        results[currentSet - 1]?.weight;

    return (
        <View style={styles.fullScreenContainer}>
            <ScrollView contentContainerStyle={styles.contentContainer}>
                <Text style={[TextStyles.title, { textAlign: 'center', marginBottom: 10 }]}>{exerciseName}</Text>

                {!hasStarted ? (
                    <>
                        <Text style={[TextStyles.subTitle, { textAlign: 'center', marginBottom: 20 }]}>Prêt ?</Text>
                        <View style={styles.seriesListContainer}>{renderSetCards('pre')}</View>
                        <TouchableOpacity style={ButtonStyles.container} onPress={() => setHasStarted(true)}>
                            <Text style={ButtonStyles.text}>Démarrer l'exercice</Text>
                        </TouchableOpacity>
                        <View style={styles.controlContainer}>
                            <TouchableOpacity style={styles.controlButton} onPress={() => setSoundsEnabled(!soundsEnabled)}>
                                <Ionicons name={soundsEnabled ? 'volume-high' : 'volume-mute'} size={30} color="#b21ae5" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.controlButton} onPress={() => setHapticsEnabled(!hapticsEnabled)}>
                                <MaterialCommunityIcons name={hapticsEnabled ? 'vibrate' : 'vibrate-off'} size={30} color="#b21ae5" />
                            </TouchableOpacity>
                        </View>
                    </>
                ) : (
                    <>
                        {phase === 'work' ? (
                            <>
                                <Text style={[TextStyles.subTitle, { textAlign: 'center', marginBottom: 20 }]}>{plannedReps} reps</Text>
                                <View style={styles.seriesListContainer}>{renderSetCards('active')}</View>
                                <TouchableOpacity style={ButtonStyles.container} onPress={lastSetCompleted ? finishSession : finishCurrentSet}>
                                    <Text style={ButtonStyles.text}>{lastSetCompleted ? "Terminer l'exercice" : "Série terminée"}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={ButtonStyles.invertedContainer} onPress={abandonExercise}>
                                    <Text style={ButtonStyles.invertedText}>Abandonner l'exercice</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <View style={styles.progressWrapper}>
                                    <Text style={TextStyles.simpleText}>Repos</Text>
                                    <View style={styles.progressContainer}>
                                        <Animated.View style={[styles.progressBar, { width: progressBarWidth }]} />
                                    </View>
                                    <Text style={styles.timerText}>{formatTime(timer)}</Text>
                                </View>
                                <View style={styles.seriesListContainer}>{renderSetCards('rest')}</View>
                                <TouchableOpacity style={ButtonStyles.container} onPress={skipRest}>
                                    <Text style={ButtonStyles.text}>Passer le repos</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={ButtonStyles.invertedContainer} onPress={abandonExercise}>
                                    <Text style={ButtonStyles.invertedText}>Abandonner l'exercice</Text>
                                </TouchableOpacity>
                            </>
                        )}
                        <View style={styles.controlContainer}>
                            <TouchableOpacity style={styles.controlButton} onPress={() => setSoundsEnabled(!soundsEnabled)}>
                                <Ionicons name={soundsEnabled ? 'volume-high' : 'volume-mute'} size={30} color="#b21ae5" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.controlButton} onPress={() => setHapticsEnabled(!hapticsEnabled)}>
                                <MaterialCommunityIcons name={hapticsEnabled ? 'vibrate' : 'vibrate-off'} size={30} color="#b21ae5" />
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </ScrollView>

            <Modal visible={isEditingModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={[TextStyles.subTitle, { marginBottom: 20 }]}>
                            {editingSetIndex === currentSet - 1
                                ? `Repos – Série ${editingSetIndex + 1}`
                                : `Modifier la Série ${editingSetIndex + 1}`}
                        </Text>
                        <WorkoutInputField
                            label="Répétitions effectuées"
                            value={tempReps}
                            onChangeText={(text) => {
                                setTempReps(text);
                                if (!/^\d*$/.test(text)) {
                                    setRepsError('Veuillez entrer un entier.');
                                } else {
                                    setRepsError('');
                                }
                            }}
                            onBlur={() => {
                                if (!/^\d+$/.test(tempReps)) {
                                    setRepsError('Veuillez entrer un entier.');
                                } else {
                                    setRepsError('');
                                }
                            }}
                            error={repsError}
                            keyboardType="numeric"
                        />
                        <WorkoutInputField
                            label="Poids effectué (kg)"
                            value={tempWeight}
                            onChangeText={(text) => {
                                setTempWeight(text);
                                if (text === '') {
                                    setWeightError('Veuillez entrer un poids.');
                                } else if (text.includes(',')) {
                                    const parts = text.split(',');
                                    if (parts.length !== 2 || !['25', '5', '75'].includes(parts[1])) {
                                        setWeightError('Le poids doit être un entier ou suivi d\'une virgule et de 25, 5 ou 75.');
                                    } else {
                                        setWeightError('');
                                    }
                                } else if (!/^\d+$/.test(text)) {
                                    setWeightError('Veuillez entrer un entier valide pour le poids.');
                                } else {
                                    setWeightError('');
                                }
                            }}
                            onBlur={() => {
                                if (tempWeight === '') {
                                    setWeightError('Veuillez entrer un poids.');
                                } else if (tempWeight.includes(',')) {
                                    const parts = tempWeight.split(',');
                                    if (parts.length !== 2 || !['25', '5', '75'].includes(parts[1])) {
                                        setWeightError('Le poids doit être un entier ou suivi d\'une virgule et de 25, 5 ou 75.');
                                    } else {
                                        setWeightError('');
                                    }
                                } else if (!/^\d+$/.test(tempWeight)) {
                                    setWeightError('Veuillez entrer un entier valide pour le poids.');
                                } else {
                                    setWeightError('');
                                }
                            }}
                            error={weightError}
                            keyboardType="numeric"
                        />
                        <TouchableOpacity style={ButtonStyles.container} onPress={saveSetData}>
                            <Text style={ButtonStyles.text}>Enregistrer</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {isMinimized && (
                <TouchableOpacity style={styles.minimizedContainer} onPress={() => setIsMinimized(false)}>
                    <Text style={TextStyles.simpleText}>{exerciseName}</Text>
                    <Text style={TextStyles.simpleText}>Série {currentSet}/{totalSets}</Text>
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
    setContainer: {
        backgroundColor: '#fff',
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingRight: 10,
        paddingLeft: 0,
        marginVertical: 5,
        width: '100%',
    },
    setNumberIconContainer: {
        width: 80,
        height: 80,
        position: 'relative',
        marginRight: 20,
    },
    setNumberIcon: {
        width: 80,
        height: 80,
        backgroundColor: '#F2F0F5',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    setNumberIconText: {
        fontSize: 16,
        color: '#141217',
        fontFamily: 'PlusJakartaSans_700Bold',
    },
    setDetailsContainer: {
        flexDirection: 'column',
        flex: 1,
    },
    setTitleText: {
        fontSize: 20,
        fontFamily: 'PlusJakartaSans_500Medium',
        color: '#141217',
        marginBottom: 12,
    },
    setStatusText: {
        fontSize: 17,
        fontFamily: 'PlusJakartaSans_300Light',
        color: '#756387',
    },
    checkIcon: {
        marginLeft: 10,
    },
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
    inputContainer: {
        marginBottom: 10,
    },
    controlContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 15,
        marginBottom: 15,
    },
    controlButton: {
        marginHorizontal: 20,
        alignItems: 'center',
    },
});

export default WorkoutSessionScreen;
