// src/screens/ManualTrackingScreen.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    FlatList,
    Modal,
    Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { API, graphqlOperation } from 'aws-amplify';
import { createExerciseTracking } from '../graphql/mutations';
import { listExercises } from '../graphql/queries';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { v4 as uuidv4 } from 'uuid';
import type { RootStackParamList } from '../types/NavigationTypes';
import { StackNavigationProp } from '@react-navigation/stack';
import { ButtonStyles } from '../styles/ButtonStyles';

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface Exercise {
    exerciseId: string;
    name: string;
}

interface SetResult {
    weight: number;
    reps: number;
}

interface ExerciseSelectorModalProps {
    visible: boolean;
    exercises: Exercise[];
    onSelect: (selected: Exercise) => void;
    onClose: () => void;
}

const ExerciseSelectorModal: React.FC<ExerciseSelectorModalProps> = ({
    visible,
    exercises,
    onSelect,
    onClose,
}) => {
    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={selectorStyles.modalOverlay}>
                <View style={selectorStyles.modalContainer}>
                    <Text style={selectorStyles.modalTitle}>Choisir un exercice</Text>
                    <FlatList
                        data={exercises}
                        keyExtractor={(item) => item.exerciseId}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={selectorStyles.itemContainer}
                                onPress={() => {
                                    onSelect(item);
                                    onClose();
                                }}
                            >
                                <Text style={selectorStyles.itemText}>{item.name}</Text>
                            </TouchableOpacity>
                        )}
                    />
                    <TouchableOpacity style={ButtonStyles.invertedContainer} onPress={onClose}>
                        <Text style={ButtonStyles.invertedText}>Annuler</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const selectorStyles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '80%',
        maxHeight: '70%',
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
        color: '#333',
    },
    itemContainer: {
        backgroundColor: '#F1F1F1',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 5,
        marginBottom: 10,
    },
    itemText: {
        fontSize: 16,
        textAlign: 'center',
        color: '#333',
    },
});

