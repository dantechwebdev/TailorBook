/**
 * FloatingAssistant
 *
 * The TailorBook AI assistant widget.
 *
 * Rules (from Mission 3 spec):
 * - Visible only on: Dashboard, Customer Details, Job Details, Business Insights
 * - Hidden on: Onboarding, New Customer, New Job, Edit screens, Settings, TailorStudio, Auth
 * - Draggable — remembers its last position
 * - Opens a modal chat interface
 * - Remains silent unless the AI has something useful to say
 * - Never interrupts the tailor's workflow
 *
 * Architecture:
 * - Component is self-contained. Parent screens just render <FloatingAssistant screen="..." />
 * - Position is persisted via AsyncStorage between sessions
 * - The AI insight (if any) is fetched on mount and shown as a subtle pulse
 * - Tapping opens a full chat modal
 */

import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  memo,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { Typography, Spacing, Radius, Shadow } from '../../constants/theme';
import { aiService } from '../../services/ai/AIService';
import { AIMessage, AIContext } from '../../types';
import { SparkleIcon, CloseIcon, ChevronRightIcon } from '../common/Icons';

// ─── Constants ────────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const FAB_SIZE = 52;
const FAB_MARGIN = 20;
const POSITION_KEY = '@tailorbook/assistant_position';

// Screens where the assistant is shown
export type AssistantScreen = 'Dashboard' | 'CustomerDetail' | 'JobDetail' | 'BusinessInsights';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FloatingAssistantProps {
  screen: AssistantScreen;
  context?: AIContext;
}

interface Position {
  x: number;
  y: number;
}

const DEFAULT_POSITION: Position = {
  x: SCREEN_WIDTH - FAB_SIZE - FAB_MARGIN,
  y: SCREEN_HEIGHT * 0.6,
};

// ─── Floating Assistant ───────────────────────────────────────────────────────

