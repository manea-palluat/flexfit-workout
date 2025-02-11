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
import { Ionicons } from '@expo/vector-icons';
import { ButtonStyles } from '../styles/ButtonStyles';
import { TextInputStyles } from '../styles/TextInputStyles';
import { TextStyles } from '../styles/TextStyles';

// MODIF: We no longer need a gradient so we import only Rect from react-native-svg.
import Svg, { Rect } from 'react-native-svg';

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

/* ======================================================================
   AnimatedBorder Component
   This component creates an animated dashed border with a solid stroke.
   MODIF: The stroke is now "#b21ae5" (the same purple as the buttons),
   and no gradient/fade effect is used.
====================================================================== */
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
    // Calculate the perimeter (ignoring rounded corners)
    const perimeter = (size - strokeWidth) * 4;
    const dashLength = size * 0.5; // adjust if needed
    const gapLength = perimeter - dashLength;

    const dashOffsetAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(dashOffsetAnim, {
                toValue: perimeter,
                duration: 2000,
                easing: Easing.linear,
                useNativeDriver: false,
            })
        ).start();
    }, [perimeter]);

    return (
        <Svg
            width={size}
            height={size}
            style={{ position: 'absolute', top: 0, left: 0 }}
        >
            <AnimatedRect
                x={strokeWidth / 2}
                y={strokeWidth / 2}
                width={size - strokeWidth}
                height={size - strokeWidth}
                rx={borderRadius}
                ry={borderRadius}
                fill="none"
                stroke="#b21ae5"  // MODIF: Solid stroke using the button purple
                strokeWidth={strokeWidth}
                strokeDasharray={`${dashLength},${gapLength}`}
                strokeDashoffset={dashOffsetAnim}
            />
        </Svg>
    );
};

/* ======================================================================
   SetNumberIcon Component
   MODIF: Added an optional "active" prop and a container for proper positioning.
   The active animated border appears only when active is true.
====================================================================== */
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
            {active && (
                <AnimatedBorder size={80} borderRadius={20} strokeWidth={3} />
            )}
        </View>
    );
};

/* ======================================================================
   WorkoutInputField Component (unchanged)
====================================================================== */
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

    // Session state
    const [hasStarted, setHasStarted] = useState<boolean>(false);
    const [currentSet, setCurrentSet] = useState<number>(1);
    const [phase, setPhase] = useState<'work' | 'rest'>('work');
    const [targetTime, setTargetTime] = useState<number>(
        Date.now() + restDuration * 1000
    );
    const [timer, setTimer] = useState<number>(restDuration);
    const [results, setResults] = useState<SetResult[]>(Array(totalSets).fill({}));
    const [isEditingModalVisible, setIsEditingModalVisible] = useState<boolean>(false);
    const [editingSetIndex, setEditingSetIndex] = useState<number>(0);
    const [tempReps, setTempReps] = useState<string>('');
    const [tempWeight, setTempWeight] = useState<string>('');
    const [isMinimized, setIsMinimized] = useState<boolean>(false);
    // Error states for the modal
    const [repsError, setRepsError] = useState<string>('');
    const [weightError, setWeightError] = useState<string>('');

    // Progress bar animation for rest period.
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
            setPhase('rest');
            setTargetTime(Date.now() + restDuration * 1000);
            setTimer(restDuration);
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
                exerciseId: '', // Reverted change: add exerciseId as empty string.
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

    // MODIF: Pass the "active" prop only if the exercise has started.
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
                            <SetNumberIcon
                                number={index + 1}
                                active={hasStarted && index === currentSet - 1}  // MODIF: Only show if hasStarted is true.
                            />
                            <View style={styles.setDetailsContainer}>
                                <Text style={styles.setTitleText}>{`Série ${index + 1}`}</Text>
                                <Text style={styles.setStatusText}>{status}</Text>
                            </View>
                            {results[index]?.reps && results[index]?.weight && (
                                <Ionicons
                                    name="checkmark-circle"
                                    size={24}
                                    color="#b21ae5"
                                    style={styles.checkIcon}
                                />
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

    if (isMinimized) {
        return (
            <TouchableOpacity
                style={styles.minimizedContainer}
                onPress={() => setIsMinimized(false)}
            >
                <Text style={TextStyles.simpleText}>{exerciseName}</Text>
                <Text style={TextStyles.simpleText}>Série {currentSet}/{totalSets}</Text>
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
                <Text style={[TextStyles.title, { textAlign: 'center', marginBottom: 10 }]}>
                    {exerciseName}
                </Text>

                {!hasStarted ? (
                    <>
                        <Text style={[TextStyles.subTitle, { textAlign: 'center', marginBottom: 20 }]}>
                            Prêt ?
                        </Text>
                        <View style={styles.seriesListContainer}>{renderSetCards('pre')}</View>
                        <TouchableOpacity
                            style={ButtonStyles.container}
                            onPress={() => setHasStarted(true)}
                        >
                            <Text style={ButtonStyles.text}>Démarrer l'exercice</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        {phase === 'work' ? (
                            <>
                                <Text style={[TextStyles.subTitle, { textAlign: 'center', marginBottom: 20 }]}>
                                    {plannedReps} reps
                                </Text>
                                <View style={styles.seriesListContainer}>{renderSetCards('active')}</View>
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
                            </>
                        )}
                        {(currentSet < totalSets ||
                            (currentSet === totalSets && !lastSetCompleted)) && (
                                <TouchableOpacity style={ButtonStyles.invertedContainer} onPress={abandonExercise}>
                                    <Text style={ButtonStyles.invertedText}>Abandonner l'exercice</Text>
                                </TouchableOpacity>
                            )}
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
                                    setRepsError("Veuillez entrer un entier.");
                                } else {
                                    setRepsError("");
                                }
                            }}
                            onBlur={() => {
                                if (!/^\d+$/.test(tempReps)) {
                                    setRepsError("Veuillez entrer un entier.");
                                } else {
                                    setRepsError("");
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
                                    setWeightError("Veuillez entrer un poids.");
                                } else if (text.includes(',')) {
                                    const parts = text.split(',');
                                    if (parts.length !== 2 || !['25', '5', '75'].includes(parts[1])) {
                                        setWeightError("Le poids doit être un entier ou suivi d'une virgule et de 25, 5 ou 75.");
                                    } else {
                                        setWeightError("");
                                    }
                                } else if (!/^\d+$/.test(text)) {
                                    setWeightError("Veuillez entrer un entier valide pour le poids.");
                                } else {
                                    setWeightError("");
                                }
                            }}
                            onBlur={() => {
                                if (tempWeight === '') {
                                    setWeightError("Veuillez entrer un poids.");
                                } else if (tempWeight.includes(',')) {
                                    const parts = tempWeight.split(',');
                                    if (parts.length !== 2 || !['25', '5', '75'].includes(parts[1])) {
                                        setWeightError("Le poids doit être un entier ou suivi d'une virgule et de 25, 5 ou 75.");
                                    } else {
                                        setWeightError("");
                                    }
                                } else if (!/^\d+$/.test(tempWeight)) {
                                    setWeightError("Veuillez entrer un entier valide pour le poids.");
                                } else {
                                    setWeightError("");
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
    // Style for the set card container.
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
    // Container for the set number icon and its animation (with added marginRight for spacing).
    setNumberIconContainer: {
        width: 80,
        height: 80,
        position: 'relative',
        marginRight: 20,
    },
    // Inner view for the square icon.
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
});

export default WorkoutSessionScreen;
