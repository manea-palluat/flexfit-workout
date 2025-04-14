// src/screens/RecentExercisesDetailScreen.tsx
// Cet écran affiche en détail les derniers exercices enregistrés par l'utilisateur.
// On y retrouve la liste des suivis d'exercices avec des fonctionnalités de recherche et de filtrage
// par groupe musculaire et par exercice spécifique. L'utilisateur peut également rafraîchir la liste
// et supprimer un enregistrement via une action long-press.

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
    Alert,
} from 'react-native';
import { API, graphqlOperation } from 'aws-amplify';
import { listExerciseTrackings, listExercises } from '../graphql/queries';
import { useAuth } from '../context/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import ExerciseFilterBar from '../components/ExerciseFilterBar';
import MuscleGroupFilterBar from '../components/MuscleGroupFilterBar';
import { TextStyles } from '../styles/TextStyles';
import type { RootStackParamList } from '../types/NavigationTypes';

// --- Interfaces pour le typage ---
// Interface pour décrire la structure d'un enregistrement de suivi d'exercice
interface TrackingRecord {
    id: string;
    userId: string;
    exerciseId: string;
    exerciseName: string;
    date: string;
    setsData: string;
}

// Interface pour stocker des informations complémentaires sur un exercice (ex: groupe musculaire)
interface ExerciseInfo {
    muscleGroup: string;
    exerciseType?: string;
}

