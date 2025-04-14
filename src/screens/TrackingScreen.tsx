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
import { listExerciseTrackings, listMensurations, listMeasures } from '../graphql/queries';
import { createMeasure, createMensuration, updateMensuration, deleteMensuration } from '../graphql/mutations';
import { useAuth } from '../context/AuthContext';
import { TextStyles } from '../styles/TextStyles';
import { ButtonStyles } from '../styles/ButtonStyles';
import type { RootStackParamList } from '../types/NavigationTypes';
import AddMeasureModal from '../components/AddMeasureModal';
import AddMensurationModal from '../components/AddMensurationModal';
import EditMensurationModal from '../components/EditMensurationModal';

// --- Types pour les Performances ---
interface TrackingRecord {
    id: string;
    userId: string;
    exerciseId: string;
    exerciseName: string;
    date: string;
    setsData: string;
}

// --- Types pour les Mensurations ---
export interface MeasurementType {
    id: string;
    userId: string;
    name: string; // ex: "Tour de bras", "Poids", etc.
    unit?: string; // ex: "cm", "kg"
    createdAt: string;
    updatedAt: string;
    owner: string;
}

export interface Measure {
    id: string;
    mensurationId: string; // Référence vers la mensuration
    userId: string;
    date: string;
    value: number;
    owner: string;
}

