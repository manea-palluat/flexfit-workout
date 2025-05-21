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
            {/* LOGO */}
            <Image style={styles.logo} source={require('../../assets/axolotl.png')} />
            {/* TITRE */}
            <Text style={[TextStyles.title, styles.titleMargin]}>Bienvenue sur FlexFit.</Text>
            {/* BOUTON CONNEXION */}
            <TouchableOpacity
                style={ButtonStyles.primaryContainer}
                onPress={() => navigation.navigate('Auth', { mode: 'login' })}
            >
                <Text style={ButtonStyles.primaryText}>Connexion</Text>
            </TouchableOpacity>
            {/* BOUTON INSCRIPTION */}
            <TouchableOpacity
                style={ButtonStyles.invertedContainer}
                onPress={() => navigation.navigate('Auth', { mode: 'signup' })}
            >
                <Text style={ButtonStyles.invertedText}>Inscription</Text>
            </TouchableOpacity>
            {/* BOUTON À PROPOS */}
            <TouchableOpacity
                style={styles.aboutButton}
                onPress={() => navigation.navigate('About')}
            >
                <Text style={styles.infoCircle}>ⓘ</Text>
                <Text style={styles.aboutButtonText}> À propos</Text>
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
        position: 'absolute',
        bottom: 40,
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoCircle: {
        fontSize: 16,
        color: '#000000',
        fontFamily: ButtonStyles.primaryText.fontFamily,
    },
    aboutButtonText: {
        fontSize: 16,
        color: '#000000',
        fontFamily: TextStyles.simpleText.fontFamily,
    },
    logo: {
        width: 200,
        height: 200,
        marginBottom: 20,
    },
});

export default HomeScreen;