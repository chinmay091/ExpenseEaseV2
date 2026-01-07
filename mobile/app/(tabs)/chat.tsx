import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useState, useRef, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { sendChatMessage, getSuggestions, ChatMessage } from "@/api/chat.api";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function ChatScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const flatListRef = useRef<FlatList>(null);

  useFocusEffect(
    useCallback(() => {
      loadSuggestions();
    }, [])
  );

  const loadSuggestions = async () => {
    try {
      const data = await getSuggestions();
      setSuggestions(data);
    } catch (error) {
      console.error("Failed to load suggestions:", error);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setLoading(true);

    try {
      const response = await sendChatMessage(text.trim(), messages);
      
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "Sorry, I couldn't process your request. Please try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionTap = (suggestion: string) => {
    sendMessage(suggestion);
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === "user";
    
    return (
      <View
        style={[
          styles.messageBubble,
          isUser 
            ? { backgroundColor: theme.tint, alignSelf: "flex-end", borderBottomRightRadius: 2 }
            : { backgroundColor: theme.card, alignSelf: "flex-start", borderBottomLeftRadius: 2, flexDirection: "row" as const, alignItems: "flex-start" as const },
        ]}
      >
        {!isUser && <Text style={styles.botIcon}>🤖</Text>}
        <Text style={[styles.messageText, { color: isUser ? "#fff" : theme.text }, !isUser && styles.assistantText]}>
          {item.content}
        </Text>
      </View>
    );
  };

  const renderSuggestions = () => {
    if (messages.length > 0) return null;

    return (
      <View style={styles.suggestionsContainer}>
        <Text style={[styles.welcomeTitle, { color: theme.text }]}>👋 Hi! I'm your finance assistant</Text>
        <Text style={[styles.welcomeSubtitle, { color: theme.textSecondary }]}>
          Ask me anything about your spending, budgets, or savings goals
        </Text>
        <View style={styles.suggestionsGrid}>
          {suggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.suggestionChip, { backgroundColor: colorScheme === "dark" ? theme.card : "#EEF2FF", borderColor: colorScheme === "dark" ? theme.cardBorder : "#C7D2FE" }]}
              onPress={() => handleSuggestionTap(suggestion)}
            >
              <Text style={[styles.suggestionText, { color: theme.tint }]}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <Text style={[styles.title, { color: theme.text }]}>AI Assistant</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        ListHeaderComponent={renderSuggestions}
        ListFooterComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.tint} />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Thinking...</Text>
            </View>
          ) : null
        }
      />

      <View style={[styles.inputContainer, { borderTopColor: theme.cardBorder, backgroundColor: theme.background }]}>
        <TextInput
          style={[styles.input, { backgroundColor: theme.input, color: theme.text }]}
          placeholder="Ask about your finances..."
          placeholderTextColor={theme.textSecondary}
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={() => sendMessage(inputText)}
          returnKeyType="send"
          editable={!loading}
        />
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: theme.tint }, (!inputText.trim() || loading) && { backgroundColor: theme.progressBg }]}
          onPress={() => sendMessage(inputText)}
          disabled={!inputText.trim() || loading}
        >
          <Text style={styles.sendButtonText}>→</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  messageList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageBubble: {
    maxWidth: "85%",
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  botIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  assistantText: {
    flex: 1,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    paddingBottom: Platform.OS === "ios" ? 28 : 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 16,
    marginRight: 10,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "600",
  },
  suggestionsContainer: {
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 20,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 40,
    marginBottom: 24,
  },
  suggestionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 16,
  },
  suggestionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
