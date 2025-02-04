// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Auth } from 'aws-amplify';

interface AuthContextProps {
    user: any;
    signIn: (email: string, password: string) => Promise<any>;
    signUp: (email: string, password: string, displayName: string) => Promise<any>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({
    user: null,
    signIn: async () => { },
    signUp: async () => { },
    signOut: async () => { },
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<any>(null);

    const signIn = async (email: string, password: string) => {
        try {
            const userData = await Auth.signIn(email, password);
            setUser(userData);
            return userData;
        } catch (error) {
            console.error('Error signing in', error);
            throw error; // Propagate the error
        }
    };

    const signUp = async (email: string, password: string, displayName: string) => {
        try {
            const signUpResult = await Auth.signUp({
                username: email, // Use email as username
                password,
                attributes: {
                    email,
                    preferred_username: displayName,
                },
            });
            return signUpResult;
        } catch (error) {
            console.error('Error signing up', error);
            throw error; // Propagate the error
        }
    };

    const signOut = async () => {
        try {
            await Auth.signOut();
            setUser(null);
        } catch (error) {
            console.error('Error signing out', error);
        }
    };

    useEffect(() => {
        const checkUser = async () => {
            try {
                const currentUser = await Auth.currentAuthenticatedUser();
                setUser(currentUser);
            } catch (error) {
                setUser(null);
            }
        };
        checkUser();
    }, []);

    return (
        <AuthContext.Provider value={{ user, signIn, signUp, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
