import React from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet, View, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { RootStackParamList } from '../types/NavigationTypes';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

type AboutNavigationProp = StackNavigationProp<RootStackParamList, 'About'>;

const AboutScreen: React.FC = () => {
    const navigation = useNavigation<AboutNavigationProp>();

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Image
                source={require('../../assets/axolotl-juge.png')}
                style={styles.axolotlImage}
            />

            <Text style={styles.header}>À propos de FlexFit</Text>
            <View style={styles.menuContainer}>
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => navigation.navigate('TermsOfUse')}
                >
                    <Ionicons
                        name="document-text-outline"
                        size={24}
                        color="#b21ae5"
                        style={styles.menuIcon}
                    />
                    <Text style={styles.menuText}>Conditions générales d'utilisation</Text>
                    <Ionicons name="chevron-forward" size={24} color="#b21ae5" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => navigation.navigate('PrivacyPolicy')}
                >
                    <Ionicons
                        name="shield-checkmark-outline"
                        size={24}
                        color="#b21ae5"
                        style={styles.menuIcon}
                    />
                    <Text style={styles.menuText}>Politique de confidentialité</Text>
                    <Ionicons name="chevron-forward" size={24} color="#b21ae5" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => navigation.navigate('LegalNotice')}
                >
                    <Ionicons
                        name="information-circle-outline"
                        size={24}
                        color="#b21ae5"
                        style={styles.menuIcon}
                    />
                    <Text style={styles.menuText}>Mentions légales</Text>
                    <Ionicons name="chevron-forward" size={24} color="#b21ae5" />
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 16,
        backgroundColor: '#fff',
        alignItems: 'center',
    },
    axolotlImage: {
        width: 150,
        height: 150,
        marginBottom: 20,
        resizeMode: 'contain',
    },
    header: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333',
    },
    menuContainer: {
        width: '100%',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F2F0F5',
        borderRadius: 10,
        paddingVertical: 15,
        paddingHorizontal: 20,
        marginVertical: 8,
    },
    menuIcon: {
        marginRight: 16,
    },
    menuText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
});

export default AboutScreen;