const ManualTrackingScreen: React.FC = () => {
    const { user } = useAuth();
    const navigation = useNavigation<NavigationProp>();

    // State for exercise selection.
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
    const [showExerciseSelector, setShowExerciseSelector] = useState<boolean>(false);

    // State for date selection.
    const [date, setDate] = useState<Date>(new Date());
    const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

    // State for set entries.
    const [setResults, setSetResults] = useState<SetResult[]>([]);
    const [tempReps, setTempReps] = useState<string>('');
    const [tempWeight, setTempWeight] = useState<string>('');

    useEffect(() => {
        const fetchExercises = async () => {
            if (!user) return;
            try {
                const userId = user?.attributes?.sub || user?.username;
                const response: any = await API.graphql(
                    graphqlOperation(listExercises, {
                        filter: { userId: { eq: userId } },
                    })
                );
                const items = response.data.listExercises.items;
                const exList: Exercise[] = items.map((e: any) => ({
                    exerciseId: e.exerciseId,
                    name: e.name,
                }));
                setExercises(exList);
                if (exList.length > 0) {
                    setSelectedExercise(exList[0]);
                }
            } catch (error) {
                console.error('Error fetching exercises for manual tracking', error);
            }
        };
        fetchExercises();
    }, [user]);

    // Date picker handlers.
    const onChangeDate = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            const newDate = new Date(selectedDate);
            newDate.setHours(12, 0, 0, 0);
            setDate(newDate);
        }
    };

    const handleConfirmDate = (selectedDate: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            const newDate = new Date(selectedDate);
            newDate.setHours(12, 0, 0, 0);
            setDate(newDate);
        }
    };

    // --- WEIGHT INPUT HANDLING ---
    const handleWeightChange = (value: string) => {
        if (value === '') {
            setTempWeight('');
            return;
        }
        const regex = /^[0-9]+(,[0-9]{0,2})?$/;
        if (regex.test(value)) {
            setTempWeight(value);
        }
    };
    // --- END WEIGHT INPUT HANDLING ---

    const addSet = () => {
        const repsNum = parseInt(tempReps, 10);
        if (tempWeight === '') {
            Alert.alert('Erreur', 'Veuillez entrer un poids.');
            return;
        }
        if (tempWeight.includes(',')) {
            const parts = tempWeight.split(',');
            if (
                parts.length !== 2 ||
                !(parts[1] === '25' || parts[1] === '5' || parts[1] === '75')
            ) {
                Alert.alert(
                    'Erreur',
                    "Le poids doit être un entier ou un entier suivi d'une virgule et de 25, 5 ou 75."
                );
                return;
            }
        }
        const weightNum = parseFloat(tempWeight.replace(',', '.'));
        if (isNaN(repsNum) || isNaN(weightNum) || repsNum <= 0 || weightNum <= 0) {
            Alert.alert('Erreur', 'Veuillez entrer des valeurs valides pour les répétitions et le poids.');
            return;
        }
        setSetResults([...setResults, { reps: repsNum, weight: weightNum }]);
        setTempReps('');
        setTempWeight('');
    };

    const handleSave = async () => {
        if (!selectedExercise) {
            Alert.alert('Erreur', "Veuillez sélectionner un exercice.");
            return;
        }
        if (setResults.length === 0) {
            Alert.alert('Erreur', 'Veuillez ajouter au moins une série.');
            return;
        }
        const userId = user?.attributes?.sub || user?.username;
        if (!userId) {
            Alert.alert('Erreur', "Identifiant de l'utilisateur introuvable.");
            return;
        }
        const trackingInput = {
            id: uuidv4(),
            userId,
            exerciseId: selectedExercise.exerciseId,
            exerciseName: selectedExercise.name,
            date: date.toISOString(),
            setsData: JSON.stringify(setResults),
        };
        try {
            await API.graphql(graphqlOperation(createExerciseTracking, { input: trackingInput }));
            Alert.alert('Succès', 'Données de suivi enregistrées.');
            navigation.goBack();
        } catch (error) {
            console.error('Erreur lors de l’enregistrement du suivi', error);
            Alert.alert('Erreur', "Une erreur est survenue lors de l'enregistrement du suivi.");
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.header}>Ajouter un suivi manuel</Text>

            <Text style={styles.label}>Exercice :</Text>
            <TouchableOpacity
                style={styles.selectorButton}
                onPress={() => setShowExerciseSelector(true)}
            >
                <Text style={styles.selectorButtonText}>
                    {selectedExercise ? selectedExercise.name : 'Sélectionner un exercice'}
                </Text>
            </TouchableOpacity>

            <ExerciseSelectorModal
                visible={showExerciseSelector}
                exercises={exercises}
                onSelect={(selected) => setSelectedExercise(selected)}
                onClose={() => setShowExerciseSelector(false)}
            />

            <Text style={styles.label}>Date :</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.selectorButton}>
                <Text style={styles.selectorButtonText}>{date.toLocaleDateString('fr-FR')}</Text>
            </TouchableOpacity>
            {showDatePicker &&
                (Platform.OS === 'android' ? (
                    <DateTimePickerModal
                        isVisible={showDatePicker}
                        mode="date"
                        date={date}
                        onConfirm={handleConfirmDate}
                        onCancel={() => setShowDatePicker(false)}
                    />
                ) : (
                    <DateTimePicker value={date} mode="date" display="default" onChange={onChangeDate} />
                ))}

            <Text style={styles.label}>Ajouter des séries :</Text>
            <View style={styles.setInputContainer}>
                <TextInput
                    style={[styles.input, styles.smallInput]}
                    placeholder="Répétitions"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    value={tempReps}
                    onChangeText={setTempReps}
                />
                <TextInput
                    style={[styles.input, styles.smallInput]}
                    placeholder="Poids (kg) ex: 50,25"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    value={tempWeight}
                    onChangeText={handleWeightChange}
                />
                <TouchableOpacity style={styles.addSetButton} onPress={addSet}>
                    <Text style={styles.addSetButtonText}>Ajouter série</Text>
                </TouchableOpacity>
            </View>

            {setResults.length > 0 && (
                <View style={styles.setsList}>
                    <Text style={styles.label}>Séries ajoutées :</Text>
                    {setResults.map((set, index) => (
                        <View key={index} style={styles.setCard}>
                            <View style={styles.setNumberIconContainer}>
                                <View style={styles.setNumberIcon}>
                                    <Text style={styles.setNumberIconText}>{index + 1}</Text>
                                </View>
                            </View>
                            <View style={styles.setDetailsContainer}>
                                <Text style={styles.setTitleText}>{`Série ${index + 1}`}</Text>
                                <Text style={styles.setStatusText}>{`${set.reps} x ${set.weight} kg`}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            )}

            <TouchableOpacity style={ButtonStyles.container} onPress={handleSave}>
                <Text style={ButtonStyles.text}>Sauvegarder</Text>
            </TouchableOpacity>
            <TouchableOpacity style={ButtonStyles.invertedContainer} onPress={() => navigation.goBack()}>
                <Text style={ButtonStyles.invertedText}>Annuler</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        paddingBottom: 40,
        backgroundColor: '#fff',
        flexGrow: 1,
    },
    header: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 20,
        marginTop: 30,
        textAlign: 'center',
        color: '#333',
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        color: '#555',
    },
    selectorButton: {
        backgroundColor: '#F1F1F1',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 5,
        marginBottom: 20,
        alignItems: 'center',
    },
    selectorButtonText: {
        fontSize: 16,
        color: '#333',
    },
    setInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        flexWrap: 'wrap',
    },
    input: {
        backgroundColor: '#F1F1F1',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 5,
        fontSize: 16,
        color: '#333',
        marginRight: 10,
        marginBottom: 10,
    },
    smallInput: {
        width: '30%',
    },
    addSetButton: {
        backgroundColor: '#b21ae5', // Same as primary color from ButtonStyles.
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 50,
        alignItems: 'center',
        marginBottom: 10,
    },
    addSetButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    setsList: {
        marginBottom: 20,
    },
    // ---- Set Card Styles (matching WorkoutSessionScreen design) ----
    setCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 10,
        marginVertical: 5,
        width: '100%',
        // Optionally add shadow or elevation:
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    setNumberIconContainer: {
        width: 70,
        height: 70,
        marginRight: 20,
    },
    setNumberIcon: {
        width: 70,
        height: 70,
        backgroundColor: '#F2F0F5',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    setNumberIconText: {
        fontSize: 16,
        color: '#141217',
        // fontFamily: 'PlusJakartaSans_700Bold', // if available
    },
    setDetailsContainer: {
        flex: 1,
        flexDirection: 'column',
    },
    setTitleText: {
        fontSize: 18,
        // fontFamily: 'PlusJakartaSans_500Medium',
        color: '#141217',
        marginBottom: 8,
    },
    setStatusText: {
        fontSize: 16,
        // fontFamily: 'PlusJakartaSans_300Light',
        color: '#756387',
    },
});

export default ManualTrackingScreen;
