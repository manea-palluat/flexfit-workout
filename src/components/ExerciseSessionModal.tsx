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

interface ExerciseSessionModalProps {
    visible: boolean;
    exercise: Exercise;
    onClose: () => void;
}

const ExerciseSessionModal: React.FC<ExerciseSessionModalProps> = ({
    visible,
    exercise,
    onClose,
}) => {
    const { sets, reps, restTime } = exercise;
    const [currentSet, setCurrentSet] = useState<number>(1);
    const [isResting, setIsResting] = useState<boolean>(false);
    const [timer, setTimer] = useState<number>(restTime);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (isResting) {
            if (timer > 0) {
                interval = setInterval(() => {
                    setTimer((prev) => prev - 1);
                }, 1000);
            } else {
                // When timer reaches 0, proceed to next set or close modal.
                setIsResting(false);
                setTimer(restTime);
                if (currentSet < sets) {
                    setCurrentSet(currentSet + 1);
                } else {
                    // All sets completed; close the modal.
                    onClose();
                }
            }
        }

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [isResting, timer, currentSet, restTime, sets, onClose]);

    const handleDone = () => {
        // Start the resting phase after finishing a set.
        setIsResting(true);
    };

    const handleCancel = () => {
        // Reset session state and close modal.
        setCurrentSet(1);
        setIsResting(false);
        setTimer(restTime);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={modalStyles.container}>
                <View style={modalStyles.modal}>
                    {!isResting ? (
                        <>
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
