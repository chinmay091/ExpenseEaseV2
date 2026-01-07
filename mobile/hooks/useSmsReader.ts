import { useState, useCallback } from "react";
import { Platform, PermissionsAndroid, Alert, NativeModules } from "react-native";

export type SmsMessage = {
  _id: string;
  body: string;
  address?: string;
  date?: number;
  read?: number;
  type?: number;
};

const SmsModule = Platform.OS === "android" ? NativeModules.Sms : null;

export const useSmsReader = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<SmsMessage[]>([]);

  const isSupported = Platform.OS === "android" && SmsModule !== null;

  const checkPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    
    try {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.READ_SMS
      );
      setHasPermission(granted);
      return granted;
    } catch (error) {
      console.error("Failed to check SMS permission:", error);
      setHasPermission(false);
      return false;
    }
  }, [isSupported]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      Alert.alert("Not Supported", "SMS reading is only available on Android devices.");
      return false;
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        {
          title: "SMS Permission",
          message: "ExpenseEase needs access to your SMS messages to import bank transactions.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        }
      );
      
      const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
      setHasPermission(isGranted);
      return isGranted;
    } catch (error) {
      console.error("Failed to request SMS permission:", error);
      return false;
    }
  }, [isSupported]);

  const readMessages = useCallback(
    async (maxCount: number = 100): Promise<SmsMessage[]> => {
      if (!isSupported || !SmsModule) {
        Alert.alert(
          "Not Supported",
          "SMS reading is not available. This may be because:\n\n" +
          "• You're on iOS (not supported)\n" +
          "• The SMS module failed to load\n\n" +
          "Please try rebuilding the app."
        );
        return [];
      }

      setLoading(true);

      try {
        let permitted = hasPermission;
        if (permitted === null) {
          permitted = await checkPermission();
        }

        if (!permitted) {
          permitted = await requestPermission();
          if (!permitted) {
            Alert.alert("Permission Denied", "SMS permission is required to import transactions from messages.");
            setLoading(false);
            return [];
          }
        }

        return new Promise((resolve) => {
          const filter = {
            box: "inbox",
            maxCount: maxCount,
          };

          SmsModule.list(
            JSON.stringify(filter),
            (fail: string) => {
              console.error("Failed to read SMS:", fail);
              Alert.alert("Error", "Failed to read SMS messages: " + fail);
              setLoading(false);
              resolve([]);
            },
            (_count: number, smsList: string) => {
              try {
                const smsArray: SmsMessage[] = JSON.parse(smsList);
                setMessages(smsArray);
                setLoading(false);
                
                if (smsArray.length === 0) {
                  Alert.alert("No Messages", "No SMS messages found in your inbox.");
                }
                
                resolve(smsArray);
              } catch (parseError) {
                console.error("Failed to parse SMS:", parseError);
                Alert.alert("Error", "Failed to parse SMS messages.");
                setLoading(false);
                resolve([]);
              }
            }
          );
        });
      } catch (error) {
        console.error("Failed to read SMS messages:", error);
        Alert.alert("Error", "Failed to read SMS messages. Please try again.");
        setLoading(false);
        return [];
      }
    },
    [isSupported, hasPermission, checkPermission, requestPermission]
  );

  return {
    isSupported,
    hasPermission,
    loading,
    messages,
    checkPermission,
    requestPermission,
    readMessages,
  };
};
