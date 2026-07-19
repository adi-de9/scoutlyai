import Feather from "@expo/vector-icons/Feather";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { usePathname, useRouter } from "expo-router";
import { ReactNode, useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

export const C = {
  bg: "#FCFAF4",
  surface: "#FFFFFF",
  muted: "#F5F1E9",
  text: "#1B2344",
  sub: "#6D7182",
  border: "#E7E0D5",
  indigo: "#6845D8",
  sky: "#3F9CD9",
  coral: "#E45149",
  mint: "#3DBE91",
  amber: "#E3A942",
};
export const F = {
  display: "Fraunces_600SemiBold",
  displayBold: "Fraunces_700Bold",
  sans: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
};

export function Card({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}
export function GradientButton({
  title,
  onPress,
  icon = "arrow-right",
  disabled = false,
  compact = false,
}: {
  title: string;
  onPress: () => void;
  icon?: keyof typeof Feather.glyphMap;
  disabled?: boolean;
  compact?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [pressed && { opacity: 0.88 }, disabled && { opacity: 0.45 }]}
    >
      <LinearGradient
        colors={[C.sky, C.indigo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradientButton, compact && styles.compactButton]}
      >
        <Text style={[styles.buttonText, compact && { fontSize: 13 }]}>{title}</Text>
        <Feather name={icon} size={compact ? 15 : 17} color="#FFFDF8" />
      </LinearGradient>
    </Pressable>
  );
}
export function OutlineButton({
  title,
  onPress,
  icon,
}: {
  title: string;
  onPress: () => void;
  icon?: keyof typeof Feather.glyphMap;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.outlineButton, pressed && { backgroundColor: "#F0ECFF" }]}
    >
      {icon && <Feather name={icon} size={16} color={C.text} />}
      <Text style={styles.outlineText}>{title}</Text>
    </Pressable>
  );
}
export function Pill({
  title,
  active,
  onPress,
  activeColor = C.text,
}: {
  title: string;
  active?: boolean;
  onPress?: () => void;
  activeColor?: string;
}) {
  const content = <Text style={[styles.pillText, active && { color: C.bg }]}>{title}</Text>;
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(active) }}
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        active && [styles.pillActive, { backgroundColor: activeColor, borderColor: activeColor }],
        pressed && styles.pillPressed,
      ]}
    >
      {content}
    </Pressable>
  ) : (
    <View style={[styles.pill, active && styles.pillActive]}>{content}</View>
  );
}
export function Dew({ size = 150 }: { size?: number }) {
  return (
    <Image
      source={require("../../assets/dew-base.png")}
      style={{ width: size, height: size }}
      contentFit="contain"
      accessibilityLabel="Dew mascot"
    />
  );
}
export function ProgressRing({ progress, size = 82 }: { progress: number; size?: number }) {
  const radius = (size - 10) / 2;
  const length = 2 * Math.PI * radius;
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={C.muted}
          strokeWidth="7"
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={C.indigo}
          strokeWidth="7"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${length} ${length}`}
          strokeDashoffset={length - (length * progress) / 100}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={{ fontFamily: F.displayBold, fontSize: size > 90 ? 21 : 17, color: C.text }}>
        {progress}%
      </Text>
    </View>
  );
}
export function RiskPill({ level, label }: { level: "low" | "medium" | "high"; label?: string }) {
  const color = level === "high" ? C.coral : level === "medium" ? C.amber : C.mint;
  return (
    <View style={[styles.risk, { backgroundColor: `${color}1C` }]}>
      <Feather
        name={level === "high" ? "alert-triangle" : level === "medium" ? "clock" : "shield"}
        color={color}
        size={13}
      />
      <Text style={[styles.riskText, { color }]}>{label ?? `${level} risk`}</Text>
    </View>
  );
}
export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const content = <View style={styles.page}>{children}</View>;
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}
const nav = [
  { href: "/home", icon: "home", label: "Home" },
  { href: "/tasks", icon: "check-square", label: "Tasks" },
  { href: "/add", icon: "plus", label: "Add", primary: true },
  { href: "/calendar", icon: "calendar", label: "Calendar" },
  { href: "/insights", icon: "trending-up", label: "Insights" },
] as const;
const NAV_TRAY_HEIGHT = 68;
const NAV_FLOATING_OFFSET = 28;
const NAV_FAB_SIZE = 68;
const NAV_DOCK_HEIGHT = NAV_TRAY_HEIGHT + NAV_FLOATING_OFFSET;

type NavigationItem = (typeof nav)[number];
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function AnimatedNavigationItem({
  item,
  active,
  onPress,
}: {
  item: NavigationItem;
  active: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const lift = useSharedValue(active ? -3 : 0);

  useEffect(() => {
    lift.value = withSpring(active ? -3 : 0, { damping: 15, stiffness: 190 });
  }, [active, lift]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.value }, { scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      hitSlop={5}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.91, { damping: 15, stiffness: 260 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 220 });
      }}
      style={[styles.navItem, animatedStyle]}
    >
      <View style={[styles.navIconWrap, active && styles.navIconWrapActive]}>
        <Feather name={item.icon} size={20} color={active ? C.indigo : C.sub} />
      </View>
      <Text style={[styles.navText, active && { color: C.indigo }]}>{item.label}</Text>
    </AnimatedPressable>
  );
}

function AnimatedAddButton({ active, onPress }: { active: boolean; onPress: () => void }) {
  const scale = useSharedValue(active ? 1.05 : 1);
  const lift = useSharedValue(active ? -2 : 0);

  useEffect(() => {
    scale.value = withSpring(active ? 1.05 : 1, { damping: 14, stiffness: 190 });
    lift.value = withSpring(active ? -2 : 0, { damping: 14, stiffness: 190 });
  }, [active, lift, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.value }, { scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel="Add notice"
      hitSlop={8}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.93, { damping: 15, stiffness: 280 });
      }}
      onPressOut={() => {
        scale.value = withSpring(active ? 1.05 : 1, { damping: 14, stiffness: 190 });
      }}
      style={[styles.navAddButton, animatedStyle]}
    >
      <View style={[styles.navFab, active && styles.navFabActive]}>
        <Feather name="plus" size={29} color="#FFFDF8" />
      </View>
    </AnimatedPressable>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: NAV_DOCK_HEIGHT + insets.bottom + 34 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.page}>{children}</View>
      </ScrollView>
      <View
        style={[
          styles.navDock,
          { height: NAV_DOCK_HEIGHT + insets.bottom, paddingBottom: insets.bottom },
        ]}
      >
        <View style={styles.navTray}>
          {nav.slice(0, 2).map((item) => (
            <AnimatedNavigationItem
              key={item.href}
              item={item}
              active={pathname === item.href}
              onPress={() => router.replace(item.href)}
            />
          ))}
          <View style={styles.navCenterSlot}>
            <AnimatedAddButton
              active={pathname === "/add"}
              onPress={() => router.replace("/add")}
            />
          </View>
          {nav.slice(3).map((item) => (
            <AnimatedNavigationItem
              key={item.href}
              item={item}
              active={pathname === item.href}
              onPress={() => router.replace(item.href)}
            />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}
export function Header({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Text style={styles.h1}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1 },
  page: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    paddingHorizontal: 18,
    paddingTop: 20,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: C.text,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  gradientButton: {
    minHeight: 49,
    borderRadius: 26,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: C.indigo,
    shadowOpacity: 0.28,
    shadowRadius: 13,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  compactButton: { minHeight: 40, paddingHorizontal: 15 },
  buttonText: { fontFamily: F.bold, color: "#FFFDF8", fontSize: 14 },
  outlineButton: {
    minHeight: 45,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
  },
  outlineText: { fontFamily: F.medium, color: C.text, fontSize: 14 },
  pill: {
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    borderRadius: 21,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pillActive: { backgroundColor: C.text, borderColor: C.text },
  pillPressed: { opacity: 0.82 },
  pillText: { fontFamily: F.medium, color: C.text, fontSize: 13 },
  risk: {
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 15,
  },
  riskText: { fontFamily: F.bold, fontSize: 11, textTransform: "capitalize" },
  navDock: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: NAV_FLOATING_OFFSET,
    paddingHorizontal: 12,
    zIndex: 10,
    elevation: 10,
  },
  navTray: {
    height: NAV_TRAY_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFDEA",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 28,
    shadowColor: C.text,
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: NAV_TRAY_HEIGHT,
    gap: 3,
  },
  navIconWrap: {
    minWidth: 30,
    minHeight: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },
  navIconWrapActive: { backgroundColor: "#F0ECFF" },
  navCenterSlot: { flex: 1 },
  navAddButton: {
    position: "absolute",
    top: -40,
    alignSelf: "center",
    width: NAV_FAB_SIZE,
    height: NAV_FAB_SIZE,
    alignItems: "center",
    zIndex: 2,
    elevation: 12,
  },
  navFab: {
    height: NAV_FAB_SIZE,
    width: NAV_FAB_SIZE,
    borderRadius: NAV_FAB_SIZE / 2,
    backgroundColor: C.indigo,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: C.bg,
    shadowColor: C.indigo,
    shadowOpacity: 0.34,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 12,
  },
  navFabActive: { backgroundColor: "#5630C9" },
  navText: { fontFamily: F.medium, color: C.sub, fontSize: 10 },
  h1: {
    fontFamily: F.displayBold,
    color: C.text,
    fontSize: 28,
    lineHeight: 33,
    letterSpacing: -0.4,
  },
  subtitle: { fontFamily: F.sans, color: C.sub, fontSize: 13, lineHeight: 19, marginTop: 5 },
  header: { flexDirection: "row", gap: 12, alignItems: "flex-start", marginBottom: 18 },
});
