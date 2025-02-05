// src/screens/TrainingScreen.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    SectionList,
    StyleSheet,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { API, graphqlOperation } from 'aws-amplify';
import { listExercises } from '../graphql/queries';
import { deleteExercise } from '../graphql/mutations';
import { useAuth } from '../context/AuthContext';
// Import the new tracking modal instead of the old one.
import ExerciseSessionTrackingModal, { Exercise } from '../components/ExerciseSessionTrackingModal';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { RootStackParamList } from '../types/NavigationTypes';
import { StackNavigationProp } from '@react-navigation/stack';

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface SectionData {
    title: string;
    data: Exercise[];
}

const TrainingScreen: React.FC = () => {
    const [sections, setSections] = useState<SectionData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const { user } = useAuth();
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

    const navigation = useNavigation<NavigationProp>();

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

    const fetchExercises = async () => {
        try {
            const response: any = await API.graphql(
                graphqlOperation(listExercises, {
                    filter: {
                        userId: { eq: user?.attributes?.sub || user?.username },
                    },
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
            `Voulez-vous vraiment supprimer l'exercice "${exercise.name}" ?`,
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

    const renderExerciseItem = ({ item }: { item: Exercise }) => (
        <View style={styles.exerciseItem}>
            <Text style={styles.exerciseName}>{item.name}</Text>
            <Text style={styles.exerciseDetails}>
                {item.sets} séries x {item.reps} reps – {item.restTime} sec repos
            </Text>
            <View style={styles.itemButtons}>
                <TouchableOpacity
                    style={styles.playButton}
                    onPress={() => {
                        setSelectedExercise(item);
                        setModalVisible(true);
                    }}
                >
                    <Text style={styles.playButtonText}>Play</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => navigation.navigate('AddEditExercise', { exercise: item })}
                >
                    <Text style={styles.editButtonText}>Modifier</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteExercise(item)}
                >
                    <Text style={styles.deleteButtonText}>Supprimer</Text>
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

    if (!user) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Veuillez vous connecter pour voir vos exercices.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {sections.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text>Aucun exercice créé pour le moment.</Text>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => navigation.navigate('AddEditExercise')}
                    >
                        <Text style={styles.addButtonText}>Ajouter un exercice</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
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
                </>
            )}

            {selectedExercise && (
                <ExerciseSessionTrackingModal
                    visible={modalVisible}
                    exercise={selectedExercise}
                    // Compute the userId from Auth context.
                    userId={user?.attributes?.sub || user?.username}
                    onClose={() => {
                        setModalVisible(false);
                        setSelectedExercise(null);
                        fetchExercises(); // Optionally refresh the list after tracking.
                    }}
                />
            )}
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
    emptyContainer: {
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
    },
    playButton: {
        backgroundColor: '#28A745',
        padding: 8,
        borderRadius: 5,
        marginRight: 10,
    },
    playButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    editButton: {
        backgroundColor: '#FFA500',
        padding: 8,
        borderRadius: 5,
        marginRight: 10,
    },
    editButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    deleteButton: {
        backgroundColor: '#DC3545',
        padding: 8,
        borderRadius: 5,
    },
    deleteButtonText: {
        color: '#fff',
        fontSize: 16,
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
});

export default TrainingScreen;
