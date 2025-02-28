// src/components/ExerciseSessionModal.tsx
import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export interface Exercise {
    exerciseId: string;
    name: string;
    muscleGroup: string;
    restTime: number; // in seconds
    sets: number;
    reps: number;
    weight: number;
}

interface ExerciseSessionModalProps { //props de la modal
    visible: boolean; //affichage de la modal
    exercise: Exercise; //détails de l'exo
    onClose: () => void; //callback pour fermer la modal
}

const ExerciseSessionModal: React.FC<ExerciseSessionModalProps> = ({
    visible,
    exercise,
    onClose,
}) => {
    const { sets, reps, restTime } = exercise; //déconstruire les infos de l'exo
    const [currentSet, setCurrentSet] = useState<number>(1); //etat: set courant, commence à 1
    const [isResting, setIsResting] = useState<boolean>(false); //etat: en repos ou non
    const [timer, setTimer] = useState<number>(restTime); //etat: timer de repos

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null; //var interval

        if (isResting) { //si en repos
            if (timer > 0) { //tant que timer > 0
                interval = setInterval(() => {
                    setTimer((prev) => prev - 1); //décrémente timer chaque seconde
                }, 1000);
            } else { //quand timer = 0
                //quand le timer atteint zéro, fin du repos, reset timer et passe au set suivant ou ferme la modal
                setIsResting(false); //fin du repos
                setTimer(restTime); //reset du timer
                if (currentSet < sets) { //s'il reste des sets
                    setCurrentSet(currentSet + 1); //passe au set suivant
                } else {
                    //TOUS LES SETS TERMINÉS; ferme la modal
                    onClose();
                }
            }
        }

        return () => {
            if (interval) { //nettoyage de l'intervalle
                clearInterval(interval);
            }
        };
    }, [isResting, timer, currentSet, restTime, sets, onClose]); //dépendances de l'effet

    const handleDone = () => {
        //lance phase de repos après fin d'un set
        setIsResting(true);
    };

    const handleCancel = () => {
        //reset de la session et fermeture de la modal
        setCurrentSet(1);
        setIsResting(false);
        setTimer(restTime);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            {/* EXERCISE SESSION MODAL */}
            <View style={modalStyles.container}>
                <View style={modalStyles.modal}>
                    {!isResting ? (
                        <>
                            {/* affiche set en cours si pas en repos */}
                            <Text style={modalStyles.title}>
                                Set {currentSet} sur {sets}
                            </Text>
                            <Text style={modalStyles.info}>{reps} reps</Text>
                            <TouchableOpacity style={modalStyles.button} onPress={handleDone}>
                                <Text style={modalStyles.buttonText}>Terminé</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            {/* affiche écran de repos avec timer */}
                            <Text style={modalStyles.title}>Repos</Text>
                            <Text style={modalStyles.info}>Temps de repos : {timer} sec</Text>
                        </>
                    )}
                    <TouchableOpacity style={modalStyles.cancelButton} onPress={handleCancel}>
                        <Text style={modalStyles.cancelButtonText}>Annuler</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const modalStyles = StyleSheet.create({
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

export default ExerciseSessionModal;
