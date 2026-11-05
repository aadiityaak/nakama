import type * as acp from "@agentclientprotocol/sdk";

/**
 * The Terate host is the one machine a chat may reach over SSH: the server
 * keeps read-only snapshots (camera stats, logs) that the profile needs.
 * Every other shell command stays denied, so the agent cannot use bash to
 * touch the Nakama host itself.
 */
const ALLOWED_HOST = "terate";

export function isTerateSshCommand(toolCall: acp.ToolCallUpdate): boolean {
  if (toolCall.kind !== "execute") {
    return false;
  }

  const command = commandFrom(toolCall.rawInput);

  if (!command) {
    return false;
  }

  const argv = splitCommand(command);

  if (argv[0] !== "ssh") {
    return false;
  }

  // Skip ssh options and their values, then check the destination host.
  for (let index = 1; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === undefined) {
      return false;
    }

    if (token === "--") {
      return argv[index + 1] === ALLOWED_HOST;
    }

    if (token.startsWith("-")) {
      // Options such as `-o BatchMode=yes` take a value; flags such as `-4` do not.
      index += token === "-o" || token === "-i" || token === "-p" ? 1 : 0;

      continue;
    }

    return token === ALLOWED_HOST;
  }

  return false;
}

function commandFrom(rawInput: unknown): string | null {
  if (!rawInput || typeof rawInput !== "object") {
    return null;
  }

  if (!("command" in rawInput)) {
    return null;
  }

  return typeof rawInput.command === "string" ? rawInput.command : null;
}

/** Split only on whitespace; quoting is kept for the SSH process to interpret. */
function splitCommand(command: string): string[] {
  return command
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0);
}
