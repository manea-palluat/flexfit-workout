// src/screens/TrackingScreen.tsx
// IMPORT DES LIBS : on charge React, ses hooks et plein d'autres modules utiles
import React, { useState, useEffect, useMemo, useCallback } from 'react'; // hooks pour gérer l'état, les effets et les mémos
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
    Alert,
    TextInput,
} from 'react-native'; // composants de base RN
import { API, graphqlOperation } from 'aws-amplify'; // pour faire des appels GraphQL
import { listExerciseTrackings, listExercises } from '../graphql/queries'; // requêtes pour récupérer les suivis et les exos
import { useAuth } from '../context/AuthContext'; // récupère le contexte d'authentification
import { useNavigation, useFocusEffect } from '@react-navigation/native'; // navigation et effet au focus
import type { RootStackParamList } from '../types/NavigationTypes'; // types de navigation
import { StackNavigationProp } from '@react-navigation/stack'; // type pour la navigation en stack
import { ButtonStyles } from '../styles/ButtonStyles'; // styles custom des boutons
import Ionicons from 'react-native-vector-icons/Ionicons'; // icônes Ionicons
import ExerciseFilterBar from '../components/ExerciseFilterBar'; // barre de filtre pour les exos
import MuscleGroupFilterBar from '../components/MuscleGroupFilterBar'; // barre de filtre pour les groupes musculaires

// TYPE : structure d'un enregistrement de suivi
interface TrackingRecord {
    id: string; // id du suivi
    userId: string; // id de l'user
    exerciseId: string; // id de l'exo
    exerciseName: string; // nom de l'exo
    date: string; // date en ISO string
    setsData: string; // données des séries sous forme de JSON string
}

type NavigationProp = StackNavigationProp<RootStackParamList>; // typage de la navigation

