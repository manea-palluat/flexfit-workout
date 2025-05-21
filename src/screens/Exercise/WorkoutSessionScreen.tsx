// Ce fichier définit l'écran de la séance d'entraînement pour l'application FlexFit.
// Il inclut la gestion des timers, animations SVG, saisie utilisateur, notifications, sons et vibrations.
// L'écran permet de gérer une séance d'exercice avec plusieurs séries, et de valider les résultats de chaque série.

import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Animated,
    Easing,
    Modal,
    TextInput,
    Alert,
    AppState,
    TouchableWithoutFeedback,
    Keyboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { API, graphqlOperation, Auth } from 'aws-amplify';
import { createExerciseTracking } from '../../graphql/mutations';
import { v4 as uuidv4 } from 'uuid';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ButtonStyles } from '../../styles/ButtonStyles';
import { TextInputStyles } from '../../styles/TextInputStyles';
import { TextStyles } from '../../styles/TextStyles';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import Svg, { Rect, Circle } from 'react-native-svg';
import { loadSettingsFromFile, saveSettingsToFile } from '../../utils/settingsStorage';

// --- Configuration des notifications ---
// Définit le comportement des notifications affichées par l'application.
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

// --- Interfaces TypeScript ---
// Définit la structure des résultats d'une série (nombre de répétitions et poids)
export interface SetResult {
    reps?: number;
    weight?: number;
}

// Interface pour les propriétés du composant de séance d'entraînement.
export interface WorkoutSessionScreenProps {
    sessionData: {
        exerciseName: string;
        totalSets: number;
        plannedReps: number;
        restDuration: number;
        exerciseType?: string;
    };
    onComplete: (results: SetResult[]) => void;
    onClose?: () => void;
}

// --- Fonctions Utilitaires ---
// Formate une durée en secondes au format "minutes:secondes"
const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

// Valide l'entrée de répétitions : doit être un entier positif
const validateReps = (value: string): string => {
    if (!/^\d+$/.test(value)) return "Veuillez entrer un entier.";
    return "";
};

// Valide l'entrée de poids : vérifie que la valeur est correcte et que les décimales sont parmi 25, 5 ou 75
const validateWeight = (value: string): string => {
    if (value === "") return "Veuillez entrer un poids.";
    if (value.includes(",")) {
        const [intPart, decPart] = value.split(",");
        if (!["25", "5", "75"].includes(decPart)) return "Décimales : 25, 5, 75.";
    } else if (!/^\d+$/.test(value)) return "Entier requis.";
    return "";
};

// --- Custom Hook pour le Timer ---
// Ce hook gère le décompte du temps pour la phase de repos, et déclenche une action à la fin du timer.
const useTimer = (
    initialDuration: number,
    phase: 'work' | 'rest' | 'paused',
    onComplete: () => void,
    isPaused: boolean
) => {
    const [timeLeft, setTimeLeft] = useState(initialDuration);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const remainingTimeRef = useRef<number>(initialDuration);

    // Démarre le timer en utilisant setInterval, calcule le temps restant et appelle onComplete si terminé.
    const startTimer = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);

        const targetTime = Date.now() + remainingTimeRef.current * 1000;

        intervalRef.current = setInterval(() => {
            const now = Date.now();
            const remaining = Math.max(Math.ceil((targetTime - now) / 1000), 0);
            setTimeLeft(remaining);
            remainingTimeRef.current = remaining;
            if (remaining === 0) {
                clearInterval(intervalRef.current!);
                intervalRef.current = null;
                onComplete();
            }
        }, 1000);
    }, [onComplete]);

    // Arrête le timer en nettoyant l'intervalle si nécessaire.
    const stopTimer = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    // Effet de contrôle du timer en fonction de la phase et de l'état de pause.
    useEffect(() => {
        console.log('useTimer: phase=', phase, 'isPaused=', isPaused, 'timeLeft=', timeLeft, 'intervalRef.current=', !!intervalRef.current);

        if (phase !== 'rest') {
            stopTimer();
            return;
        }

        if (isPaused) {
            stopTimer();
        } else if (!intervalRef.current && timeLeft > 0) {
            startTimer();
        }

        return () => {
            stopTimer();
        };
    }, [phase, isPaused, startTimer, stopTimer]);

    // Permet de réinitialiser le timer avec une nouvelle durée éventuellement différente.
    const reset = useCallback((newDuration?: number) => {
        const duration = newDuration || initialDuration;
        setTimeLeft(duration);
        remainingTimeRef.current = duration;
        stopTimer();
    }, [initialDuration, stopTimer]);

    return { timeLeft, reset };
};

