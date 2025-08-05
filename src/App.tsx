import { useQuery } from "@tanstack/react-query";

import { connectDustClient } from "dustkit/internal";
import { useState, useEffect } from "react";
import { resourceToHex } from "@latticexyz/common";

interface Waypoint {
  id: string;
  entityId: string;
  label: string;
  notes: string;
  category: string;
  createdAt: string;
}

type TabType = "waypoints" | "forcefield" | "signs" | "newsletter";

export function App() {
  const dustClient = useQuery({
    queryKey: ["dust-client"],
    queryFn: connectDustClient,
  });
// const { appContext, provider } = await connectDustClient();


  // Tab management
  const [activeTab, setActiveTab] = useState<TabType>("waypoints");

  // Waypoint state
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [newWaypoint, setNewWaypoint] = useState({
    entityId: "",
    label: "",
    notes: "",
    category: "General"
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [editingWaypoint, setEditingWaypoint] = useState<Waypoint | null>(null);

  // ForceField state (keeping for the other tab)
  const [targetEntityId, setTargetEntityId] = useState<string>("");
  const [memberEntityId, setMemberEntityId] = useState<string>("");
  // const [energyAmount, setEnergyAmount] = useState<string>("1000");

  // Sign Editor state
  const [signEntityId, setSignEntityId] = useState<string>("");
  const [signText, setSignText] = useState<string>("");
  const [signUpdateResult, setSignUpdateResult] = useState<string>("");
  const [forceFieldEntityId, setForceFieldEntityId] = useState<string>("");
  const [signCursorLoading, setSignCursorLoading] = useState<boolean>(false);
  const [forceFieldCursorLoading, setForceFieldCursorLoading] = useState<boolean>(false);

  // MUD Query state
  const [mudQuery, setMudQuery] = useState<string>("");
  // const [mudQueryResult, setMudQueryResult] = useState<any[]>([]);
  // const [mudQueryLoading, setMudQueryLoading] = useState<boolean>(false);
  // const [mudQueryError, setMudQueryError] = useState<string>("");

  // Position state
  const [playerPosition, setPlayerPosition] = useState<string>("");
  const [cursorPosition, setCursorPosition] = useState<string>("");
  const [playerPositionLoading, setPlayerPositionLoading] = useState<boolean>(false);
  const [cursorPositionLoading, setCursorPositionLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | 'info'; id: string } | null>(null);

  // Load waypoints from localStorage
  useEffect(() => {
    try {
      const savedWaypoints = localStorage.getItem("raidguild-waypoints");
      if (savedWaypoints) {
        const parsed = JSON.parse(savedWaypoints);
        console.log("📂 Loading waypoints from localStorage:", parsed.length);
        setWaypoints(parsed);
      } else {
        console.log("📂 No saved waypoints found in localStorage, adding default Forge Hall waypoint");
        // Add default RaidGuild Forge Hall waypoint
        const defaultWaypoint: Waypoint = {
          id: 'default-forge-hall',
          entityId: '0x03000005040000009afffffc6100000000000000000000000000000000000000',
          label: 'RaidGuild Forge Hall',
          notes: 'The main RaidGuild Forge Hall - a central hub for crafting and community',
          category: 'Base',
          createdAt: new Date().toISOString()
        };
        setWaypoints([defaultWaypoint]);
        localStorage.setItem("raidguild-waypoints", JSON.stringify([defaultWaypoint]));
      }
    } catch (error) {
      console.error("Error loading waypoints:", error);
    }
    setIsLoaded(true);
  }, []);

  // Auto-hide feedback after 3 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => {
        setFeedback(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const showFeedback = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    setFeedback({ message, type, id });
  };

  // Save waypoints to localStorage
  useEffect(() => {
    // Only save after initial load to prevent overwriting with empty array
    if (isLoaded) {
      try {
        localStorage.setItem("raidguild-waypoints", JSON.stringify(waypoints));
        console.log("💾 Waypoints saved to localStorage:", waypoints.length);
      } catch (error) {
        console.error("Error saving waypoints:", error);
      }
    }
  }, [waypoints, isLoaded]);

  // Set waypoint in game
  const setWaypointInGame = async (entityId: string, label: string) => {
    try {
            await dustClient.data?.provider.request({
              method: "setWaypoint",
              params: {
          entity: entityId as `0x${string}`,
          label,
              },
            });
      console.log(`✅ Waypoint set: ${label}`);
      return true;
    } catch (error) {
      console.error("Error setting waypoint:", error);
      return false;
    }
  };

  // Add new waypoint
  const addWaypoint = () => {
    if (!newWaypoint.entityId.trim() || !newWaypoint.label.trim()) {
      showFeedback("Please enter both Entity ID and Label!", "error");
      return;
    }

    const waypoint: Waypoint = {
      id: Date.now().toString(),
      entityId: newWaypoint.entityId.trim(),
      label: newWaypoint.label.trim(),
      notes: newWaypoint.notes.trim(),
      category: newWaypoint.category,
      createdAt: new Date().toISOString()
    };

    setWaypoints(prev => [...prev, waypoint]);
    setNewWaypoint({ entityId: "", label: "", notes: "", category: "General" });
    showFeedback(`Waypoint "${waypoint.label}" added successfully!`, "success");
    console.log("Added waypoint:", waypoint);
  };

  // Set waypoint in game from waypoint object
  const activateWaypoint = async (waypoint: Waypoint) => {
    try {
      const success = await setWaypointInGame(waypoint.entityId, waypoint.label);
      if (success) {
        console.log(`✅ Waypoint set in game: ${waypoint.label}`);
        showFeedback(`Waypoint "${waypoint.label}" has been set in the game!`, "success");
      } else {
        showFeedback(`Failed to set waypoint "${waypoint.label}" in the game.`, "error");
      }
    } catch (error) {
      console.error("Error setting waypoint in game:", error);
      showFeedback(`Error setting waypoint: ${error instanceof Error ? error.message : String(error)}`, "error");
    }
  };

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
                  { type: "string", name: "content" }
                ],
                outputs: [],
                stateMutability: "nonpayable"
              }
            ],
            functionName: "setTextSignContent",
            args: [signEntityId, signText],
                },
              ],
            });

      // Check for errors in the result (following the ethereum-monument pattern)
      if (result?.transactionHash) {
        setSignUpdateResult(`✅ Sign text updated successfully! Transaction: ${result.transactionHash.slice(0, 10)}...`);
        console.log(`✅ Sign text updated: ${signText}`);
        console.log(`📝 Transaction hash: ${result.transactionHash}`);
      } else {
        setSignUpdateResult(`✅ Sign text updated successfully!`);
        console.log(`✅ Sign text updated: ${signText}`);
      }
    } catch (error) {
      console.error("Error updating sign text:", error);
      setSignUpdateResult(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Edit waypoint
  const saveEditedWaypoint = () => {
    if (!editingWaypoint) return;
    
    setWaypoints(prev => prev.map(wp => 
      wp.id === editingWaypoint.id ? editingWaypoint : wp
    ));
    setEditingWaypoint(null);
  };

  // Delete waypoint
  const deleteWaypoint = (id: string) => {
    if (confirm("Are you sure you want to delete this waypoint?")) {
      setWaypoints(prev => prev.filter(wp => wp.id !== id));
    }
  };

  // Clear all waypoints
  const clearAllWaypoints = () => {
    if (confirm("Are you sure you want to clear all waypoints? This cannot be undone.")) {
      setWaypoints([]);
    }
  };

  const importWaypoints = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedWaypoints = JSON.parse(content);
        
        // Validate the imported data
        if (!Array.isArray(importedWaypoints)) {
          alert("Invalid file format. Expected an array of waypoints.");
          return;
        }

        // Validate each waypoint has required fields
        const validWaypoints = importedWaypoints.filter((wp: any) => 
          wp.entityId && wp.label && wp.category && wp.createdAt
        );

        if (validWaypoints.length !== importedWaypoints.length) {
          alert(`Warning: ${importedWaypoints.length - validWaypoints.length} waypoints were skipped due to invalid format.`);
        }

        if (validWaypoints.length === 0) {
          alert("No valid waypoints found in the file.");
          return;
        }

        // Add imported waypoints to existing ones
        setWaypoints(prev => [...prev, ...validWaypoints]);
        alert(`Successfully imported ${validWaypoints.length} waypoints!`);
        
        // Clear the file input
        event.target.value = '';
      } catch (error) {
        console.error("Error importing waypoints:", error);
        alert("Error importing waypoints. Please check the file format.");
      }
    };
    reader.readAsText(file);
  };

  const exportWaypoints = () => {
    const dataStr = JSON.stringify(waypoints, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `raidguild-waypoints-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // const executeMudQuery = async () => {
  //   if (!mudQuery.trim()) {
  //     setMudQueryError("Please enter a query");
  //     return;
  //   }

  //   setMudQueryLoading(true);
  //   setMudQueryError("");
  //   setMudQueryResult([]);

  //   try {
  //     // Using the MUD SQL API endpoint for Garnet (which supports Dust)
  //     const response = await fetch("https://indexer.mud.redstonechain.com/q", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify([
  //         {
  //           query: mudQuery,
  //           address: "0x253eb85B3C953bFE3827CC14a151262482E7189C", // Dust world address
  //         }
  //       ]),
  //     });

  //     if (!response.ok) {
  //       throw new Error(`HTTP error! status: ${response.status}`);
  //     }

  //     const data = await response.json() as any;
      
  //     if (data.error) {
  //       throw new Error(data.error);
  //     }

  //     // The API returns an array of results, we want the first one
  //     const result = Array.isArray(data) ? data[0] : data;
      
  //     if (result.error) {
  //       throw new Error(result.error);
  //     }

  //     setMudQueryResult(result.records || []);
  //     console.log("✅ MUD Query executed successfully:", result);
  //   } catch (error) {
  //     console.error("❌ Error executing MUD query:", error);
  //     setMudQueryError(error instanceof Error ? error.message : "Unknown error occurred");
  //   } finally {
  //     setMudQueryLoading(false);
  //   }
  // };

  const getPlayerPositionEntity = async () => {
    setPlayerPositionLoading(true);
    setPlayerPosition("");
    try {
      const result = await dustClient.data?.provider.request({
        method: "getPlayerPosition",
        params: {
          entity: "0x0000000000000000000000000000000000000000000000000000000000000000", // Current player
        },
      });

      if (result) {
        const { x, y, z } = result;
        console.log(`✅ Player position: ${x}, ${y}, ${z}`);
        
        // Round coordinates to integers for MUD query (quadrant system - round to next block for negatives)
        const roundedX = x < 0 ? Math.floor(x) : Math.round(x);
        const roundedY = y < 0 ? Math.floor(y) - 1 : Math.round(y) - 1; // -1 to account for the fact that the player is in the block below the cursor
        const roundedZ = z < 0 ? Math.floor(z) : Math.round(z);
        console.log(`✅ Rounded position: ${roundedX}, ${roundedY}, ${roundedZ}`);
        
        // Query MUD to find entity at this position
        const query = `SELECT "entityId" FROM "EntityPosition" WHERE "x" = '${roundedX}' AND "y" = '${roundedY}' AND "z" = '${roundedZ}' LIMIT 1`;
        setMudQuery(query);
        
        // Execute the query automatically
        const response = await fetch("https://indexer.mud.redstonechain.com/q", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify([
            {
              query: query,
              address: "0x253eb85B3C953bFE3827CC14a151262482E7189C",
            }
          ]),
        });

        if (response.ok) {
          const data = await response.json() as any;
          console.log("📊 Raw MUD response:", data);
          
          const result = Array.isArray(data) ? data[0] : data;
          console.log("📊 Processed result:", result);
          
          if (result.error) {
            console.log("❌ Result error:", result.error);
            setPlayerPosition(`Error: ${result.error}`);
            return;
          }
          
          // MUD API returns data in result.result[0] array format
          // result.result[0][0] = headers, result.result[0][1] = data
          if (result.result && result.result.length > 0 && result.result[0] && result.result[0].length > 1) {
            const headers = result.result[0][0];
            const dataRow = result.result[0][1];
            console.log("📊 Headers:", headers);
            console.log("📊 Data row:", dataRow);
            
            // Find the entityId column index
            const entityIdIndex = headers.findIndex((header: string) => header === 'entityId');
            if (entityIdIndex !== -1 && dataRow[entityIdIndex]) {
              const entityId = dataRow[entityIdIndex];
              console.log("🎯 Found entity ID:", entityId);
              setPlayerPosition(entityId);
              setNewWaypoint(prev => ({ ...prev, entityId }));
              console.log(`✅ Found entity at player position: ${entityId}`);
            } else {
              console.log("❌ No entityId found in data");
              setPlayerPosition("No entity found at position");
            }
          } else {
            console.log("❌ No data in result.result[0]");
            setPlayerPosition("No entity found at position");
          }
        } else {
          console.log("❌ Response not OK:", response.status, response.statusText);
          const errorText = await response.text();
          console.log("❌ Error response:", errorText);
          setPlayerPosition(`Error: ${response.status} ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error("❌ Error getting player position:", error);
      setPlayerPosition("Error getting position");
    } finally {
      setPlayerPositionLoading(false);
    }
  };

  const getCursorPositionEntity = async () => {
    setCursorPositionLoading(true);
    setCursorPosition("");
    try {
      const result = await dustClient.data?.provider.request({
        method: "getCursorPosition",
        params: {},
      });

      if (result && typeof result === 'object' && 'x' in result && 'y' in result && 'z' in result) {
        const { x, y, z } = result as { x: number; y: number; z: number };
        console.log(`✅ Cursor position: ${x}, ${y}, ${z}`);
        
        // Round coordinates to integers for MUD query (quadrant system - round to next block for negatives)
        const roundedX = x < 0 ? Math.floor(x) : Math.round(x);
        const roundedY = y < 0 ? Math.floor(y) : Math.round(y);
        const roundedZ = z < 0 ? Math.floor(z) : Math.round(z);
        console.log(`✅ Rounded cursor position: ${roundedX}, ${roundedY}, ${roundedZ}`);
        
        // Query MUD to find entity at this position
        const query = `SELECT "entityId" FROM "EntityPosition" WHERE "x" = '${roundedX}' AND "y" = '${roundedY}' AND "z" = '${roundedZ}' LIMIT 1`;
        setMudQuery(query);
        
        // Execute the query automatically
        const response = await fetch("https://indexer.mud.redstonechain.com/q", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify([
            {
              query: query,
              address: "0x253eb85B3C953bFE3827CC14a151262482E7189C",
            }
          ]),
        });

        if (response.ok) {
          const data = await response.json() as any;
          console.log("📊 Raw MUD response (cursor):", data);
          
          const result = Array.isArray(data) ? data[0] : data;
          console.log("📊 Processed result (cursor):", result);
          
          if (result.error) {
            console.log("❌ Result error (cursor):", result.error);
            setCursorPosition(`Error: ${result.error}`);
            return;
          }
          
          // MUD API returns data in result.result[0] array format
          // result.result[0][0] = headers, result.result[0][1] = data
          if (result.result && result.result.length > 0 && result.result[0] && result.result[0].length > 1) {
            const headers = result.result[0][0];
            const dataRow = result.result[0][1];
            console.log("📊 Headers (cursor):", headers);
            console.log("📊 Data row (cursor):", dataRow);
            
            // Find the entityId column index
            const entityIdIndex = headers.findIndex((header: string) => header === 'entityId');
            if (entityIdIndex !== -1 && dataRow[entityIdIndex]) {
              const entityId = dataRow[entityIdIndex];
              console.log("🎯 Found entity ID (cursor):", entityId);
              setCursorPosition(entityId);
              setNewWaypoint(prev => ({ ...prev, entityId }));
              console.log(`✅ Found entity at cursor position: ${entityId}`);
            } else {
              console.log("❌ No entityId found in data (cursor)");
              setCursorPosition("No entity found at position");
            }
          } else {
            console.log("❌ No data in result.result[0] (cursor)");
            setCursorPosition("No entity found at position");
          }
        } else {
          console.log("❌ Response not OK (cursor):", response.status, response.statusText);
          const errorText = await response.text();
          console.log("❌ Error response (cursor):", errorText);
          setCursorPosition(`Error: ${response.status} ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error("❌ Error getting cursor position:", error);
      setCursorPosition("Error getting position");
    } finally {
      setCursorPositionLoading(false);
    }
  };

  // Get entity at cursor and verify its type
  const getEntityAtCursorWithType = async (expectedType: 'sign' | 'forcefield') => {
    // Set loading state based on type
    if (expectedType === 'sign') {
      setSignCursorLoading(true);
    } else {
      setForceFieldCursorLoading(true);
    }
    
    try {
      const result = await dustClient.data?.provider.request({
        method: "getCursorPosition",
        params: {},
      });

      if (result && typeof result === 'object' && 'x' in result && 'y' in result && 'z' in result) {
        const { x, y, z } = result as { x: number; y: number; z: number };
        console.log(`✅ Cursor position: ${x}, ${y}, ${z}`);
        
        // Round coordinates
        const roundedX = x < 0 ? Math.floor(x) : Math.round(x);
        const roundedY = y < 0 ? Math.floor(y) : Math.round(y);
        const roundedZ = z < 0 ? Math.floor(z) : Math.round(z);
        
        // First, get the entity at this position
        const entityQuery = `SELECT "entityId" FROM "EntityPosition" WHERE "x" = '${roundedX}' AND "y" = '${roundedY}' AND "z" = '${roundedZ}' LIMIT 1`;
        
        const entityResponse = await fetch("https://indexer.mud.redstonechain.com/q", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify([{ query: entityQuery, address: "0x253eb85B3C953bFE3827CC14a151262482E7189C" }]),
        });

        if (entityResponse.ok) {
          const entityData = await entityResponse.json() as any;
          const entityResult = Array.isArray(entityData) ? entityData[0] : entityData;
          
          if (entityResult.result && entityResult.result.length > 0 && entityResult.result[0] && entityResult.result[0].length > 1) {
            const entityId = entityResult.result[0][1][0]; // Get the entityId from the data row
            
            // Now verify the object type
            const typeId = expectedType === 'sign' ? 120 : 145; // 120 for signs, 145 for force fields
            const typeQuery = `SELECT "entityId" FROM "EntityObjectType" WHERE "entityId" = '${entityId}' AND "objectType" = '${typeId}' LIMIT 1`;
            
            const typeResponse = await fetch("https://indexer.mud.redstonechain.com/q", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify([{ query: typeQuery, address: "0x253eb85B3C953bFE3827CC14a151262482E7189C" }]),
            });

            if (typeResponse.ok) {
              const typeData = await typeResponse.json() as any;
              const typeResult = Array.isArray(typeData) ? typeData[0] : typeData;
              
              if (typeResult.result && typeResult.result.length > 0 && typeResult.result[0] && typeResult.result[0].length > 1) {
                // Entity is of the expected type
                const verifiedEntityId = typeResult.result[0][1][0];
                console.log(`✅ Found ${expectedType} at cursor: ${verifiedEntityId}`);
                
                if (expectedType === 'sign') {
                  setSignEntityId(verifiedEntityId);
                  showFeedback(`Found sign at cursor: ${verifiedEntityId}`, "success");
                } else {
                  // For force fields, set it in the force field entity ID state
                  setForceFieldEntityId(verifiedEntityId);
                  setTargetEntityId(verifiedEntityId); // Also set it in the target entity ID for membership management
                  showFeedback(`Found force field at cursor: ${verifiedEntityId}`, "success");
                }
                
                return verifiedEntityId;
              } else {
                showFeedback(`No ${expectedType} found at cursor position`, "error");
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
      if (expectedType === 'sign') {
        setSignCursorLoading(false);
      } else {
        setForceFieldCursorLoading(false);
      }
    }
  };

  // Get categories for filtering
  const getCategories = () => {
    const categories = [...new Set(waypoints.map(wp => wp.category))];
    return ["All", ...categories];
  };

  // Filter waypoints
  const filteredWaypoints = waypoints.filter(waypoint => {
    const matchesSearch = waypoint.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         waypoint.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         waypoint.entityId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || waypoint.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get category color
  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      "General": "#666",
      "Friend": "#00BCD4",
      "Mining": "#795548",
      "Resources": "#2196F3",
      "Safe Zone": "#4CAF50",
      "Danger Zone": "#f44336",
      "Base": "#9C27B0",
      "Trading": "#FF9800",
      "Force Field": "#E91E63",
      "Spawn": "#607D8B",
      "Custom": "#607D8B"
    };
    return colors[category] || "#666";
  };

  // Copy entity ID to clipboard
  const copyEntityId = (entityId: string) => {
    navigator.clipboard.writeText(entityId);
    alert("Entity ID copied to clipboard!");
  };

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
                  { type: "bool", name: "allowed" }
                ],
                outputs: [],
                stateMutability: "nonpayable"
              },
              {
                type: "function",
                name: "setMembership",
                inputs: [
                  { type: "bytes32", name: "target" },
                  { type: "bytes32", name: "member" },
                  { type: "bool", name: "allowed" }
                ],
                outputs: [],
                stateMutability: "nonpayable"
              },
              {
                type: "function",
                name: "setMembership",
                inputs: [
                  { type: "uint256", name: "groupId" },
                  { type: "address", name: "member" },
                  { type: "bool", name: "allowed" }
                ],
                outputs: [],
                stateMutability: "nonpayable"
              },
              {
                type: "function",
                name: "setMembership",
                inputs: [
                  { type: "uint256", name: "groupId" },
                  { type: "bytes32", name: "member" },
                  { type: "bool", name: "allowed" }
                ],
                outputs: [],
                stateMutability: "nonpayable"
              }
            ],
            functionName,
            args,
                },
              ],
            });

      if (result?.transactionHash) {
        console.log(`✅ Successfully called ${functionName}. Transaction: ${result.transactionHash.slice(0, 10)}...`);
      } else {
        console.log(`✅ Successfully called ${functionName}`);
      }
    } catch (error) {
      console.error(`❌ Error calling ${functionName}:`, error);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ 
        textAlign: "center", 
        color: "#1a1a1a",
        marginBottom: "10px",
        fontSize: "2.5rem",
        fontWeight: "bold",
        textShadow: "2px 2px 4px rgba(0,0,0,0.3), 0 0 20px rgba(245,56,98,0.5)",
        background: "linear-gradient(135deg, #f53862 0%, #ff6b8a 50%, #f53862 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        letterSpacing: "2px",
        borderBottom: "3px solid #f53862",
        paddingBottom: "10px"
      }}>
        ⚔️ RaidGuild Forge ⚔️
      </h1>
      <p style={{
        textAlign: "center",
        color: "#ffffff",
        fontSize: "1.1rem",
        marginBottom: "30px",
        fontStyle: "italic",
        textShadow: "2px 2px 4px rgba(0,0,0,0.8), 1px 1px 2px rgba(0,0,0,0.9)"
      }}>
        Your comprehensive toolkit for Dust adventures
      </p>

      {/* Tab Navigation */}
      <div style={{ 
        display: "flex", 
        gap: "10px", 
        marginBottom: "20px",
        borderBottom: "2px solid #444"
      }}>
        <button
          onClick={() => setActiveTab("waypoints")}
          style={{ 
            padding: "10px 20px", 
            backgroundColor: activeTab === "waypoints" ? "#4CAF50" : "#333",
            color: "white",
            border: "none",
            borderRadius: "8px 8px 0 0"
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
             borderRadius: "8px 8px 0 0"
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
             borderRadius: "8px 8px 0 0"
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
             borderRadius: "8px 8px 0 0"
           }}
         >
           📰 Dust Weekly
         </button>
      </div>

      {/* Waypoint Manager Tab */}
              {activeTab === "waypoints" && (
          <div>
            <div style={{
              backgroundColor: "#2a2a2a",
              padding: "20px 25px",
              borderRadius: "12px",
              marginBottom: "25px",
              border: "2px solid #4CAF50",
              boxShadow: "0 4px 12px rgba(76,175,80,0.2)"
            }}>
              <h2 style={{
                color: "#ffffff",
                fontSize: "1.8rem",
                fontWeight: "bold",
                margin: 0,
                textAlign: "center",
                textShadow: "2px 2px 4px rgba(0,0,0,0.5)"
              }}>
                📍 Waypoint Manager
              </h2>
            </div>
          
                  {/* Feedback Display */}
        {feedback && (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: feedback.type === 'success' ? '#4CAF50' : feedback.type === 'error' ? '#f44336' : '#2196F3',
            color: 'white',
            padding: '20px 30px',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            zIndex: 1000,
            maxWidth: '400px',
            textAlign: 'center',
            fontSize: '16px',
            fontWeight: '500'
          }}>
            {feedback.message}
          </div>
        )}

        {/* Quick Position Tools */}
        <div style={{ 
          backgroundColor: "#2a2a2a", 
          padding: "20px", 
          borderRadius: "12px", 
          marginBottom: "25px",
          border: "1px solid #4CAF50",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
        }}>
                          <h3 style={{ 
                  color: "#ffffff", 
                  marginBottom: "15px", 
                  fontSize: "20px",
                  fontWeight: "bold",
                  textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                  borderBottom: "2px solid #4CAF50",
                  paddingBottom: "5px"
                }}>
                  📍 Quick Position Tools
                </h3>
          <p style={{ color: "#ccc", fontSize: "14px", marginBottom: "20px", lineHeight: "1.5" }}>
            Get entity IDs at your current position or cursor position automatically! No need to manually query the database.
          </p>
          
          <div style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>

            <button
              onClick={getCursorPositionEntity}
              disabled={cursorPositionLoading}
              style={{ 
                padding: "12px 20px", 
                backgroundColor: cursorPositionLoading ? "#666" : "#2196F3", 
                color: "white", 
                border: "none", 
                borderRadius: "8px",
                cursor: cursorPositionLoading ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: "500",
                transition: "all 0.2s ease",
                boxShadow: cursorPositionLoading ? "none" : "0 2px 4px rgba(33, 150, 243, 0.3)"
              }}
            >
              {cursorPositionLoading ? "⏳ Loading..." : "🖱️ Get Entity at Cursor Position"}
            </button>
            <button
              onClick={getPlayerPositionEntity}
              disabled={playerPositionLoading}
              style={{ 
                padding: "12px 20px", 
                backgroundColor: playerPositionLoading ? "#666" : "#4CAF50", 
                color: "white", 
                border: "none", 
                borderRadius: "8px",
                cursor: playerPositionLoading ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: "500",
                transition: "all 0.2s ease",
                boxShadow: playerPositionLoading ? "none" : "0 2px 4px rgba(76, 175, 80, 0.3)"
              }}
            >
              {playerPositionLoading ? "⏳ Loading..." : "🎯 Get Entity at Block Below Player Position"}
            </button>
          </div>

                      {/* Waypoint Note */}
                      <div style={{ 
              backgroundColor: "#3a2a3a", 
              padding: "12px", 
              borderRadius: "8px", 
              marginBottom: "20px",
              border: "1px solid #9C27B0",
              borderLeft: "4px solid #FF9800"
            }}>
              <p style={{ 
                margin: "0", 
                fontSize: "13px", 
                color: "#FFD700",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <span style={{ fontSize: "16px" }}>⚠️</span>
                <span>Currently, only placed blocks/objects can act as waypoints. Natural terrain and other entities are not supported.</span>
              </p>
            </div>
           

          {(playerPosition || cursorPosition) && (
            <div style={{ 
              backgroundColor: "#2a2a2a", 
              padding: "15px", 
              borderRadius: "8px", 
              fontSize: "14px", 
              color: "#ccc",
              border: "1px solid #4CAF50"
            }}>
              {playerPosition && (
                <p style={{ marginBottom: "8px" }}><strong>🎯 Player Position:</strong> <code style={{ backgroundColor: "#1a1a1a", color: "#ffffff", padding: "2px 6px", borderRadius: "4px" }}>{playerPosition}</code></p>
              )}
              {cursorPosition && (
                <p style={{ marginBottom: "8px" }}><strong>🖱️ Cursor Position:</strong> <code style={{ backgroundColor: "#1a1a1a", color: "#ffffff", padding: "2px 6px", borderRadius: "4px" }}>{cursorPosition}</code></p>
              )}
              <p style={{ color: "#4CAF50", fontSize: "13px", margin: 0, fontWeight: "500" }}>
                ✅ Entity ID automatically added to the waypoint form below!
              </p>
            </div>
          )}

          <div style={{ 
            backgroundColor: "#2a2a2a", 
            padding: "15px", 
            borderRadius: "8px", 
            fontSize: "13px", 
            color: "#888",
            marginTop: "20px"
          }}>
            <p style={{ marginBottom: "10px", fontWeight: "600", color: "#ccc" }}>💡 How it works:</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              <div>
                <p style={{ marginBottom: "5px" }}><strong>🎯 Player Position:</strong></p>
                <p style={{ fontSize: "12px", lineHeight: "1.4" }}>Gets your current coordinates and finds the entity ID at that location</p>
              </div>
              <div>
                <p style={{ marginBottom: "5px" }}><strong>🖱️ Cursor Position:</strong></p>
                <p style={{ fontSize: "12px", lineHeight: "1.4" }}>Gets the coordinates where your cursor is pointing and finds the entity ID</p>
              </div>
            </div>
          </div>
        </div>





         {/* Add New Waypoint */}
         <div style={{ 
           backgroundColor: "#2a2a2a", 
           padding: "25px", 
           borderRadius: "12px", 
           marginBottom: "25px",
           border: "1px solid #9C27B0",
           boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
         }}>
                       <h3 style={{ 
              color: "#ffffff", 
              marginBottom: "20px", 
              fontSize: "20px",
              fontWeight: "bold",
              textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
              borderBottom: "2px solid #9C27B0",
              paddingBottom: "5px"
            }}>
              ➕ Add New Waypoint
            </h3>
            

           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
             <input
               type="text"
               placeholder="Entity ID (required) - e.g., 0x1234..."
               value={newWaypoint.entityId}
               onChange={(e) => setNewWaypoint(prev => ({ ...prev, entityId: e.target.value }))}
               style={{ 
                 gridColumn: "1 / -1", 
                 padding: "12px", 
                 backgroundColor: "#2a2a2a",
                 border: "1px solid #444",
                 borderRadius: "8px",
                 color: "#fff",
                 fontSize: "14px"
               }}
             />
             <input
               type="text"
               placeholder="Label (required) - e.g., My Base"
               value={newWaypoint.label}
               onChange={(e) => setNewWaypoint(prev => ({ ...prev, label: e.target.value }))}
               style={{ 
                 padding: "12px", 
                 backgroundColor: "#2a2a2a",
                 border: "1px solid #444",
                 borderRadius: "8px",
                 color: "#fff",
                 fontSize: "14px"
               }}
             />
             <select
               value={newWaypoint.category}
               onChange={(e) => setNewWaypoint(prev => ({ ...prev, category: e.target.value }))}
               style={{ 
                 padding: "12px", 
                 backgroundColor: "#2a2a2a",
                 border: "1px solid #444",
                 borderRadius: "8px", 
                 color: "#fff",
                 fontSize: "14px"
               }}
             >
               <option value="General">General</option>
               <option value="Friend">👥 Friend</option>
               <option value="Mining">Mining</option>
               <option value="Resources">Resources</option>
               <option value="Safe Zone">Safe Zone</option>
               <option value="Danger Zone">Danger Zone</option>
               <option value="Base">Base</option>
               <option value="Trading">Trading</option>
               <option value="Force Field">Force Field</option>
               <option value="Spawn">Spawn</option>
               <option value="Custom">Custom</option>
             </select>
             <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
               <button
                 onClick={addWaypoint}
                 style={{ 
                   padding: "12px 20px", 
                   backgroundColor: "#9C27B0", 
                   color: "white", 
                   border: "none", 
                   borderRadius: "8px",
                   fontSize: "14px",
                   fontWeight: "500",
                   cursor: "pointer",
                   transition: "all 0.2s ease",
                   boxShadow: "0 2px 4px rgba(156, 39, 176, 0.3)"
                 }}
               >
                 📍 Add Waypoint
               </button>
               {feedback && feedback.message.includes("added successfully") && (
                 <span style={{
                   fontSize: "14px",
                   color: "#4CAF50",
                   fontWeight: "500"
                 }}>
                   ✅ Added!
                 </span>
               )}
             </div>
           </div>
           
           <textarea
             placeholder="Notes (optional) - What's at this location? Any important details?"
             value={newWaypoint.notes}
             onChange={(e) => setNewWaypoint(prev => ({ ...prev, notes: e.target.value }))}
             style={{ 
               width: "100%", 
               minHeight: "80px", 
               padding: "12px", 
               backgroundColor: "#2a2a2a",
               border: "1px solid #444",
               borderRadius: "8px",
               color: "#fff",
               fontSize: "14px",
               resize: "vertical"
             }}
           />
         </div>

          {/* Filters */}
          <div style={{ 
            display: "flex", 
            gap: "15px", 
            marginBottom: "25px",
            alignItems: "center",
            backgroundColor: "#1a1a1a",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid #607D8B"
          }}>
            <div style={{ flex: 1 }}>
              <input
                type="text"
                placeholder="🔍 Search waypoints..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ 
                  width: "100%",
                  padding: "12px", 
                  backgroundColor: "#2a2a2a",
                  border: "1px solid #444",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "14px"
                }}
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ 
                padding: "12px", 
                backgroundColor: "#2a2a2a",
                border: "1px solid #444",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "14px",
                minWidth: "150px"
              }}
            >
              {getCategories().map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <div style={{ 
              backgroundColor: "#2a2a2a", 
              padding: "12px 16px", 
              borderRadius: "8px",
              color: "#ccc",
              fontSize: "14px",
              fontWeight: "500"
            }}>
              📊 {filteredWaypoints.length} of {waypoints.length} waypoints
            </div>
          </div>

          {/* Waypoints Table */}
          <div style={{ 
            backgroundColor: "#1a1a1a", 
            borderRadius: "12px", 
            overflow: "hidden",
            border: "1px solid #444",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#2a2a2a" }}>
                  <th style={{ padding: "16px", textAlign: "left", borderBottom: "1px solid #444", color: "#fff", fontSize: "14px", fontWeight: "600" }}>📍 Set Waypoint</th>
                  <th style={{ padding: "16px", textAlign: "left", borderBottom: "1px solid #444", color: "#fff", fontSize: "14px", fontWeight: "600" }}>🏷️ Label</th>
                  <th style={{ padding: "16px", textAlign: "left", borderBottom: "1px solid #444", color: "#fff", fontSize: "14px", fontWeight: "600" }}>📂 Category</th>
                  <th style={{ padding: "16px", textAlign: "left", borderBottom: "1px solid #444", color: "#fff", fontSize: "14px", fontWeight: "600" }}>🆔 Entity ID</th>
                  <th style={{ padding: "16px", textAlign: "left", borderBottom: "1px solid #444", color: "#fff", fontSize: "14px", fontWeight: "600" }}>📝 Notes</th>
                  <th style={{ padding: "16px", textAlign: "left", borderBottom: "1px solid #444", color: "#fff", fontSize: "14px", fontWeight: "600" }}>📅 Created</th>
                  <th style={{ padding: "16px", textAlign: "left", borderBottom: "1px solid #444", color: "#fff", fontSize: "14px", fontWeight: "600" }}>⚙️ Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWaypoints.map(waypoint => (
                  <tr key={waypoint.id} style={{ 
                    borderBottom: "1px solid #333",
                    backgroundColor: "#2a2a2a",
                    transition: "background-color 0.2s ease"
                  }}>
                    <td style={{ padding: "16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <button
                          onClick={() => activateWaypoint(waypoint)}
                          style={{ 
                            padding: "8px 16px", 
                            fontSize: "13px", 
                            backgroundColor: "#4CAF50", 
                            color: "white", 
                            border: "none", 
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: "500",
                            transition: "all 0.2s ease",
                            boxShadow: "0 2px 4px rgba(76, 175, 80, 0.3)"
                          }}
                          title="Set this waypoint in the game"
                        >
                          📍 Set Waypoint
                        </button>
                        {feedback && feedback.message.includes(waypoint.label) && (
                          <span style={{
                            fontSize: "12px",
                            color: feedback.type === 'success' ? '#4CAF50' : '#f44336',
                            fontWeight: "500"
                          }}>
                            {feedback.type === 'success' ? '✅' : '❌'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "16px" }}>
                      {editingWaypoint?.id === waypoint.id ? (
                        <input
                          type="text"
                          value={editingWaypoint.label}
                          onChange={(e) => setEditingWaypoint(prev => prev ? {...prev, label: e.target.value} : null)}
                          style={{ 
                            padding: "8px", 
                            width: "100%",
                            backgroundColor: "#1a1a1a",
                            border: "1px solid #444",
                            borderRadius: "4px",
                            color: "#fff",
                            fontSize: "14px"
                          }}
                        />
                      ) : (
                        <strong style={{ color: "#fff", fontSize: "14px" }}>{waypoint.label}</strong>
                      )}
                    </td>
                    <td style={{ padding: "16px" }}>
                      {editingWaypoint?.id === waypoint.id ? (
                        <select
                          value={editingWaypoint.category}
                          onChange={(e) => setEditingWaypoint(prev => prev ? {...prev, category: e.target.value} : null)}
                          style={{ 
                            padding: "8px",
                            backgroundColor: "#1a1a1a",
                            border: "1px solid #444",
                            borderRadius: "4px",
                            color: "#fff",
                            fontSize: "14px"
                          }}
                        >
                          <option value="General">General</option>
                          <option value="Friend">👥 Friend</option>
                          <option value="Mining">Mining</option>
                          <option value="Resources">Resources</option>
                          <option value="Safe Zone">Safe Zone</option>
                          <option value="Danger Zone">Danger Zone</option>
                          <option value="Base">Base</option>
                          <option value="Trading">Trading</option>
                          <option value="Force Field">Force Field</option>
                          <option value="Spawn">Spawn</option>
                          <option value="Custom">Custom</option>
                        </select>
                      ) : (
                        <span style={{ 
                          padding: "4px 12px", 
                          borderRadius: "16px", 
                          fontSize: "12px",
                          backgroundColor: getCategoryColor(waypoint.category),
                          color: "white",
                          fontWeight: "500"
                        }}>
                          {waypoint.category}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "16px", fontSize: "13px", fontFamily: "monospace", color: "#ccc" }}>
                      <code style={{ backgroundColor: "#1a1a1a", padding: "4px 8px", borderRadius: "4px" }}>
                        {waypoint.entityId.substring(0, 10)}...
                      </code>
                      <button
                        onClick={() => copyEntityId(waypoint.entityId)}
                        style={{ 
                          marginLeft: "8px", 
                          padding: "4px 8px", 
                          fontSize: "12px", 
                          backgroundColor: "#607D8B", 
                          color: "white", 
                          border: "none", 
                          borderRadius: "4px",
                          cursor: "pointer",
                          transition: "all 0.2s ease"
                        }}
                        title="Copy Entity ID"
                      >
                        📋
                      </button>
                    </td>
                    <td style={{ padding: "16px", fontSize: "14px", color: "#ccc" }}>
                      {editingWaypoint?.id === waypoint.id ? (
                        <textarea
                          value={editingWaypoint.notes}
                          onChange={(e) => setEditingWaypoint(prev => prev ? {...prev, notes: e.target.value} : null)}
                          style={{ 
                            padding: "8px", 
                            width: "100%", 
                            minHeight: "60px",
                            backgroundColor: "#1a1a1a",
                            border: "1px solid #444",
                            borderRadius: "4px",
                            color: "#fff",
                            fontSize: "14px",
                            resize: "vertical"
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: "13px" }}>
                          {waypoint.notes || <span style={{ color: "#666", fontStyle: "italic" }}>No notes</span>}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "16px", fontSize: "13px", color: "#888" }}>
                      {new Date(waypoint.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "16px" }}>
                      <div style={{ display: "flex", gap: "8px" }}>
                        {editingWaypoint?.id === waypoint.id ? (
                          <>
                            <button
                              onClick={saveEditedWaypoint}
                              style={{ 
                                padding: "6px 12px", 
                                fontSize: "12px", 
                                backgroundColor: "#4CAF50", 
                                color: "white", 
                                border: "none", 
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontWeight: "500",
                                transition: "all 0.2s ease"
                              }}
                            >
                              ✅ Save
                            </button>
                            <button
                              onClick={() => setEditingWaypoint(null)}
                              style={{ 
                                padding: "6px 12px", 
                                fontSize: "12px", 
                                backgroundColor: "#666", 
                                color: "white", 
                                border: "none", 
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontWeight: "500",
                                transition: "all 0.2s ease"
                              }}
                            >
                              ❌ Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingWaypoint(waypoint)}
                              style={{ 
                                padding: "6px 10px", 
                                fontSize: "12px", 
                                backgroundColor: "#2196F3", 
                                color: "white", 
                                border: "none", 
                                borderRadius: "6px",
                                cursor: "pointer",
                                transition: "all 0.2s ease"
                              }}
                              title="Edit waypoint"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => deleteWaypoint(waypoint.id)}
                              style={{ 
                                padding: "6px 10px", 
                                fontSize: "12px", 
                                backgroundColor: "#f44336", 
                                color: "white", 
                                border: "none", 
                                borderRadius: "6px",
                                cursor: "pointer",
                                transition: "all 0.2s ease"
                              }}
                              title="Delete waypoint"
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredWaypoints.length === 0 && (
            <div style={{ 
              textAlign: "center", 
              padding: "60px 40px", 
              color: "#888",
              backgroundColor: "#1a1a1a",
              borderRadius: "12px",
              border: "1px solid #444",
              marginBottom: "25px"
            }}>
              {waypoints.length === 0 ? (
                <div>
                  <div style={{ fontSize: "48px", marginBottom: "20px" }}>📍</div>
                  <h3 style={{ 
                color: "#666", 
                marginBottom: "10px",
                fontSize: "18px",
                fontWeight: "bold",
                textAlign: "center"
              }}>
                No waypoints yet
              </h3>
                  <p style={{ fontSize: "14px" }}>Add your first waypoint using the form above!</p>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: "48px", marginBottom: "20px" }}>🔍</div>
                  <h3 style={{ 
                color: "#666", 
                marginBottom: "10px",
                fontSize: "18px",
                fontWeight: "bold",
                textAlign: "center"
              }}>
                No matches found
              </h3>
                  <p style={{ fontSize: "14px" }}>Try adjusting your search criteria or category filter.</p>
                </div>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div style={{ 
            marginTop: "25px", 
            textAlign: "center",
            backgroundColor: "#2a2a2a",
            padding: "25px",
            borderRadius: "12px",
            border: "1px solid #607D8B"
          }}>
            <h3 style={{ 
              color: "#ffffff", 
              marginBottom: "20px", 
              fontSize: "20px",
              fontWeight: "bold",
              textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
              borderBottom: "2px solid #607D8B",
              paddingBottom: "5px"
            }}>
              ⚙️ Quick Actions
            </h3>
            <div style={{ display: "flex", gap: "15px", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={clearAllWaypoints}
                style={{ 
                  padding: "12px 20px", 
                  backgroundColor: "#f44336", 
                  color: "white", 
                  border: "none", 
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: "0 2px 4px rgba(244, 67, 54, 0.3)"
                }}
              >
                🗑️ Clear All Waypoints
              </button>
              <button
                onClick={exportWaypoints}
                style={{ 
                  padding: "12px 20px", 
                  backgroundColor: "#4CAF50", 
                  color: "white", 
                  border: "none", 
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: "0 2px 4px rgba(76, 175, 80, 0.3)"
                }}
              >
                📤 Export Waypoints
              </button>
              <label
                style={{ 
                  padding: "8px 16px", 
                  backgroundColor: "#2196F3", 
                  color: "white", 
                  border: "none", 
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "inline-block"
                }}
              >
                📥 Import Waypoints
                <input
                  type="file"
                  accept=".json"
                  onChange={importWaypoints}
                  style={{ display: "none" }}
                />
              </label>
            </div>
            
            <div style={{ 
              backgroundColor: "#1a1a1a", 
              padding: "10px", 
              borderRadius: "4px", 
              fontSize: "12px", 
              color: "#888",
              maxWidth: "600px",
              margin: "0 auto"
            }}>
              <p><strong>💡 Import/Export Tips:</strong></p>
              <p>• <strong>Export:</strong> Downloads all your waypoints as a JSON file with today's date</p>
              <p>• <strong>Import:</strong> Select a JSON file to add waypoints to your existing collection</p>
              <p>• <strong>Share:</strong> Export your waypoints and share the file with friends!</p>
              <p>• <strong>Backup:</strong> Export regularly to backup your waypoint collection</p>
            </div>
          </div>
        </div>
      )}

      {/* ForceField Explorer Tab */}
              {activeTab === "forcefield" && (
          <div>
            <div style={{
              backgroundColor: "#2a2a2a",
              padding: "20px 25px",
              borderRadius: "12px",
              marginBottom: "25px",
              border: "2px solid #2196F3",
              boxShadow: "0 4px 12px rgba(33,150,243,0.2)"
            }}>
              <h2 style={{
                color: "#ffffff",
                fontSize: "1.8rem",
                fontWeight: "bold",
                margin: 0,
                textAlign: "center",
                textShadow: "2px 2px 4px rgba(0,0,0,0.5)"
              }}>
                🔒 ForceField Operations
              </h2>
            </div>
          
          <div style={{ 
            backgroundColor: "#2a2a2a", 
            padding: "20px", 
            borderRadius: "12px", 
            marginBottom: "20px",
            border: "1px solid #2196F3"
          }}>
            <h3 style={{ 
              color: "#ffffff", 
              marginBottom: "15px", 
              fontSize: "18px",
              fontWeight: "bold",
              textShadow: "2px 2px 4px rgba(0,0,0,0.5)"
            }}>
              🔒 Membership Management
            </h3>
            <div style={{ display: "flex", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: "10px", flex: 1, minWidth: "300px" }}>
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
                    fontSize: "14px"
                  }}
                />
                                 <button
                   onClick={() => getEntityAtCursorWithType('forcefield')}
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
                     transition: "all 0.2s ease"
                   }}
                 >
                   {forceFieldCursorLoading ? "⏳ Loading..." : "🖱️ Get FF at Cursor"}
                 </button>
              </div>
              <button
                onClick={() => handleSystemCall("setMembership", [targetEntityId, memberEntityId, true])}
                style={{ padding: "8px 16px", backgroundColor: "#4CAF50", color: "white", border: "none", borderRadius: "4px" }}
              >
                Add Member
              </button>
              <button
                onClick={() => handleSystemCall("setMembership", [targetEntityId, memberEntityId, false])}
                style={{ padding: "8px 16px", backgroundColor: "#f44336", color: "white", border: "none", borderRadius: "4px" }}
              >
                Remove Member
              </button>
            </div>
          </div>

          <div style={{ 
            backgroundColor: "#2a2a2a", 
            padding: "20px", 
            borderRadius: "12px", 
            marginBottom: "20px",
            border: "1px solid #2196F3"
          }}>
            <h3 style={{ 
              color: "#ffffff", 
              marginBottom: "15px", 
              fontSize: "18px",
              fontWeight: "bold",
              textShadow: "2px 2px 4px rgba(0,0,0,0.5)"
            }}>
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
                  fontSize: "14px"
                }}
              />
              <div style={{ fontSize: "12px", color: "#888", marginTop: "5px" }}>
                Enter player address (0x...) or entity ID (numeric)
              </div>
            </div>
          </div>

          <div style={{ 
            backgroundColor: "#2a2a2a", 
            padding: "20px", 
            borderRadius: "12px", 
            marginBottom: "20px",
            border: "1px solid #2196F3"
          }}>
            <h3 style={{ 
              color: "#ffffff", 
              marginBottom: "15px", 
              fontSize: "18px",
              fontWeight: "bold",
              textShadow: "2px 2px 4px rgba(0,0,0,0.5)"
            }}>
              📖 Instructions
            </h3>
                         <div style={{ 
               backgroundColor: "#1a1a1a", 
               padding: "15px", 
               borderRadius: "8px", 
               marginBottom: "20px",
               border: "1px solid #2196F3"
             }}>
               <h4 style={{ 
                color: "#ffffff", 
                marginBottom: "10px",
                fontSize: "16px",
                fontWeight: "bold",
                textShadow: "2px 2px 4px rgba(0,0,0,0.5)"
              }}>
                🔒 ForceField Membership Management
              </h4>
               <div style={{ color: "#ccc", fontSize: "14px", lineHeight: "1.5" }}>
                 <p><strong>setMembership(target, member, allowed):</strong> Manages forcefield access permissions</p>
                 <p><strong>target:</strong> ForceField entity ID (numeric, e.g., 12345)</p>
                 <p><strong>member:</strong> Player address (0x...) or entity ID (numeric)</p>
                 <p><strong>allowed:</strong> true to grant access, false to revoke access</p>
                 <p><strong>⚠️ Important:</strong> Use numeric entity IDs for forcefields, not full chain entity IDs!</p>
                 <p><strong>💡 Pro Tip:</strong> Force fields protect areas from mining, building, and other actions!</p>
               </div>
             </div>
          </div>
                 </div>
       )}

       {/* Sign Editor Tab */}
               {activeTab === "signs" && (
          <div>
            <div style={{
              backgroundColor: "#2a2a2a",
              padding: "20px 25px",
              borderRadius: "12px",
              marginBottom: "25px",
              border: "2px solid #9C27B0",
              boxShadow: "0 4px 12px rgba(156,39,176,0.2)"
            }}>
              <h2 style={{
                color: "#ffffff",
                fontSize: "1.8rem",
                fontWeight: "bold",
                margin: 0,
                textAlign: "center",
                textShadow: "2px 2px 4px rgba(0,0,0,0.5)"
              }}>
                📝 Sign Editor
              </h2>
            </div>




           {/* Sign Editor Form */}
           <div style={{ 
             backgroundColor: "#2a2a2a", 
             padding: "20px", 
             borderRadius: "8px", 
             marginBottom: "20px" 
           }}>
             <h3 style={{ 
               color: "#ffffff", 
               marginBottom: "15px", 
               fontSize: "20px",
               fontWeight: "bold",
               textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
               borderBottom: "2px solid #9C27B0",
               paddingBottom: "5px"
             }}>
               ✏️ Edit Sign Text
             </h3>
             <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
               <div>
                 <label style={{ display: "block", marginBottom: "5px", color: "#ccc" }}>
                   Sign Entity ID (numeric, e.g., 286365):
                 </label>
                 <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
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
                       color: "white"
                     }}
                   />
                   <button
                     onClick={() => getEntityAtCursorWithType('sign')}
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
                       transition: "all 0.2s ease"
                     }}
                   >
                     {signCursorLoading ? "⏳ Loading..." : "🖱️ Get Sign at Cursor"}
                   </button>
                 </div>
               </div>
               
               <div>
                 <label style={{ display: "block", marginBottom: "5px", color: "#ccc" }}>
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
                     resize: "vertical"
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
                   cursor: "pointer"
                 }}
               >
                 📝 Update Sign
               </button>
             </div>

             {signUpdateResult && (
               <div style={{ 
                 marginTop: "15px",
                 padding: "15px", 
                 borderRadius: "4px",
                 fontFamily: "monospace",
                 fontSize: "14px",
                 border: signUpdateResult.startsWith("✅") ? "1px solid #4CAF50" : "1px solid #f44336",
                 backgroundColor: signUpdateResult.startsWith("✅") ? "#1a3a1a" : "#3a1a1a"
               }}>
                 <strong>Result:</strong><br/>
                 {signUpdateResult}
               </div>
             )}
           </div>

           {/* Quick Examples */}
           <div style={{ 
             backgroundColor: "#2a2a2a", 
             padding: "20px", 
             borderRadius: "8px", 
             marginBottom: "20px" 
           }}>
             <h3>💡 Sign Text Ideas</h3>
             <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "15px" }}>
               <div style={{ backgroundColor: "#1a1a1a", padding: "15px", borderRadius: "4px" }}>
                 <h4 style={{ 
                color: "#1a1a1a", 
                marginBottom: "10px",
                fontSize: "16px",
                fontWeight: "bold",
                textShadow: "1px 1px 1px rgba(0,0,0,0.1)"
              }}>
                📍 Location Markers
              </h4>
                 <ul style={{ color: "#ccc", fontSize: "14px", lineHeight: "1.4" }}>
                   <li>"Welcome to Base Alpha"</li>
                   <li>"Mining Site - Level 3"</li>
                   <li>"Safe Zone - No PvP"</li>
                   <li>"Resource Depot"</li>
                 </ul>
               </div>
               <div style={{ backgroundColor: "#1a1a1a", padding: "15px", borderRadius: "4px" }}>
                                   <h4 style={{ 
                    color: "#1a1a1a", 
                    marginBottom: "10px",
                    fontSize: "16px",
                    fontWeight: "bold",
                    textShadow: "1px 1px 1px rgba(0,0,0,0.1)"
                  }}>
                    🗺️ Directions
                  </h4>
                 <ul style={{ color: "#ccc", fontSize: "14px", lineHeight: "1.4" }}>
                   <li>"North → Spawn Point"</li>
                   <li>"East → Trading Hub"</li>
                   <li>"Danger Zone Ahead!"</li>
                   <li>"Secret Passage →"</li>
                 </ul>
               </div>
               <div style={{ backgroundColor: "#1a1a1a", padding: "15px", borderRadius: "4px" }}>
                                   <h4 style={{ 
                    color: "#1a1a1a", 
                    marginBottom: "10px",
                    fontSize: "16px",
                    fontWeight: "bold",
                    textShadow: "1px 1px 1px rgba(0,0,0,0.1)"
                  }}>
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
       )}

       {/* Utilities Tab */}
                      {activeTab === "newsletter" && (
          <div>
            <div style={{
              backgroundColor: "#2a2a2a",
              padding: "20px 25px",
              borderRadius: "12px",
              marginBottom: "25px",
              border: "2px solid #FF9800",
              boxShadow: "0 4px 12px rgba(255,152,0,0.2)"
            }}>
              <h2 style={{
                color: "#ffffff",
                fontSize: "1.8rem",
                fontWeight: "bold",
                margin: 0,
                textAlign: "center",
                textShadow: "2px 2px 4px rgba(0,0,0,0.5)"
              }}>
                📰 Dust Weekly
              </h2>
            </div>
            <p style={{ color: "#888", marginBottom: "20px" }}>
              Weekly newsletter with the latest Dust updates and community highlights
            </p>

          <div style={{ 
            backgroundColor: "#2a2a2a", 
            padding: "40px", 
            borderRadius: "12px", 
            marginBottom: "20px",
            border: "1px solid #FF9800",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "64px", marginBottom: "20px" }}>📰</div>
            <h3 style={{ 
              color: "#ffffff", 
              marginBottom: "15px",
              fontSize: "24px",
              fontWeight: "bold",
              textShadow: "2px 2px 4px rgba(0,0,0,0.5)"
            }}>
              Coming Soon!
            </h3>
            <p style={{ 
              color: "#ccc", 
              fontSize: "16px", 
              lineHeight: "1.6",
              maxWidth: "500px",
              margin: "0 auto"
            }}>
              The Dust Weekly newsletter is currently in development. 
              Stay tuned for weekly updates, community highlights, and the latest news from the Dust universe!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