const RecentExercisesDetailScreen: React.FC = () => {
    // Récupération du user connecté et de la navigation
    const { user } = useAuth();
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

    // États pour stocker les suivis d'exercices, l'état de chargement et de rafraîchissement, et les filtres appliqués
    const [trackings, setTrackings] = useState<TrackingRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [filterExercise, setFilterExercise] = useState<string>('Tous');
    const [filterMuscleGroup, setFilterMuscleGroup] = useState<string>('Tous');
    const [availableMuscleGroups, setAvailableMuscleGroups] = useState<string[]>([]);
    // Mapping des exercices pour récupérer des infos comme le groupe musculaire
    const [exerciseMapping, setExerciseMapping] = useState<{ [key: string]: ExerciseInfo }>({});

    // --- Fonction de récupération des suivis d'exercices ---
    // On récupère les suivis via GraphQL pour l'utilisateur connecté
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
            console.log('fetchTrackings:', items.length);
            setTrackings(items);
        } catch (error) {
            console.error('Erreur lors du chargement des suivis', error);
            Alert.alert('Erreur', 'Impossible de charger les suivis.');
        } finally {
            setLoading(false);
        }
    };

    // --- Fonction de récupération des exercices ---
    // Cette fonction permet de récupérer les exercices enregistrés par l'utilisateur
    // afin d'en extraire le groupe musculaire et d'autres infos pour les filtres.
    const fetchExercises = async () => {
        if (!user) return;
        try {
            const response: any = await API.graphql(
                graphqlOperation(listExercises, {
                    filter: { userId: { eq: user?.attributes?.sub || user?.username } },
                })
            );
            const items = response.data.listExercises.items;
            const mapping: { [key: string]: ExerciseInfo } = {};
            const groups: string[] = [];
            // Pour chaque exercice, on stocke le mapping par nom et on collecte les groupes musculaires
            items.forEach((ex: any) => {
                if (ex.name && ex.muscleGroup) {
                    mapping[ex.name] = { muscleGroup: ex.muscleGroup, exerciseType: ex.exerciseType };
                    groups.push(ex.muscleGroup);
                }
            });
            console.log('fetchExercises:', { mapping, groups });
            setExerciseMapping(mapping);
            // Supprime les doublons dans les groupes musculaires
            setAvailableMuscleGroups(Array.from(new Set(groups)));
        } catch (error) {
            console.error('Erreur lors du chargement des exercices', error);
            Alert.alert('Erreur', 'Impossible de charger les groupes musculaires.');
        }
    };

    // --- Utilisation de useFocusEffect pour rafraîchir les suivis quand l'écran est focalisé ---
    useFocusEffect(
        useCallback(() => {
            console.log('useFocusEffect triggered');
            fetchTrackings();
        }, [user])
    );

    // --- Utilisation de useEffect pour récupérer les données dès que l'utilisateur change ---
    useEffect(() => {
        console.log('useEffect for trackings triggered');
        fetchTrackings();
    }, [user]);

    useEffect(() => {
        console.log('useEffect for exercises triggered');
        fetchExercises();
    }, [user]);

    // --- Fonction de rafraîchissement (pull-to-refresh) ---
    const onRefresh = async () => {
        setRefreshing(true);
        await fetchTrackings();
        await fetchExercises();
        setRefreshing(false);
    };

    // --- Gestion des filtres --- 
    // Lorsqu'on change le groupe musculaire, on met à jour l'état et réinitialise le filtre d'exercice si nécessaire
    const handleMuscleGroupChange = (selectedGroup: string) => {
        console.log('handleMuscleGroupChange:', selectedGroup);
        setFilterMuscleGroup(selectedGroup);
        if (filterExercise !== 'Tous' && exerciseMapping[filterExercise]?.muscleGroup !== selectedGroup) {
            console.log('Resetting filterExercise to Tous due to muscle group change');
            setFilterExercise('Tous');
        }
    };

    // Mise à jour du filtre d'exercice lorsqu'une sélection est effectuée via la barre de filtre d'exercices
    const handleExerciseFilterChange = (selectedExercise: string, _searchQuery: string) => {
        console.log('handleExerciseFilterChange:', { selectedExercise, _searchQuery });
        setFilterExercise(selectedExercise);
    };

    // --- Définition des exercices uniques enregistrés dans les suivis ---
    const uniqueExercises = Array.from(new Set(trackings.map((t) => t.exerciseName)));
    // Applique le filtre muscle si nécessaire sur la liste d'exercices uniques
    const filteredExercises =
        filterMuscleGroup === 'Tous'
            ? uniqueExercises
            : uniqueExercises.filter((ex) => exerciseMapping[ex]?.muscleGroup === filterMuscleGroup);

    // --- Filtrage des suivis selon les filtres sélectionnés et la recherche ---
    const filteredTrackings = trackings.filter((tracking) => {
        const exerciseMatch = filterExercise === 'Tous' || tracking.exerciseName === filterExercise;
        const muscleMatch =
            filterMuscleGroup === 'Tous' ||
            exerciseMapping[tracking.exerciseName]?.muscleGroup === filterMuscleGroup;
        const searchMatch =
            searchQuery.trim() === '' ||
            tracking.exerciseName.toLowerCase().includes(searchQuery.toLowerCase());
        const result = exerciseMatch && muscleMatch && searchMatch;
        console.log('Filtering:', {
            tracking: tracking.exerciseName,
            exerciseMatch,
            muscleMatch,
            searchMatch,
            result,
        });
        return result;
    });

    // --- Rendu d'un item de la liste des suivis --- 
    // Chaque item affiche le nom de l'exercice et la date, et gère la navigation vers l'historique ainsi que la suppression
    const renderTrackingItem = ({ item }: { item: TrackingRecord }) => {
        const dateObj = new Date(item.date);
        // Formatage de la date sous forme "jj/mm"
        const formattedDate = `${String(dateObj.getDate()).padStart(2, '0')}/${String(
            dateObj.getMonth() + 1
        ).padStart(2, '0')}`;
        return (
            <TouchableOpacity
                style={styles.trackingItem}
                // Navigation vers l'écran "ExerciseHistory" pour afficher l'historique complet d'un exercice
                onPress={() => navigation.navigate('ExerciseHistory', { exerciseName: item.exerciseName })}
                // Permet de supprimer un enregistrement par un appui long
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
                                    // Supprime l'item en filtrant la liste des suivis
                                    setTrackings((prev) => prev.filter((rec) => rec.id !== item.id));
                                },
                            },
                        ],
                        { cancelable: true }
                    );
                }}
            >
                <Text style={TextStyles.simpleText}>
                    {item.exerciseName} - {formattedDate}
                </Text>
            </TouchableOpacity>
        );
    };

    // Si les données sont en cours de chargement, on affiche un indicateur de chargement
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={TextStyles.simpleText}>Chargement des données…</Text>
            </View>
        );
    }

    console.log('Rendering with:', {
        trackings: trackings.length,
        filteredTrackings: filteredTrackings.length,
        filterExercise,
        filterMuscleGroup,
    });

    return (
        <View style={styles.container}>
            {/* Titre principal de l'écran */}
            <Text style={[TextStyles.headerText, styles.headerText]}>
                Exercices récents détaillés
            </Text>
            {/* Champ de recherche pour filtrer par nom d'exercice */}
            <TextInput
                style={styles.searchInput}
                placeholder="Rechercher un exercice…"
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
            />
            {/* Barre de filtre pour sélectionner un groupe musculaire */}
            <MuscleGroupFilterBar
                groups={availableMuscleGroups}
                activeGroup={filterMuscleGroup}
                onFilterChange={handleMuscleGroupChange}
            />
            {/* Barre de filtre pour sélectionner un exercice spécifique */}
            <ExerciseFilterBar
                exercises={filteredExercises}
                initialActiveFilter={filterExercise}
                onFilterChange={handleExerciseFilterChange}
            />
            {/* Liste des suivis filtrés */}
            <FlatList
                data={filteredTrackings}
                keyExtractor={(item) => item.id}
                renderItem={renderTrackingItem}
                contentContainerStyle={styles.listContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <Text style={[TextStyles.subSimpleText, styles.emptyText]}>
                        Aucun suivi trouvé. Essayez d'ajuster vos filtres.
                    </Text>
                }
            />
        </View>
    );
};

export default RecentExercisesDetailScreen;

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: '#fff' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerText: { marginBottom: 12, color: '#141217' },
    searchInput: {
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F1F1F1',
        paddingHorizontal: 15,
        marginBottom: 10,
        fontSize: 14,
        color: '#333',
    },
    listContainer: { paddingBottom: 20 },
    trackingItem: {
        backgroundColor: '#F1F1F1',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    emptyText: { textAlign: 'center', marginTop: 20, color: '#999' },
});
