// src/screens/TrackingScreen.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Dimensions,
    LayoutChangeEvent,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LineChart } from 'react-native-chart-kit';
import { API, graphqlOperation } from 'aws-amplify';
import { listExerciseTrackings } from '../graphql/queries';
import { useAuth } from '../context/AuthContext';
import { TextStyles } from '../styles/TextStyles';
import { ButtonStyles } from '../styles/ButtonStyles';
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

const TrackingScreen: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'performances' | 'mensurations'>('performances');
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { user } = useAuth();

    const [trackings, setTrackings] = useState<TrackingRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

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
            console.error('Erreur lors du chargement des suivis', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrackings();
    }, [user]);

    const [exerciseMapping] = useState<{ [key: string]: ExerciseInfo }>({
        "Développé couché": { muscleGroup: "Pectoraux", exerciseType: "normal" },
        "Squat": { muscleGroup: "Jambes", exerciseType: "normal" },
    });
    const [availableMuscleGroups] = useState<string[]>(["Pectoraux", "Jambes"]);

    const recentExercises = useMemo(() => {
        const uniqueExercises: { [key: string]: TrackingRecord } = {};
        const sorted = [...trackings].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        sorted.forEach((tracking) => {
            if (!uniqueExercises[tracking.exerciseName]) {
                uniqueExercises[tracking.exerciseName] = tracking;
            }
        });
        return Object.values(uniqueExercises).slice(0, 2);
    }, [trackings]);

    const compute1RM = (reps: number, weight: number): number => {
        return weight * (1 + reps / 30);
    };

    const getMiniChartDataForExercise = (exerciseName: string) => {
        const now = new Date();
        const threshold = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
        const totalDays = Math.floor((now.getTime() - threshold.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const data: (number | null)[] = new Array(totalDays).fill(null);
        const labels: string[] = new Array(totalDays).fill('');

        const sessions = trackings
            .filter((t) => {
                if (t.exerciseName !== exerciseName) return false;
                const d = new Date(t.date);
                return d >= threshold && d <= now;
            })
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        sessions.forEach((session) => {
            try {
                const sessionDate = new Date(session.date);
                const daysSinceThreshold = Math.floor(
                    (sessionDate.getTime() - threshold.getTime()) / (1000 * 60 * 60 * 24)
                );
                if (daysSinceThreshold >= 0 && daysSinceThreshold < totalDays) {
                    const sets = JSON.parse(session.setsData);
                    if (!Array.isArray(sets)) return;
                    const max1RM = Math.max(
                        ...sets.map((set: { reps: number; weight: number }) =>
                            compute1RM(set.reps, set.weight)
                        )
                    );
                    data[daysSinceThreshold] = max1RM;
                }
            } catch (error) {
                console.error(`Erreur lors du calcul de 1RM pour ${session.id}:`, error);
            }
        });

        // Création des labels au format "jj/mm" (ex: "29/09")
        for (let i = 0; i < totalDays; i++) {
            const currentDate = new Date(threshold);
            currentDate.setDate(currentDate.getDate() + i);
            const day = ('0' + currentDate.getDate()).slice(-2);
            const month = ('0' + (currentDate.getMonth() + 1)).slice(-2);
            labels[i] = `${day}/${month}`;
        }

        // Filtrer les données pour ne garder que les points valides
        const validData: number[] = [];
        const validLabels: string[] = [];
        data.forEach((value, index) => {
            if (value !== null && !isNaN(value)) {
                validData.push(value);
                validLabels.push(labels[index]);
            }
        });

        console.log(`Données filtrées pour ${exerciseName}:`, { validData, validLabels });
        return { data: validData, labels: validLabels, hasData: validData.length > 0 };
    };

    const MiniChart: React.FC<{ exerciseName: string }> = ({ exerciseName }) => {
        const { data, labels, hasData } = getMiniChartDataForExercise(exerciseName);
        const [chartWidth, setChartWidth] = useState(Dimensions.get('window').width - 32);
        const chartHeight = 220;

        const handleLayout = (event: LayoutChangeEvent) => {
            const { width } = event.nativeEvent.layout;
            console.log(`Largeur du conteneur pour ${exerciseName}:`, width);
            setChartWidth(width);
        };

        if (!hasData) {
            return (
                <View style={styles.chartContainer}>
                    <Text style={[TextStyles.subSimpleText, { textAlign: 'center' }]}>
                        Aucune donnée disponible pour {exerciseName}
                    </Text>
                </View>
            );
        }

        return (
            <View style={styles.chartContainer} onLayout={handleLayout}>
                <LineChart
                    data={{
                        labels,
                        datasets: [
                            {
                                data,
                                strokeWidth: 2,
                                withDots: true,
                            },
                        ],
                    }}
                    width={chartWidth}
                    height={chartHeight}
                    yAxisSuffix=" kg"
                    chartConfig={{
                        backgroundColor: '#fff',
                        backgroundGradientFrom: '#fff',
                        backgroundGradientTo: '#fff',
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(178, 26, 229, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(20, 18, 23, ${opacity})`,
                        propsForDots: {
                            r: '4',
                            strokeWidth: '1',
                            stroke: '#b21ae5',
                        },
                        propsForLabels: {
                            fontSize: 12,
                        },
                        fillShadowGradientOpacity: 0,
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

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={TextStyles.simpleText}>Chargement des données…</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={[TextStyles.headerText, { color: '#141217' }]}>Suivi</Text>
            </View>

            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'performances' && styles.activeTab]}
                    onPress={() => setActiveTab('performances')}
                >
                    <Text style={[TextStyles.simpleText, activeTab === 'performances' && { color: '#fff' }]}>
                        Performances
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'mensurations' && styles.activeTab]}
                    onPress={() => setActiveTab('mensurations')}
                >
                    <Text style={[TextStyles.simpleText, activeTab === 'mensurations' && { color: '#fff' }]}>
                        Mensurations
                    </Text>
                </TouchableOpacity>
            </View>

            {activeTab === 'performances' ? (
                <ScrollView style={styles.contentContainer}>
                    <Text style={[TextStyles.subTitle, styles.sectionTitle]}>Résumé général</Text>
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryBox}>
                            <Text style={[TextStyles.subSimpleText, styles.summaryBoxLabel]}>
                                Exos (7 derniers jours)
                            </Text>
                            <Text style={[TextStyles.simpleText, styles.summaryBoxValue]}>
                                {trackings.length}
                            </Text>
                        </View>
                        <View style={styles.summaryBox}>
                            <Text style={[TextStyles.subSimpleText, styles.summaryBoxLabel]}>
                                Poids total
                            </Text>
                            <Text style={[TextStyles.simpleText, styles.summaryBoxValue]}>
                                {trackings.reduce((sum, t) => {
                                    try {
                                        const sets = JSON.parse(t.setsData);
                                        const sessionTotal = sets.reduce(
                                            (s: number, set: { reps: number; weight: number }) =>
                                                s + set.reps * set.weight,
                                            0
                                        );
                                        return sum + sessionTotal;
                                    } catch {
                                        return sum;
                                    }
                                }, 0)}{' '}
                                kg
                            </Text>
                        </View>
                    </View>

                    <Text style={[TextStyles.subTitle, styles.sectionTitle]}>Exercices récents</Text>
                    {recentExercises.map((exercise) => (
                        <TouchableOpacity
                            key={exercise.id}
                            style={styles.exerciseCard}
                            onPress={() =>
                                navigation.navigate('RecentExercisesDetail', { exerciseName: exercise.exerciseName })
                            }
                        >
                            <View style={styles.exerciseCardContent}>
                                <View style={styles.exerciseBlock}>
                                    <Text style={[TextStyles.simpleText, styles.exerciseName]}>
                                        {exercise.exerciseName}
                                    </Text>
                                    <MiniChart exerciseName={exercise.exerciseName} />
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}

                    <Text style={[TextStyles.subTitle, styles.sectionTitle]}>Records</Text>
                    <View style={styles.recordsContainer}>
                        <Text style={[TextStyles.subSimpleText, styles.recordLine]}>
                            Tractions : 20 reps
                        </Text>
                        <Text style={[TextStyles.subSimpleText, styles.recordLine]}>
                            DC : 100 kg
                        </Text>
                    </View>

                    <View style={{ height: 120 }} />
                </ScrollView>
            ) : (
                <ScrollView style={styles.contentContainer}>
                    <Text style={[TextStyles.subTitle, styles.sectionTitle]}>Dernières mensurations</Text>
                    <View style={styles.measurementItem}>
                        <Text style={[TextStyles.simpleText, styles.measurementDate]}>
                            1 avr. 2025
                        </Text>
                        <Text style={[TextStyles.simpleText, styles.measurementValue]}>
                            Poids : 72 kg
                        </Text>
                        <Text style={[TextStyles.simpleText, styles.measurementValue]}>
                            Tour de bras : 34 cm
                        </Text>
                    </View>
                    <Text style={[TextStyles.subTitle, styles.sectionTitle]}>Graphiques</Text>
                    <View style={styles.mensuGraphPlaceholder}>
                        <Text style={[TextStyles.subSimpleText, { color: '#999' }]}>
                            Graphiques (Poids, tour de taille, etc.)
                        </Text>
                    </View>
                    <View style={{ height: 120 }} />
                </ScrollView>
            )}

            {activeTab === 'performances' ? (
                <TouchableOpacity
                    style={[
                        ButtonStyles.container,
                        {
                            marginHorizontal: 16,
                            marginBottom: 16,
                            alignSelf: 'center',
                            width: Dimensions.get('window').width - 32,
                        },
                    ]}
                    onPress={() => navigation.navigate('ManualTracking')}
                >
                    <Text style={ButtonStyles.text}>Ajouter un suivi manuel</Text>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    style={[
                        ButtonStyles.container,
                        {
                            marginHorizontal: 16,
                            marginBottom: 16,
                            alignSelf: 'center',
                            width: Dimensions.get('window').width - 32,
                        },
                    ]}
                    onPress={() => navigation.navigate('AddMeasurement')}
                >
                    <Text style={ButtonStyles.text}>+ Ajouter une mensuration</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

export default TrackingScreen;

const PURPLE = '#b21ae5';
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { paddingTop: 16, paddingHorizontal: 16, marginBottom: 8 },
    tabBar: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#F1F1F1',
    },
    tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center' },
    activeTab: { backgroundColor: PURPLE },
    contentContainer: { flex: 1, paddingHorizontal: 16 },
    sectionTitle: { marginVertical: 8 },
    summaryRow: { flexDirection: 'row', marginBottom: 16 },
    summaryBox: { flex: 1, backgroundColor: '#F1F1F1', padding: 12, borderRadius: 8, marginRight: 8 },
    summaryBoxLabel: { marginBottom: 4 },
    summaryBoxValue: {},
    exerciseCard: {
        backgroundColor: '#F1F1F1',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        width: '100%',
    },
    exerciseCardContent: {},
    exerciseBlock: { marginBottom: 16 },
    exerciseName: { marginBottom: 4 },
    chartContainer: {
        overflow: 'visible',
        borderRadius: 16,
        minHeight: 220,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 8,
    },
    recordsContainer: { backgroundColor: '#F1F1F1', borderRadius: 8, padding: 12 },
    recordLine: { marginBottom: 4 },
    measurementItem: { backgroundColor: '#F1F1F1', borderRadius: 8, padding: 12, marginBottom: 12 },
    measurementDate: { marginBottom: 4 },
    measurementValue: {},
    mensuGraphPlaceholder: {
        height: 140,
        backgroundColor: '#F8F8F8',
        borderRadius: 8,
        marginBottom: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
