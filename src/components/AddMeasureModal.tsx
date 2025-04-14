// src/components/AddMeasureModal.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    TextInput,
    Switch,
    StyleSheet,
    Alert,
} from 'react-native';
import { ButtonStyles } from '../styles/ButtonStyles';
import { TextStyles } from '../styles/TextStyles';

export interface MeasurementType {
    id: string;
    name: string;
    unit?: string;
}

export interface AddMeasureModalProps {
    visible: boolean;
    onClose: () => void;
    measurementDate: Date;
    measurementTypes: MeasurementType[];
    /**
     * Called when the measurement entries are submitted.
     * Form data contains keys as measurement type IDs with a numeric value.
     */
    onSubmit: (formData: { [key: string]: { value: number } }) => Promise<void>;
}

interface MeasurementFormData {
    [key: string]: { active: boolean; value: string };
}

const AddMeasureModal: React.FC<AddMeasureModalProps> = ({
    visible,
    onClose,
    measurementDate,
    measurementTypes,
    onSubmit,
}) => {
    const [measurementForm, setMeasurementForm] = useState<MeasurementFormData>({});
    const [errorMessage, setErrorMessage] = useState<string>('');

    useEffect(() => {
        const initialForm: MeasurementFormData = {};
        measurementTypes.forEach((type) => {
            initialForm[type.id] = { active: false, value: '' };
        });
        setMeasurementForm(initialForm);
        setErrorMessage('');
    }, [measurementTypes, visible]);

    const toggleMeasurement = (id: string, active: boolean) => {
        setMeasurementForm((prev) => ({
            ...prev,
            [id]: { ...prev[id], active },
        }));
    };

    const updateMeasurementValue = (id: string, value: string) => {
        setMeasurementForm((prev) => ({
            ...prev,
            [id]: { ...prev[id], value },
        }));
    };

    const handleSubmit = async () => {
        const formData: { [key: string]: { value: number } } = {};
        for (const id in measurementForm) {
            if (measurementForm[id].active) {
                if (!measurementForm[id].value || isNaN(parseFloat(measurementForm[id].value))) {
                    setErrorMessage('Veuillez entrer des valeurs numériques valides pour les mesures activées.');
                    return;
                }
                formData[id] = { value: parseFloat(measurementForm[id].value) };
            }
        }
        if (Object.keys(formData).length === 0) {
            setErrorMessage('Veuillez activer au moins un type de mensuration et fournir une valeur.');
            return;
        }
        try {
            await onSubmit(formData);
            setErrorMessage('');
            onClose();
        } catch (error) {
            Alert.alert('Erreur', "Une erreur est survenue lors de l'enregistrement.");
            console.error(error);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.modalBackground}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Ajouter une mesure</Text>
                    <Text style={styles.dateText}>Date : {measurementDate.toLocaleDateString()}</Text>
                    {measurementTypes.map((type) => (
                        <View key={type.id} style={styles.measurementRow}>
                            <Switch
                                value={measurementForm[type.id]?.active || false}
                                onValueChange={(value) => toggleMeasurement(type.id, value)}
                            />
                            <Text style={styles.measurementLabel}>
                                {type.name} {type.unit ? `(${type.unit})` : ''}
                            </Text>
                            {measurementForm[type.id]?.active && (
                                <TextInput
                                    style={styles.input}
                                    placeholder="Valeur"
                                    keyboardType="numeric"
                                    value={measurementForm[type.id]?.value}
                                    onChangeText={(text) => updateMeasurementValue(type.id, text)}
                                />
                            )}
                        </View>
                    ))}
                    {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
                    <TouchableOpacity style={ButtonStyles.container} onPress={handleSubmit}>
                        <Text style={ButtonStyles.text}>Enregistrer</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={styles.cancelText}>Annuler</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

export default AddMeasureModal;

const styles = StyleSheet.create({
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        width: '90%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    dateText: {
        fontSize: 16,
        marginBottom: 12,
        textAlign: 'center',
        color: '#666',
    },
    measurementRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    measurementLabel: {
        marginLeft: 8,
        fontSize: 16,
        flex: 1,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 6,
        padding: 8,
        width: 80,
        textAlign: 'center',
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginBottom: 8,
    },
    cancelText: {
        textAlign: 'center',
        marginTop: 12,
        color: '#b21ae5',
        fontSize: 16,
    },
});
