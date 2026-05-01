type DevToolsOrientation = "vertical" | "horizontal";

export type DevToolsState = {
  readonly isOpen: boolean;
  readonly orientation?: DevToolsOrientation;
};

type FirebugWindow = Window & {
  Firebug?: {
    chrome?: {
      isInitialized?: boolean;
    };
  };
};

const DEVTOOLS_THRESHOLD = 170;
const DEVTOOLS_POLL_INTERVAL_MS = 500;
const DEVTOOLS_CONSOLE_PROBE_INTERVAL_MS = 1000;

const devtools: {
  isOpen: boolean;
  orientation?: DevToolsOrientation;
} = {
  isOpen: false,
  orientation: undefined,
};

function emitDevToolsChange(isOpen: boolean, orientation?: DevToolsOrientation) {
  window.dispatchEvent(
    new CustomEvent<DevToolsState>("devtoolschange", {
      detail: { isOpen, orientation },
    }),
  );
}

function markDevToolsOpen(orientation?: DevToolsOrientation) {
  if ((!devtools.isOpen || devtools.orientation !== orientation)) {
    emitDevToolsChange(true, orientation);
  }

  devtools.isOpen = true;
  devtools.orientation = orientation;
}

function createConsoleProbe() {
  const probe = new Image();

  Object.defineProperty(probe, "id", {
    configurable: true,
    get() {
      markDevToolsOpen(devtools.orientation);
      return "";
    },
  });

  return probe;
}

function runDetection({ emitEvents = true }: { emitEvents?: boolean } = {}) {
  const widthThreshold = window.outerWidth - window.innerWidth > DEVTOOLS_THRESHOLD;
  const heightThreshold = window.outerHeight - window.innerHeight > DEVTOOLS_THRESHOLD;
  const orientation: DevToolsOrientation = widthThreshold ? "vertical" : "horizontal";
  const firebugInitialized = Boolean(
    (window as FirebugWindow).Firebug?.chrome?.isInitialized,
  );

  if (!(heightThreshold && widthThreshold) && (firebugInitialized || widthThreshold || heightThreshold)) {
    if ((!devtools.isOpen || devtools.orientation !== orientation) && emitEvents) {
      emitDevToolsChange(true, orientation);
    }

    devtools.isOpen = true;
    devtools.orientation = orientation;
    return;
  }

  if (devtools.isOpen && emitEvents) {
    emitDevToolsChange(false, undefined);
  }

  devtools.isOpen = false;
  devtools.orientation = undefined;
}

if (typeof window !== "undefined") {
  const consoleProbe = createConsoleProbe();

  runDetection({ emitEvents: false });
  window.setInterval(() => {
    runDetection();
  }, DEVTOOLS_POLL_INTERVAL_MS);
  window.setInterval(() => {
    if (devtools.isOpen) return;
    console.debug(consoleProbe);
  }, DEVTOOLS_CONSOLE_PROBE_INTERVAL_MS);
}

export default devtools;