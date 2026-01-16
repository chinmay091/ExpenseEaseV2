import { useState, useCallback, useEffect } from "react";
import { Alert, Platform } from "react-native";
import Constants from "expo-constants";

export type GoogleUser = {
  id: string;
  email: string;
  name: string;
  photo?: string;
};

export type GoogleAuthState = {
  isSignedIn: boolean;
  user: GoogleUser | null;
  accessToken: string | null;
};

let GoogleSignin: any = null;
let statusCodes: any = null;
let moduleLoadAttempted = false;

const isExpoGo = Constants.appOwnership === "expo";

const loadGoogleSignIn = async () => {
  if (moduleLoadAttempted) return GoogleSignin !== null;
  moduleLoadAttempted = true;
  
  if (isExpoGo) {
    console.warn("Google Sign-In is not available in Expo Go. Use a development build.");
    return false;
  }
  
  try {
    const module = await import("@react-native-google-signin/google-signin");
    GoogleSignin = module.GoogleSignin;
    statusCodes = module.statusCodes;
    return true;
  } catch (e) {
    console.warn("Google Sign-In module not available:", e);
    return false;
  }
};

export const useGoogleAuth = () => {
  const [authState, setAuthState] = useState<GoogleAuthState>({
    isSignedIn: false,
    user: null,
    accessToken: null,
  });
  const [loading, setLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isAvailable, setIsAvailable] = useState(!isExpoGo);

  const configure = useCallback(async (webClientId?: string) => {
    const loaded = await loadGoogleSignIn();
    if (!loaded || !GoogleSignin) {
      setIsAvailable(false);
      return false;
    }

    try {
      const clientId = webClientId || "461574312562-3kgqc0nj0qucvp993moufvv0qf6nsmlc.apps.googleusercontent.com";
      await GoogleSignin.configure({
        webClientId: clientId,
        offlineAccess: true,
        scopes: ["https://www.googleapis.com/auth/gmail.readonly"],
      });
      setIsConfigured(true);
      return true;
    } catch (error) {
      console.error("Failed to configure Google Sign-In:", error);
      return false;
    }
  }, []);

  const checkSignInStatus = useCallback(async () => {
    if (!isAvailable || !GoogleSignin || !isConfigured) return;

    try {
      const response = await GoogleSignin.signInSilently();
      if (response?.data?.user) {
        const tokens = await GoogleSignin.getTokens();
        setAuthState({
          isSignedIn: true,
          user: {
            id: response.data.user.id,
            email: response.data.user.email,
            name: response.data.user.name || "",
            photo: response.data.user.photo || undefined,
          },
          accessToken: tokens.accessToken,
        });
      }
    } catch (error: any) {
      console.log("Not signed in silently");
    }
  }, [isConfigured, isAvailable]);

  const signIn = useCallback(async () => {
    if (isExpoGo) {
      Alert.alert(
        "Not Available",
        "Google Sign-In is not available in Expo Go. Please use a development build."
      );
      return null;
    }

    const loaded = await loadGoogleSignIn();
    if (!loaded || !GoogleSignin) {
      Alert.alert("Error", "Google Sign-In is not available");
      return null;
    }

    if (!isConfigured) {
      await configure();
    }

    setLoading(true);

    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      
      if (response?.data?.user) {
        const tokens = await GoogleSignin.getTokens();
        const newState = {
          isSignedIn: true,
          user: {
            id: response.data.user.id,
            email: response.data.user.email,
            name: response.data.user.name || "",
            photo: response.data.user.photo || undefined,
          },
          accessToken: tokens.accessToken,
        };
        setAuthState(newState);
        return newState;
      }
      return null;
    } catch (error: any) {
      if (statusCodes && error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log("Sign-in cancelled");
      } else if (statusCodes && error.code === statusCodes.IN_PROGRESS) {
        Alert.alert("Sign-In In Progress", "Please wait...");
      } else if (statusCodes && error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert("Error", "Google Play Services is not available");
      } else {
        console.error("Sign-in error:", error);
        Alert.alert("Sign-In Failed", error.message || "An error occurred");
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [isConfigured, configure]);

  const signOut = useCallback(async () => {
    if (!GoogleSignin) return;

    try {
      await GoogleSignin.signOut();
      setAuthState({
        isSignedIn: false,
        user: null,
        accessToken: null,
      });
    } catch (error) {
      console.error("Sign-out error:", error);
    }
  }, []);

  const getAccessToken = useCallback(async () => {
    if (!GoogleSignin || !authState.isSignedIn) return null;

    try {
      const tokens = await GoogleSignin.getTokens();
      setAuthState(prev => ({ ...prev, accessToken: tokens.accessToken }));
      return tokens.accessToken;
    } catch (error) {
      console.error("Failed to get access token:", error);
      await signOut();
      return null;
    }
  }, [authState.isSignedIn, signOut]);

  useEffect(() => {
    if (isConfigured && isAvailable) {
      checkSignInStatus();
    }
  }, [isConfigured, checkSignInStatus, isAvailable]);

  return {
    ...authState,
    loading,
    isConfigured,
    isAvailable,
    configure,
    signIn,
    signOut,
    getAccessToken,
    checkSignInStatus,
  };
};