const TrackingScreen: React.FC = () => {
    const [trackings, setTrackings] = useState<TrackingRecord[]>([]); // liste des suivis
    const [loading, setLoading] = useState<boolean>(true); // état de chargement
    const [refreshing, setRefreshing] = useState<boolean>(false); // état pour pull-to-refresh
    const { user } = useAuth(); // récupère l'user courant
    const navigation = useNavigation<NavigationProp>(); // navigation typée

    // ETAT : barre de recherche
    const [searchQuery, setSearchQuery] = useState<string>(''); // query de recherche

    // ETAT : filtre par exo (géré via ExerciseFilterBar)
    const [filterExercise, setFilterExercise] = useState<string>('All'); // filtre sur l'exo sélectionné

    // ETAT : filtre par groupe musculaire
    const [filterMuscleGroup, setFilterMuscleGroup] = useState<string>('All'); // filtre sur le groupe musculaire

    // ETAT : liste des groupes musculaires dispo et mapping nom exo => groupe
    const [availableMuscleGroups, setAvailableMuscleGroups] = useState<string[]>([]); // groupes dispo
    const [exerciseMapping, setExerciseMapping] = useState<{ [key: string]: string }>({}); // mapping exo -> groupe

    // MEMO : récupère la liste unique d'exos à partir des suivis
    const uniqueExercises = useMemo(() => {
        return Array.from(new Set(trackings.map((t) => t.exerciseName))); // unique par nom
    }, [trackings]);

    // MEMO : filtre les exos pour la barre de filtre en fonction du groupe sélectionné
    const filteredExercises = useMemo(() => {
        if (filterMuscleGroup !== 'All') {
            return uniqueExercises.filter(
                (ex) => exerciseMapping[ex] === filterMuscleGroup
            );
        }
        return uniqueExercises;
    }, [uniqueExercises, exerciseMapping, filterMuscleGroup]);

    // PULL-TO-REFRESH : rafraîchit les suivis
    const onRefresh = async () => {
        setRefreshing(true); // démarre le refresh
        await fetchTrackings(); // recharge les données
        setRefreshing(false); // stop refresh
    };

    // Recharge les suivis dès que l'écran reprend le focus
    useFocusEffect(
        useCallback(() => {
            fetchTrackings(); // recharge quand l'écran est focus
        }, [user])
    );

    // recharge aussi au montage ou quand l'user change
    useEffect(() => {
        fetchTrackings();
    }, [user]);

    // FONCTION : récupère les enregistrements de suivi depuis le backend
    const fetchTrackings = async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        try {
            const response: any = await API.graphql(
                graphqlOperation(listExerciseTrackings, {
                    filter: { userId: { eq: user?.attributes?.sub || user?.username } },
                    sortDirection: 'DESC',
                })
            );
            const items: TrackingRecord[] = response.data.listExerciseTrackings.items;
            setTrackings(items); // stocke les suivis
        } catch (error) {
            console.error('Error fetching tracking data', error);
            Alert.alert('Erreur', 'Une erreur est survenue lors du chargement des données.');
        } finally {
            setLoading(false);
        }
    };

    // Récupère les groupes musculaires dispo et crée le mapping exo => groupe
    useEffect(() => {
        const fetchMuscleGroups = async () => {
            if (!user) return;
            try {
                const response: any = await API.graphql(
                    graphqlOperation(listExercises, {
                        filter: { userId: { eq: user?.attributes?.sub || user?.username } },
                    })
                );
                const items = response.data.listExercises.items;
                const mapping: { [key: string]: string } = {};
                const groups: string[] = [];
                items.forEach((e: any) => {
                    if (e.name && e.muscleGroup) {
                        mapping[e.name] = e.muscleGroup; // associe nom => groupe
                        groups.push(e.muscleGroup); // stocke le groupe
                    }
                });
                setExerciseMapping(mapping);
                setAvailableMuscleGroups(Array.from(new Set(groups))); // groupe unique
            } catch (error) {
                console.error('Error fetching muscle groups', error);
                Alert.alert('Erreur', 'Impossible de charger les groupes musculaires.');
            }
        };
        fetchMuscleGroups();
    }, [user]);

    // CALCULS : stats de synthèse
    const totalSessions = trackings.length; // nb total de séances
    const totalWeightLifted = trackings.reduce((sum, record) => {
        try {
            const setsData = JSON.parse(record.setsData); // parse les données JSON
            const recordTotal = setsData.reduce(
                (s: number, set: { reps: number; weight: number }) => s + set.reps * set.weight,
                0
            );
            return sum + recordTotal; // ajoute le total de l'enregistrement
        } catch (e) {
            return sum;
        }
    }, 0);

    // FILTRAGE : on filtre les suivis selon la recherche et les filtres appliqués
    const filteredTrackings = trackings.filter((tracking) => {
        let exerciseMatch = true;
        if (searchQuery) {
            exerciseMatch = tracking.exerciseName
                .toLowerCase()
                .includes(searchQuery.toLowerCase());
        } else if (filterExercise && filterExercise !== 'All') {
            exerciseMatch = tracking.exerciseName === filterExercise;
        }
        const muscleMatch =
            filterMuscleGroup !== 'All'
                ? exerciseMapping[tracking.exerciseName] === filterMuscleGroup
                : true;
        return exerciseMatch && muscleMatch;
    });

    // ACTIVE FILTERS : badges affichés pour les filtres actifs
    const activeFilters: string[] = [];
    if (filterMuscleGroup && filterMuscleGroup !== 'All')
        activeFilters.push(`Groupe: ${filterMuscleGroup}`);
    if (filterExercise && filterExercise !== 'All')
        activeFilters.push(`Exercice: ${filterExercise}`);
    if (searchQuery) activeFilters.push(`Recherche: ${searchQuery}`);

    // RENDER : comment afficher chaque enregistrement de suivi
    const renderItem = ({ item }: { item: TrackingRecord }) => {
        const dateObj = new Date(item.date);
        // Format de la date au style dd/mm
        const formattedDate = `${dateObj.getDate().toString().padStart(2, '0')}/${(
            dateObj.getMonth() + 1
        )
            .toString()
            .padStart(2, '0')}`;

        let setSummary = '';
        try {
            const setsData = JSON.parse(item.setsData);
            setSummary = setsData
                .map((set: { reps: number; weight: number }) => `${set.reps} x ${set.weight} kg`)
                .join('\n'); // résumé de chaque set
        } catch (e) {
            console.error('Error parsing setsData', e);
        }

        return (
            <TouchableOpacity
                style={styles.recordItem}
                onPress={() => navigation.navigate('TrackingDetail', { tracking: item })} // navigate vers le détail
                onLongPress={() => {
                    Alert.alert(
                        'Supprimer',
                        'Voulez-vous supprimer cet enregistrement ?',
                        [
                            { text: 'Annuler', style: 'cancel' },
                            {
                                text: 'Supprimer',
                                style: 'destructive',
                                onPress: () => {
                                    setTrackings((prev) => prev.filter((rec) => rec.id !== item.id));
                                },
                            },
                        ],
                        { cancelable: true }
                    );
                }}
                accessibilityLabel={`Enregistrement du ${formattedDate} pour ${item.exerciseName}`} // accessibilité
            >
                <Text style={styles.recordTitle}>
                    {item.exerciseName} - {formattedDate}
                </Text>
                <Text style={styles.recordSummary}>{setSummary}</Text>
            </TouchableOpacity>
        );
    };

    // SI chargement => affiche écran de chargement
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Chargement des données de suivi...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* HEADER DE SYNTHÈSE */}
            <View style={styles.summaryHeader}>
                <Text style={styles.summaryText}>Séances: {totalSessions}</Text>
                <Text style={styles.summaryText}>Poids total: {totalWeightLifted.toFixed(0)} kg</Text>
            </View>

            {/* BARRE DE RECHERCHE */}
            <TextInput
                style={styles.searchBar}
                placeholder="Rechercher un exercice..." // placeholder
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
            />

            {/* FILTRE PAR GROUPE MUSCULAIRE */}
            <MuscleGroupFilterBar
                groups={availableMuscleGroups} // groupes dispo
                activeGroup={filterMuscleGroup} // groupe sélectionné
                onFilterChange={(selectedGroup) => {
                    setFilterMuscleGroup(selectedGroup);
                    // Reset du filtre d'exo si l'exo courant ne correspond plus
                    if (
                        filterExercise !== 'Tout' &&
                        exerciseMapping[filterExercise] !== selectedGroup
                    ) {
                        setFilterExercise('Tout');
                    }
                }}
            />

            {/* FILTRE PAR EXERCICE */}
            <ExerciseFilterBar
                exercises={filteredExercises} // exos filtrés
                onFilterChange={(selectedExercise, query) => {
                    setFilterExercise(selectedExercise);
                    // la recherche est gérée séparément
                }}
            />

            {/* BADGES DES FILTRES ACTIFS */}
            {activeFilters.length > 0 && (
                <View style={styles.activeFiltersContainer}>
                    {activeFilters.map((filter, idx) => (
                        <View key={idx} style={styles.filterBadge}>
                            <Text style={styles.filterBadgeText}>{filter}</Text>
                        </View>
                    ))}
                </View>
            )}

            {/* LISTE DES SUIVIS */}
            <FlatList
                data={filteredTrackings}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.contentContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} // pull-to-refresh
                ListEmptyComponent={
                    <View style={styles.emptyStateContainer}>
                        <Text style={styles.emptyStateText}>
                            Aucun enregistrement trouvé. Essayez d'ajuster vos filtres.
                        </Text>
                    </View>
                }
            />

            {/* BOUTON ACTION PERMANENT */}
            <TouchableOpacity
                style={styles.persistentButton}
                onPress={() => navigation.navigate('ManualTracking')}
                accessibilityLabel="Ajouter un suivi manuel"
            >
                <Text style={ButtonStyles.text}>Ajouter un suivi manuel</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
        paddingBottom: 80, // espace en bas pour le bouton
    },
    summaryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#F1F1F1',
        borderRadius: 8,
    },
    summaryText: {
        fontSize: 14,
        color: '#333',
    },
    searchBar: {
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F1F1F1',
        paddingHorizontal: 15,
        marginBottom: 10,
        fontSize: 14,
        color: '#333',
    },
    activeFiltersContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 10,
    },
    filterBadge: {
        backgroundColor: '#b21ae5',
        borderRadius: 12,
        paddingVertical: 4,
        paddingHorizontal: 8,
        marginRight: 6,
        marginBottom: 6,
    },
    filterBadgeText: {
        color: '#fff',
        fontSize: 12,
    },
    contentContainer: {
        paddingBottom: 20,
    },
    emptyStateContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#999',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    recordItem: {
        backgroundColor: '#F1F1F1',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
    },
    recordTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    recordSummary: {
        fontSize: 14,
        color: '#444',
        lineHeight: 20,
    },
    persistentButton: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        right: 16,
        ...ButtonStyles.container, // styles du bouton custom
    },
});

export default TrackingScreen;