const TrackingScreen: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'performances' | 'mensurations'>('performances');
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { user } = useAuth();

    // Performances state
    const [trackings, setTrackings] = useState<TrackingRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    // Measurements state
    const [measurementTypes, setMeasurementTypes] = useState<MeasurementType[]>([]);
    const [measures, setMeasures] = useState<Measure[]>([]);
    const [loadingMeasurements, setLoadingMeasurements] = useState<boolean>(true);
    const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
    const [chartWidth, setChartWidth] = useState(Dimensions.get('window').width - 32);

    // Modals
    const [addMeasureModalVisible, setAddMeasureModalVisible] = useState(false);
    const [addMensurationModalVisible, setAddMensurationModalVisible] = useState(false);
    const [editMensurationModalVisible, setEditMensurationModalVisible] = useState(false);
    const [editingMensuration, setEditingMensuration] = useState<MeasurementType | null>(null);

    // --- Fetch Performances ---
    const fetchTrackings = async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        try {
            const response: any = await API.graphql(
                graphqlOperation(listExerciseTrackings, {
                    filter: { userId: { eq: user.attributes?.sub || user.username } },
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

    // --- Fetch Measurements (Mensurations) ---
    const fetchMeasurementTypes = async () => {
        if (!user) return;
        try {
            const response: any = await API.graphql(
                graphqlOperation(listMensurations, {
                    filter: { userId: { eq: user.attributes?.sub || user.username } },
                })
            );
            const types: MeasurementType[] = response.data.listMensurations.items;
            setMeasurementTypes(types);
            if (types.length > 0 && !selectedTypeId) {
                setSelectedTypeId(types[0].id);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des types de mensurations', error);
        }
    };

    const fetchMeasures = async () => {
        if (!user) return;
        try {
            const response: any = await API.graphql(
                graphqlOperation(listMeasures, {
                    filter: { userId: { eq: user.attributes?.sub || user.username } },
                })
            );
            const m: Measure[] = response.data.listMeasures.items;
            setMeasures(m);
        } catch (error) {
            console.error('Erreur lors du chargement des mesures', error);
        } finally {
            setLoadingMeasurements(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'mensurations') {
            const fetchData = async () => {
                await fetchMeasurementTypes();
                await fetchMeasures();
            };
            fetchData();
        }
    }, [user, activeTab]);

    // --- Performances Calculations ---
    const currentStreak = useMemo(() => {
        const trainingDaysSet = new Set<number>();
        trackings.forEach((t) => {
            const d = new Date(t.date);
            d.setHours(0, 0, 0, 0);
            trainingDaysSet.add(d.getTime());
        });
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTime = today.getTime();
        if (!trainingDaysSet.has(todayTime)) return 0;
        let streak = 0;
        let dayToCheck = todayTime;
        while (trainingDaysSet.has(dayToCheck)) {
            streak++;
            dayToCheck -= 86400000;
        }
        return streak;
    }, [trackings]);

    const recentExercises = useMemo(() => {
        const uniqueExercises: { [key: string]: TrackingRecord } = {};
        const sorted = [...trackings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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

    // --- MiniChart for Performances ---
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
                        ...sets.map((set: { reps: number; weight: number }) => compute1RM(set.reps, set.weight))
                    );
                    data[daysSinceThreshold] = max1RM;
                }
            } catch (error) {
                console.error(`Erreur lors du calcul de 1RM pour ${session.id}:`, error);
            }
        });

        for (let i = 0; i < totalDays; i++) {
            const currentDate = new Date(threshold);
            currentDate.setDate(currentDate.getDate() + i);
            const day = ('0' + currentDate.getDate()).slice(-2);
            const month = ('0' + (currentDate.getMonth() + 1)).slice(-2);
            labels[i] = `${day}/${month}`;
        }

        let validData: number[] = [];
        let validLabels: string[] = [];
        data.forEach((value, index) => {
            if (value !== null && !isNaN(value)) {
                validData.push(value);
                validLabels.push(labels[index]);
            }
        });

        if (validData.length >= 4) {
            const points = validData.map((value, index) => ({ value, label: validLabels[index] }));
            const sortedValues = [...validData].sort((a, b) => a - b);
            const q1 = sortedValues[Math.floor(validData.length / 4)];
            const q3 = sortedValues[Math.floor((validData.length * 3) / 4)];
            const iqr = q3 - q1;
            const lowerBound = q1 - 1.5 * iqr;
            const upperBound = q3 + 1.5 * iqr;
            const filteredPoints = points.filter(point => point.value >= lowerBound && point.value <= upperBound);
            validData = filteredPoints.map(point => point.value);
            validLabels = filteredPoints.map(point => point.label);
        }

        return { data: validData, labels: validLabels, hasData: validData.length > 0 };
    };

    const MiniChart: React.FC<{ exerciseName: string }> = ({ exerciseName }) => {
        const { data, labels, hasData } = getMiniChartDataForExercise(exerciseName);
        const [chartWidthLocal, setChartWidthLocal] = useState(Dimensions.get('window').width - 32);
        const chartHeight = 220;

        const handleLayout = (event: LayoutChangeEvent) => {
            const { width } = event.nativeEvent.layout;
            setChartWidthLocal(width);
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
                        datasets: [{ data, strokeWidth: 2, withDots: true }],
                    }}
                    width={chartWidthLocal}
                    height={chartHeight}
                    yAxisSuffix=" kg"
                    chartConfig={{
                        backgroundColor: '#fff',
                        backgroundGradientFrom: '#fff',
                        backgroundGradientTo: '#fff',
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(178, 26, 229, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(20, 18, 23, ${opacity})`,
                        propsForDots: { r: '4', strokeWidth: '1', stroke: '#b21ae5' },
                        propsForLabels: { fontSize: 12 },
                    }}
                    bezier
                    fromZero
                    withInnerLines={false}
                    withOuterLines={true}
                    style={{ borderRadius: 16 }}
                />
            </View>
        );
    };

    // --- Measurements Summary Data ---
    const summaryData = useMemo(() => {
        return measurementTypes.map((type) => {
            const measuresForType = measures
                .filter((m) => m.mensurationId === type.id)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            const latest = measuresForType[0];
            return { ...type, latestValue: latest ? latest.value : null };
        });
    }, [measurementTypes, measures]);

    // --- Measurements Chart Data for Selected Type ---
    const chartData = useMemo(() => {
        if (!selectedTypeId) return { labels: [], data: [] };
        const filtered = measures
            .filter((m) => m.mensurationId === selectedTypeId)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const labels: string[] = [];
        const data: number[] = [];
        filtered.forEach((m) => {
            const d = new Date(m.date);
            const day = ('0' + d.getDate()).slice(-2);
            const month = ('0' + (d.getMonth() + 1)).slice(-2);
            labels.push(`${day}/${month}`);
            data.push(m.value);
        });
        return { labels, data };
    }, [selectedTypeId, measures]);

    // --- Measurements Grouped History ---
    const groupedHistory = useMemo(() => {
        const groups: { [date: string]: Measure[] } = {};
        measures.forEach((m) => {
            const d = new Date(m.date);
            const formatted = `${('0' + d.getDate()).slice(-2)}/${('0' + (d.getMonth() + 1)).slice(-2)}/${d.getFullYear()}`;
            if (!groups[formatted]) groups[formatted] = [];
            groups[formatted].push(m);
        });
        const sortedDates = Object.keys(groups).sort((a, b) => {
            const da = new Date(a.split('/').reverse().join('-')).getTime();
            const db = new Date(b.split('/').reverse().join('-')).getTime();
            return db - da;
        });
        return sortedDates.map((date) => ({ date, measures: groups[date] }));
    }, [measures]);

    const handleChartLayout = (event: LayoutChangeEvent) => {
        const { width } = event.nativeEvent.layout;
        setChartWidth(width);
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
            {/* Header */}
            <View style={styles.header}>
                <Text style={[TextStyles.headerText, { color: '#141217' }]}>Suivi</Text>
            </View>

            {/* Tab Bar */}
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

            {/* Content */}
            {activeTab === 'performances' ? (
                <ScrollView style={styles.contentContainer}>
                    <Text style={[TextStyles.subTitle, styles.sectionTitle]}>Résumé général</Text>
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryBox}>
                            <Text style={[TextStyles.subSimpleText, styles.summaryBoxLabel]}>
                                Exos (7 derniers jours)
                            </Text>
                            <Text style={[TextStyles.simpleText, styles.summaryBoxValue]}>{trackings.length}</Text>
                        </View>
                        <View style={styles.summaryBox}>
                            <Text style={[TextStyles.subSimpleText, styles.summaryBoxLabel]}>
                                Jours consécutifs
                            </Text>
                            <Text style={[TextStyles.simpleText, styles.summaryBoxValue]}>
                                {currentStreak} {currentStreak === 1 ? 'jour' : 'jours'}
                            </Text>
                        </View>
                    </View>

                    <Text style={[TextStyles.subTitle, styles.sectionTitle]}>Exercices récents</Text>
                    <View style={styles.exercisesContainer}>
                        {recentExercises.map((exercise) => (
                            <TouchableOpacity
                                key={exercise.id}
                                style={styles.exerciseItem}
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
                    </View>

                    <Text style={[TextStyles.subTitle, styles.sectionTitle]}>Records</Text>
                    <View style={styles.recordsContainer}>
                        <Text style={[TextStyles.subSimpleText, styles.recordLine]}>Tractions : 20 reps</Text>
                        <Text style={[TextStyles.subSimpleText, styles.recordLine]}>DC : 100 kg</Text>
                    </View>
                    <View style={{ height: 120 }} />
                </ScrollView>
            ) : (
                <ScrollView style={styles.contentContainer} contentContainerStyle={{ paddingBottom: 120 }}>
                    {/* Header for Mensurations (sans le sous-titre) */}
                    <Text style={[TextStyles.headerText, { color: '#141217', marginBottom: 16 }]}>
                        Suivi des mensurations
                    </Text>
                    {/* Measurements Summary (grid) */}
                    <Text style={[TextStyles.subTitle, styles.sectionTitle]}>Résumé rapide</Text>
                    <View style={styles.gridContainer}>
                        {summaryData.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.card}
                                onLongPress={() => {
                                    setEditingMensuration(item);
                                    setEditMensurationModalVisible(true);
                                }}
                                onPress={() => setSelectedTypeId(item.id)}
                            >
                                <Text style={styles.cardEmoji}>
                                    {item.name.toLowerCase().includes('poids')
                                        ? '⚖️'
                                        : item.name.toLowerCase().includes('bras')
                                            ? '💪'
                                            : item.name.toLowerCase().includes('taille')
                                                ? '📏'
                                                : '📊'}
                                </Text>
                                <Text style={styles.cardTitle}>{item.name}</Text>
                                <Text style={styles.cardValue}>
                                    {item.latestValue !== null ? `${item.latestValue} ${item.unit || ''}` : 'Pas de donnée'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    {/* Evolution Chart */}
                    <Text style={[TextStyles.subTitle, styles.sectionTitle]}>Évolution</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelector}>
                        {measurementTypes.map((type) => (
                            <TouchableOpacity
                                key={type.id}
                                style={[styles.typeTab, selectedTypeId === type.id && { backgroundColor: '#b21ae5' }]}
                                onPress={() => setSelectedTypeId(type.id)}
                            >
                                <Text style={[TextStyles.simpleText, { color: selectedTypeId === type.id ? '#fff' : '#141217' }]}>
                                    {type.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <View style={styles.chartWrapper} onLayout={handleChartLayout}>
                        {chartData.data.length > 0 ? (
                            <LineChart
                                data={{ labels: chartData.labels, datasets: [{ data: chartData.data, strokeWidth: 2 }] }}
                                width={chartWidth}
                                height={220}
                                yAxisSuffix={measurementTypes.find((t) => t.id === selectedTypeId)?.unit || ''}
                                chartConfig={{
                                    backgroundColor: '#fff',
                                    backgroundGradientFrom: '#fff',
                                    backgroundGradientTo: '#fff',
                                    decimalPlaces: 0,
                                    color: (opacity = 1) => `rgba(178, 26, 229, ${opacity})`,
                                    labelColor: (opacity = 1) => `rgba(20, 18, 23, ${opacity})`,
                                    propsForDots: { r: '4', strokeWidth: '1', stroke: '#b21ae5' },
                                    propsForLabels: { fontSize: 12 },
                                }}
                                bezier
                                fromZero
                                withInnerLines={false}
                                withOuterLines={true}
                                style={{ borderRadius: 16 }}
                            />
                        ) : (
                            <Text style={[TextStyles.subSimpleText, { textAlign: 'center' }]}>
                                Aucune donnée pour ce type
                            </Text>
                        )}
                    </View>
                    {/* Measurements History */}
                    <Text style={[TextStyles.subTitle, styles.sectionTitle]}>Historique</Text>
                    {groupedHistory.map((group) => (
                        <View key={group.date} style={styles.historyGroup}>
                            <Text style={styles.historyDate}>📅 {group.date}</Text>
                            <Text style={styles.historyEntry}>
                                {group.measures
                                    .map((m) => {
                                        const type = measurementTypes.find((t) => t.id === m.mensurationId);
                                        return type ? `${type.name} : ${m.value} ${type.unit || ''}` : '';
                                    })
                                    .join(' | ')}
                            </Text>
                        </View>
                    ))}
                    {/* CTA Buttons for Measurements */}
                    <TouchableOpacity
                        style={[ButtonStyles.container, { marginBottom: 12 }]}
                        onPress={() => setAddMeasureModalVisible(true)}
                    >
                        <Text style={ButtonStyles.text}>+ Ajouter une mesure</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={ButtonStyles.invertedContainer}
                        onPress={() => setAddMensurationModalVisible(true)}
                    >
                        <Text style={ButtonStyles.invertedText}>+ Ajouter une mensuration</Text>
                    </TouchableOpacity>
                </ScrollView>
            )}

            {activeTab === 'performances' ? (
                <TouchableOpacity
                    style={[
                        ButtonStyles.container,
                        { marginHorizontal: 16, marginBottom: 16, alignSelf: 'center', width: Dimensions.get('window').width - 32 },
                    ]}
                    onPress={() => navigation.navigate('ManualTracking')}
                >
                    <Text style={ButtonStyles.text}>Ajouter un suivi manuel</Text>
                </TouchableOpacity>
            ) : null}

            {/* Modals */}
            <AddMeasureModal
                visible={addMeasureModalVisible}
                onClose={() => setAddMeasureModalVisible(false)}
                measurementDate={new Date()}
                measurementTypes={measurementTypes}
                onSubmit={async (formData) => {
                    if (!user) return;
                    for (const id in formData) {
                        const input = {
                            userId: user.attributes?.sub || user.username,
                            mensurationId: id,
                            date: formData.date, // Utilisation de la date sélectionnée dans le modal
                            value: formData[id].value,
                        };
                        try {
                            await API.graphql(graphqlOperation(createMeasure, { input }));
                        } catch (error) {
                            console.error("Erreur lors de la création de la mesure", error);
                        }
                    }
                    await fetchMeasures();
                }}
            />

            <AddMensurationModal
                visible={addMensurationModalVisible}
                onClose={() => setAddMensurationModalVisible(false)}
                onSubmit={async (name: string, unit?: string) => {
                    if (!user) return;
                    const input = {
                        userId: user.attributes?.sub || user.username,
                        name,
                        unit,
                    };
                    try {
                        await API.graphql(graphqlOperation(createMensuration, { input }));
                        await fetchMeasurementTypes();
                    } catch (error) {
                        console.error("Erreur lors de la création de la mensuration", error);
                    }
                }}
            />

            {editingMensuration && (
                <EditMensurationModal
                    visible={editMensurationModalVisible}
                    onClose={() => setEditMensurationModalVisible(false)}
                    mensuration={editingMensuration}
                    onUpdate={async (id, name, unit) => {
                        const input = {
                            id,
                            userId: user.attributes?.sub || user.username,
                            name,
                            unit,
                        };
                        try {
                            await API.graphql(graphqlOperation(updateMensuration, { input }));
                            await fetchMeasurementTypes();
                        } catch (error) {
                            console.error("Erreur lors de la mise à jour de la mensuration", error);
                        }
                    }}
                    onDelete={async (id) => {
                        const input = { id }; // On n'envoie que l'id
                        try {
                            await API.graphql(graphqlOperation(deleteMensuration, { input }));
                            await fetchMeasurementTypes();
                        } catch (error) {
                            console.error("Erreur lors de la suppression de la mensuration", error);
                        }
                    }}
                />
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
    exercisesContainer: { backgroundColor: '#F1F1F1', borderRadius: 8, padding: 12, marginBottom: 16 },
    exerciseItem: { marginBottom: 16 },
    exerciseCardContent: {},
    exerciseBlock: { marginBottom: 16 },
    exerciseName: { marginBottom: 4 },
    chartContainer: {
        overflow: 'hidden',
        borderRadius: 16,
        minHeight: 220,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 8,
    },
    recordsContainer: { backgroundColor: '#F1F1F1', borderRadius: 8, padding: 12 },
    recordLine: { marginBottom: 4 },
    // Measurements styles:
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        width: (Dimensions.get('window').width - 48) / 2,
        marginBottom: 12,
        alignItems: 'center',
        elevation: 2,
    },
    cardEmoji: { fontSize: 28, marginBottom: 4 },
    cardTitle: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 16, marginBottom: 4, color: '#141217' },
    cardValue: { fontSize: 14, color: '#141217' },
    typeSelector: { marginBottom: 8 },
    typeTab: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: PURPLE,
        marginRight: 8,
    },
    chartWrapper: { borderRadius: 16, overflow: 'hidden', backgroundColor: '#fff', marginBottom: 16 },
    chart: { borderRadius: 16 },
    historyGroup: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 12 },
    historyDate: { fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium', marginBottom: 4 },
    historyEntry: { fontSize: 14, color: '#141217' },
});
