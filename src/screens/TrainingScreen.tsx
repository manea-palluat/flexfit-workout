// src/screens/TrainingScreen.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    SectionList,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Modal,
} from 'react-native';
import { API, graphqlOperation } from 'aws-amplify';
import { listExercises } from '../graphql/queries';
import { deleteExercise } from '../graphql/mutations';
import { useAuth } from '../context/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { RootStackParamList } from '../types/NavigationTypes';
import { StackNavigationProp } from '@react-navigation/stack';

// Import the tracking modal component (if needed)
import ExerciseSessionTrackingModal from '../components/ExerciseSessionTrackingModal';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export interface Exercise {
    exerciseId: string;
    name: string;
    muscleGroup: string;
    restTime: number;
    sets: number;
    reps: number;
}

interface SectionData {
    title: string;
    data: Exercise[];
}

const TrainingScreen: React.FC = () => {
    const [sections, setSections] = useState<SectionData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const { user } = useAuth();
    const navigation = useNavigation<NavigationProp>();

    // For the "Play" modal:
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

    // For the three-dots action modal:
    const [actionModalVisible, setActionModalVisible] = useState<boolean>(false);
    const [selectedExerciseAction, setSelectedExerciseAction] = useState<Exercise | null>(null);

    // Refresh exercises whenever the screen gains focus.
    useFocusEffect(
        React.useCallback(() => {
            if (user) {
                fetchExercises();
            } else {
                setLoading(false);
            }
        }, [user])
    );

    useEffect(() => {
        if (user) {
            fetchExercises();
        } else {
            setLoading(false);
        }
    }, [user]);

    const fetchExercises = async () => {
        try {
            const response: any = await API.graphql(
                graphqlOperation(listExercises, {
                    filter: { userId: { eq: user?.attributes?.sub || user?.username } },
                })
            );
            const items: Exercise[] = response.data.listExercises.items;
            // Group exercises by muscleGroup.
            const grouped = items.reduce((acc: { [key: string]: Exercise[] }, exercise: Exercise) => {
                if (!acc[exercise.muscleGroup]) {
                    acc[exercise.muscleGroup] = [];
                }
                acc[exercise.muscleGroup].push(exercise);
                return acc;
            }, {});
            const sectionsData = Object.keys(grouped).map((muscleGroup) => ({
                title: muscleGroup,
                data: grouped[muscleGroup],
            }));
            setSections(sectionsData);
        } catch (error) {
            console.error('Error fetching exercises', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteExercise = async (exercise: Exercise) => {
        Alert.alert(
            'Confirmer la suppression',
            `Voulez-vous vraiment supprimer l'exercice "${exercise.name}" ? Cette action est irréversible. Cela ne supprimera pas les données de suivi associées.`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const userId = user?.attributes?.sub || user?.username;
                            if (!userId) {
                                Alert.alert('Erreur', "Identifiant de l'utilisateur introuvable.");
                                return;
                            }
                            const input = {
                                userId,
                                exerciseId: exercise.exerciseId,
                            };
                            await API.graphql(graphqlOperation(deleteExercise, { input }));
                            Alert.alert('Succès', 'Exercice supprimé.');
                            fetchExercises();
                        } catch (error) {
                            console.error('Erreur lors de la suppression de l\'exercice', error);
                            Alert.alert(
                                'Erreur',
                                "Une erreur est survenue lors de la suppression de l'exercice."
                            );
                        }
                    },
                },
            ]
        );
    };

    const openActionModal = (exercise: Exercise) => {
        setSelectedExerciseAction(exercise);
        setActionModalVisible(true);
    };

    const handleAction = (action: 'modifier' | 'supprimer') => {
        setActionModalVisible(false);
        if (!selectedExerciseAction) return;
        if (action === 'modifier') {
            navigation.navigate('AddEditExercise', { exercise: selectedExerciseAction });
        } else if (action === 'supprimer') {
            handleDeleteExercise(selectedExerciseAction);
        }
    };

    const renderExerciseItem = ({ item }: { item: Exercise }) => (
        <View style={styles.exerciseItem}>
            <Text style={styles.exerciseName}>{item.name}</Text>
            <Text style={styles.exerciseDetails}>
                {item.sets} sets x {item.reps} reps – {item.restTime} sec repos
            </Text>
            <View style={styles.itemButtons}>
                <TouchableOpacity
                    style={styles.playButton}
                    onPress={() => {
                        console.log('Play button pressed for:', item);
                        const sessionData = {
                            exerciseName: item.name,
                            totalSets: item.sets,
                            plannedReps: item.reps,
                            restDuration: item.restTime,
                        };
                        navigation.navigate('WorkoutSession', {
                            sessionData,
                            onComplete: (results: { reps?: number; weight?: number }[]) => {
                                console.log('Session complete, results:', results);
                                // Here, implement saving the session data as needed.
                            }
                        });
                    }}
                >
                    <Text style={styles.playButtonText}>Play</Text>
                </TouchableOpacity>
                <Text style={styles.playButtonText}>Play</Text>
                <TouchableOpacity
                    style={styles.historyButton}
                    onPress={() => navigation.navigate('ExerciseHistory', { exerciseName: item.name })}
                >
                    <Text style={styles.historyButtonText}>Historique</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => openActionModal(item)}
                >
                    <Text style={styles.actionButtonText}>⋮</Text>
                </TouchableOpacity>
            </View>
        </View >
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Chargement des exercices...</Text>
            </View>
        );
    }

    if (sections.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Aucun exercice créé pour le moment.</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => navigation.navigate('AddEditExercise')}
                >
                    <Text style={styles.addButtonText}>Ajouter un exercice</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <SectionList
                sections={sections}
                keyExtractor={(item) => item.exerciseId}
                renderItem={renderExerciseItem}
                renderSectionHeader={({ section: { title } }) => (
                    <Text style={styles.sectionHeader}>{title}</Text>
                )}
            />
            <TouchableOpacity
                style={styles.addButtonBottom}
                onPress={() => navigation.navigate('AddEditExercise')}
            >
                <Text style={styles.addButtonText}>Ajouter un exercice</Text>
            </TouchableOpacity>

            {/* Tracking Modal for "Play" */}
            {selectedExercise && (
                <ExerciseSessionTrackingModal
                    visible={modalVisible}
                    exercise={selectedExercise}
                    userId={user?.attributes?.sub || user?.username}
                    onClose={() => {
                        setModalVisible(false);
                        setSelectedExercise(null);
                        fetchExercises();
                    }}
                />
            )}

            {/* Action Modal for three dots */}
            <Modal visible={actionModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.actionModalContainer}>
                        <TouchableOpacity
                            style={styles.actionModalButton}
                            onPress={() => handleAction('modifier')}
                        >
                            <Text style={styles.actionModalButtonText}>Modifier</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionModalButton}
                            onPress={() => handleAction('supprimer')}
                        >
                            <Text style={styles.actionModalButtonText}>Supprimer</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionModalButton, styles.cancelActionButton]}
                            onPress={() => setActionModalVisible(false)}
                        >
                            <Text style={styles.actionModalButtonText}>Annuler</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionHeader: {
        fontSize: 20,
        fontWeight: 'bold',
        backgroundColor: '#eee',
        padding: 8,
        marginBottom: 4,
    },
    exerciseItem: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        marginBottom: 8,
    },
    exerciseName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    exerciseDetails: {
        fontSize: 14,
        color: '#666',
    },
    itemButtons: {
        flexDirection: 'row',
        marginTop: 10,
        flexWrap: 'wrap',
    },
    playButton: {
        backgroundColor: '#28A745',
        padding: 8,
        borderRadius: 5,
        marginRight: 10,
        marginBottom: 8,
    },
    playButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    historyButton: {
        backgroundColor: '#6C757D',
        padding: 8,
        borderRadius: 5,
        marginRight: 10,
        marginBottom: 8,
    },
    historyButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    actionButton: {
        backgroundColor: '#ccc',
        padding: 8,
        borderRadius: 5,
        marginBottom: 8,
    },
    actionButtonText: {
        fontSize: 20,
        color: '#333',
    },
    addButton: {
        marginTop: 20,
        backgroundColor: '#007BFF',
        padding: 12,
        borderRadius: 8,
        width: '80%',
        alignItems: 'center',
    },
    addButtonBottom: {
        backgroundColor: '#007BFF',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionModalContainer: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 20,
        alignItems: 'center',
    },
    actionModalButton: {
        backgroundColor: '#007BFF',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginBottom: 10,
        width: '100%',
    },
    cancelActionButton: {
        backgroundColor: '#6C757D',
    },
    actionModalButtonText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
    },
    retourButton: {
        backgroundColor: '#007BFF',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignSelf: 'center',
        marginBottom: 20,
    },
    retourButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default TrainingScreen;