// --- Composant Animé SVG pour les bordures ---
// Ce composant utilise une animation pour créer un effet de bordure animée autour d'un élément.
const AnimatedRect = Animated.createAnimatedComponent(Rect);
interface AnimatedBorderProps { size: number; borderRadius: number; strokeWidth: number; }
const AnimatedBorder = memo<AnimatedBorderProps>(({ size, borderRadius, strokeWidth }) => {
    // Calcul de la longueur des segments droits et courbes pour définir le motif de trait
    const straightLength = (size - strokeWidth) * 4 - 8 * borderRadius;
    const curvedLength = 2 * Math.PI * borderRadius;
    const perimeter = straightLength + curvedLength;
    const dashLength = perimeter * 0.2;
    const gapLength = perimeter - dashLength;
    const dashPattern = `${dashLength},${gapLength}`;
    const dashOffsetAnim = useRef(new Animated.Value(0)).current;

    // Démarre une boucle animée qui déplace le motif de trait de la bordure
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
});

// --- Composant SetNumberIcon ---
// Affiche un icône de numéro de série avec une bordure animée si la série est active.
interface SetNumberIconProps { number: number; active?: boolean; }
const SetNumberIcon = memo<SetNumberIconProps>(({ number, active }) => (
    <View style={styles.setNumberIconContainer}>
        <View style={styles.setNumberIcon}>
            <Text style={styles.setNumberIconText}>{number}</Text>
        </View>
        {active && <AnimatedBorder size={70} borderRadius={20} strokeWidth={3} />}
    </View>
));

// --- Composant WorkoutInputField ---
// Champ de saisie pour les données de la série (répétitions et poids) avec animation de "secousse" en cas d'erreur.
interface WorkoutInputFieldProps {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    onBlur?: () => void;
    error?: string;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
    shake: () => void;
}
const WorkoutInputField = memo<WorkoutInputFieldProps>(({ label, value, onChangeText, onBlur, error, keyboardType = 'default', shake }) => {
    const shakeAnim = useRef(new Animated.Value(0)).current;

    // Fonction déclenchant une animation de secousse pour attirer l'attention sur l'erreur
    const triggerShake = () => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    };

    // Lancer l'animation de secousse si une erreur est présente
    useEffect(() => {
        if (error) triggerShake();
    }, [error]);

    // Met à jour la fonction de "secousse" externe pour qu'elle déclenche le triggerShake
    useEffect(() => {
        shake = triggerShake;
    }, [shake]);

    return (
        <Animated.View style={[TextInputStyles.container, styles.inputContainer, { transform: [{ translateX: shakeAnim }] }]}>
            <TextInput
                placeholder={label}
                placeholderTextColor="#999"
                value={value}
                onChangeText={onChangeText}
                onBlur={onBlur}
                style={[TextInputStyles.input, error && { borderColor: 'red' }, { textAlign: 'center' }]}
                keyboardType={keyboardType}
                accessibilityLabel={label}
            />
            {error ? <Text style={TextInputStyles.errorText}>{error}</Text> : null}
        </Animated.View>
    );
});

// --- Axolotl SVG Animation ---
// Animation amusante d'un axolotl (ou élément graphique similaire) qui rebondit pour motiver l'utilisateur.
const AxolotlAnimation = memo(({ isPaused }: { isPaused: boolean }) => {
    const bounceAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!isPaused) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(bounceAnim, { toValue: 10, duration: 500, useNativeDriver: true }),
                    Animated.timing(bounceAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
                ])
            ).start();
        } else {
            bounceAnim.stopAnimation();
            bounceAnim.setValue(0);
        }
    }, [isPaused]);

    return (
        <Animated.View style={{ transform: [{ translateY: bounceAnim }], marginVertical: 20 }}>
            <Svg width={50} height={50}>
                <Circle cx="25" cy="25" r="20" fill="#b21ae5" />
                <Circle cx="18" cy="20" r="5" fill="white" />
                <Circle cx="32" cy="20" r="5" fill="white" />
            </Svg>
            <Text style={styles.axolotlText}>{isPaused ? "Petite pause !" : "Au boulot !"}</Text>
        </Animated.View>
    );
});

