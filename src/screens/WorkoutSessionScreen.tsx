// src/screens/WorkoutSessionScreen.tsx
// IMPORT DES LIBS : on importe tout ce qu'il faut pour cet écran
import React, { useState, useEffect, useRef } from 'react'; // importe react et ses hooks
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
} from 'react-native'; // composants basiques de react-native
import { useNavigation } from '@react-navigation/native'; // navigation entre écrans
import { API, graphqlOperation, Auth } from 'aws-amplify'; // pour les appels API et l'authentification
import { createExerciseTracking } from '../graphql/mutations'; // mutation pour sauvegarder l'exo
import { v4 as uuidv4 } from 'uuid'; // générer des id uniques
import { Ionicons } from '@expo/vector-icons'; // icônes Ionicons
import { MaterialCommunityIcons } from '@expo/vector-icons'; // icônes Material Community
import { ButtonStyles } from '../styles/ButtonStyles'; // styles custom des boutons
import { TextInputStyles } from '../styles/TextInputStyles'; // styles custom des inputs
import { TextStyles } from '../styles/TextStyles'; // styles custom du texte
import { Audio } from 'expo-av'; // gestion du son
import * as Haptics from 'expo-haptics'; // vibrations haptics
import * as Notifications from 'expo-notifications'; // gestion des notifications
import Svg, { Rect } from 'react-native-svg'; // dessin SVG

// CONFIG NOTIFICATIONS : configuration des notif' pour qu'elles s'affichent bien
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true, // affiche l'alerte
        shouldPlaySound: true, // joue le son
        shouldSetBadge: false, // pas de badge
    }),
});

// ----------------------------------------------------------------------------
// INTERFACES & HELPER FUNCTIONS
//
export interface SetResult {
    reps?: number; // rép
    weight?: number; // poids
}

export interface WorkoutSessionScreenProps {
    sessionData: {
        exerciseName: string; // nom de l'exo
        totalSets: number; // nombre total de séries
        plannedReps: number; // répétitions prévues
        restDuration: number; // durée du repos (sec)
    };
    onComplete: (results: SetResult[]) => void; // callback quand l'exo est fini
    onClose?: () => void; // callback facultatif pour fermer l'écran
}

