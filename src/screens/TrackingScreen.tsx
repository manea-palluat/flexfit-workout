// src/screens/TrackingScreen.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
    Alert,
    TextInput,
} from 'react-native';
import { API, graphqlOperation } from 'aws-amplify';
import { listExerciseTrackings, listExercises } from '../graphql/queries';
import { useAuth } from '../context/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { RootStackParamList } from '../types/NavigationTypes';
import { StackNavigationProp } from '@react-navigation/stack';
import { ButtonStyles } from '../styles/ButtonStyles';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ExerciseFilterBar from '../components/ExerciseFilterBar';
import MuscleGroupFilterBar from '../components/MuscleGroupFilterBar';

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface TrackingRecord {
    id: string;
    userId: string;
    exerciseId: string;
    exerciseName: string;
    date: string; // ISO string
    setsData: string; // JSON string
}

const TrackingScreen: React.FC = () => {
    const [trackings, setTrackings] = useState<TrackingRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const { user } = useAuth();
    const navigation = useNavigation<NavigationProp>();

    // Search bar state.
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Exercise filter state (managed by ExerciseFilterBar).
    const [filterExercise, setFilterExercise] = useState<string>('All');

    // Muscle group filter state.
    const [filterMuscleGroup, setFilterMuscleGroup] = useState<string>('All');

    // State for available muscle groups and mapping from exercise name to muscle group.
    const [availableMuscleGroups, setAvailableMuscleGroups] = useState<string[]>([]);
    const [exerciseMapping, setExerciseMapping] = useState<{ [key: string]: string }>({});

    // Compute unique exercises from tracking records.
    const uniqueExercises = useMemo(() => {
        return Array.from(new Set(trackings.map((t) => t.exerciseName)));
    }, [trackings]);

    // Compute filtered exercises for the ExerciseFilterBar based on the active muscle group.
    const filteredExercises = useMemo(() => {
        if (filterMuscleGroup !== 'All') {
            return uniqueExercises.filter(
                (ex) => exerciseMapping[ex] === filterMuscleGroup
            );
        }
        return uniqueExercises;
    }, [uniqueExercises, exerciseMapping, filterMuscleGroup]);

    // Pull-to-refresh handler.
    const onRefresh = async () => {
        setRefreshing(true);
        await fetchTrackings();
        setRefreshing(false);
    };

    // Refresh tracking data when screen gains focus.
    useFocusEffect(
        useCallback(() => {
            fetchTrackings();
        }, [user])
    );

    useEffect(() => {
        fetchTrackings();
    }, [user]);

    // Fetch tracking records.
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
            setTrackings(items);
        } catch (error) {
            console.error('Error fetching tracking data', error);
            Alert.alert('Erreur', 'Une erreur est survenue lors du chargement des données.');
        } finally {
            setLoading(false);
        }
    };

    // Fetch available muscle groups and build exercise mapping from user's exercises.
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
                        mapping[e.name] = e.muscleGroup;
                        groups.push(e.muscleGroup);
                    }
                });
                setExerciseMapping(mapping);
                setAvailableMuscleGroups(Array.from(new Set(groups)));
            } catch (error) {
                console.error('Error fetching muscle groups', error);
                Alert.alert('Erreur', 'Impossible de charger les groupes musculaires.');
            }
        };
        fetchMuscleGroups();
    }, [user]);

    // Compute summary statistics.
    const totalSessions = trackings.length;
    const totalWeightLifted = trackings.reduce((sum, record) => {
        try {
            const setsData = JSON.parse(record.setsData);
            const recordTotal = setsData.reduce(
                (s: number, set: { reps: number; weight: number }) => s + set.reps * set.weight,
                0
            );
            return sum + recordTotal;
        } catch (e) {
            return sum;
        }
    }, 0);

    // Filtering logic for tracking records.
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

    // Active filter badges.
    const activeFilters: string[] = [];
    if (filterMuscleGroup && filterMuscleGroup !== 'All')
        activeFilters.push(`Groupe: ${filterMuscleGroup}`);
    if (filterExercise && filterExercise !== 'All')
        activeFilters.push(`Exercice: ${filterExercise}`);
    if (searchQuery) activeFilters.push(`Recherche: ${searchQuery}`);

    const renderItem = ({ item }: { item: TrackingRecord }) => {
        const dateObj = new Date(item.date);
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
                .join('\n');
        } catch (e) {
            console.error('Error parsing setsData', e);
        }

        return (
            <TouchableOpacity
                style={styles.recordItem}
                onPress={() => navigation.navigate('TrackingDetail', { tracking: item })}
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
                accessibilityLabel={`Enregistrement du ${formattedDate} pour ${item.exerciseName}`}
            >
                <Text style={styles.recordTitle}>
                    {item.exerciseName} - {formattedDate}
                </Text>
                <Text style={styles.recordSummary}>{setSummary}</Text>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Chargement des données de suivi...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Summary Header */}
            <View style={styles.summaryHeader}>
                <Text style={styles.summaryText}>Séances: {totalSessions}</Text>
                <Text style={styles.summaryText}>Poids total: {totalWeightLifted.toFixed(0)} kg</Text>
            </View>

            {/* Search Bar */}
            <TextInput
                style={styles.searchBar}
                placeholder="Search exercises..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
            />

            {/* Muscle Group Filter Bar */}
            <MuscleGroupFilterBar
                groups={availableMuscleGroups}
                activeGroup={filterMuscleGroup}
                onFilterChange={(selectedGroup) => {
                    setFilterMuscleGroup(selectedGroup);
                    // Reset exercise filter only if current selected exercise doesn't belong to the chosen group.
                    if (
                        filterExercise !== 'All' &&
                        exerciseMapping[filterExercise] !== selectedGroup
                    ) {
                        setFilterExercise('All');
                    }
                }}
            />

            {/* Exercise Filter Bar */}
            <ExerciseFilterBar
                exercises={filteredExercises}
                onFilterChange={(selectedExercise, query) => {
                    setFilterExercise(selectedExercise);
                    // Search query is controlled by the separate search bar.
                }}
            />

            {/* Active Filter Badges */}
            {activeFilters.length > 0 && (
                <View style={styles.activeFiltersContainer}>
                    {activeFilters.map((filter, idx) => (
                        <View key={idx} style={styles.filterBadge}>
                            <Text style={styles.filterBadgeText}>{filter}</Text>
                        </View>
                    ))}
                </View>
            )}

            <FlatList
                data={filteredTrackings}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.contentContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.emptyStateContainer}>
                        <Text style={styles.emptyStateText}>
                            Aucun enregistrement trouvé. Essayez d'ajuster vos filtres.
                        </Text>
                    </View>
                }
            />

            {/* Persistent Action Button */}
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
        paddingBottom: 80, // Extra space for persistent button.
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
        ...ButtonStyles.container,
    },
});

export default TrackingScreen;
