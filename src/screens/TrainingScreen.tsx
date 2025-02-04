// src/screens/TrainingScreen.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    SectionList,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { API, graphqlOperation } from 'aws-amplify';
import { listExercises } from '../graphql/queries';
import { useAuth } from '../context/AuthContext';
import ExerciseSessionModal, { Exercise } from '../components/ExerciseSessionModal';
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

    // Fetch exercises when the screen is focused.
    useFocusEffect(
        React.useCallback(() => {
            if (user) {
                fetchExercises();
            } else {
                setLoading(false);
            }
        }, [user])
    );

    // Also fetch on initial mount.
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
                    // Use user.attributes.sub if available; otherwise, fallback to user.username.
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

    const renderExerciseItem = ({ item }: { item: Exercise }) => (
        <View style={styles.exerciseItem}>
            <Text style={styles.exerciseName}>{item.name}</Text>
            <Text style={styles.exerciseDetails}>
                {item.sets} sets x {item.reps} reps – {item.restTime} sec repos
            </Text>
            <TouchableOpacity
                style={styles.playButton}
                onPress={() => {
                    setSelectedExercise(item);
                    setModalVisible(true);
                }}
            >
                <Text style={styles.playButtonText}>Play</Text>
            </TouchableOpacity>
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
                <ExerciseSessionModal
                    visible={modalVisible}
                    exercise={selectedExercise}
                    onClose={() => {
                        setModalVisible(false);
                        setSelectedExercise(null);
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
    playButton: {
        backgroundColor: '#28A745',
        padding: 8,
        borderRadius: 5,
        marginTop: 10,
        alignSelf: 'flex-start',
    },
    playButtonText: {
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