const FloatingAssistant: React.FC<FloatingAssistantProps> = memo(({ screen, context }) => {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  // ── Position state ────────────────────────────────────────────────────
  const pan = useRef(new Animated.ValueXY()).current;
  const [position, setPosition] = useState<Position>(DEFAULT_POSITION);
  const [isDragging, setIsDragging] = useState(false);
  const positionRef = useRef(position);

  // ── Chat state ────────────────────────────────────────────────────────
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [proactiveHint, setProactiveHint] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const hintOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef<ScrollView>(null);

  // ── Restore saved position ────────────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(POSITION_KEY)
      .then((val) => {
        if (val) {
          const saved: Position = JSON.parse(val);
          // Clamp to current screen bounds
          const clamped = clampPosition(saved);
          setPosition(clamped);
          positionRef.current = clamped;
          pan.setValue({ x: 0, y: 0 });
        }
      })
      .catch(() => {/* ignore */});
  }, []);

  // ── PanResponder for drag ─────────────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,

      onPanResponderGrant: () => {
        pan.setOffset({ x: (pan.x as any)._value, y: (pan.y as any)._value });
        pan.setValue({ x: 0, y: 0 });
        setIsDragging(true);
      },

      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),

      onPanResponderRelease: (_, g) => {
        pan.flattenOffset();
        setIsDragging(false);

        // Calculate new absolute position
        const newPos = clampPosition({
          x: positionRef.current.x + g.dx,
          y: positionRef.current.y + g.dy,
        });

        setPosition(newPos);
        positionRef.current = newPos;
        pan.setValue({ x: 0, y: 0 });

        AsyncStorage.setItem(POSITION_KEY, JSON.stringify(newPos)).catch(() => {});
      },
    })
  ).current;

  // ── Proactive AI hint ─────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    const fetchHint = async () => {
      try {
        await aiService.initialize();
        // Only generate a hint if we have context data
        if (!context?.data) return;

        let hint: string | null = null;

        if (screen === 'JobDetail' && context.data) {
          hint = await aiService.getJobInsight(context.data as any);
        } else if (screen === 'CustomerDetail' && context.data) {
          hint = await aiService.getCustomerInsight(context.data as any);
        } else if (screen === 'BusinessInsights' && context.data) {
          hint = await aiService.getBusinessInsight(context.data as any);
        }

        if (hint && mounted) {
          setProactiveHint(hint);
          // Show hint bubble after a short delay
          setTimeout(() => {
            if (!mounted) return;
            setShowHint(true);
            Animated.timing(hintOpacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }).start();
            // Auto-dismiss after 5 seconds
            setTimeout(() => {
              if (!mounted) return;
              Animated.timing(hintOpacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
              }).start(() => setShowHint(false));
            }, 5000);
          }, 1500);
        }
      } catch {
        // AI hints are non-critical — fail silently
      }
    };

    fetchHint();

    // Subtle pulse animation for the FAB
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
      ])
    );
    pulse.start();

    return () => {
      mounted = false;
      pulse.stop();
    };
  }, [screen, context]);

  // ── Send message ──────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isSending) return;

    const userMessage: AIMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsSending(true);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      await aiService.initialize();
      const response = await aiService.chat([...messages, userMessage], screen);

      const assistantMessage: AIMessage = {
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I had trouble responding. Please try again.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsSending(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [inputText, isSending, messages, screen]);

  const handleOpen = useCallback(() => {
    if (isDragging) return;
    setShowHint(false);
    // Seed with proactive hint as first assistant message if available
    if (proactiveHint && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: proactiveHint,
        timestamp: new Date().toISOString(),
      }]);
    }
    setIsOpen(true);
  }, [isDragging, proactiveHint, messages]);

  // ── Render position ───────────────────────────────────────────────────
  const fabStyle = {
    left: position.x,
    top: position.y,
    transform: pan.getTranslateTransform(),
  };

  return (
    <>
      {/* ─── Floating Button ─── */}
      <Animated.View
        style={[styles.fab, fabStyle]}
        {...panResponder.panHandlers}
      >
        {/* Proactive hint bubble */}
        {showHint && proactiveHint && (
          <Animated.View style={[styles.hintBubble, { opacity: hintOpacity }]}>
            <Text style={styles.hintText} numberOfLines={3}>{proactiveHint}</Text>
          </Animated.View>
        )}

        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={[styles.fabBtn, { backgroundColor: colors.primary }]}
            onPress={handleOpen}
            activeOpacity={0.9}
            accessibilityLabel="Open TailorBook Assistant"
            accessibilityRole="button"
          >
            <SparkleIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      {/* ─── Chat Modal ─── */}
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent
        presentationStyle="overFullScreen"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalSheet}
          >
            {/* Header */}
            <View style={[styles.modalHeader, { backgroundColor: colors.primary }]}>
              <View style={styles.modalHeaderLeft}>
                <SparkleIcon size={18} color="#FFFFFF" />
                <View style={styles.modalHeaderText}>
                  <Text style={styles.modalTitle}>TailorBook Assistant</Text>
                  <Text style={styles.modalSubtitle}>{screen}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setIsOpen(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <CloseIcon size={20} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            </View>

            {/* Messages */}
            <ScrollView
              ref={scrollRef}
              style={[styles.messagesContainer, { backgroundColor: colors.background }]}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
            >
              {messages.length === 0 && (
                <View style={styles.emptyChat}>
                  <SparkleIcon size={32} color={colors.textTertiary} />
                  <Text style={[styles.emptyChatTitle, { color: colors.textPrimary }]}>
                    How can I help?
                  </Text>
                  <Text style={[styles.emptyChatSub, { color: colors.textSecondary }]}>
                    Ask me anything about this {screen.toLowerCase().replace('detail', '').trim()}.
                  </Text>
                </View>
              )}

              {messages.map((msg, idx) => (
                <ChatBubble key={idx} message={msg} colors={colors} styles={styles} />
              ))}

              {isSending && (
                <View style={[styles.assistantBubble, { backgroundColor: colors.surface }]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              )}
            </ScrollView>

            {/* Input */}
            <View style={[styles.inputRow, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.background }]}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask me anything..."
                placeholderTextColor={colors.textTertiary}
                multiline
                maxLength={500}
                returnKeyType="send"
                onSubmitEditing={handleSend}
                blurOnSubmit={false}
              />
              <TouchableOpacity
                style={[styles.sendBtn, { backgroundColor: inputText.trim() ? colors.primary : colors.border }]}
                onPress={handleSend}
                disabled={!inputText.trim() || isSending}
              >
                <ChevronRightIcon size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
});

