import { describe, expect, test } from "bun:test";
import type * as acp from "@agentclientprotocol/sdk";
import { isTerateSshCommand } from "./acp-command-policy";

function execute(command: string): acp.ToolCallUpdate {
  return { kind: "execute", rawInput: { command }, toolCallId: "call-1" };
}

describe("ACP command policy", () => {
  test("approves ssh to the Terate host", () => {
    expect(isTerateSshCommand(execute("ssh terate 'terate-camera-stats'"))).toBe(
      true
    );
  });

  test("approves ssh options before the host", () => {
    expect(
      isTerateSshCommand(execute("ssh -o BatchMode=yes terate hostname"))
    ).toBe(true);
  });

  test("rejects ssh to any other host", () => {
    expect(isTerateSshCommand(execute("ssh other hostname"))).toBe(false);
  });

  test("rejects local shell commands", () => {
    expect(isTerateSshCommand(execute("rm -rf /tmp/x"))).toBe(false);
  });

  test("rejects non-execute tool calls", () => {
    expect(
      isTerateSshCommand({
        kind: "read",
        rawInput: { command: "ssh terate" },
        toolCallId: "call-1",
      })
    ).toBe(false);
  });

  test("rejects a call without a command", () => {
    expect(
      isTerateSshCommand({ kind: "execute", toolCallId: "call-1" })
    ).toBe(false);
  });
});
