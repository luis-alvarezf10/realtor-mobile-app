import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ScreenHeader } from "../../../shared/components/ScreenHeader";
import { supabase } from "../../../lib/supabase";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

export function ChatScreen({ navigation }: any) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "¡Hola! Soy Hunter AI, tu asistente inmobiliario. ¿En qué puedo ayudarte hoy? Puedes preguntarme sobre propiedades, estrategias de venta, clientes o lo que necesites.",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.text,
        }));

      const { data, error } = await supabase.functions.invoke("chat", {
        body: { message: text, history },
      });

      if (error) throw error;

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.reply,
        sender: "ai",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Lo siento, tuve un problema al procesar tu mensaje. Por favor intenta de nuevo.",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <ScreenHeader
        title="Hunter AI"
        subtitle="Asistente inmobiliario inteligente"
        onBack={() => navigation.goBack()}
      />

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              item.sender === "user" ? styles.userBubble : styles.aiBubble,
            ]}
          >
            {item.sender === "ai" && (
              <View style={styles.aiIcon}>
                <Ionicons name="sparkles" size={16} color="#cc2d19" />
              </View>
            )}
            <View style={styles.bubbleContent}>
              <Text
                style={[
                  styles.bubbleText,
                  item.sender === "user"
                    ? styles.userBubbleText
                    : styles.aiBubbleText,
                ]}
              >
                {item.text}
              </Text>
            </View>
          </View>
        )}
        ListFooterComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <View style={[styles.bubble, styles.aiBubble]}>
                <View style={styles.aiIcon}>
                  <Ionicons name="sparkles" size={16} color="#cc2d19" />
                </View>
                <ActivityIndicator size="small" color="#cc2d19" />
              </View>
            </View>
          ) : null
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Escribe tu mensaje..."
          placeholderTextColor="#9CA3AF"
          multiline
          maxLength={1000}
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!input.trim() || loading}
        >
          <Ionicons
            name="send"
            size={20}
            color={!input.trim() || loading ? "#9CA3AF" : "#fff"}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  listContent: {
    padding: 16,
    paddingBottom: 8,
  },
  bubble: {
    flexDirection: "row",
    maxWidth: "85%",
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: "#cc2d19",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: "#fff",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  aiIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    marginTop: -2,
  },
  bubbleContent: {
    flex: 1,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userBubbleText: {
    color: "#fff",
  },
  aiBubbleText: {
    color: "#111827",
  },
  loadingContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  input: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: "#111827",
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#cc2d19",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: "#F3F4F6",
  },
});
