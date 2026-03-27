import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AppButton } from "./AppButton";
import { AppThemeContext, defaultTheme, spacing } from "../theme";
import { recordNativeCrashLog } from "../services/native-crash-service";

export class CrashBoundary extends React.Component {
  static contextType = AppThemeContext;

  constructor(props) {
    super(props);
    this.state = {
      crashed: false,
      crashId: "",
    };
  }

  static getDerivedStateFromError() {
    return {
      crashed: true,
    };
  }

  async componentDidCatch(error, info) {
    const entry = await recordNativeCrashLog({
      stage: "render",
      source: "crash-boundary",
      error,
      context: {
        componentStack: info?.componentStack || "",
        ...(typeof this.props.getContext === "function" ? this.props.getContext() : {}),
      },
    });

    this.setState({
      crashId: entry.id,
    });
  }

  render() {
    if (!this.state.crashed) {
      return this.props.children;
    }

    const theme = this.context || defaultTheme;
    const styles = createStyles(theme);

    return (
      <View style={styles.screen}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.copy}>The app saved a crash log for this device.</Text>
        {this.state.crashId ? <Text style={styles.meta}>Crash ID {this.state.crashId}</Text> : null}
        <View style={styles.actions}>
          <AppButton
            label="Return to Start"
            onPress={() => {
              this.setState({ crashed: false, crashId: "" });
              if (typeof this.props.onReset === "function") {
                this.props.onReset();
              }
            }}
          />
        </View>
      </View>
    );
  }
}

const createStyles = (theme) => StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: theme.colors.background,
  },
  title: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: "800",
  },
  copy: {
    color: theme.colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  meta: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  actions: {
    marginTop: spacing.sm,
  },
});
