// src/screens/EditTrackingScreen.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Button,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { API, graphqlOperation } from 'aws-amplify';
import { updateExerciseTracking } from '../graphql/mutations';
import { useAuth } from '../context/AuthContext';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { v4 as uuidv4 } from 'uuid';
import type { RootStackParamList } from '../types/NavigationTypes';
import { StackNavigationProp } from '@react-navigation/stack';

type EditTrackingRouteProp = RouteProp<RootStackParamList, 'EditTracking'>;
type NavigationProp = StackNavigationProp<RootStackParamList>;

interface SetResult {
    weight: number;
    reps: number;
}

interface TrackingRecord {
    id: string;
    userId: string;
    exerciseId: string;
    exerciseName: string;
    date: string;
    setsData: string;
}

const EditTrackingScreen: React.FC = () => {
    const route = useRoute<EditTrackingRouteProp>();
    const navigation = useNavigation<NavigationProp>();
    const { tracking } = route.params as { tracking: TrackingRecord };
    const { user } = useAuth();

    // Pre-populate with existing tracking data.
    const [date, setDate] = useState<Date>(new Date(tracking.date));
    const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
    let initialSets: SetResult[] = [];
    try {
        initialSets = JSON.parse(tracking.setsData);
    } catch (error) {
        console.error('Error parsing setsData', error);
    }
    const [setResults, setSetResults] = useState<SetResult[]>(initialSets);
    const [tempReps, setTempReps] = useState<string>('');
    const [tempWeight, setTempWeight] = useState<string>('');

    // Date picker handler: when a date is selected, fix time to noon.
    const onChangeDate = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            const newDate = new Date(selectedDate);
            newDate.setHours(12, 0, 0, 0);
            setDate(newDate);
        }
    };

    const addSet = () => {
        const repsNum = parseInt(tempReps, 10);
        const weightNum = parseFloat(tempWeight);
        if (isNaN(repsNum) || isNaN(weightNum) || repsNum <= 0 || weightNum <= 0) {
            Alert.alert('Erreur', 'Veuillez entrer des valeurs valides pour les répétitions et le poids.');
            return;
        }
        setSetResults([...setResults, { reps: repsNum, weight: weightNum }]);
        setTempReps('');
        setTempWeight('');
    };

    const handleSave = async () => {
        const userId = user?.attributes?.sub || user?.username;
        if (!userId) {
            Alert.alert('Erreur', "Identifiant de l'utilisateur introuvable.");
            return;
        }
        if (setResults.length === 0) {
            Alert.alert('Erreur', 'Veuillez ajouter au moins une série.');
            return;
        }
        const trackingInput = {
            id: tracking.id,
            userId,
            exerciseId: tracking.exerciseId,
            exerciseName: tracking.exerciseName, // assuming exerciseName doesn't change
            date: date.toISOString(),
            setsData: JSON.stringify(setResults),
        };
        try {
            await API.graphql(graphqlOperation(updateExerciseTracking, { input: trackingInput }));
            Alert.alert('Succès', 'Données de suivi mises à jour.');
            navigation.goBack();
        } catch (error) {
            console.error('Erreur lors de la mise à jour du suivi', error);
            Alert.alert('Erreur', "Une erreur est survenue lors de la mise à jour du suivi.");
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.header}>Modifier le suivi</Text>
            <Text style={styles.label}>Date :</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
                <Text style={styles.dateButtonText}>{date.toLocaleDateString('fr-FR')}</Text>
            </TouchableOpacity>
            {showDatePicker && (
                <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={onChangeDate}
                />
            )}
            <Text style={styles.label}>Modifier les séries :</Text>
            {setResults.map((set, index) => (
                <View key={index} style={styles.setRow}>
                    <Text style={styles.setLabel}>Série {index + 1} :</Text>
                    <Text style={styles.setText}>{set.reps} répétitions x {set.weight} kg</Text>
                </View>
            ))}
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
                    placeholder="Poids (kg)"
                    keyboardType="numeric"
                    value={tempWeight}
                    onChangeText={setTempWeight}
                />
                <TouchableOpacity style={styles.addSetButton} onPress={addSet}>
                    <Text style={styles.addSetButtonText}>Ajouter série</Text>
                </TouchableOpacity>
            </View>
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
    setRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    setLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 8,
    },
    setText: {
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
    buttonContainer: {
        marginTop: 10,
    },
});

export default EditTrackingScreen;
