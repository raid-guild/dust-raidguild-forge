import { useQuery } from "@tanstack/react-query";

import { connectDustClient } from "dustkit/internal";
import { useState } from "react";
import { WaypointsTab } from "./components/WaypointsTab";
import { ForcefieldTab } from "./components/ForcefieldTab";
import { SignsTab } from "./components/SignsTab";
import { NewsletterTab } from "./components/NewsletterTab";
import { AboutTab } from "./components/AboutTab";

type TabType = "waypoints" | "forcefield" | "signs" | "newsletter" | "about";

export function App() {
  const dustClient = useQuery({
    queryKey: ["dust-client"],
    queryFn: connectDustClient,
  });

  // Tab management
  const [activeTab, setActiveTab] = useState<TabType>("waypoints");

  // ForceField state (keeping for the other tab)
  const [targetEntityId, setTargetEntityId] = useState<string>("");

  // Sign Editor state
  const [signEntityId, setSignEntityId] = useState<string>("");
  const [, setForceFieldEntityId] = useState<string>("");
  const [signCursorLoading, setSignCursorLoading] = useState<boolean>(false);
  const [forceFieldCursorLoading, setForceFieldCursorLoading] =
    useState<boolean>(false);

  const [feedback, setFeedback] = useState<{
    message: string;
    type: "success" | "error" | "info";
    id: string;
  } | null>(null);

  const showFeedback = (
    message: string,
    type: "success" | "error" | "info" = "success"
  ) => {
    const id = Date.now().toString();
    setFeedback({ message, type, id });
  };

  // Get entity at cursor and verify its type
  const getEntityAtCursorWithType = async (
    expectedType: "sign" | "forcefield"
  ) => {
    // Set loading state based on type
    if (expectedType === "sign") {
      setSignCursorLoading(true);
    } else {
      setForceFieldCursorLoading(true);
    }

    try {
      const result = await dustClient.data?.provider.request({
        method: "getCursorPosition",
        params: {},
      });

      if (
        result &&
        typeof result === "object" &&
        "x" in result &&
        "y" in result &&
        "z" in result
      ) {
        const { x, y, z } = result as { x: number; y: number; z: number };
        console.log(`✅ Cursor position: ${x}, ${y}, ${z}`);

        // Round coordinates
        const roundedX = x < 0 ? Math.floor(x) : Math.round(x);
        const roundedY = y < 0 ? Math.floor(y) : Math.round(y);
        const roundedZ = z < 0 ? Math.floor(z) : Math.round(z);

        // First, get the entity at this position
        const entityQuery = `SELECT "entityId" FROM "EntityPosition" WHERE "x" = '${roundedX}' AND "y" = '${roundedY}' AND "z" = '${roundedZ}' LIMIT 1`;

        const entityResponse = await fetch(
          "https://indexer.mud.redstonechain.com/q",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify([
              {
                query: entityQuery,
                address: "0x253eb85B3C953bFE3827CC14a151262482E7189C",
              },
            ]),
          }
        );

        if (entityResponse.ok) {
          const entityData = (await entityResponse.json()) as any;
          const entityResult = Array.isArray(entityData)
            ? entityData[0]
            : entityData;

          if (
            entityResult.result &&
            entityResult.result.length > 0 &&
            entityResult.result[0] &&
            entityResult.result[0].length > 1
          ) {
            const entityId = entityResult.result[0][1][0]; // Get the entityId from the data row

            // Now verify the object type
            const typeId = expectedType === "sign" ? 120 : 145; // 120 for signs, 145 for force fields
            const typeQuery = `SELECT "entityId" FROM "EntityObjectType" WHERE "entityId" = '${entityId}' AND "objectType" = '${typeId}' LIMIT 1`;

            const typeResponse = await fetch(
              "https://indexer.mud.redstonechain.com/q",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify([
                  {
                    query: typeQuery,
                    address: "0x253eb85B3C953bFE3827CC14a151262482E7189C",
                  },
                ]),
              }
            );

            if (typeResponse.ok) {
              const typeData = (await typeResponse.json()) as any;
              const typeResult = Array.isArray(typeData)
                ? typeData[0]
                : typeData;

              if (
                typeResult.result &&
                typeResult.result.length > 0 &&
                typeResult.result[0] &&
                typeResult.result[0].length > 1
              ) {
                // Entity is of the expected type
                const verifiedEntityId = typeResult.result[0][1][0];
                console.log(
                  `✅ Found ${expectedType} at cursor: ${verifiedEntityId}`
                );

                if (expectedType === "sign") {
                  setSignEntityId(verifiedEntityId);
                  showFeedback(
                    `Found sign at cursor: ${verifiedEntityId}`,
                    "success"
                  );
                } else {
                  // For force fields, set it in the force field entity ID state
                  setForceFieldEntityId(verifiedEntityId);
                  setTargetEntityId(verifiedEntityId); // Also set it in the target entity ID for membership management
                  showFeedback(
                    `Found force field at cursor: ${verifiedEntityId}`,
                    "success"
                  );
                }

                return verifiedEntityId;
              } else {
                showFeedback(
                  `No ${expectedType} found at cursor position`,
                  "error"
                );
                return null;
              }
            } else {
              showFeedback(`Error verifying ${expectedType} type`, "error");
              return null;
            }
          } else {
            showFeedback("No entity found at cursor position", "error");
            return null;
          }
        } else {
          showFeedback("Error getting entity at cursor", "error");
          return null;
        }
      }
    } catch (error) {
      console.error(`❌ Error getting ${expectedType} at cursor:`, error);
      showFeedback(`Error getting ${expectedType} at cursor`, "error");
      return null;
    } finally {
      // Clear loading state based on type
      if (expectedType === "sign") {
        setSignCursorLoading(false);
      } else {
        setForceFieldCursorLoading(false);
      }
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1
        style={{
          textAlign: "center",
          color: "#1a1a1a",
          marginBottom: "10px",
          fontSize: "2.5rem",
          fontWeight: "bold",
          textShadow:
            "2px 2px 4px rgba(0,0,0,0.3), 0 0 20px rgba(245,56,98,0.5)",
          background:
            "linear-gradient(135deg, #f53862 0%, #ff6b8a 50%, #f53862 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          letterSpacing: "2px",
          borderBottom: "3px solid #f53862",
          paddingBottom: "10px",
        }}
      >
        ⚔️ RaidGuild Forge ⚔️
      </h1>
      <p
        style={{
          textAlign: "center",
          color: "#ffffff",
          fontSize: "1.1rem",
          marginBottom: "30px",
          fontStyle: "italic",
          textShadow:
            "2px 2px 4px rgba(0,0,0,0.8), 1px 1px 2px rgba(0,0,0,0.9)",
        }}
      >
        Your comprehensive toolkit for Dust adventures
      </p>

      {/* Tab Navigation */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
          borderBottom: "2px solid #444",
        }}
      >
        <button
          onClick={() => setActiveTab("waypoints")}
          style={{
            padding: "10px 20px",
            backgroundColor: activeTab === "waypoints" ? "#4CAF50" : "#333",
            color: "white",
            border: "none",
            borderRadius: "8px 8px 0 0",
          }}
        >
          📍 Waypoint Manager
        </button>
        <button
          onClick={() => setActiveTab("forcefield")}
          style={{
            padding: "10px 20px",
            backgroundColor: activeTab === "forcefield" ? "#2196F3" : "#333",
            color: "white",
            border: "none",
            borderRadius: "8px 8px 0 0",
          }}
        >
          🔒 ForceField Explorer
        </button>
        <button
          onClick={() => setActiveTab("signs")}
          style={{
            padding: "10px 20px",
            backgroundColor: activeTab === "signs" ? "#9C27B0" : "#333",
            color: "white",
            border: "none",
            borderRadius: "8px 8px 0 0",
          }}
        >
          📝 Sign Editor
        </button>
        <button
          onClick={() => setActiveTab("newsletter")}
          style={{
            padding: "10px 20px",
            backgroundColor: activeTab === "newsletter" ? "#FF9800" : "#333",
            color: "white",
            border: "none",
            borderRadius: "8px 8px 0 0",
          }}
        >
          📰 Daily DUST
        </button>
        <button
          onClick={() => setActiveTab("about")}
          style={{
            padding: "10px 20px",
            backgroundColor: activeTab === "about" ? "#e91e63" : "#333",
            color: "white",
            border: "none",
            borderRadius: "8px 8px 0 0",
          }}
        >
          ℹ️ About
        </button>
      </div>

      {/* Waypoint Manager Tab */}
      {activeTab === "waypoints" && <WaypointsTab />}

      {/* ForceField Explorer Tab */}
      {activeTab === "forcefield" && (
        <ForcefieldTab
          forceFieldCursorLoading={forceFieldCursorLoading}
          getEntityAtCursorWithType={getEntityAtCursorWithType}
          setTargetEntityId={setTargetEntityId}
          targetEntityId={targetEntityId}
        />
      )}

      {/* Sign Editor Tab */}
      {activeTab === "signs" && (
        <SignsTab
          getEntityAtCursorWithType={getEntityAtCursorWithType}
          setSignEntityId={setSignEntityId}
          signCursorLoading={signCursorLoading}
          signEntityId={signEntityId}
        />
      )}

      {/* Newsletter Tab */}
      {activeTab === "newsletter" && <NewsletterTab />}

      {/* About Tab */}
      {activeTab === "about" && <AboutTab />}
    </div>
  );
}
