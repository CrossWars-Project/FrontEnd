import {
  createContext, useEffect, useState, useContext, Children, useMemo,
} from 'react';
import PropTypes from 'prop-types';
import supabase from '../supabaseClient';

const AuthContext = createContext();

export function AuthContextProvider({ children }) {
  const [session, setSession] = useState(undefined);

  // Sign up
  const signUpNewUser = async ({ email, password, displayName }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName }, // store the display name in the user table
      },
    });

    if (error) {
      console.error('there was a problem signing up: ', error);
      return { success: false, error };
    }
    return { success: true, data };
  };

  // Login
  const loginUser = async ({ email, password }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        console.error('login error occurred: ', error);
        return { success: false, error: error.message };
      }
      console.log('sign-in success: ', data);
      return { success: true, data };
    } catch (error) {
      console.error('an error occurred: ', error);
      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    // Get current session safely
    supabase.auth.getSession().then((result) => {
      const currentSession = result.data?.session ?? null;
      setSession(currentSession);
    });

    // Listen for auth changes
    supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession?.session ?? null);
    });
  }, []);

  // Sign out
  const signOut = () => {
    const { error } = supabase.auth.signOut();
    if (error) {
      console.error('there was an error: ', error);
    }
  };

  AuthContextProvider.propTypes = {
    children: PropTypes.node.isRequired,
  };

  const value = useMemo(() => ({
    session,
    signUpNewUser,
    loginUser,
    signOut,
  }), [session]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const UserAuth = () => useContext(AuthContext);
