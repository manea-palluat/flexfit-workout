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
    const navigation = useNavigation<NavigationProp>(); //récupère la navigation

    return (
        <View style={styles.container}>
            {/*LOGO*/}
            <Image style={styles.logo} source={require('../../assets/axolotl.png')} />{/*affiche le logo, c'est trop mignon*/}
            {/* TITRE */}
            <Text style={[TextStyles.title, styles.titleMargin]}>Bienvenue sur FlexFit.</Text>
            {/* BOUTON CONNEXION */}
            <TouchableOpacity
                style={ButtonStyles.container}
                onPress={() => navigation.navigate('Auth', { mode: 'login' })} //redirige vers l'écran d'auth en mode connexion
            >
                <Text style={ButtonStyles.text}>Connexion</Text>
            </TouchableOpacity>
            {/* BOUTON INSCRIPTION */}
            <TouchableOpacity
                style={ButtonStyles.invertedContainer}
                onPress={() => navigation.navigate('Auth', { mode: 'signup' })} //redirige vers l'écran d'auth en mode inscription
            >
                <Text style={ButtonStyles.invertedText}>Inscription</Text>
            </TouchableOpacity>
            {/* BOUTON À PROPOS */}
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
