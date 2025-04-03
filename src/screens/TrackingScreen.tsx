// src/screens/TrackingScreen.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LineChart } from 'react-native-chart-kit';
import { API, graphqlOperation } from 'aws-amplify';
import { listExerciseTrackings } from '../graphql/queries';
import { useAuth } from '../context/AuthContext';
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
        const sorted = [...trackings].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        return sorted.slice(0, 2).map((t) => t.exerciseName);
    }, [trackings]);

    const compute1RM = (reps: number, weight: number) => {
        return weight * (1 + reps / 30);
    };

    // Fonction pour obtenir les labels des 3 derniers mois
    const getLastThreeMonthsLabels = () => {
        const now = new Date();
        const months = [];
        for (let i = 2; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = date.toLocaleString('fr-FR', { month: 'short' });
            months.push(monthName);
        }
        return months; // Par exemple: ["janv.", "févr.", "mars"]
    };

    // Fonction pour générer les données du graphique sur les 3 derniers mois
    const getMiniChartDataForExercise = (exerciseName: string) => {
        const now = new Date();
        const threshold = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        const sessions = trackings
            .filter((t) => {
                if (t.exerciseName !== exerciseName) return false;
                const d = new Date(t.date);
                return d >= threshold;
            })
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Créer un axe virtuel avec 90 points (un par jour sur 3 mois)
        const totalDays = 90; // Approximativement 3 mois
        const data: number[] = new Array(totalDays).fill(null); // Remplir avec null pour les jours sans données

        // Calculer les positions des séances sur l'axe des x
        sessions.forEach((session) => {
            try {
                const sessionDate = new Date(session.date);
                const daysSinceThreshold = Math.floor(
                    (sessionDate.getTime() - threshold.getTime()) / (1000 * 60 * 60 * 24)
                );
                if (daysSinceThreshold >= 0 && daysSinceThreshold < totalDays) {
                    const sets = JSON.parse(session.setsData);
                    const max1RM = Math.max(
                        ...sets.map((set: { reps: number; weight: number }) =>
                            compute1RM(set.reps, set.weight)
                        )
                    );
                    data[daysSinceThreshold] = max1RM;
                }
            } catch (error) {
                console.error('Erreur lors du calcul de la 1RM', error);
            }
        });

        // Labels pour l'axe des x (seulement les 3 mois)
        const labels = getLastThreeMonthsLabels();

        return { data, labels };
    };

    const MiniChart: React.FC<{ exerciseName: string }> = ({ exerciseName }) => {
        const { data, labels } = getMiniChartDataForExercise(exerciseName);
        const [chartWidth, setChartWidth] = useState(Dimensions.get("window").width - 56);
        const chartHeight = 220;

        const handleLayout = (event: any) => {
            const { width } = event.nativeEvent.layout;
            setChartWidth(width);
        };

        return (
            <View style={styles.chartContainer} onLayout={handleLayout}>
                <LineChart
                    data={{
                        labels: labels,
                        datasets: [
                            {
                                data: data,
                                strokeWidth: 2,
                                withDots: true,
                            },
                        ],
                    }}
                    width={chartWidth}
                    height={chartHeight}
                    yAxisSuffix=" kg"
                    chartConfig={{
                        backgroundColor: "#fff",
                        backgroundGradientFrom: "#fff",
                        backgroundGradientTo: "#fff",
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(178,26,229, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(20,18,23, ${opacity})`,
                        propsForDots: {
                            r: "4",
                            strokeWidth: "1",
                            stroke: "#b21ae5",
                        },
                        propsForVerticalLabels: {
                            fontSize: 12,
                        },
                        propsForHorizontalLabels: {
                            fontSize: 12,
                        },
                        // Ajuster les labels pour qu'ils soient espacés comme des mois
                        formatXLabel: (value, index) => {
                            // Afficher uniquement les labels aux positions correspondant aux mois
                            const positions = [0, 30, 60]; // Approximativement le début de chaque mois
                            return positions.includes(index) ? labels[positions.indexOf(index)] : '';
                        },
                    }}
                    fromZero={true}
                    yAxisInterval={20}
                    segments={5}
                    style={{ borderRadius: 16 }}
                    withCustomGrid={true}
                    // S'assurer que les points sont dessinés même pour les valeurs nulles (mais sans ligne)
                    withInnerLines={false}
                    withOuterLines={true}
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
            {/* HEADER */}
            <View style={styles.header}>
                <Text style={[TextStyles.headerText, { color: '#141217' }]}>Suivi</Text>
            </View>

            {/* ONGLETS */}
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

            {/* CONTENU */}
            {activeTab === 'performances' ? (
                <ScrollView style={styles.contentContainer}>
                    {/* RÉSUMÉ GÉNÉRAL */}
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
                                            (s: number, set: { reps: number; weight: number }) => s + set.reps * set.weight,
                                            0
                                        );
                                        return sum + sessionTotal;
                                    } catch {
                                        return sum;
                                    }
                                }, 0)}{" "}
                                kg
                            </Text>
                        </View>
                    </View>

                    {/* EXERCICES RÉCENTS */}
                    <Text style={[TextStyles.subTitle, styles.sectionTitle]}>Exercices récents</Text>
                    <TouchableOpacity
                        style={styles.exerciseCard}
                        onPress={() => navigation.navigate('RecentExercisesDetail')}
                    >
                        <View style={styles.exerciseCardContent}>
                            {recentExercises.map((exerciseName, index) => (
                                <View key={`${exerciseName}-${index}`} style={styles.exerciseBlock}>
                                    <Text style={[TextStyles.simpleText, styles.exerciseName]}>
                                        {exerciseName}
                                    </Text>
                                    <MiniChart exerciseName={exerciseName} />
                                </View>
                            ))}
                        </View>
                    </TouchableOpacity>

                    {/* RECORDS */}
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
                    {/* ONGLET MENSURATIONS */}
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

            {/* BOUTON FLOTTANT */}
            {activeTab === 'performances' ? (
                <TouchableOpacity
                    style={styles.floatingButton}
                    onPress={() => {
                        // TODO: Navigation vers l'écran d'ajout de suivi manuel
                    }}
                >
                    <Text style={TextStyles.simpleText}>Ajouter un suivi manuel</Text>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    style={styles.floatingButton}
                    onPress={() => {
                        // TODO: Navigation vers l'écran d'ajout de mensuration
                    }}
                >
                    <Text style={TextStyles.simpleText}>+ Ajouter une mensuration</Text>
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
        width: "100%",
    },
    exerciseCardContent: {},
    exerciseBlock: { marginBottom: 16 },
    exerciseName: { marginBottom: 4 },
    chartContainer: {
        overflow: 'hidden',
        borderRadius: 16,
    },
    miniGraph: {
        width: Dimensions.get("window").width - 40,
        height: 220,
        backgroundColor: '#E2E2E2',
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    miniGraphText: {},
    recordsContainer: {
        backgroundColor: '#F1F1F1',
        borderRadius: 8,
        padding: 12,
    },
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
    floatingButton: {
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 16,
        backgroundColor: PURPLE,
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
    },
});