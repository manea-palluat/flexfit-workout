// src/screens/HomeScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../types/NavigationTypes';
import { ButtonStyles } from '../styles/ButtonStyles';
import { TextStyles } from '../styles/TextStyles';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Auth'>;

const HomeScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();

    return (
        <View style={styles.container}>
            <Image style={styles.logo} source={require('../../assets/axolotl.png')} />
            <Text style={[TextStyles.title, styles.titleMargin]}>Bienvenue sur FlexFit.</Text>

            <TouchableOpacity
                style={ButtonStyles.container}
                onPress={() => navigation.navigate('Auth', { mode: 'login' })}
            >
                <Text style={ButtonStyles.text}>Connexion</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={ButtonStyles.invertedContainer}
                onPress={() => navigation.navigate('Auth', { mode: 'signup' })}
            >
                <Text style={ButtonStyles.invertedText}>Inscription</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.aboutButton} onPress={() => navigation.navigate('About')}>
                <Text style={styles.aboutButtonText}>À propos</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    titleMargin: {
        marginVertical: 20,
    },
    aboutButton: {
        marginTop: 20,
        padding: 10,
    },
    aboutButtonText: {
        color: '#007BFF',
        fontSize: 16,
    },
    logo: {
        width: 200,
        height: 200,
        marginBottom: 20,
    },
});

export default HomeScreen;
