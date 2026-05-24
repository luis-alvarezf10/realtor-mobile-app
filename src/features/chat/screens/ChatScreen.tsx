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
  Keyboard,
  Animated,
  Easing,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../../lib/supabase";
import { GradientBackground } from "../../../shared/components/GradientBackground";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

const QUICK_ACTIONS = [
  { label: "Resumen de hoy", prompt: "Dame mi resumen operativo de hoy: citas, riesgos y prioridades." },
  { label: "Riesgos de citas", prompt: "Revisa mis citas de hoy y dime si hay riesgos por clima, horario o cliente." },
  { label: "Atencion al cliente", prompt: "Dame recomendaciones de atencion al cliente para mis citas de hoy." },
  { label: "Seguimiento", prompt: "Ayudame a preparar mensajes de seguimiento para clientes con citas de hoy." },
];

function getLocalDate() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function ChatScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "Hola, soy Hunterito. Puedo revisar tu agenda, detectar riesgos por clima, darte recordatorios de citas y sugerirte acciones para atender mejor a tus clientes.",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const bottomPadding = useRef(new Animated.Value(Math.max(insets.bottom, 10) + 78)).current;

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  useEffect(() => {
    const closedPadding = Math.max(insets.bottom, 10) + 78;
    const openPadding = 10;

    const animatePadding = (toValue: number, duration = 250) => {
      Animated.timing(bottomPadding, {
        toValue,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    };

    bottomPadding.setValue(closedPadding);

    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      Keyboard.scheduleLayoutAnimation(event);
      animatePadding(openPadding, event.duration || 250);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, (event) => {
      Keyboard.scheduleLayoutAnimation(event);
      animatePadding(closedPadding, event.duration || 250);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [bottomPadding, insets.bottom]);

  const sendMessage = async (quickPrompt?: string) => {
    const text = (quickPrompt || input).trim();
    if (!text || loading) return;

    if (!quickPrompt) setInput("");

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
        body: { message: text, history, localDate: getLocalDate() },
      });

      if (error) {
        throw new Error(data?.error || error.message || "Edge Function error");
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.reply,
        sender: "ai",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      console.error("Hunterito error:", err);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: err?.message
          ? `Tuve un problema procesando tu solicitud: ${err.message}`
          : "Tuve un problema procesando tu solicitud. Intenta de nuevo en un momento.",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <View style={styles.headerIcon}>
            <Ionicons name="sparkles" size={22} color="#cc2d19" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Hunterito</Text>
            <Text style={styles.headerSubtitle}>Agenda, clientes y recomendaciones</Text>
          </View>
          <View style={styles.headerStatus}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Activo</Text>
          </View>
        </View>

        <View style={styles.quickActionsWrap}>
          <FlatList
            horizontal
            data={QUICK_ACTIONS}
            keyExtractor={(item) => item.label}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.quickAction, loading && styles.quickActionDisabled]}
                onPress={() => sendMessage(item.prompt)}
                disabled={loading}
                activeOpacity={0.82}
              >
                <Ionicons name="sparkles-outline" size={15} color="#cc2d19" />
                <Text style={styles.quickActionText}>{item.label}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.sender === "user" ? styles.userBubble : styles.aiBubble]}>
              {item.sender === "ai" && (
                <View style={styles.aiIcon}>
                  <Ionicons name="sparkles" size={16} color="#cc2d19" />
                </View>
              )}
              <View style={styles.bubbleContent}>
                <Text style={[styles.bubbleText, item.sender === "user" ? styles.userBubbleText : styles.aiBubbleText]}>
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

        <Animated.View
          style={[
            styles.inputContainer,
            { paddingBottom: bottomPadding },
          ]}
        >
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Pidele una recomendacion..."
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={1000}
            onSubmitEditing={() => sendMessage()}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]}
            onPress={() => sendMessage()}
            disabled={!input.trim() || loading}
          >
            <Ionicons name="send" size={20} color={!input.trim() || loading ? "#9CA3AF" : "#fff"} />
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(204, 45, 25, 0.16)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(204, 45, 25, 0.26)",
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 21,
    fontWeight: "900",
  },
  headerSubtitle: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  headerStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.24)",
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  statusText: {
    color: "#A7F3D0",
    fontSize: 11,
    fontWeight: "800",
  },
  quickActionsWrap: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  quickActionsContent: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  quickAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  quickActionDisabled: {
    opacity: 0.55,
  },
  quickActionText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  listContent: {
    padding: 16,
    paddingBottom: 18,
  },
  bubble: {
    flexDirection: "row",
    maxWidth: "88%",
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
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  aiIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
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
    color: "#fff",
  },
  loadingContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "rgba(10, 10, 10, 0.72)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.10)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: "#fff",
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
    backgroundColor: "rgba(255, 255, 255, 0.10)",
  },
});
