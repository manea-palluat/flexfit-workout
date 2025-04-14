import React from 'react';
import { Modal, View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { ButtonStyles } from '../styles/ButtonStyles';

interface ActionModalProps { //props pour l'exo modal
    visible: boolean; //visible: booléen pour afficher la modal
    onModifier: () => void; //callback pour modifier
    onSupprimer: () => void; //callback pour supprimer
    onCancel: () => void; //callback pour annuler
}

const ActionModal: React.FC<ActionModalProps> = ({ visible, onModifier, onSupprimer, onCancel }) => { //composant action modal
    return (
        <Modal visible={visible} transparent animationType="slide">
            {/*modal qui slide pour apparaitre*/}
            <View style={styles.modalOverlay}>
                {/*overlay sombre en arrière-plan*/}
                <View style={styles.actionModalContainer}>
                    {/*ACTION MODAL CONTAINER*/}
                    <TouchableOpacity
                        style={ButtonStyles.container}
                        onPress={onModifier}
                    >
                        {/*btn modifier*/}
                        <Text style={ButtonStyles.text}>Modifier</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={ButtonStyles.container}
                        onPress={onSupprimer}
                    >
                        {/*btn supprimer*/}
                        <Text style={ButtonStyles.text}>Supprimer</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={ButtonStyles.invertedContainer}
                        onPress={onCancel}
                    >
                        {/*btn annuler*/}
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
