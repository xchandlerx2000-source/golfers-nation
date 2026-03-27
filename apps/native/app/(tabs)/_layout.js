import React from "react";
import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";
import { radii, useAppTheme } from "../../src/theme";

function TabGlyph({ routeName, focused, color }) {
  const stroke = focused ? 2 : 1.5;

  if (routeName === "home") {
    return (
      <View style={glyphStyles.homeWrap}>
        <View
          style={[
            glyphStyles.homeRoof,
            {
              borderBottomColor: color,
              borderBottomWidth: 8,
              borderLeftWidth: 8,
              borderRightWidth: 8,
            },
          ]}
        />
        <View
          style={[
            glyphStyles.homeBase,
            {
              borderColor: color,
              borderWidth: stroke,
            },
          ]}
        />
      </View>
    );
  }

  if (routeName === "score") {
    return (
      <View style={glyphStyles.scoreWrap}>
        {[8, 13, 18].map((height, index) => (
          <View
            key={height}
            style={[
              glyphStyles.scoreBar,
              {
                height,
                backgroundColor: color,
                opacity: focused ? 1 : 0.78 - index * 0.12,
              },
            ]}
          />
        ))}
      </View>
    );
  }

  if (routeName === "community") {
    return (
      <View style={glyphStyles.communityWrap}>
        <View style={[glyphStyles.communityDot, { backgroundColor: color, opacity: focused ? 1 : 0.84 }]} />
        <View style={[glyphStyles.communityDot, glyphStyles.communityDotOffset, { backgroundColor: color, opacity: focused ? 0.88 : 0.7 }]} />
        <View style={[glyphStyles.communityLine, { backgroundColor: color }]} />
      </View>
    );
  }

  return (
    <View style={glyphStyles.profileWrap}>
      <View style={[glyphStyles.profileHead, { borderColor: color, borderWidth: stroke }]} />
      <View style={[glyphStyles.profileBody, { borderColor: color, borderWidth: stroke }]} />
    </View>
  );
}

export default function TabsLayout() {
  const theme = useAppTheme();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTintColor: theme.colors.text,
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
          backgroundColor: theme.colors.tabBar,
          shadowColor: theme.colors.shadow,
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
        tabBarActiveBackgroundColor: theme.colors.surfaceRaised,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "800",
          letterSpacing: 0.3,
        },
        tabBarIcon: ({ color, focused, size }) => (
          <View style={{ width: focused ? size + 2 : size, height: focused ? size + 2 : size, alignItems: "center", justifyContent: "center" }}>
            <TabGlyph routeName={route.name} focused={focused} color={color} />
          </View>
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

const glyphStyles = StyleSheet.create({
  homeWrap: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  homeRoof: {
    width: 0,
    height: 0,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "transparent",
    marginBottom: -1,
  },
  homeBase: {
    width: 14,
    height: 10,
    borderRadius: 4,
    backgroundColor: "transparent",
  },
  scoreWrap: {
    width: 18,
    height: 18,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 2,
  },
  scoreBar: {
    width: 4,
    borderRadius: 999,
  },
  communityWrap: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  communityDot: {
    position: "absolute",
    width: 7,
    height: 7,
    borderRadius: 999,
    top: 2,
    left: 2,
  },
  communityDotOffset: {
    left: 9,
    top: 4,
  },
  communityLine: {
    position: "absolute",
    width: 13,
    height: 4,
    borderRadius: 999,
    bottom: 2,
  },
  profileWrap: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  profileHead: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "transparent",
    marginBottom: 1,
  },
  profileBody: {
    width: 13,
    height: 7,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    backgroundColor: "transparent",
  },
});
