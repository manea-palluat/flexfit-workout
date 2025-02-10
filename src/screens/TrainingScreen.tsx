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
import { TextStyles } from '../styles/TextStyles'; // In case you need additional text styles

// Import the tracking modal component
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
                            console.error("Erreur lors de la suppression de l'exercice", error);
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
        <View style={styles.exerciseCard}>
            {/* Play Icon on the left */}
            <TouchableOpacity
                style={styles.playIconContainer}
                onPress={() => {
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
                            // Implement saving the session data as needed.
                        },
                    });
                }}
            >
                <Text style={styles.playIcon}>▶</Text>
            </TouchableOpacity>

            {/* Exercise Details in the center */}
            <View style={styles.exerciseDetailsContainer}>
                <Text style={styles.exerciseName}>{item.name}</Text>
                <Text style={styles.exerciseParams}>
                    {item.sets} × {item.reps} reps - {item.restTime}s
                </Text>
            </View>

            {/* Right Side Buttons: History and Options */}
            <View style={styles.cardButtonsContainer}>
                <TouchableOpacity
                    style={styles.historyButton}
                    onPress={() => navigation.navigate('ExerciseHistory', { exerciseName: item.name })}
                >
                    <Text style={styles.historyButtonText}>Historique</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.optionsButton}
                    onPress={() => openActionModal(item)}
                >
                    <Text style={styles.optionsButtonText}>⋮</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Chargement des exercices...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {sections.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text>Aucun exercice créé pour le moment.</Text>
                </View>
            ) : (
                <SectionList
                    sections={sections}
                    keyExtractor={(item) => item.exerciseId}
                    renderItem={renderExerciseItem}
                    renderSectionHeader={({ section: { title } }) => (
                        <Text style={[TextStyles.headerText, styles.sectionHeaderText]}>
                            {title}
                        </Text>
                    )}
                />
            )}

            {/* Floating Action Button (FAB) */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('AddEditExercise')}
            >
                <Text style={styles.fabIcon}>+</Text>
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
        backgroundColor: '#FFFFFF', // Very white white
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionHeaderText: {
        color: '#333',
        marginVertical: 12,
        paddingHorizontal: 16,
    },
    // Exercise card style – using a very soft beige
    exerciseCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F0E6', // Very soft beige
        borderRadius: 10,
        padding: 16,
        paddingVertical: 22,
        marginVertical: 8,
    },
    // Play icon container (circular purple button)
    playIconContainer: {
        backgroundColor: '#b21ae5',
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    playIcon: {
        color: '#fff',
        fontSize: 24,
    },
    // Exercise details container
    exerciseDetailsContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    exerciseName: {
        fontFamily: 'PlusJakartaSans_500Medium',
        lineHeight: 25,
        fontSize: 16,
        color: '#141217',
        marginBottom: 4,
    },
    exerciseParams: {
        fontSize: 14,
        color: '#756387',
    },
    // Right side container for History and Options buttons
    cardButtonsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    historyButton: {
        backgroundColor: '#b21ae5',
        borderRadius: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginRight: 8,
    },
    historyButtonText: {
        fontFamily: 'PlusJakartaSans_700Bold',
        fontSize: 13,
        color: '#fff',
    },
    optionsButton: {
        width: 60, // Increased width for wider three dots
        justifyContent: 'center',
        alignItems: 'center',
        padding: 8,
    },
    optionsButtonText: {
        fontSize: 24,
        color: '#333',
    },
    // Modal overlay and action modal styles
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
    // Floating Action Button (FAB) styles
    fab: {
        position: 'absolute',
        right: 16,
        bottom: 16,
        backgroundColor: '#b21ae5',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fabIcon: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
        transform: [{ translateY: -2.22 }],
    },
});

export default TrainingScreen;
