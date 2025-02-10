// src/screens/ManualTrackingScreen.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    Button,
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
                    <TouchableOpacity style={selectorStyles.closeButton} onPress={onClose}>
                        <Text style={selectorStyles.closeButtonText}>Annuler</Text>
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
    },
    itemContainer: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    itemText: {
        fontSize: 16,
        textAlign: 'center',
    },
    closeButton: {
        marginTop: 12,
        backgroundColor: '#007BFF',
        paddingVertical: 10,
        borderRadius: 5,
    },
    closeButtonText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
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

    // Date picker handler
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
    // Allow user to type a weight with an optional comma and up to 2 digits.
    // Permits intermediate states like "50," or "50,2".
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
                Alert.alert('Erreur', "Le poids doit être un entier ou un entier suivi d'une virgule et de 25, 5 ou 75.");
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
                style={styles.exerciseButton}
                onPress={() => setShowExerciseSelector(true)}
            >
                <Text style={styles.exerciseButtonText}>
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
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
                <Text style={styles.dateButtonText}>{date.toLocaleDateString('fr-FR')}</Text>
            </TouchableOpacity>
            {showDatePicker && (
                Platform.OS === 'android' ? (
                    <DateTimePickerModal
                        isVisible={showDatePicker}
                        mode="date"
                        date={date}
                        onConfirm={handleConfirmDate}
                        onCancel={() => setShowDatePicker(false)}
                    />
                ) : (
                    <DateTimePicker
                        value={date}
                        mode="date"
                        display="default"
                        onChange={onChangeDate}
                    />
                )
            )}

            <Text style={styles.label}>Ajouter des séries :</Text>
            <View style={styles.setInputContainer}>
                <TextInput
                    style={[styles.input, styles.smallInput]}
                    placeholder="Répétitions"
                    keyboardType="numeric"
                    value={tempReps}
                    onChangeText={setTempReps}
                />
                <TextInput
                    style={[styles.input, styles.smallInput]}
                    placeholder="Poids (kg) ex: 50,25"
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
                        <Text key={index} style={styles.setSummary}>
                            Série {index + 1}: {set.reps} répétitions x {set.weight} kg
                        </Text>
                    ))}
                </View>
            )}

            <View style={styles.buttonContainer}>
                <Button title="Sauvegarder" onPress={handleSave} />
            </View>
            <View style={styles.buttonContainer}>
                <Button title="Annuler" onPress={() => navigation.goBack()} color="#888" />
            </View>
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
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
    },
    exerciseButton: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 12,
        marginBottom: 20,
        alignItems: 'center',
    },
    exerciseButtonText: {
        fontSize: 16,
    },
    dateButton: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 12,
        marginBottom: 20,
        alignItems: 'center',
    },
    dateButtonText: {
        fontSize: 16,
    },
    setInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        flexWrap: 'wrap',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 12,
        marginRight: 10,
        marginBottom: 10,
    },
    smallInput: {
        width: '30%',
    },
    addSetButton: {
        backgroundColor: '#28A745',
        padding: 12,
        borderRadius: 5,
    },
    addSetButtonText: {
        color: '#fff',
        fontSize: 14,
    },
    setsList: {
        marginBottom: 20,
    },
    setSummary: {
        fontSize: 16,
        marginBottom: 4,
    },
    buttonContainer: {
        marginTop: 10,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    errorText: {
        fontSize: 18,
        color: 'red',
        textAlign: 'center',
    },
});

export default ManualTrackingScreen;