const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60); // calcule les minutes
    const secs = seconds % 60; // calcule les secondes restantes
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`; // retourne au format mm:ss
};

// ----------------------------------------------------------------------------
// ANIMATED BORDER COMPONENT
//
const AnimatedRect = Animated.createAnimatedComponent(Rect); // transforme Rect en composant animé

interface AnimatedBorderProps {
    size: number; // taille totale
    borderRadius: number; // arrondi
    strokeWidth: number; // épaisseur du trait
}

const AnimatedBorder: React.FC<AnimatedBorderProps> = ({
    size,
    borderRadius,
    strokeWidth,
}) => {
    const straightLength = (size - strokeWidth) * 4 - 8 * borderRadius; // longueur des segments droits
    const curvedLength = 2 * Math.PI * borderRadius; // longueur des coins arrondis
    const perimeter = straightLength + curvedLength; // périmètre total
    const dashLength = perimeter * 0.2; // longueur du tiret
    const gapLength = perimeter - dashLength; // longueur de l'espace
    const dashPattern = `${dashLength},${gapLength}`; // pattern tiret/espace
    const dashOffsetAnim = useRef(new Animated.Value(0)).current; // valeur d'animation pour le décalage

    useEffect(() => {
        // boucle l'animation pour créer l'effet de défilement
        Animated.loop(
            Animated.timing(dashOffsetAnim, {
                toValue: -perimeter, // fait défiler sur toute la longueur
                duration: 2000, // durée de l'animation
                easing: Easing.linear, // défilement constant
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
                rx={borderRadius} // arrondi horizontal
                ry={borderRadius} // arrondi vertical
                fill="none" // pas de remplissage
                stroke="#b21ae5" // couleur du trait
                strokeWidth={strokeWidth}
                strokeDasharray={dashPattern} // applique le pattern
                strokeDashoffset={dashOffsetAnim} // animation du décalage
                strokeLinecap="round" // extrémités arrondies
            />
        </Svg>
    );
};

// ----------------------------------------------------------------------------
// SETNUMBER ICON COMPONENT
//
interface SetNumberIconProps {
    number: number; // numéro de la série
    active?: boolean; // série active ou pas
}
const SetNumberIcon: React.FC<SetNumberIconProps> = ({ number, active }) => {
    return (
        <View style={styles.setNumberIconContainer}>
            <View style={styles.setNumberIcon}>
                <Text style={styles.setNumberIconText}>{number}</Text>
            </View>
            {active && <AnimatedBorder size={70} borderRadius={20} strokeWidth={3} />}
            // si active, on affiche la bordure animée
        </View>
    );
};

// ----------------------------------------------------------------------------
// WORKOUT INPUT FIELD COMPONENT
//
interface WorkoutInputFieldProps {
    label: string; // texte du placeholder
    value: string; // valeur actuelle
    onChangeText: (text: string) => void; // callback lors du changement
    onBlur?: () => void; // callback à la perte de focus
    error?: string; // message d'erreur éventuel
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad'; // type de clavier
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
                placeholder={label} // affiche le label
                placeholderTextColor="#999" // couleur du placeholder
                value={value}
                onChangeText={onChangeText}
                onBlur={onBlur}
                style={TextInputStyles.input}
                keyboardType={keyboardType}
            />
            {error ? <Text style={TextInputStyles.errorText}>{error}</Text> : null}
            // affiche l'erreur si besoin
        </View>
    );
};

// ----------------------------------------------------------------------------
// MAIN WORKOUTSESSIONSCREEN COMPONENT
//
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

    // déclaration des états
    const [hasStarted, setHasStarted] = useState<boolean>(false); // l'exo a démarré ou pas
    const [currentSet, setCurrentSet] = useState<number>(1); // série en cours
    const [phase, setPhase] = useState<'work' | 'rest'>('work'); // phase: travail ou repos
    const [targetTime, setTargetTime] = useState<number>(Date.now() + restDuration * 1000); // fin du repos en timestamp
    const [timer, setTimer] = useState<number>(restDuration); // timer en sec
    const [results, setResults] = useState<SetResult[]>(Array(totalSets).fill({})); // données des séries
    const [isEditingModalVisible, setIsEditingModalVisible] = useState<boolean>(false); // modal d'édition visible
    const [editingSetIndex, setEditingSetIndex] = useState<number>(0); // index de la série en modif
    const [tempReps, setTempReps] = useState<string>(''); // rép temporaires
    const [tempWeight, setTempWeight] = useState<string>(''); // poids temporaire
    const [isMinimized, setIsMinimized] = useState<boolean>(false); // vue minimisée ou pas
    const [repsError, setRepsError] = useState<string>(''); // erreur rép
    const [weightError, setWeightError] = useState<string>(''); // erreur poids

    // états des sons
    const [countdownSound, setCountdownSound] = useState<Audio.Sound | null>(null);
    const [whistleSound, setWhistleSound] = useState<Audio.Sound | null>(null);

    // contrôles sons et vibrations
    const [soundsEnabled, setSoundsEnabled] = useState<boolean>(true);
    const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(true);

    // suivi de l'état de l'app (foreground/background)
    const [appState, setAppState] = useState(AppState.currentState);

    // demande les permissions de notif' au montage
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

    // configure le mode audio
    useEffect(() => {
        Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
        });
    }, []);

    // chargement des sons pour le compte à rebours et le sifflet
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

    // BARRE DE PROGRESSION : animation de la barre pendant le repos
    const progressAnim = useRef(new Animated.Value(restDuration)).current;
    useEffect(() => {
        Animated.timing(progressAnim, {
            toValue: timer, // fait varier selon le timer
            duration: 500,
            easing: Easing.linear,
            useNativeDriver: false,
        }).start();
    }, [timer]);

    // TIMER DE REPOS AVEC NOTIF' : gère le timer et les notifications pendant le repos
    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | undefined;
        let notificationId: string | undefined;

        if (phase === 'rest') {
            // annule les notif' en cours et programme une nouvelle
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
                    handleRestComplete(); // fin du repos, on repasse en mode travail
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

    // écouteur AppState : annule les notif' quand l'app redevient active
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

    // fin du repos : on repasse en mode travail ou on termine la session
    const handleRestComplete = () => {
        setPhase('work');
        setTimer(restDuration);
        setTargetTime(Date.now() + restDuration * 1000);
        if (currentSet < totalSets) {
            setCurrentSet((prev) => prev + 1); // passe à la série suivante
        } else {
            finishSession(); // fin de l'exo
        }
    };

    // appelé quand l'utilisateur finit une série
    const finishCurrentSet = () => {
        if (currentSet === totalSets) {
            if (!(results[currentSet - 1]?.reps && results[currentSet - 1]?.weight)) {
                // dernière série pas encore validée : ouvre le modal
                setEditingSetIndex(currentSet - 1);
                setTempReps('');
                setTempWeight('');
                setRepsError('');
                setWeightError('');
                setIsEditingModalVisible(true);
            }
        } else {
            // passe en mode repos
            setPhase('rest');
            setTargetTime(Date.now() + restDuration * 1000);
            setTimer(restDuration);
            // la notif se programme via l'effet du timer, ouvre le modal après un petit délai
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

    // sauvegarde les données de la série
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

    // termine la session en sauvegardant si besoin
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

    // skipRest : annule la notif et repasse en mode travail
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

    // supprime la session et quitte sans sauvegarder
    const deleteSession = async () => {
        if (onComplete) onComplete([]); // passe un tableau vide
        if (onClose) {
            onClose();
        } else {
            navigation.goBack();
        }
    };

    // abandon de l'exo : propose de sauvegarder ou supprimer selon le progrès
    const abandonExercise = () => {
        const hasCompletedSet = results.some(set => set?.reps && set?.weight);

        if (!hasCompletedSet) {
            Alert.alert(
                "Abandonner l'exercice",
                "Vous n'avez pas encore réalisé la première série. Voulez-vous vraiment abandonner l'exercice ?",
                [
                    { text: "Annuler", style: "cancel" },
                    {
                        text: "Abandonner",
                        style: "destructive",
                        onPress: async () => {
                            await Notifications.cancelAllScheduledNotificationsAsync();
                            deleteSession();
                        },
                    },
                ]
            );
        } else {
            Alert.alert(
                "Abandonner l'exercice",
                "Voulez-vous sauvegarder la séance en cours ou supprimer toutes les données ?",
                [
                    { text: "Annuler", style: "cancel" },
                    {
                        text: "Sauvegarder",
                        onPress: async () => {
                            await Notifications.cancelAllScheduledNotificationsAsync();
                            finishSession();
                        },
                    },
                    {
                        text: "Supprimer",
                        style: "destructive",
                        onPress: async () => {
                            await Notifications.cancelAllScheduledNotificationsAsync();
                            deleteSession();
                        },
                    },
                ]
            );
        }
    };

    // annule l'exo en pré-démarrage
    const cancelPreStartExercise = async () => {
        await Notifications.cancelAllScheduledNotificationsAsync();
        if (onClose) {
            onClose();
        } else {
            navigation.goBack();
        }
    };

    // affiche les cartes des séries
    const renderSetCards = (mode: 'pre' | 'active' | 'rest') => {
        const lastSetCompleted =
            currentSet === totalSets &&
            results[currentSet - 1]?.reps &&
            results[currentSet - 1]?.weight;

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
                                active={hasStarted && index === currentSet - 1 && !lastSetCompleted}
                            />
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
                        <TouchableOpacity style={ButtonStyles.invertedContainer} onPress={cancelPreStartExercise}>
                            <Text style={ButtonStyles.invertedText}>Annuler l'exercice</Text>
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
                                    <Text style={ButtonStyles.invertedText}>Arrêter l'exercice</Text>
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
                                    <Text style={ButtonStyles.invertedText}>Arrêter l'exercice</Text>
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
        width: 70,
        height: 70,
        position: 'relative',
        marginRight: 20,
    },
    setNumberIcon: {
        width: 70,
        height: 70,
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
        fontSize: 18,
        fontFamily: 'PlusJakartaSans_500Medium',
        color: '#141217',
        marginBottom: 8,
    },
    setStatusText: {
        fontSize: 16,
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
