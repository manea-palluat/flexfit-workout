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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { RootStackParamList } from '../types/NavigationTypes';
import { StackNavigationProp } from '@react-navigation/stack';
import { TextStyles } from '../styles/TextStyles';
import { SvgXml } from 'react-native-svg';
import ExerciseSessionTrackingModal from '../components/ExerciseSessionTrackingModal';
import ActionModal from '../components/ActionModal';

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

const historyIconSvg = `
<svg fill="#000000" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 503.379 503.379" xml:space="preserve">
  <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
  <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
  <g id="SVGRepo_iconCarrier">
    <g>
      <path d="M458.091,128.116v326.842c0,26.698-21.723,48.421-48.422,48.421h-220.92c-26.699,0-48.421-21.723-48.421-48.421V242.439 c6.907,1.149,13.953,1.894,21.184,1.894c5.128,0,10.161-0.381,15.132-0.969v211.594c0,6.673,5.429,12.104,12.105,12.104h220.92 c6.674,0,12.105-5.432,12.105-12.104V128.116c0-6.676-5.432-12.105-12.105-12.105H289.835c0-12.625-1.897-24.793-5.297-36.315 h125.131C436.368,79.695,458.091,101.417,458.091,128.116z M159.49,228.401c-62.973,0-114.202-51.229-114.202-114.199 C45.289,51.229,96.517,0,159.49,0c62.971,0,114.202,51.229,114.202,114.202C273.692,177.172,222.461,228.401,159.49,228.401z M159.49,204.19c49.618,0,89.989-40.364,89.989-89.988c0-49.627-40.365-89.991-89.989-89.991 c-49.626,0-89.991,40.364-89.991,89.991C69.499,163.826,109.87,204.19,159.49,204.19z M227.981,126.308 c6.682,0,12.105-5.423,12.105-12.105s-5.423-12.105-12.105-12.105h-56.386v-47.52c0-6.682-5.423-12.105-12.105-12.105 s-12.105,5.423-12.105,12.105v59.625c0,6.682,5.423,12.105,12.105,12.105H227.981z M367.697,224.456h-131.14 c-6.682,0-12.105,5.423-12.105,12.105c0,6.683,5.423,12.105,12.105,12.105h131.14c6.685,0,12.105-5.423,12.105-12.105 C379.803,229.879,374.382,224.456,367.697,224.456z M367.91,297.885h-131.14c-6.682,0-12.105,5.42-12.105,12.105 s5.423,12.105,12.105,12.105h131.14c6.685,0,12.104-5.42,12.104-12.105S374.601,297.885,367.91,297.885z M367.91,374.353h-131.14 c-6.682,0-12.105,5.426-12.105,12.105c0,6.685,5.423,12.104,12.105,12.104h131.14c6.685,0,12.104-5.42,12.104-12.104 C380.015,379.778,374.601,374.353,367.91,374.353z"></path>
    </g>
  </g>
</svg>
`;

type NavigationProp = StackNavigationProp<RootStackParamList>;

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
                    onPress={() =>
                        navigation.navigate('ExerciseHistory', { exerciseName: item.name })
                    }
                >
                    <SvgXml xml={historyIconSvg} width="24" height="24" />
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

            {/* External Action Modal */}
            <ActionModal
                visible={actionModalVisible}
                onModifier={() => handleAction('modifier')}
                onSupprimer={() => handleAction('supprimer')}
                onCancel={() => setActionModalVisible(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
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
    exerciseCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F2F0F5',
        borderRadius: 10,
        padding: 16,
        paddingVertical: 22,
        marginVertical: 8,
    },
    playIconContainer: {
        backgroundColor: '#C932FC',
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
        fontSize: 16,
        color: '#756387',
    },
    cardButtonsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    historyButton: {
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    optionsButton: {
        width: 60,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 8,
    },
    optionsButtonText: {
        fontSize: 24,
        color: '#333',
    },
    fab: {
        position: 'absolute',
        right: 16,
        bottom: 16,
        backgroundColor: '#b603fc',
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
        transform: [{ translateY: -2.23 }],
    },
});

export default TrainingScreen;
