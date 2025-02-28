//src/components/ExerciseSessionTrackingModal.tsx
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
    name: string;  //expected to be non-null
    muscleGroup: string;
    restTime: number; //in seconds
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
    userId: string; //donné par le parent
    onClose: () => void;
}

const COOLDOWN_BAR_WIDTH = 200; //BARRE DE PROGRESSION: largeur max en pixels

const ExerciseSessionTrackingModal: React.FC<ExerciseSessionTrackingModalProps> = ({
    visible,
    exercise,
    userId,
    onClose,
}) => {
    //récup infos de l'exo
    const { sets, reps, restTime } = exercise;
    const [currentSet, setCurrentSet] = useState<number>(1); //numéro du set en cours
    const [isResting, setIsResting] = useState<boolean>(false); //flag: en repos ou pas
    const [timer, setTimer] = useState<number>(restTime); //timer initialisé sur le temps de repos
    const [currentResult, setCurrentResult] = useState<SetResult>({ weight: 0, reps: 0 }); //résultat du set actuel
    const [results, setResults] = useState<SetResult[]>([]); //liste des résultats accumulés

    //valeur animée pour la barre de progression du repos
    const progressAnim = useRef(new Animated.Value(restTime)).current;

    //Animation de la barre: update de progressAnim en fonction du timer
    useEffect(() => {
        Animated.timing(progressAnim, {
            toValue: timer,
            duration: 500, //durée de transition smooth
            useNativeDriver: false,
        }).start();
    }, [timer, progressAnim]);

    //gestion du décompte pendant le repos
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isResting) {
            if (timer > 0) {
                interval = setInterval(() => {
                    setTimer(prev => prev - 1); //décrémente le timer chaque seconde
                }, 1000);
            } else {
                if (interval) clearInterval(interval);
                //REPOS TERMINÉ: reset timer et passage au set suivant ou soumission
                setIsResting(false);
                setTimer(restTime);
                if (currentSet < sets) {
                    setCurrentSet(currentSet + 1); //passe au set suivant
                } else {
                    //TOUS LES SETS FINIS: envoi des données de suivi
                    submitTrackingData();
                }
            }
        }
        return () => {
            if (interval) clearInterval(interval); //nettoyage de l'intervalle
        };
    }, [isResting, timer, currentSet]);

    //ENVOI DES DONNÉES
    const submitTrackingData = async () => {
        //verif du nom de l'exo
        const safeExerciseName =
            (typeof exercise.name === 'string' && exercise.name.trim().length > 0)
                ? exercise.name.trim()
                : 'Exercice Inconnu';
        //prépare les données à envoyer
        const trackingInput = {
            id: uuidv4(),
            userId,
            exerciseId: exercise.exerciseId,
            exerciseName: safeExerciseName,
            date: new Date().toISOString(),
            setsData: JSON.stringify(results),
        };
        console.log('Submitting tracking record with input:', trackingInput); //debug: affiche les données
        try {
            await API.graphql(graphqlOperation(createExerciseTracking, { input: trackingInput }));
            Alert.alert('Succès', 'Données de suivi enregistrées.'); //succès: alerte et fermeture du modal
            onClose();
        } catch (error) {
            console.error('Erreur lors de l’enregistrement des données de suivi', error);
            Alert.alert('Erreur', "Une erreur est survenue lors de l'enregistrement des données de suivi."); //erreur: alerte l'utilisateur
        }
    };

    //FIN DU SET
    const handleSetCompletion = () => {
        if (currentResult.weight <= 0 || currentResult.reps <= 0) {
            Alert.alert('Erreur', 'Veuillez entrer un poids et un nombre de répétitions valides.'); //alerte: valeurs invalides
            return;
        }
        setResults([...results, currentResult]); //ajoute le résultat et reset
        setCurrentResult({ weight: 0, reps: 0 });
        setIsResting(true); //active le mode repos
    };

    //ANNULER
    const handleCancel = () => {
        setCurrentSet(1);
        setIsResting(false);
        setTimer(restTime);
        setResults([]);
        onClose(); //reset de l'état et fermeture du modal
    };

    //BARRE DE PROGRESSION: interpolation de la valeur animée pour la largeur
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

export default ExerciseSessionTrackingModal; //export du composant
