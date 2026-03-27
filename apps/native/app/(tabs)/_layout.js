import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii } from "../../src/theme";

function getTabIconName(routeName, focused) {
  switch (routeName) {
    case "home":
      return focused ? "home" : "home-outline";
    case "score":
      return focused ? "golf" : "golf-outline";
    case "community":
      return focused ? "people" : "people-outline";
    case "profile":
      return focused ? "person-circle" : "person-circle-outline";
    default:
      return focused ? "ellipse" : "ellipse-outline";
  }
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: "800",
        },
        tabBarStyle: {
          position: "absolute",
          left: 14,
          right: 14,
          bottom: 14,
          height: 78,
          paddingTop: 8,
          paddingBottom: 12,
          borderTopWidth: 0,
          borderRadius: radii.xl,
          backgroundColor: colors.tabBar,
          shadowColor: colors.shadow,
          shadowOpacity: 0.32,
          shadowRadius: 24,
          shadowOffset: {
            width: 0,
            height: 12,
          },
          elevation: 12,
        },
        tabBarItemStyle: {
          marginHorizontal: 4,
          borderRadius: radii.lg,
        },
        tabBarActiveBackgroundColor: colors.surfaceRaised,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "800",
          letterSpacing: 0.3,
        },
        tabBarIcon: ({ color, focused, size }) => (
          <Ionicons name={getTabIconName(route.name, focused)} size={focused ? size + 2 : size} color={color} />
        ),
      })}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="score" options={{ title: "Score" }} />
      <Tabs.Screen name="community" options={{ title: "Community" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
