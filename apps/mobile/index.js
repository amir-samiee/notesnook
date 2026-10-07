/* eslint-disable @typescript-eslint/no-var-requires */
import "./globals.js";
import NetInfo from "@react-native-community/netinfo";
import React from "react";
import { AppRegistry, LogBox, NativeModules } from "react-native";
import Config from "react-native-config";
import "react-native-get-random-values";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { enableFreeze } from "react-native-screens";
import { BackgroundSync } from "./app/services/background-sync";
import Notifications from "./app/services/notifications";
import appJson from "./app.json";

// This bundle is shared between the app and the iOS share extension (the
// extension loads the app's main.jsbundle instead of building its own, which
// saves ~10MB). Everything below module scope therefore runs in BOTH, so
// app-only side effects have to be gated.
//
// `ShareViewController` is an RCT_EXPORT_MODULE declared in
// ios/Make Note/ShareViewController.m, which is compiled only into the
// extension target — so its presence is a reliable discriminator.
const IS_SHARE_EXTENSION = (() => {
  try {
    return !!NativeModules.ShareViewController;
  } catch (e) {
    return false;
  }
})();

if (!IS_SHARE_EXTENSION) {
  // Must stay at module scope: headless launches never render a component, and
  // notifee requires its background handler registered before the event fires.
  BackgroundSync.registerHeadlessTask();
  BackgroundSync.start();
  Notifications.init();
}

enableFreeze(true);
NetInfo.configure({
  reachabilityUrl: "https://api.notesnook.com/health",
  reachabilityTest: (response) => {
    if (!response) return false;
    console.log("reachabilty test", response.status);
    return response?.status >= 200 && response?.status < 300;
  }
});

const appName = appJson.name;
if (Config.isTesting) {
  Date.prototype.toLocaleString = () => "XX-XX-XX";
}

if (__DEV__) {
  console.warn = () => null;
  LogBox.ignoreAllLogs();
}

const AppProvider = () => {
  const App = require("./app/app").default;
  return <App />;
};

AppRegistry.registerComponent(appName, () => AppProvider);

const NotePreviewConfigureProvider = () => {
  const App = require("./app/app").default;
  return <App configureMode="note-preview" />;
};

AppRegistry.registerComponent(
  "NotePreviewConfigure",
  () => NotePreviewConfigureProvider
);

const ShareProvider = () => {
  let NotesnookShare = require("./app/share/index").default;
  return (
    <SafeAreaProvider>
      <NotesnookShare />
    </SafeAreaProvider>
  );
};

AppRegistry.registerComponent("NotesnookShare", () => ShareProvider);
