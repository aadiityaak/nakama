import { describe, expect, test } from "bun:test";
import type * as acp from "@agentclientprotocol/sdk";
import { isApprovedSshCommand } from "./acp-command-policy";

function execute(command: string): acp.ToolCallUpdate {
  return { kind: "execute", rawInput: { command }, toolCallId: "call-1" };
}

describe("ACP command policy", () => {
  test("approves ssh to the Terate host", () => {
    expect(
      isApprovedSshCommand(execute("ssh terate 'terate-camera-stats'"))
    ).toBe(true);
  });

  test("approves ssh to the sweet host", () => {
    expect(isApprovedSshCommand(execute("ssh sweet hostname"))).toBe(true);
  });

  test("approves ssh options before the host", () => {
    expect(
      isApprovedSshCommand(execute("ssh -o BatchMode=yes terate hostname"))
    ).toBe(true);
  });

  test("rejects ssh to any other host", () => {
    expect(isApprovedSshCommand(execute("ssh other hostname"))).toBe(false);
  });

  test("rejects local shell commands", () => {
    expect(isApprovedSshCommand(execute("rm -rf /tmp/x"))).toBe(false);
  });

  test("rejects non-execute tool calls", () => {
    expect(
      isApprovedSshCommand({
        kind: "read",
        rawInput: { command: "ssh terate" },
        toolCallId: "call-1",
      })
    ).toBe(false);
  });

  test("rejects a call without a command", () => {
    expect(
      isApprovedSshCommand({ kind: "execute", toolCallId: "call-1" })
    ).toBe(false);
  });
});
