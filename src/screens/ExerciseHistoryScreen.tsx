// src/screens/ExerciseHistoryScreen.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    SectionList,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Dimensions,
    LayoutChangeEvent,
} from 'react-native';
import { API, graphqlOperation } from 'aws-amplify';
import { listExerciseTrackings } from '../graphql/queries';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../types/NavigationTypes';
import { RouteProp, useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LineChart } from 'react-native-chart-kit';
import { TextStyles } from '../styles/TextStyles';

type ExerciseHistoryRouteProp = RouteProp<RootStackParamList, 'ExerciseHistory'>;
type NavigationProp = StackNavigationProp<RootStackParamList>;

interface TrackingRecord {
    id: string;
    userId: string;
    exerciseId: string;
    exerciseName: string;
    date: string; // ISO string
    setsData: string; // JSON représentant les résultats de chaque série
}

interface SectionData {
    title: string;
    data: TrackingRecord[];
}

const ExerciseHistoryScreen: React.FC = () => {
    const route = useRoute<ExerciseHistoryRouteProp>();
    const navigation = useNavigation<NavigationProp>();
    // Le nom de l'exercice sera affiché dans le header (défini via navigation)
    const { exerciseName } = route.params;
    const { user } = useAuth();
    const [trackings, setTrackings] = useState<TrackingRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    // Calcul du 1RM selon la formule : poids * (1 + reps/30)
    const compute1RM = (reps: number, weight: number): number => {
        return weight * (1 + reps / 30);
    };

    const fetchHistory = async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        try {
            const userId = user?.attributes?.sub || user?.username;
            const response: any = await API.graphql(
                graphqlOperation(listExerciseTrackings, {
                    filter: {
                        userId: { eq: userId },
                        exerciseName: { eq: exerciseName },
                    },
                    sortDirection: 'DESC',
                })
            );
            let items: TrackingRecord[] = response.data.listExerciseTrackings.items;
            // On trie les enregistrements par ordre décroissant (les plus récents en haut)
            items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setTrackings(items);
        } catch (error) {
            console.error('Error fetching exercise history', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchHistory();
        }, [user, exerciseName])
    );

    // Regroupement des sessions par mois
    const groupTrackingsByMonth = (trackings: TrackingRecord[]): SectionData[] => {
        const currentYear = new Date().getFullYear();
        const monthNames = [
            'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
        ];
        const groups: { [key: string]: SectionData } = {};

        trackings.forEach((item) => {
            const date = new Date(item.date);
            const year = date.getFullYear();
            const month = date.getMonth(); // 0-indexé
            const key = `${year}-${month}`;
            if (!groups[key]) {
                const title = (year === currentYear)
                    ? monthNames[month]
                    : `${monthNames[month]} ${year}`;
                groups[key] = { title, data: [] };
            }
            groups[key].data.push(item);
        });

        const sections = Object.values(groups);
        // Tri des sections par date décroissante (le mois le plus récent en haut)
        sections.sort((a, b) => {
            const dateA = new Date(a.data[0].date);
            const dateB = new Date(b.data[0].date);
            return dateB.getTime() - dateA.getTime();
        });
        return sections;
    };

    const sections = groupTrackingsByMonth(trackings);

    // Génération des données du graphique pour les 2 derniers mois
    const getChartData = () => {
        const now = new Date();
        const threshold = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
        const totalDays = Math.floor((now.getTime() - threshold.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const data: (number | null)[] = new Array(totalDays).fill(null);
        const labels: string[] = new Array(totalDays).fill('');

        // On trie les sessions par ordre croissant (du plus ancien au plus récent)
        const sessions = [...trackings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        sessions.forEach((session) => {
            try {
                const sessionDate = new Date(session.date);
                const dayIndex = Math.floor((sessionDate.getTime() - threshold.getTime()) / (1000 * 60 * 60 * 24));
                if (dayIndex >= 0 && dayIndex < totalDays) {
                    const sets = JSON.parse(session.setsData);
                    if (!Array.isArray(sets)) return;
                    const max1RM = Math.max(...sets.map((set: { reps: number; weight: number }) => compute1RM(set.reps, set.weight)));
                    data[dayIndex] = max1RM;
                }
            } catch (error) {
                console.error(`Erreur lors du calcul du graphique pour ${session.id}:`, error);
            }
        });
        for (let i = 0; i < totalDays; i++) {
            const currentDate = new Date(threshold);
            currentDate.setDate(currentDate.getDate() + i);
            const day = ('0' + currentDate.getDate()).slice(-2);
            const month = ('0' + (currentDate.getMonth() + 1)).slice(-2);
            labels[i] = `${day}/${month}`;
        }
        const validData: number[] = [];
        const validLabels: string[] = [];
        data.forEach((value, index) => {
            if (value !== null && !isNaN(value)) {
                validData.push(value);
                validLabels.push(labels[index]);
            }
        });
        return { data: validData, labels: validLabels, hasData: validData.length > 0 };
    };

    // Composant du graphique avec le titre "Évolution de la 1RM"
    const ExerciseChart: React.FC = () => {
        const { data, labels, hasData } = getChartData();
        const [chartWidth, setChartWidth] = useState(Dimensions.get('window').width - 32);
        const chartHeight = 220;

        const handleLayout = (event: LayoutChangeEvent) => {
            const { width } = event.nativeEvent.layout;
            setChartWidth(width);
        };

        if (!hasData) {
            return (
                <View style={styles.chartContainer}>
                    <Text style={[TextStyles.subSimpleText, { textAlign: 'center' }]}>
                        Aucune donnée disponible.
                    </Text>
                </View>
            );
        }

        return (
            <View style={styles.chartContainer} onLayout={handleLayout}>
                {/* Titre du graphique */}
                <Text style={[TextStyles.headerText, styles.chartTitle]}>
                    Évolution de la 1RM
                </Text>
                <LineChart
                    data={{
                        labels,
                        datasets: [{ data, strokeWidth: 2, withDots: true }],
                    }}
                    width={chartWidth}
                    height={chartHeight}
                    yAxisSuffix=" kg"
                    chartConfig={{
                        backgroundColor: '#fff',
                        backgroundGradientFrom: '#fff',
                        backgroundGradientTo: '#fff',
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(178,26,229,${opacity})`,
                        labelColor: (opacity = 1) => `rgba(20,18,23,${opacity})`,
                        propsForDots: {
                            r: '4',
                            strokeWidth: '1',
                            stroke: '#b21ae5',
                        },
                        propsForLabels: {
                            fontSize: 14,
                        },
                        paddingLeft: 20,
                        paddingRight: 40,
                    }}
                    bezier
                    fromZero
                    withInnerLines={false}
                    withOuterLines={true}
                    style={{
                        borderRadius: 16,
                        marginLeft: 10,
                        marginRight: 10,
                    }}
                />
            </View>
        );
    };

    const renderItem = ({ item }: { item: TrackingRecord }) => {
        const dateObj = new Date(item.date);
        // Format de date sans afficher l'heure
        const formattedDate = dateObj.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
        let setsData: { reps: number; weight: number }[] = [];
        try {
            setsData = JSON.parse(item.setsData);
        } catch (e) {
            console.error('Error parsing setsData', e);
        }
        return (
            <TouchableOpacity
                style={styles.trackingItem}
                onPress={() => navigation.navigate('TrackingDetail', { tracking: item })}
            >
                <View style={styles.itemHeader}>
                    <Text style={[TextStyles.simpleText, styles.dateText]}>{formattedDate}</Text>
                </View>
                <View style={styles.setsContainer}>
                    {setsData.map((set, index) => (
                        <View key={index} style={styles.setRow}>
                            <Text style={[TextStyles.simpleText, styles.setLabel]}>Série {index + 1}</Text>
                            <Text style={[TextStyles.simpleText, styles.setValue]}>
                                {set.reps} x {set.weight} kg
                            </Text>
                        </View>
                    ))}
                </View>
            </TouchableOpacity>
        );
    };

    const renderSectionHeader = ({ section }: { section: SectionData }) => (
        <View style={styles.sectionHeader}>
            <Text style={[TextStyles.headerText, styles.sectionHeaderText]}>{section.title}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#141217" />
                </View>
            ) : (
                <SectionList
                    ListHeaderComponent={<ExerciseChart />}
                    sections={sections}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    renderSectionHeader={renderSectionHeader}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={[TextStyles.simpleText, styles.emptyText]}>
                                Aucune session enregistrée pour cet exercice.
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

export default ExerciseHistoryScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
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
        padding: 16,
    },
    emptyText: {
        fontSize: 18,
        color: '#141217',
        textAlign: 'center',
    },
    listContent: {
        paddingBottom: 30,
    },
    // Titres de section (inspirés du TrackingScreen, sans fond)
    sectionHeader: {
        paddingVertical: 4,
        marginBottom: 8,
    },
    sectionHeaderText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#141217',
    },
    trackingItem: {
        backgroundColor: '#FAFAFA',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 3,
    },
    itemHeader: {
        marginBottom: 12,
    },
    dateText: {
        fontSize: 18,
        color: '#141217',
    },
    setsContainer: {
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 8,
    },
    setRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    setLabel: {
        fontSize: 18,
        color: '#141217',
    },
    setValue: {
        fontSize: 18,
        color: '#141217',
        fontWeight: 'bold',
    },
    chartContainer: {
        borderRadius: 16,
        minHeight: 220,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    chartTitle: {
        marginBottom: 8,
        fontSize: 22,
        fontWeight: '600',
        color: '#141217',
    },
});
