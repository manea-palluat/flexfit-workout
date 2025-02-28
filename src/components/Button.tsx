// src/components/Button.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface ButtonProps { //props du btn
    title: string; //titre du btn
    onPress: () => void; //callback au click
}

const Button: React.FC<ButtonProps> = ({ title, onPress }) => { //BOUTON
    return (
        <TouchableOpacity style={styles.button} onPress={onPress}>
            {/* btn tactile */}
            <Text style={styles.text}>{title}</Text>
            {/* texte affiché */}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#007BFF',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
    },
    text: {
        color: '#FFFFFF',
        fontSize: 16,
    },
});

export default Button;
