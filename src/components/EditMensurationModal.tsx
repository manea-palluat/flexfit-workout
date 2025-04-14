// src/components/EditMensurationModal.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    TextInput,
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

export interface EditMensurationModalProps {
    visible: boolean;
    onClose: () => void;
    mensuration: MeasurementType;
    /**
     * Fonction appelée pour mettre à jour la mensuration.
     * Doit retourner une promesse.
     */
    onUpdate: (id: string, name: string, unit?: string) => Promise<void>;
    /**
     * Fonction appelée pour supprimer la mensuration.
     * Doit retourner une promesse.
     */
    onDelete: (id: string) => Promise<void>;
}

const EditMensurationModal: React.FC<EditMensurationModalProps> = ({
    visible,
    onClose,
    mensuration,
    onUpdate,
    onDelete,
}) => {
    const [name, setName] = useState<string>(mensuration.name);
    const [unit, setUnit] = useState<string>(mensuration.unit || '');
    const [error, setError] = useState<string>('');

    // Réinitialisation des champs lorsque la mensuration change
    useEffect(() => {
        setName(mensuration.name);
        setUnit(mensuration.unit || '');
        setError('');
    }, [mensuration]);

    const handleUpdate = async () => {
        if (!name.trim()) {
            setError('Le nom ne peut pas être vide.');
            return;
        }
        try {
            await onUpdate(mensuration.id, name, unit);
            onClose();
        } catch (err) {
            Alert.alert('Erreur', "Une erreur est survenue lors de la mise à jour.");
            console.error(err);
        }
    };

    const handleDelete = async () => {
        Alert.alert(
            'Confirmer',
            'Voulez-vous vraiment supprimer cette mensuration ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // IMPORTANT : On n'envoie ici que l'ID, car l'input deleteMensuration attend uniquement l'ID.
                            const input = { id: mensuration.id };
                            await onDelete(mensuration.id);
                            onClose();
                        } catch (err) {
                            Alert.alert('Erreur', "Une erreur est survenue lors de la suppression.");
                            console.error(err);
                        }
                    },
                },
            ],
            { cancelable: true }
        );
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.modalBackground}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Modifier la mensuration</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Nom"
                        value={name}
                        onChangeText={setName}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Unité (ex: cm, kg)"
                        value={unit}
                        onChangeText={setUnit}
                    />
                    {error ? <Text style={styles.errorText}>{error}</Text> : null}
                    <TouchableOpacity style={ButtonStyles.container} onPress={handleUpdate}>
                        <Text style={ButtonStyles.text}>Enregistrer</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={ButtonStyles.destructiveContainer}
                        onPress={handleDelete}
                    >
                        <Text style={ButtonStyles.destructiveText}>Supprimer</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={styles.cancelText}>Annuler</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

export default EditMensurationModal;

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
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 6,
        padding: 10,
        marginBottom: 12,
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