// --- Composant Principal: WorkoutSessionScreen ---
// Ce composant gère l'ensemble de la logique de la séance d'entraînement,
// y compris le démarrage, la gestion des séries, les pauses, les timers, les notifications, et la validation des données.
const WorkoutSessionScreen: React.FC<WorkoutSessionScreenProps> = ({ sessionData, onComplete, onClose }) => {
    // Vérifie si les paramètres de session sont fournis
    if (!sessionData) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Erreur: Les paramètres de session sont manquants.</Text>
            </View>
        );
    }

    const navigation = useNavigation();
    const { exerciseName, totalSets, plannedReps, restDuration: initialRestDuration } = sessionData;
    const exerciseType = sessionData.exerciseType?.toLowerCase() === 'bodyweight' ? 'bodyweight' : 'normal';

    // --- États de gestion de la séance ---
    // hasStarted: si l'exercice a démarré
    // currentSet: numéro de la série en cours
    // phase: peut être 'work', 'rest' ou 'paused'
    // restDuration: durée du repos entre séries
    // isPaused: état de pause du timer
    // results: stocke les résultats de chaque série
    // isEditingModalVisible: contrôle l'affichage du modal de saisie
    // editingSetIndex: index de la série en cours de modification
    // tempReps, tempWeight: valeurs temporaires pour la saisie
    // repsError, weightError: messages d'erreur pour la validation
    // soundsEnabled, hapticsEnabled: préférences pour audio et vibrations
    const [hasStarted, setHasStarted] = useState(false);
    const [currentSet, setCurrentSet] = useState(1);
    const [phase, setPhase] = useState<'work' | 'rest' | 'paused'>('work');
    const [restDuration, setRestDuration] = useState(initialRestDuration);
    const [isPaused, setIsPaused] = useState(false);
    const [results, setResults] = useState<SetResult[]>(Array(totalSets).fill({}));
    const [isEditingModalVisible, setIsEditingModalVisible] = useState(false);
    const [editingSetIndex, setEditingSetIndex] = useState(0);
    const [tempReps, setTempReps] = useState('');
    const [tempWeight, setTempWeight] = useState('');
    const [repsError, setRepsError] = useState('');
    const [weightError, setWeightError] = useState('');
    const [soundsEnabled, setSoundsEnabled] = useState(true);
    const [hapticsEnabled, setHapticsEnabled] = useState(true);

    // Références pour déclencher l'animation de secousse sur les inputs en cas d'erreur
    const repsInputShakeRef = useRef<() => void>(() => { });
    const weightInputShakeRef = useRef<() => void>(() => { });

    // --- Gestion de la fin de la phase de repos ---
    // Lorsque le repos est terminé, on repasse en phase "work" ou on termine la séance.
    const handleRestComplete = useCallback(() => {
        setPhase('work');
        resetTimer();
        if (currentSet < totalSets) setCurrentSet((prev) => prev + 1);
        else finishSession();
    }, [currentSet, totalSets, restDuration]);

    // --- Timer ---
    // Utilise le hook useTimer pour gérer le décompte du temps de repos.
    const { timeLeft, reset: resetTimer } = useTimer(restDuration, phase, handleRestComplete, isPaused);

    // --- Sons ---
    // Charge les fichiers audio pour le compte à rebours et le sifflet, puis configure le mode audio.
    const [countdownSound, setCountdownSound] = useState<Audio.Sound | null>(null);
    const [whistleSound, setWhistleSound] = useState<Audio.Sound | null>(null);

    useEffect(() => {
        const loadSounds = async () => {
            const { sound: loadedCountdown } = await Audio.Sound.createAsync(require('../../assets/sounds/beep.mp3'));
            setCountdownSound(loadedCountdown);
            const { sound: loadedWhistle } = await Audio.Sound.createAsync(require('../../assets/sounds/whistle.mp3'));
            setWhistleSound(loadedWhistle);
        };
        loadSounds();
        Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: true });
        return () => {
            countdownSound?.unloadAsync();
            whistleSound?.unloadAsync();
        };
    }, []);

    // --- Chargement des paramètres utilisateur --- 
    // Récupère les préférences pour l'audio et les vibrations depuis le stockage local.
    useEffect(() => {
        const loadSettings = async () => {
            const settings = await loadSettingsFromFile();
            setSoundsEnabled(settings.audioEnabled);
            setHapticsEnabled(settings.hapticsEnabled);
        };
        loadSettings();
    }, []);

    // Permet de basculer l'état du son et de sauvegarder la préférence.
    const toggleSound = async () => {
        const newVal = !soundsEnabled;
        setSoundsEnabled(newVal);
        await saveSettingsToFile({ ...(await loadSettingsFromFile()), audioEnabled: newVal });
    };

    // Permet de basculer l'état des vibrations et de sauvegarder la préférence.
    const toggleHaptics = async () => {
        const newVal = !hapticsEnabled;
        setHapticsEnabled(newVal);
        await saveSettingsToFile({ ...(await loadSettingsFromFile()), hapticsEnabled: newVal });
    };

    // --- Animation de progression --- 
    // Utilise une valeur animée pour afficher la barre de progression du timer.
    const progressAnim = useRef(new Animated.Value(restDuration)).current;
    useEffect(() => {
        Animated.timing(progressAnim, {
            toValue: timeLeft,
            duration: 500,
            easing: Easing.linear,
            useNativeDriver: false,
        }).start();
    }, [timeLeft]);

    // Détermine si la dernière série est complétée pour gérer l'affichage des boutons.
    const lastSetCompleted: boolean = currentSet === totalSets && !!results[currentSet - 1]?.reps && (exerciseType === 'bodyweight' || !!results[currentSet - 1]?.weight);

    // --- Gestion des effets du timer (sons, vibrations et notifications) ---
    useEffect(() => {
        if (phase !== 'rest' || isPaused) return;

        // Fonction pour déclencher des sons et vibrations lorsque le temps est presque écoulé.
        const handleTimerEffects = async () => {
            if (timeLeft <= 3 && timeLeft > 0) {
                if (soundsEnabled && countdownSound) await countdownSound.replayAsync();
                if (hapticsEnabled) await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            if (timeLeft === 0 && soundsEnabled && whistleSound) await whistleSound.replayAsync();
        };
        handleTimerEffects();

        // Planifie une notification pour signaler la fin du repos et le début de la prochaine série.
        const scheduleNotification = async () => {
            await Notifications.cancelAllScheduledNotificationsAsync();
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: "Au boulot !",
                    body: `Série ${currentSet + 1} de ${exerciseName}`,
                    sound: true,
                },
                trigger: {
                    type: 'timeInterval',
                    seconds: restDuration,
                    repeats: false,
                } as Notifications.TimeIntervalTriggerInput,
            });
        };
        scheduleNotification();

        return () => {
            Notifications.cancelAllScheduledNotificationsAsync();
        };
    }, [phase, timeLeft, soundsEnabled, hapticsEnabled, currentSet, exerciseName, restDuration, countdownSound, whistleSound]);

    // Supprime les notifications programmées lorsque l'application redevient active.
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (state) => {
            if (state === 'active') Notifications.cancelAllScheduledNotificationsAsync();
        });
        return () => subscription.remove();
    }, []);

    // --- Logique de transition entre les phases et validation des séries ---
    // Termine la série actuelle et passe à la phase de repos, ou ouvre le modal d'édition pour saisir les données.
    const finishCurrentSet = () => {
        if (currentSet === totalSets && !results[currentSet - 1]?.reps) openEditModal();
        else {
            setPhase('rest');
            resetTimer();
            setTimeout(openEditModal, 500);
        }
    };

    // Ouvre le modal pour saisir ou modifier les données de la série en cours.
    const openEditModal = () => {
        setEditingSetIndex(currentSet - 1);
        setTempReps('');
        setTempWeight('');
        setRepsError('');
        setWeightError('');
        setIsEditingModalVisible(true);
    };

    // Valide et sauvegarde les données saisies pour une série.
    const saveSetData = () => {
        const repsErr = validateReps(tempReps);
        const weightErr = exerciseType !== 'bodyweight' ? validateWeight(tempWeight) : '';
        setRepsError(repsErr);
        setWeightError(weightErr);

        if (repsErr || weightErr) {
            if (repsErr) repsInputShakeRef.current();
            if (weightErr) weightInputShakeRef.current();
            return;
        }

        const updated = [...results];
        updated[editingSetIndex] = exerciseType !== 'bodyweight'
            ? { reps: parseInt(tempReps), weight: parseFloat(tempWeight.replace(',', '.')) }
            : { reps: parseInt(tempReps) };
        setResults(updated);
        setIsEditingModalVisible(false);
    };

    // Termine la séance en sauvegardant les résultats via GraphQL et en naviguant hors de l'écran.
    const finishSession = async () => {
        const validResults = results.filter((set) => set.reps && (exerciseType === 'bodyweight' || set.weight));
        try {
            const user = await Auth.currentAuthenticatedUser();
            const trackingInput = {
                id: uuidv4(),
                userId: user.attributes.sub,
                exerciseId: '',
                exerciseName,
                date: new Date().toISOString(),
                setsData: JSON.stringify(validResults),
            };
            await API.graphql(graphqlOperation(createExerciseTracking, { input: trackingInput }));
        } catch (error) {
            Alert.alert("Erreur", "Impossible de sauvegarder la séance. Réessayez plus tard.");
            console.error(error);
        }
        onComplete(validResults);
        if (onClose) onClose();
        else navigation.goBack();
    };

    // Permet de passer directement la phase de repos.
    const skipRest = () => {
        Notifications.cancelAllScheduledNotificationsAsync();
        setPhase('work');
        resetTimer();
        if (currentSet < totalSets) setCurrentSet((prev) => prev + 1);
        else finishSession();
    };

    // Bascule entre la pause et la reprise du timer.
    const togglePause = () => {
        setIsPaused((prev) => !prev);
        if (!isPaused) Notifications.cancelAllScheduledNotificationsAsync();
    };

    // Revient à l'état précédent (soit de travail à repos, soit ajuste le timer ou le numéro de série).
    const goToPreviousState = () => {
        if (phase === 'work') {
            setPhase('rest');
            resetTimer();
        } else if (phase === 'rest') {
            if (timeLeft > restDuration - 3 && currentSet > 1) {
                setCurrentSet((prev) => prev - 1);
                setPhase('work');
            } else {
                resetTimer();
            }
        }
    };

    // Passe à l'état suivant en incrémentant le numéro de série ou en changeant la phase.
    const goToNextState = () => {
        if (phase === 'work' && currentSet < totalSets) {
            setCurrentSet((prev) => prev + 1);
        } else if (phase === 'rest' && currentSet < totalSets) {
            setPhase('work');
            resetTimer();
            setCurrentSet((prev) => prev + 1);
        }
    };

    // Permet d'abandonner l'exercice en proposant de sauvegarder ou de supprimer la session.
    const abandonExercise = () => {
        const validResults = results.filter((set) => set.reps && (exerciseType === 'bodyweight' || set.weight));
        if (validResults.length === 0) {
            Alert.alert(
                "Abandonner",
                "Aucune série complétée. Voulez-vous quitter ?",
                [
                    { text: "Annuler", style: "cancel" },
                    { text: "Quitter", style: "destructive", onPress: deleteSession },
                ]
            );
        } else {
            Alert.alert(
                "Abandonner",
                `Séries complétées : ${validResults.length}/${totalSets}. Sauvegarder ou supprimer ?`,
                [
                    { text: "Annuler", style: "cancel" },
                    { text: "Sauvegarder", onPress: finishSession },
                    { text: "Supprimer", style: "destructive", onPress: deleteSession },
                ]
            );
        }
    };

    // Supprime la session et revient en arrière.
    const deleteSession = () => {
        Notifications.cancelAllScheduledNotificationsAsync();
        onComplete([]);
        if (onClose) onClose();
        else navigation.goBack();
    };

    // Annule l'exercice avant son démarrage.
    const cancelPreStartExercise = () => {
        Notifications.cancelAllScheduledNotificationsAsync();
        if (onClose) onClose();
        else navigation.goBack();
    };

    // --- Rendu des cartes de séries --- 
    // Affiche la liste des séries avec leur statut (Terminé, En cours, À venir).
    const renderSetCards = (mode: 'pre' | 'active' | 'rest') => {
        const lastSetCompleted: boolean = currentSet === totalSets && !!results[currentSet - 1]?.reps && (exerciseType === 'bodyweight' || !!results[currentSet - 1]?.weight);
        return Array.from({ length: totalSets }).map((_, index) => {
            const status = results[index]?.reps && (exerciseType === 'bodyweight' || results[index]?.weight)
                ? `Terminé : ${results[index].reps}${exerciseType !== 'bodyweight' ? ` x ${results[index].weight} kg` : ''}`
                : (mode !== 'pre' && index === currentSet - 1 ? 'En cours' : 'À venir');
            return (
                <TouchableOpacity
                    key={index}
                    style={styles.setContainer}
                    onPress={() => {
                        if (results[index]?.reps) {
                            setEditingSetIndex(index);
                            setTempReps(results[index].reps?.toString() || '');
                            setTempWeight(results[index].weight?.toString() || '');
                            setIsEditingModalVisible(true);
                        }
                    }}
                    accessibilityLabel={`Série ${index + 1}: ${status}`}
                >
                    <SetNumberIcon number={index + 1} active={hasStarted && index === currentSet - 1 && !lastSetCompleted} />
                    <View style={styles.setDetailsContainer}>
                        <Text style={styles.setTitleText}>{`Série ${index + 1}`}</Text>
                        <Text style={styles.setStatusText}>{status}</Text>
                    </View>
                    {results[index]?.reps && <Ionicons name="checkmark-circle" size={24} color="#b21ae5" style={styles.checkIcon} />}
                </TouchableOpacity>
            );
        });
    };

    // Détermine la largeur de la barre de progression en fonction du temps restant.
    const progressBarWidth = progressAnim.interpolate({
        inputRange: [0, restDuration],
        outputRange: ['0%', '100%'],
        extrapolate: 'clamp',
    });

    return (
        <View style={styles.fullScreenContainer}>
            <ScrollView contentContainerStyle={[styles.contentContainer, { paddingBottom: 100 }]}>
                {/* Titre de l'exercice */}
                <Text style={[TextStyles.title, { textAlign: 'center', marginBottom: 10 }]}>{exerciseName}</Text>

                {/* Affichage avant le démarrage de l'exercice */}
                {!hasStarted ? (
                    <>
                        <Text style={[TextStyles.subTitle, { textAlign: 'center', marginBottom: 20 }]}>Prêt ?</Text>
                        <View style={styles.seriesListContainer}>{renderSetCards('pre')}</View>
                        <TouchableOpacity style={ButtonStyles.primaryContainer} onPress={() => setHasStarted(true)} accessibilityLabel="Démarrer l'exercice">
                            <Text style={ButtonStyles.primaryText}>Démarrer l'exercice</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={ButtonStyles.invertedContainer} onPress={cancelPreStartExercise} accessibilityLabel="Annuler l'exercice">
                            <Text style={ButtonStyles.invertedText}>Annuler l'exercice</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        {/* Affichage en phase de travail */}
                        {phase === 'work' ? (
                            <>
                                <Text style={[TextStyles.subTitle, { textAlign: 'center', marginBottom: 20 }]}>{plannedReps} reps</Text>
                                <AxolotlAnimation isPaused={isPaused} />
                                <View style={styles.seriesListContainer}>{renderSetCards('active')}</View>
                                <TouchableOpacity
                                    style={ButtonStyles.primaryContainer}
                                    onPress={lastSetCompleted ? finishSession : finishCurrentSet}
                                    accessibilityLabel={lastSetCompleted ? "Terminer l'exercice" : "Série terminée"}
                                >
                                    <Text style={ButtonStyles.primaryText}>{lastSetCompleted ? "Terminer l'exercice" : "Série terminée"}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={ButtonStyles.invertedContainer} onPress={abandonExercise} accessibilityLabel="Arrêter l'exercice">
                                    <Text style={ButtonStyles.invertedText}>Arrêter l'exercice</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                {/* Affichage en phase de repos */}
                                <View style={styles.progressWrapper}>
                                    <Text style={TextStyles.simpleText}>{isPaused ? 'En pause' : 'Repos'}</Text>
                                    <View style={styles.progressContainer}>
                                        <Animated.View style={[styles.progressBar, { width: progressBarWidth }]} />
                                    </View>
                                    <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
                                </View>
                                <View style={styles.seriesListContainer}>{renderSetCards('rest')}</View>
                                <TouchableOpacity style={ButtonStyles.primaryContainer} onPress={skipRest} accessibilityLabel="Passer le repos">
                                    <Text style={ButtonStyles.primaryText}>Passer le repos</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={ButtonStyles.invertedContainer} onPress={abandonExercise} accessibilityLabel="Arrêter l'exercice">
                                    <Text style={ButtonStyles.invertedText}>Arrêter l'exercice</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </>
                )}
                {/* Contrôles audio et vibrations */}
                <View style={styles.controlContainer}>
                    <TouchableOpacity style={styles.controlButton} onPress={toggleSound} accessibilityLabel={soundsEnabled ? "Désactiver le son" : "Activer le son"}>
                        <Ionicons name={soundsEnabled ? 'volume-high' : 'volume-mute'} size={30} color="#b21ae5" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.controlButton} onPress={toggleHaptics} accessibilityLabel={hapticsEnabled ? "Désactiver les vibrations" : "Activer les vibrations"}>
                        <MaterialCommunityIcons name={hapticsEnabled ? 'vibrate' : 'vibrate-off'} size={30} color="#b21ae5" />
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Boutons fixes en bas de l'écran pour la navigation entre états */}
            {hasStarted && (
                <View style={styles.fixedControlButtonsContainer}>
                    <TouchableOpacity
                        style={styles.controlButtonIcon}
                        onPress={goToPreviousState}
                        disabled={currentSet === 1}
                        accessibilityLabel="État précédent"
                    >
                        <Ionicons name="chevron-back" size={24} color={currentSet === 1 ? "#ccc" : "#b21ae5"} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.pausePlayButton}
                        onPress={togglePause}
                        accessibilityLabel={isPaused ? "Reprendre" : "Pause"}
                    >
                        <Ionicons
                            name={isPaused ? "play" : "pause"}
                            size={20}
                            color="#fff"
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.controlButtonIcon}
                        onPress={goToNextState}
                        disabled={lastSetCompleted}
                        accessibilityLabel="État suivant"
                    >
                        <Ionicons name="chevron-forward" size={24} color={lastSetCompleted ? "#ccc" : "#b21ae5"} />
                    </TouchableOpacity>
                </View>
            )}

            {/* Modal de saisie pour modifier ou entrer les données d'une série */}
            <Modal visible={isEditingModalVisible} transparent animationType="slide">
                <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContainer}>
                            <Text style={[TextStyles.subTitle, { marginBottom: 20 }]}>
                                {results[editingSetIndex]?.reps
                                    ? `Modifie les données de ta série ${editingSetIndex + 1} comme un pro !`
                                    : `Entre les données de ta série ${editingSetIndex + 1} comme un pro !`}
                            </Text>

                            {/* Saisie des répétitions avec boutons d'ajustement et possibilité de copier depuis la série précédente */}
                            <View style={styles.inputRow}>
                                <TouchableOpacity
                                    style={styles.adjustButton}
                                    onPress={() => setTempReps(Math.max(0, parseInt(tempReps || '0') - 1).toString())}
                                    accessibilityLabel="Retirer 1 répétition"
                                >
                                    <Text style={styles.adjustButtonText}>-</Text>
                                </TouchableOpacity>
                                <WorkoutInputField
                                    label="Répétitions"
                                    value={tempReps}
                                    onChangeText={setTempReps}
                                    onBlur={() => setRepsError(validateReps(tempReps))}
                                    error={repsError}
                                    keyboardType="numeric"
                                    shake={repsInputShakeRef.current}
                                />
                                <TouchableOpacity
                                    style={styles.adjustButton}
                                    onPress={() => setTempReps((parseInt(tempReps || '0') + 1).toString())}
                                    accessibilityLabel="Ajouter 1 répétition"
                                >
                                    <Text style={styles.adjustButtonText}>+</Text>
                                </TouchableOpacity>
                                {editingSetIndex > 0 && results[editingSetIndex - 1]?.reps && (
                                    <TouchableOpacity
                                        style={styles.historyButton}
                                        onPress={() => setTempReps(results[editingSetIndex - 1].reps!.toString())}
                                        accessibilityLabel="Copier les répétitions de la série précédente"
                                    >
                                        <Ionicons name="time-outline" size={20} color="#b21ae5" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Saisie du poids avec boutons d'ajustement et possibilité de copier depuis la série précédente */}
                            {exerciseType !== 'bodyweight' && (
                                <View style={styles.inputRow}>
                                    <TouchableOpacity
                                        style={styles.adjustButton}
                                        onPress={() => {
                                            const currentWeight = parseFloat(tempWeight.replace(',', '.') || '0');
                                            const newWeight = Math.max(0, currentWeight - 2.5);
                                            setTempWeight(newWeight % 1 === 0 ? newWeight.toString() : newWeight.toString().replace('.', ','));
                                        }}
                                        accessibilityLabel="Retirer 2,5 kg"
                                    >
                                        <Text style={styles.adjustButtonText}>-</Text>
                                    </TouchableOpacity>
                                    <WorkoutInputField
                                        label="Poids (kg)"
                                        value={tempWeight}
                                        onChangeText={setTempWeight}
                                        onBlur={() => setWeightError(validateWeight(tempWeight))}
                                        error={weightError}
                                        keyboardType="numeric"
                                        shake={weightInputShakeRef.current}
                                    />
                                    <TouchableOpacity
                                        style={styles.adjustButton}
                                        onPress={() => {
                                            const currentWeight = parseFloat(tempWeight.replace(',', '.') || '0');
                                            const newWeight = currentWeight + 2.5;
                                            setTempWeight(newWeight % 1 === 0 ? newWeight.toString() : newWeight.toString().replace('.', ','));
                                        }}
                                        accessibilityLabel="Ajouter 2,5 kg"
                                    >
                                        <Text style={styles.adjustButtonText}>+</Text>
                                    </TouchableOpacity>
                                    {editingSetIndex > 0 && results[editingSetIndex - 1]?.weight && (
                                        <TouchableOpacity
                                            style={styles.historyButton}
                                            onPress={() => setTempWeight(results[editingSetIndex - 1].weight!.toString())}
                                            accessibilityLabel="Copier le poids de la série précédente"
                                        >
                                            <Ionicons name="time-outline" size={20} color="#b21ae5" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}

                            {/* Bouton d'enregistrement des données de la série */}
                            <TouchableOpacity style={ButtonStyles.primaryContainer} onPress={saveSetData} accessibilityLabel="Enregistrer la série">
                                <Text style={ButtonStyles.primaryText}>Enregistrer</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
};

export default WorkoutSessionScreen;

// --- Styles associés à l'écran de la séance d'entraînement ---
// Définition des styles pour chaque composant et vue utilisée dans l'écran.
const styles = StyleSheet.create({
    fullScreenContainer: { flex: 1, backgroundColor: '#fff' },
    contentContainer: { flexGrow: 1, alignItems: 'center', paddingVertical: 20, paddingHorizontal: 20 },
    setContainer: { backgroundColor: '#fff', borderRadius: 10, flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingRight: 10, paddingLeft: 0, marginVertical: 5, width: '100%' },
    setNumberIconContainer: { width: 70, height: 70, position: 'relative', marginRight: 20 },
    setNumberIcon: { width: 70, height: 70, backgroundColor: '#F2F0F5', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    setNumberIconText: { fontSize: 16, color: '#141217', fontFamily: 'PlusJakartaSans_700Bold' },
    setDetailsContainer: { flexDirection: 'column', flex: 1 },
    setTitleText: { fontSize: 18, fontFamily: 'PlusJakartaSans_500Medium', color: '#141217', marginBottom: 8 },
    setStatusText: { fontSize: 16, fontFamily: 'PlusJakartaSans_300Light', color: '#756387' },
    checkIcon: { marginLeft: 10 },
    progressWrapper: { width: '100%', alignSelf: 'center', marginBottom: 20 },
    progressContainer: { width: '100%', height: 8, backgroundColor: '#e0dce5', borderRadius: 6, overflow: 'hidden', marginVertical: 10 },
    progressBar: { height: '100%', backgroundColor: '#141118' },
    timerText: { fontSize: 16, color: '#141118', marginTop: 5, alignSelf: 'flex-start' },
    seriesListContainer: { width: '100%', marginVertical: 20 },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
    errorText: { fontSize: 18, color: 'red', textAlign: 'center' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContainer: { width: '90%', backgroundColor: '#fff', borderRadius: 8, padding: 20, alignItems: 'center' },
    inputContainer: { width: 120, marginHorizontal: 10 },
    controlContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 15, marginBottom: 15 },
    controlButton: { marginHorizontal: 20, alignItems: 'center' },
    axolotlText: { textAlign: 'center', color: '#b21ae5', fontSize: 16 },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
        width: '100%',
    },
    adjustButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#b21ae5',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 10,
    },
    adjustButtonText: {
        fontSize: 20,
        color: '#ffffff',
        lineHeight: 40,
    },
    historyButton: {
        marginLeft: 10,
    },
    fixedControlButtonsContainer: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
        paddingVertical: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },
    controlButtonIcon: {
        padding: 5,
    },
    pausePlayButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#b21ae5',
        justifyContent: 'center',
        alignItems: 'center',
    },
});