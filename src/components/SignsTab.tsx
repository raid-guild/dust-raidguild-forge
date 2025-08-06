import { useQuery } from "@tanstack/react-query";

import { connectDustClient } from "dustkit/internal";
import React, { useState } from "react";
import { resourceToHex } from "@latticexyz/common";

type SignsTabProps = {
  getEntityAtCursorWithType: (
    expectedType: "sign" | "forcefield"
  ) => Promise<any>;
  setSignEntityId: (id: string) => void;
  signCursorLoading: boolean;
  signEntityId: string;
};

export const SignsTab: React.FC<SignsTabProps> = ({
  getEntityAtCursorWithType,
  setSignEntityId,
  signCursorLoading,
  signEntityId,
}) => {
  const dustClient = useQuery({
    queryKey: ["dust-client"],
    queryFn: connectDustClient,
  });

  const [signText, setSignText] = useState<string>("");
  const [signUpdateResult, setSignUpdateResult] = useState<string>("");

  // Update sign text
  const updateSignText = async () => {
    if (!signEntityId.trim()) {
      setSignUpdateResult("❌ Please enter a sign entity ID");
      return;
    }

    if (!signText.trim()) {
      setSignUpdateResult("❌ Please enter sign text");
      return;
    }

    try {
      setSignUpdateResult("🔄 Updating sign...");

      // Use the setTextSignContent function from the DefaultProgramSystem
      // Based on the ethereum-monument example: https://github.com/dustproject/ethereum-monument/blob/main/packages/spawn-app/src/spawn/spawnPlayer.ts
      const result = await dustClient.data?.provider.request({
        method: "systemCall",
        params: [
          {
            systemId: resourceToHex({
              type: "system",
              namespace: "dfprograms_1",
              name: "DefaultProgramSystem",
            }),
            abi: [
              {
                type: "function",
                name: "setTextSignContent",
                inputs: [
                  { type: "bytes32", name: "target" },
                  { type: "string", name: "content" },
                ],
                outputs: [],
                stateMutability: "nonpayable",
              },
            ],
            functionName: "setTextSignContent",
            args: [signEntityId, signText],
          },
        ],
      });

      // Check for errors in the result (following the ethereum-monument pattern)
      if (result?.transactionHash) {
        setSignUpdateResult(
          `✅ Sign text updated successfully! Transaction: ${result.transactionHash.slice(0, 10)}...`
        );
        console.log(`✅ Sign text updated: ${signText}`);
        console.log(`📝 Transaction hash: ${result.transactionHash}`);
      } else {
        setSignUpdateResult(`✅ Sign text updated successfully!`);
        console.log(`✅ Sign text updated: ${signText}`);
      }
    } catch (error) {
      console.error("Error updating sign text:", error);
      setSignUpdateResult(
        `❌ Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  return (
    <div>
      <div
        style={{
          backgroundColor: "#2a2a2a",
          padding: "20px 25px",
          borderRadius: "12px",
          marginBottom: "25px",
          border: "2px solid #9C27B0",
          boxShadow: "0 4px 12px rgba(156,39,176,0.2)",
        }}
      >
        <h2
          style={{
            color: "#ffffff",
            fontSize: "1.8rem",
            fontWeight: "bold",
            margin: 0,
            textAlign: "center",
            textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
          }}
        >
          📝 Sign Editor
        </h2>
      </div>

      {/* Sign Editor Form */}
      <div
        style={{
          backgroundColor: "#2a2a2a",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <h3
          style={{
            color: "#ffffff",
            marginBottom: "15px",
            fontSize: "20px",
            fontWeight: "bold",
            textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
            borderBottom: "2px solid #9C27B0",
            paddingBottom: "5px",
          }}
        >
          ✏️ Edit Sign Text
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                color: "#ccc",
              }}
            >
              Sign Entity ID (numeric, e.g., 286365):
            </label>
            <div
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "flex-end",
              }}
            >
              <input
                type="text"
                placeholder="Enter sign entity ID (e.g., 0x1234...)"
                value={signEntityId}
                onChange={(e) => setSignEntityId(e.target.value)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #444",
                  backgroundColor: "#1a1a1a",
                  color: "white",
                }}
              />
              <button
                onClick={() => getEntityAtCursorWithType("sign")}
                disabled={signCursorLoading}
                style={{
                  padding: "10px 16px",
                  backgroundColor: signCursorLoading ? "#666" : "#4CAF50",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: signCursorLoading ? "not-allowed" : "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s ease",
                }}
              >
                {signCursorLoading ? "⏳ Loading..." : "🖱️ Get Sign at Cursor"}
              </button>
            </div>
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                color: "#ccc",
              }}
            >
              Sign Text:
            </label>
            <textarea
              placeholder="Enter the text you want on the sign..."
              value={signText}
              onChange={(e) => setSignText(e.target.value)}
              style={{
                width: "100%",
                minHeight: "100px",
                padding: "10px",
                borderRadius: "4px",
                border: "1px solid #444",
                backgroundColor: "#1a1a1a",
                color: "white",
                resize: "vertical",
              }}
            />
          </div>

          <button
            onClick={updateSignText}
            style={{
              padding: "12px 20px",
              backgroundColor: "#9C27B0",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            📝 Update Sign
          </button>
        </div>

        {signUpdateResult && (
          <div
            style={{
              marginTop: "15px",
              padding: "15px",
              borderRadius: "4px",
              fontFamily: "monospace",
              fontSize: "14px",
              border: signUpdateResult.startsWith("✅")
                ? "1px solid #4CAF50"
                : "1px solid #f44336",
              backgroundColor: signUpdateResult.startsWith("✅")
                ? "#1a3a1a"
                : "#3a1a1a",
            }}
          >
            <strong>Result:</strong>
            <br />
            {signUpdateResult}
          </div>
        )}
      </div>

      {/* Quick Examples */}
      <div
        style={{
          backgroundColor: "#2a2a2a",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <h3>💡 Sign Text Ideas</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "15px",
          }}
        >
          <div
            style={{
              backgroundColor: "#1a1a1a",
              padding: "15px",
              borderRadius: "4px",
            }}
          >
            <h4
              style={{
                color: "#1a1a1a",
                marginBottom: "10px",
                fontSize: "16px",
                fontWeight: "bold",
                textShadow: "1px 1px 1px rgba(0,0,0,0.1)",
              }}
            >
              📍 Location Markers
            </h4>
            <ul style={{ color: "#ccc", fontSize: "14px", lineHeight: "1.4" }}>
              <li>"Welcome to Base Alpha"</li>
              <li>"Mining Site - Level 3"</li>
              <li>"Safe Zone - No PvP"</li>
              <li>"Resource Depot"</li>
            </ul>
          </div>
          <div
            style={{
              backgroundColor: "#1a1a1a",
              padding: "15px",
              borderRadius: "4px",
            }}
          >
            <h4
              style={{
                color: "#1a1a1a",
                marginBottom: "10px",
                fontSize: "16px",
                fontWeight: "bold",
                textShadow: "1px 1px 1px rgba(0,0,0,0.1)",
              }}
            >
              🗺️ Directions
            </h4>
            <ul style={{ color: "#ccc", fontSize: "14px", lineHeight: "1.4" }}>
              <li>"North → Spawn Point"</li>
              <li>"East → Trading Hub"</li>
              <li>"Danger Zone Ahead!"</li>
              <li>"Secret Passage →"</li>
            </ul>
          </div>
          <div
            style={{
              backgroundColor: "#1a1a1a",
              padding: "15px",
              borderRadius: "4px",
            }}
          >
            <h4
              style={{
                color: "#1a1a1a",
                marginBottom: "10px",
                fontSize: "16px",
                fontWeight: "bold",
                textShadow: "1px 1px 1px rgba(0,0,0,0.1)",
              }}
            >
              💬 Messages
            </h4>
            <ul style={{ color: "#ccc", fontSize: "14px", lineHeight: "1.4" }}>
              <li>"John was here"</li>
              <li>"Team meeting spot"</li>
              <li>"Help needed - mining"</li>
              <li>"RaidGuild Territory"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