FloatingAssistant.displayName = 'FloatingAssistant';

// ─── Chat Bubble ──────────────────────────────────────────────────────────────

const ChatBubble = memo(({
  message,
  colors,
  styles,
}: {
  message: AIMessage;
  colors: any;
  styles: any;
}) => {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.bubbleRow, isUser && styles.bubbleRowUser]}>
      <View
        style={[
          isUser ? styles.userBubble : styles.assistantBubble,
          { backgroundColor: isUser ? colors.primary : colors.surface },
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            { color: isUser ? '#FFFFFF' : colors.textPrimary },
          ]}
        >
          {message.content}
        </Text>
      </View>
    </View>
  );
});

ChatBubble.displayName = 'ChatBubble';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clampPosition(pos: Position): Position {
  return {
    x: Math.max(FAB_MARGIN, Math.min(SCREEN_WIDTH - FAB_SIZE - FAB_MARGIN, pos.x)),
    y: Math.max(100, Math.min(SCREEN_HEIGHT - FAB_SIZE - 100, pos.y)),
  };
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (colors: any) =>
  StyleSheet.create({
    fab: {
      position: 'absolute',
      zIndex: 999,
      alignItems: 'flex-end',
    },
    fabBtn: {
      width: FAB_SIZE,
      height: FAB_SIZE,
      borderRadius: FAB_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      ...Shadow.lg,
    },
    hintBubble: {
      position: 'absolute',
      right: FAB_SIZE + Spacing.sm,
      bottom: 0,
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      padding: Spacing.md,
      maxWidth: 220,
      ...Shadow.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    hintText: {
      fontSize: Typography.xs,
      color: colors.textPrimary,
      lineHeight: 17,
    },
    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalSheet: {
      height: SCREEN_HEIGHT * 0.72,
      borderTopLeftRadius: Radius.xxl,
      borderTopRightRadius: Radius.xxl,
      overflow: 'hidden',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.md,
      paddingTop: Spacing.lg,
    },
    modalHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    modalHeaderText: {
      marginLeft: Spacing.xs,
    },
    modalTitle: {
      fontSize: Typography.base,
      fontWeight: Typography.bold,
      color: '#FFFFFF',
    },
    modalSubtitle: {
      fontSize: Typography.xs,
      color: 'rgba(255,255,255,0.7)',
      marginTop: 1,
    },
    messagesContainer: { flex: 1 },
    messagesContent: {
      padding: Spacing.base,
      paddingBottom: Spacing.xl,
      flexGrow: 1,
    },
    emptyChat: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.xxxl,
      gap: Spacing.md,
    },
    emptyChatTitle: {
      fontSize: Typography.lg,
      fontWeight: Typography.bold,
      marginTop: Spacing.md,
    },
    emptyChatSub: {
      fontSize: Typography.sm,
      textAlign: 'center',
      lineHeight: 20,
      paddingHorizontal: Spacing.xl,
    },
    bubbleRow: {
      marginBottom: Spacing.md,
      alignItems: 'flex-start',
    },
    bubbleRowUser: {
      alignItems: 'flex-end',
    },
    assistantBubble: {
      maxWidth: '80%',
      borderRadius: Radius.lg,
      borderTopLeftRadius: 4,
      padding: Spacing.md,
      ...Shadow.sm,
    },
    userBubble: {
      maxWidth: '80%',
      borderRadius: Radius.lg,
      borderTopRightRadius: 4,
      padding: Spacing.md,
    },
    bubbleText: {
      fontSize: Typography.sm,
      lineHeight: 20,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      padding: Spacing.md,
      borderTopWidth: 1,
      gap: Spacing.sm,
    },
    input: {
      flex: 1,
      borderRadius: Radius.lg,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      fontSize: Typography.base,
      maxHeight: 100,
    },
    sendBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

export default FloatingAssistant;
