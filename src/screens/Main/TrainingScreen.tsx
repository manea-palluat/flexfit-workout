// src/screens/TrainingScreen.tsx
// IMPORT DES LIBS : on charge toutes les dependances nécessaires
import React, { useState, useEffect } from 'react'; // react et ses hooks, tranquille
import {
    View,
    Text,
    SectionList,
    StyleSheet,
    TouchableOpacity,
    Alert,
} from 'react-native'; // composants de base de react-native
import { API, graphqlOperation } from 'aws-amplify'; // pour interagir avec l'API backend
import { listExercises } from '../../graphql/queries'; // requête GraphQL pour récupérer les exos
import { deleteExercise } from '../../graphql/mutations'; // mutation pour supprimer un exo
import { useAuth } from '../../context/AuthContext'; // contexte d'authentification
import { useNavigation, useFocusEffect } from '@react-navigation/native'; // navigation et focus effect
import type { RootStackParamList } from '../../types/NavigationTypes'; // types de navigation
import { StackNavigationProp } from '@react-navigation/stack'; // type pour la navigation en stack
import { TextStyles } from '../../styles/TextStyles'; // styles custom pour le texte
import { SvgXml } from 'react-native-svg'; // pour afficher du SVG
import ExerciseSessionTrackingModal from '../../components/ExerciseSessionTrackingModal'; // modal de suivi d'exo
import ActionModal from '../../components/ActionModal'; // modal d'actions (modifier/supprimer)
import type { WorkoutSessionData } from '../../types/NavigationTypes';

// Mise à jour de l'interface pour inclure exerciseType (optionnel)
export interface Exercise {
    exerciseId: string; // id unique de l'exo
    name: string; // nom de l'exo
    muscleGroup: string; // groupe musculaire ciblé
    restTime: number; // temps de repos en secondes
    sets: number; // nombre de séries
    reps: number; // nb de répétitions
    exerciseType?: string; // <-- New field, e.g. "bodyweight" or "normal"
}

interface SectionData {
    title: string; // titre de la section (groupe musculaire)
    data: Exercise[]; // liste d'exos dans la section
}

// icône SVG pour l'historique
const historyIconSvg = `
<svg fill="#000000" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" 
xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 503.379 503.379" xml:space="preserve">
  <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
  <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
  <g id="SVGRepo_iconCarrier">
    <g>
      <path d="M458.091,128.116v326.842c0,26.698-21.723,48.421-48.422,48.421h-220.92c-26.699,0-48.421-21.723-48.421-48.421V242.439 
      c6.907,1.149,13.953,1.894,21.184,1.894c5.128,0,10.161-0.381,15.132-0.969v211.594c0,6.673,5.429,12.104,12.105,12.104h220.92 
      c6.674,0,12.105-5.432,12.105-12.104V128.116c0-6.676-5.432-12.105-12.105-12.105H289.835c0-12.625-1.897-24.793-5.297-36.315 
      h125.131C436.368,79.695,458.091,101.417,458.091,128.116z M159.49,228.401c-62.973,0-114.202-51.229-114.202-114.199 
      C45.289,51.229,96.517,0,159.49,0c62.971,0,114.202,51.229,114.202,114.202C273.692,177.172,222.461,228.401,159.49,228.401z 
      M159.49,204.19c49.618,0,89.989-40.364,89.989-89.988c0-49.627-40.365-89.991-89.989-89.991c-49.626,0-89.991,40.364-89.991,89.991 
      C69.499,163.826,109.87,204.19,159.49,204.19z M227.981,126.308 c6.682,0,12.105-5.423,12.105-12.105s-5.423-12.105-12.105-12.105h-56.386v-47.52
      c0-6.682-5.423-12.105-12.105-12.105 s-12.105,5.423-12.105,12.105v59.625c0,6.682,5.423,12.105,12.105,12.105H227.981z 
      M367.697,224.456h-131.14 c-6.682,0-12.105,5.423-12.105,12.105c0,6.683,5.423,12.105,12.105,12.105h131.14c6.685,0,12.105-5.423,12.105-12.105 
      C379.803,229.879,374.382,224.456,367.697,224.456z M367.91,297.885h-131.14c-6.682,0-12.105,5.42-12.105,12.105 s5.423,12.105,12.105,12.105h131.14
      c6.685,0,12.104-5.42,12.104-12.105S374.601,297.885,367.91,297.885z M367.91,374.353h-131.14 c-6.682,0-12.105,5.426-12.105,12.105
      c0,6.685,5.423,12.104,12.105,12.104h131.14c6.685,0,12.104-5.42,12.104-12.104 C380.015,379.778,374.601,374.353,367.91,374.353z"></path>
    </g>
  </g>
</svg>
`;

// Type de navigation pour ce screen
type NavigationProp = StackNavigationProp<RootStackParamList>;

