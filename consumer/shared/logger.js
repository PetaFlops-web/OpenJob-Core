function serialize(arg) {
  if (arg instanceof Error) return { name: arg.name, message: arg.message, stack: arg.stack };
  if (typeof arg === "object" && arg !== null) return arg;
  return String(arg);
}

function emit(level, ...args) {
  const payload = args.length === 1 ? serialize(args[0]) : args.map(serialize);
  const entry = {
    level,
    timestamp: new Date().toISOString(),
    message: payload,
  };
  const line = JSON.stringify(entry);
  (level === "error" ? process.stderr : process.stdout).write(line + "\n");
}

const logger = {
  log(...args)   { emit("info", ...args); },
  warn(...args)  { emit("warn", ...args); },
  error(...args) { emit("error", ...args); },
};

export default logger;