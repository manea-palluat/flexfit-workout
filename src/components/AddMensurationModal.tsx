// src/components/AddMensurationModal.tsx
import React, { useState } from 'react';
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

export interface AddMensurationModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (name: string, unit?: string) => Promise<void>;
}

const AddMensurationModal: React.FC<AddMensurationModalProps> = ({
    visible,
    onClose,
    onSubmit,
}) => {
    const [name, setName] = useState<string>('');
    const [unit, setUnit] = useState<string>('');
    const [error, setError] = useState<string>('');

    const handleSubmit = async () => {
        if (!name.trim()) {
            setError('Veuillez entrer le nom de la mensuration.');
            return;
        }
        try {
            await onSubmit(name, unit);
            setName('');
            setUnit('');
            setError('');
            onClose();
        } catch (err) {
            Alert.alert('Erreur', "Une erreur s'est produite lors de la création.");
            console.error(err);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.modalBackground}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Ajouter une mensuration</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Nom (ex: Tour de bras)"
                        value={name}
                        onChangeText={setName}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Unité (ex: cm, kg) - optionnel"
                        value={unit}
                        onChangeText={setUnit}
                    />
                    {error ? <Text style={styles.errorText}>{error}</Text> : null}
                    <TouchableOpacity style={ButtonStyles.container} onPress={handleSubmit}>
                        <Text style={ButtonStyles.text}>Créer la mensuration</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={styles.cancelText}>Annuler</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

export default AddMensurationModal;

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