// MAIN TRAINING SCREEN : ici on gère l'affichage des exos et la navigation
const TrainingScreen: React.FC = () => {
    const [sections, setSections] = useState<SectionData[]>([]); // état pour stocker les sections groupées par muscle
    const [loading, setLoading] = useState<boolean>(true); // état pour gérer le chargement
    const { user } = useAuth(); // récupère l'user depuis le contexte d'auth
    const navigation = useNavigation<NavigationProp>(); // navigation typée pour éviter les erreurs

    // Modal pour lancer une session d'exo
    const [modalVisible, setModalVisible] = useState<boolean>(false); // contrôle la visibilité de la modal de session
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null); // exo sélectionné pour la session

    // Modal d'action pour les trois points
    const [actionModalVisible, setActionModalVisible] = useState<boolean>(false); // modal pour les options (modifier/supprimer)
    const [selectedExerciseAction, setSelectedExerciseAction] = useState<Exercise | null>(null); // exo sélectionné pour l'action

    // Rafraîchit les exos quand l'écran reprend le focus
    useFocusEffect(
        React.useCallback(() => {
            if (user) {
                fetchExercises(); // recharge les exos dès que l'écran est actif
            } else {
                setLoading(false); // plus de chargement si pas d'user
            }
        }, [user])
    );

    useEffect(() => {
        if (user) {
            fetchExercises(); // recharge au montage si l'user existe
        } else {
            setLoading(false); // sinon on arrête le chargement
        }
    }, [user]);

    // Fonction pour récupérer les exos depuis le backend
    const fetchExercises = async () => {
        try {
            const response: any = await API.graphql(
                graphqlOperation(listExercises, {
                    filter: { userId: { eq: user?.attributes?.sub || user?.username } },
                })
            );
            const items: Exercise[] = response.data.listExercises.items;
            // On regroupe les exos par groupe musculaire
            const grouped = items.reduce((acc: { [key: string]: Exercise[] }, exercise: Exercise) => {
                if (!acc[exercise.muscleGroup]) {
                    acc[exercise.muscleGroup] = []; // initialise le tableau si inexistant
                }
                acc[exercise.muscleGroup].push(exercise); // ajoute l'exo dans le groupe
                return acc;
            }, {});
            // Création d'un tableau de sections pour la liste
            const sectionsData = Object.keys(grouped).map((muscleGroup) => ({
                title: muscleGroup, // titre de la section
                data: grouped[muscleGroup], // exos de ce groupe
            }));
            setSections(sectionsData); // on met à jour les sections
        } catch (error) {
            console.error('Error fetching exercises', error); // log l'erreur
        } finally {
            setLoading(false); // on arrête le chargement dans tous les cas
        }
    };

    // Supprime un exo après confirmation
    const handleDeleteExercise = async (exercise: Exercise) => {
        Alert.alert(
            'Confirmer la suppression',
            `Voulez-vous vraiment supprimer l'exercice "${exercise.name}" ? Cette action est irréversible. Cela ne supprimera pas les données de suivi associées.`,
            [
                { text: 'Annuler', style: 'cancel' }, // option pour annuler
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const userId = user?.attributes?.sub || user?.username;
                            if (!userId) {
                                Alert.alert('Erreur', "Identifiant de l'utilisateur introuvable."); // vérification de l'user
                                return;
                            }
                            const input = {
                                userId,
                                exerciseId: exercise.exerciseId,
                            };
                            await API.graphql(graphqlOperation(deleteExercise, { input })); // appel de la mutation pour supprimer
                            Alert.alert('Succès', 'Exercice supprimé.'); // confirmation à l'user
                            fetchExercises(); // on recharge la liste
                        } catch (error) {
                            console.error("Erreur lors de la suppression de l'exercice", error);
                            Alert.alert('Erreur', "Une erreur est survenue lors de la suppression de l'exercice.");
                        }
                    },
                },
            ]
        );
    };

    // Ouvre la modal d'actions (modifier/supprimer)
    const openActionModal = (exercise: Exercise) => {
        setSelectedExerciseAction(exercise); // sélection de l'exo pour action
        setActionModalVisible(true); // affiche la modal d'action
    };

    // Gère l'action choisie dans la modal d'action
    const handleAction = (action: 'modifier' | 'supprimer') => {
        setActionModalVisible(false); // ferme la modal d'action
        if (!selectedExerciseAction) return;
        const ex = selectedExerciseAction
        const safeType = (ex.exerciseType === 'bodyweight' ? 'bodyweight' : 'normal') as
            | 'normal'
            | 'bodyweight'

        navigation.navigate('AddEditExercise', {
            exercise: {
                ...ex,
                exerciseType: safeType,
            },
        })
    }

    // Rend une carte d'exercice dans la liste
    const renderExerciseItem = ({ item }: { item: Exercise }) => (
        <View style={styles.exerciseCard}>
            {/* Bouton PLAY à gauche pour lancer la session */}
            <TouchableOpacity
                style={styles.playIconContainer}
                onPress={() => {
                    const sessionData: WorkoutSessionData = {
                        exerciseName: item.name,
                        totalSets: item.sets,
                        plannedReps: item.reps,
                        restDuration: item.restTime,
                        // ici on force le type acceptable
                        exerciseType: item.exerciseType === 'bodyweight' ? 'bodyweight' : 'normal',
                    };

                    navigation.navigate('WorkoutSession', {
                        sessionData,
                        onComplete: (results) => {
                            console.log('Session complete, results:', results);
                            // …
                        },
                    });
                }}
            >
                <Text style={styles.playIcon}>▶</Text>
            </TouchableOpacity>

            {/* Détails de l'exo au centre */}
            <View style={styles.exerciseDetailsContainer}>
                <Text style={styles.exerciseName}>{item.name}</Text>
                <Text style={styles.exerciseParams}>
                    {item.sets} × {item.reps} reps - {item.restTime}s
                </Text>
            </View>

            {/* Boutons History et Options à droite */}
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

            {/* FAB pour ajouter un exo */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('AddEditExercise')}
            >
                <Text style={styles.fabIcon}>+</Text>
            </TouchableOpacity>

            {/* Modal de suivi d'exo quand on lance la session */}
            {selectedExercise && (
                <ExerciseSessionTrackingModal
                    visible={modalVisible}
                    exercise={selectedExercise}
                    userId={user?.attributes?.sub || user?.username}
                    onClose={() => {
                        setModalVisible(false);
                        setSelectedExercise(null);
                        fetchExercises(); // recharge la liste après fermeture
                    }}
                />
            )}

            {/* Modal externe d'action pour modifier ou supprimer */}
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
