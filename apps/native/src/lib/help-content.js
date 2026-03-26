export const HELP_SECTIONS = [
  {
    id: "getting-started",
    title: "Getting Started",
    items: [
      "Use Home for the next action. Start Round if you are hosting. Join Game if you already have a code.",
      "Score is the live tool. Community is for chats, posts, and join flow. Profile holds stats and account access.",
      "Local-safe fallbacks stay on, so you can keep using the app even if cloud sync drops.",
    ],
  },
  {
    id: "accounts",
    title: "Accounts",
    items: [
      "Cloud account mode keeps your session, requests, and live sync attached to the same golfer.",
      "If a cloud session expires during a live round, scoring stays on the phone and sync can recover after sign-in.",
      "Use Profile or Settings to sign out cleanly before switching golfers.",
    ],
  },
  {
    id: "rounds",
    title: "Rounds",
    items: [
      "Pick a course, pick a format, then choose solo or live. The phone flow stays short on purpose.",
      "Finish Round saves the card into local round history and stats.",
      "Course services and tee-time requests only show when the selected course supports them.",
    ],
  },
  {
    id: "community",
    title: "Community",
    items: [
      "Clubhouse is the feed for golf updates and links.",
      "Golf Circle is where follow and friend actions live.",
      "Messages are local-first for now, which keeps the flow testable while backend sync matures.",
    ],
  },
  {
    id: "support",
    title: "Support",
    items: [
      "Use Settings and Testing to inspect sync state, request queue state, and crash logs.",
      "If something feels stale, refresh the session first before assuming the round is broken.",
      "Report the exact error text when possible. That is much more useful than a general description.",
    ],
  },
];
