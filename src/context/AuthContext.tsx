import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Auth } from 'aws-amplify';

interface AuthContextProps {
    user: any; //user courant
    signIn: (email: string, password: string) => Promise<any>; //fonction pour se connecter
    signUp: (email: string, password: string, displayName: string) => Promise<any>; //fonction pour s'inscrire
    signOut: () => Promise<void>; //fonction pour se déconnecter
}

const AuthContext = createContext<AuthContextProps>({ //création du context d'auth avec valeurs par défaut
    user: null,
    signIn: async () => { },
    signUp: async () => { },
    signOut: async () => { },
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<any>(null); //état user initialisé à null

    const signIn = async (email: string, password: string) => { //fonction de connexion
        try {
            const userData = await Auth.signIn(email, password); //appel à Auth.signIn d'AWS Amplify
            setUser(userData); //mise à jour de l'état user
            return userData; //retourne les données utilisateur
        } catch (error) {
            console.error('Error signing in', error); //affiche l'erreur
            throw error; //relance l'erreur
        }
    };

    const signUp = async (email: string, password: string, displayName: string) => { //fonction d'inscription
        try {
            const signUpResult = await Auth.signUp({
                username: email, //utilise l'email comme nom d'utilisateur
                password,
                attributes: {
                    email,
                    preferred_username: displayName,
                },
            });
            return signUpResult; //retourne le résultat de l'inscription
        } catch (error) {
            console.error('Error signing up', error); //affiche l'erreur d'inscription
            throw error; //relance l'erreur
        }
    };

    const signOut = async () => { //fonction de déconnexion
        try {
            await Auth.signOut(); //appel à Auth.signOut d'AWS Amplify
            setUser(null); //réinitialise l'état user
        } catch (error) {
            console.error('Error signing out', error); //affiche l'erreur de déconnexion
        }
    };

    useEffect(() => { //vérifie l'utilisateur authentifié au chargement
        const checkUser = async () => { //fonction pour vérifier l'utilisateur courant
            try {
                const currentUser = await Auth.currentAuthenticatedUser(); //récupère l'utilisateur courant
                setUser(currentUser); //met à jour l'état user
            } catch (error) {
                setUser(null); //en cas d'erreur, réinitialise l'utilisateur
            }
        };
        checkUser(); //appel de la fonction de vérification
    }, []);

    return (
        <AuthContext.Provider value={{ user, signIn, signUp, signOut }}> {/*fournit le context d'auth aux enfants*/}
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext); //hook pour accéder au context d'auth
