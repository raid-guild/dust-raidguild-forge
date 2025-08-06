import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { connectDustClient } from "dustkit/internal";
import { resourceToHex } from "@latticexyz/common";

type ForcefieldTabProps = {
  forceFieldCursorLoading: boolean;
  getEntityAtCursorWithType: (
    expectedType: "sign" | "forcefield"
  ) => Promise<any>;
  setTargetEntityId: React.Dispatch<React.SetStateAction<string>>;
  targetEntityId: string;
};

export const ForcefieldTab: React.FC<ForcefieldTabProps> = ({
  forceFieldCursorLoading,
  getEntityAtCursorWithType,
  setTargetEntityId,
  targetEntityId,
}) => {
  const dustClient = useQuery({
    queryKey: ["dust-client"],
    queryFn: connectDustClient,
  });

  // ForceField state (keeping for the other tab)
  const [memberEntityId, setMemberEntityId] = useState<string>("");

  // ForceField system call handler (keeping for the other tab)
  const handleSystemCall = async (functionName: string, args: any[] = []) => {
    try {
      const result = await dustClient.data?.provider.request({
        method: "systemCall",
        params: [
          {
            systemId: resourceToHex({
              type: "system",
              namespace: "",
              name: "DefaultProgramSystem",
            }),
            abi: [
              {
                type: "function",
                name: "setMembership",
                inputs: [
                  { type: "bytes32", name: "target" },
                  { type: "address", name: "member" },
                  { type: "bool", name: "allowed" },
                ],
                outputs: [],
                stateMutability: "nonpayable",
              },
              {
                type: "function",
                name: "setMembership",
                inputs: [
                  { type: "bytes32", name: "target" },
                  { type: "bytes32", name: "member" },
                  { type: "bool", name: "allowed" },
                ],
                outputs: [],
                stateMutability: "nonpayable",
              },
              {
                type: "function",
                name: "setMembership",
                inputs: [
                  { type: "uint256", name: "groupId" },
                  { type: "address", name: "member" },
                  { type: "bool", name: "allowed" },
                ],
                outputs: [],
                stateMutability: "nonpayable",
              },
              {
                type: "function",
                name: "setMembership",
                inputs: [
                  { type: "uint256", name: "groupId" },
                  { type: "bytes32", name: "member" },
                  { type: "bool", name: "allowed" },
                ],
                outputs: [],
                stateMutability: "nonpayable",
              },
            ],
            functionName,
            args,
          },
        ],
      });

      if (result?.transactionHash) {
        console.log(
          `✅ Successfully called ${functionName}. Transaction: ${result.transactionHash.slice(0, 10)}...`
        );
      } else {
        console.log(`✅ Successfully called ${functionName}`);
      }
    } catch (error) {
      console.error(`❌ Error calling ${functionName}:`, error);
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
          border: "2px solid #2196F3",
          boxShadow: "0 4px 12px rgba(33,150,243,0.2)",
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
          🔒 ForceField Operations
        </h2>
      </div>

      <div
        style={{
          backgroundColor: "#2a2a2a",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "20px",
          border: "1px solid #2196F3",
        }}
      >
        <h3
          style={{
            color: "#ffffff",
            marginBottom: "15px",
            fontSize: "18px",
            fontWeight: "bold",
            textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
          }}
        >
          🔒 Membership Management
        </h3>
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "10px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "10px",
              flex: 1,
              minWidth: "300px",
            }}
          >
            <input
              type="text"
              placeholder="ForceField Entity ID (numeric)"
              value={targetEntityId}
              onChange={(e) => setTargetEntityId(e.target.value)}
              style={{
                flex: 1,
                padding: "12px",
                backgroundColor: "#1a1a1a",
                border: "1px solid #444",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "14px",
              }}
            />
            <button
              onClick={() => getEntityAtCursorWithType("forcefield")}
              disabled={forceFieldCursorLoading}
              style={{
                padding: "8px 16px",
                backgroundColor: forceFieldCursorLoading ? "#666" : "#2196F3",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: forceFieldCursorLoading ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s ease",
              }}
            >
              {forceFieldCursorLoading
                ? "⏳ Loading..."
                : "🖱️ Get FF at Cursor"}
            </button>
          </div>
          <button
            onClick={() =>
              handleSystemCall("setMembership", [
                targetEntityId,
                memberEntityId,
                true,
              ])
            }
            style={{
              padding: "8px 16px",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
            }}
          >
            Add Member
          </button>
          <button
            onClick={() =>
              handleSystemCall("setMembership", [
                targetEntityId,
                memberEntityId,
                false,
              ])
            }
            style={{
              padding: "8px 16px",
              backgroundColor: "#f44336",
              color: "white",
              border: "none",
              borderRadius: "4px",
            }}
          >
            Remove Member
          </button>
        </div>
      </div>

      <div
        style={{
          backgroundColor: "#2a2a2a",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "20px",
          border: "1px solid #2196F3",
        }}
      >
        <h3
          style={{
            color: "#ffffff",
            marginBottom: "15px",
            fontSize: "18px",
            fontWeight: "bold",
            textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
          }}
        >
          👤 Member Input
        </h3>
        <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
          <input
            type="text"
            placeholder="Member Address or Entity ID"
            value={memberEntityId}
            onChange={(e) => setMemberEntityId(e.target.value)}
            style={{
              flex: 1,
              padding: "12px",
              backgroundColor: "#1a1a1a",
              border: "1px solid #444",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "14px",
            }}
          />
          <div style={{ fontSize: "12px", color: "#888", marginTop: "5px" }}>
            Enter player address (0x...) or entity ID (numeric)
          </div>
        </div>
      </div>

      <div
        style={{
          backgroundColor: "#2a2a2a",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "20px",
          border: "1px solid #2196F3",
        }}
      >
        <h3
          style={{
            color: "#ffffff",
            marginBottom: "15px",
            fontSize: "18px",
            fontWeight: "bold",
            textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
          }}
        >
          📖 Instructions
        </h3>
        <div
          style={{
            backgroundColor: "#1a1a1a",
            padding: "15px",
            borderRadius: "8px",
            marginBottom: "20px",
            border: "1px solid #2196F3",
          }}
        >
          <h4
            style={{
              color: "#ffffff",
              marginBottom: "10px",
              fontSize: "16px",
              fontWeight: "bold",
              textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
            }}
          >
            🔒 ForceField Membership Management
          </h4>
          <div style={{ color: "#ccc", fontSize: "14px", lineHeight: "1.5" }}>
            <p>
              <strong>setMembership(target, member, allowed):</strong> Manages
              forcefield access permissions
            </p>
            <p>
              <strong>target:</strong> ForceField entity ID (numeric, e.g.,
              12345)
            </p>
            <p>
              <strong>member:</strong> Player address (0x...) or entity ID
              (numeric)
            </p>
            <p>
              <strong>allowed:</strong> true to grant access, false to revoke
              access
            </p>
            <p>
              <strong>⚠️ Important:</strong> Use numeric entity IDs for
              forcefields, not full chain entity IDs!
            </p>
            <p>
              <strong>💡 Pro Tip:</strong> Force fields protect areas from
              mining, building, and other actions!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
