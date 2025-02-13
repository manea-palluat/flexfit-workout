// src/components/ActionModal.tsx
import React from 'react';
import { Modal, View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { ButtonStyles } from '../styles/ButtonStyles';

interface ActionModalProps {
    visible: boolean;
    onModifier: () => void;
    onSupprimer: () => void;
    onCancel: () => void;
}

const ActionModal: React.FC<ActionModalProps> = ({ visible, onModifier, onSupprimer, onCancel }) => {
    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <View style={styles.actionModalContainer}>
                    <TouchableOpacity
                        style={ButtonStyles.container}
                        onPress={onModifier}
                    >
                        <Text style={ButtonStyles.text}>Modifier</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={ButtonStyles.container}
                        onPress={onSupprimer}
                    >
                        <Text style={ButtonStyles.text}>Supprimer</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={ButtonStyles.invertedContainer}
                        onPress={onCancel}
                    >
                        <Text style={ButtonStyles.invertedText}>Annuler</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionModalContainer: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 20,
        alignItems: 'center',
    },
});

export default ActionModal;
