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

interface TrackingRecord {
    id: string;
    userId: string;
    exerciseId: string;
    exerciseName: string;
    date: string;
    setsData: string;
}

interface ExerciseInfo {
    muscleGroup: string;
    exerciseType?: string;
}

const RecentExercisesDetailScreen: React.FC = () => {
    const { user } = useAuth();
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

    const [trackings, setTrackings] = useState<TrackingRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [filterExercise, setFilterExercise] = useState<string>('Tous');
    const [filterMuscleGroup, setFilterMuscleGroup] = useState<string>('Tous');
    const [availableMuscleGroups, setAvailableMuscleGroups] = useState<string[]>([]);
    const [exerciseMapping, setExerciseMapping] = useState<{ [key: string]: ExerciseInfo }>({});

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
            items.forEach((ex: any) => {
                if (ex.name && ex.muscleGroup) {
                    mapping[ex.name] = { muscleGroup: ex.muscleGroup, exerciseType: ex.exerciseType };
                    groups.push(ex.muscleGroup);
                }
            });
            console.log('fetchExercises:', { mapping, groups });
            setExerciseMapping(mapping);
            setAvailableMuscleGroups(Array.from(new Set(groups)));
        } catch (error) {
            console.error('Erreur lors du chargement des exercices', error);
            Alert.alert('Erreur', 'Impossible de charger les groupes musculaires.');
        }
    };

    useFocusEffect(
        useCallback(() => {
            console.log('useFocusEffect triggered');
            fetchTrackings();
        }, [user])
    );

    useEffect(() => {
        console.log('useEffect for trackings triggered');
        fetchTrackings();
    }, [user]);

    useEffect(() => {
        console.log('useEffect for exercises triggered');
        fetchExercises();
    }, [user]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchTrackings();
        await fetchExercises();
        setRefreshing(false);
    };

    const handleMuscleGroupChange = (selectedGroup: string) => {
        console.log('handleMuscleGroupChange:', selectedGroup);
        setFilterMuscleGroup(selectedGroup);
        if (filterExercise !== 'Tous' && exerciseMapping[filterExercise]?.muscleGroup !== selectedGroup) {
            console.log('Resetting filterExercise to Tous due to muscle group change');
            setFilterExercise('Tous');
        }
    };

    const handleExerciseFilterChange = (selectedExercise: string, _searchQuery: string) => {
        console.log('handleExerciseFilterChange:', { selectedExercise, _searchQuery });
        setFilterExercise(selectedExercise);
    };

    const uniqueExercises = Array.from(new Set(trackings.map((t) => t.exerciseName)));
    const filteredExercises = filterMuscleGroup === 'Tous'
        ? uniqueExercises
        : uniqueExercises.filter((ex) => exerciseMapping[ex]?.muscleGroup === filterMuscleGroup);

    const filteredTrackings = trackings.filter((tracking) => {
        const exerciseMatch = filterExercise === 'Tous' || tracking.exerciseName === filterExercise;
        const muscleMatch =
            filterMuscleGroup === 'Tous' ||
            exerciseMapping[tracking.exerciseName]?.muscleGroup === filterMuscleGroup;
        const searchMatch =
            searchQuery.trim() === '' ||
            tracking.exerciseName.toLowerCase().includes(searchQuery.toLowerCase());
        const result = exerciseMatch && muscleMatch && searchMatch;
        console.log('Filtering:', { tracking: tracking.exerciseName, exerciseMatch, muscleMatch, searchMatch, result });
        return result;
    });

    const renderTrackingItem = ({ item }: { item: TrackingRecord }) => {
        const dateObj = new Date(item.date);
        const formattedDate = `${String(dateObj.getDate()).padStart(2, '0')}/${String(
            dateObj.getMonth() + 1
        ).padStart(2, '0')}`;
        return (
            <TouchableOpacity
                style={styles.trackingItem}
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
            >
                <Text style={TextStyles.simpleText}>
                    {item.exerciseName} - {formattedDate}
                </Text>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={TextStyles.simpleText}>Chargement des données…</Text>
            </View>
        );
    }

    console.log('Rendering with:', { trackings: trackings.length, filteredTrackings: filteredTrackings.length, filterExercise, filterMuscleGroup });

    return (
        <View style={styles.container}>
            <Text style={[TextStyles.headerText, styles.headerText]}>
                Exercices récents détaillés
            </Text>
            <TextInput
                style={styles.searchInput}
                placeholder="Rechercher un exercice…"
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
            />
            <MuscleGroupFilterBar
                groups={availableMuscleGroups}
                activeGroup={filterMuscleGroup}
                onFilterChange={handleMuscleGroupChange}
            />
            <ExerciseFilterBar
                exercises={filteredExercises}
                initialActiveFilter={filterExercise}
                onFilterChange={handleExerciseFilterChange}
            />

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