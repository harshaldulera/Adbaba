import { useState, useEffect, useRef } from "react";
import ReactFlow, {
    ReactFlowProvider,
    useNodesState,
    useEdgesState,
    Background,
    BackgroundVariant,
    MiniMap,
    Controls,
} from "reactflow";
import { stratify, tree } from "d3-hierarchy";
import { Box, LinearProgress, Typography, Button } from "@mui/material";
import { Link } from "react-router-dom";
import { ArrowForward } from "@mui/icons-material";
import "reactflow/dist/style.css";

import { useBusinessContext } from "../context/BusinessContext";
import { ArrowBack } from "@mui/icons-material";

const initialNodes: any[] = [];
const initialEdges: any[] = [];

const nodeWidth = 172;
const nodeHeight = 36;

const getLayoutedElements = (nodes: any[], edges: any[]) => {
    if (nodes.length === 0) {
        return { nodes, edges };
    }

    // Find all root nodes (nodes that are never targets in edges)
    const targetIds = new Set(edges.map((e: any) => e.target));
    const rootNodes = nodes.filter((node: any) => !targetIds.has(node.id));
    
    // If there are multiple roots, create a virtual root node
    let nodesToLayout = nodes;
    let edgesToLayout = edges;
    let virtualRootId: string | null = null;
    
    if (rootNodes.length > 1) {
        // Create a virtual root node
        virtualRootId = "__virtual_root__";
        const virtualRoot = {
            id: virtualRootId,
            position: { x: 0, y: 0 },
            data: { label: "Root" }
        };
        
        // Add virtual root to nodes
        nodesToLayout = [virtualRoot, ...nodes];
        
        // Create edges from virtual root to all root nodes
        const virtualEdges = rootNodes.map((rootNode: any, index: number) => ({
            id: `__virtual_edge_${index}__`,
            source: virtualRootId,
            target: rootNode.id
        }));
        
        edgesToLayout = [...virtualEdges, ...edges];
    }

    // Create a hierarchy from the nodes and edges
    const hierarchy = stratify()
        .id((d: any) => d.id)
        .parentId((d: any) => {
            // for each node, find if there's an edge whose `target` is this node
            // that edge's `source` is the parent
            const parentEdge = edgesToLayout.find((edge: any) => edge.target === d.id);
            return parentEdge?.source || null;
        });

    const root = hierarchy(nodesToLayout);

    // Configure d3 tree layout
    const treeLayout = tree().nodeSize([nodeWidth * 2, nodeHeight * 4]);
    const layout = treeLayout(root);

    // Map the d3-hierarchy positions back to React Flow positions
    // Filter out the virtual root if it was created
    const layoutedNodes = layout.descendants()
        .filter((node: any) => node.data.id !== virtualRootId)
        .map((node: any) => ({
            ...(node.data as any),
            position: {
                x: node.x - nodeWidth / 2,
                y: node.y - nodeHeight / 2,
            },
        }));

    // Filter out virtual edges from the returned edges
    const filteredEdges = virtualRootId 
        ? edges.filter((e: any) => !e.id?.startsWith("__virtual_edge_"))
        : edges;

    return { nodes: layoutedNodes, edges: filteredEdges };
};

const LayoutFlow = ({ setLoading }: { setLoading: (loading: boolean) => void }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
    // Get business data from context
    const { businessData } = useBusinessContext();
    
    // Cache for storing API responses (using useRef to avoid re-renders)
    const cacheRef = useRef<{ [key: string]: any }>({});
    const lastBusinessDataHashRef = useRef<string>("");
  
    // Create a hash of business data to detect changes
    const createBusinessDataHash = (data: any): string => {
      if (!data) return "";
      return JSON.stringify(data);
    };
  
    useEffect(() => {
      const fetchFunnelData = async () => {
        if (!businessData) {
          console.log("No business data available");
          return;
        }

        // Create hash of current business data
        const currentHash = createBusinessDataHash(businessData);
        
        // Check if business data has changed
        if (currentHash === lastBusinessDataHashRef.current && cacheRef.current[currentHash]) {
          console.log("Using cached funnel data - no changes detected");
          // Use cached data
          const cachedData = cacheRef.current[currentHash];
          const { nodes: cachedNodes, edges: cachedEdges } = cachedData.visualizationData;
          
          const edgesWithAnimation = cachedEdges.map((edge: any) => ({
            ...edge,
            animated: true,
          }));
          
          const { nodes: layoutedNodes, edges: layoutedEdges } =
            getLayoutedElements(cachedNodes, edgesWithAnimation);
          
          setNodes(layoutedNodes);
          setEdges(layoutedEdges);
          return;
        }

        // Business data has changed or no cache exists - call API
        console.log("Business data changed or no cache - calling API");
        setLoading(true);
        try {
          const response = await fetch(
            "http://localhost:3000/generate-funnel-flow",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ businessData }),
            }
          );
  
          if (!response.ok) {
            throw new Error("Failed to fetch funnel data");
          }
  
          const data = await response.json();
          console.log("Funnel Data:", data);
  
          // Store in cache
          cacheRef.current[currentHash] = data;
          lastBusinessDataHashRef.current = currentHash;
  
          // data.visualizationData contains { nodes: [...], edges: [...] }
          const { nodes: newNodes, edges: newEdges } = data.visualizationData;
  
          // OPTIONAL: if you want each edge to be animated, you can map them:
          const edgesWithAnimation = newEdges.map((edge: any) => ({
            ...edge,
            animated: true,
          }));
  
          // Apply D3 layout before setting them in state:
          const { nodes: layoutedNodes, edges: layoutedEdges } =
            getLayoutedElements(newNodes, edgesWithAnimation);
  
          setNodes(layoutedNodes);
          setEdges(layoutedEdges);
        } catch (error) {
          console.error("Error fetching funnel data:", error);
        } finally {
          setLoading(false);
        }
      };
  
      fetchFunnelData();
    }, [businessData, setNodes, setEdges, setLoading]);
  
    return (
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <Controls />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <MiniMap nodeStrokeWidth={3} zoomable pannable />
      </ReactFlow>
    );
  };
  
  const Funnel = () => {
    const [loading, setLoading] = useState(false); // State to manage loading
    const [currentFactIndex, setCurrentFactIndex] = useState(0); // State for current fact
    const marketingFacts = [
      "Generating a personalized funnel...",
      "We create solutions tailored to your needs.",
      "Your success is our priority.",
      "Data-driven insights for better decisions.",
      "Streamlining your processes for efficiency.",
    ];
  
    useEffect(() => {
      let interval: NodeJS.Timeout;
      if (loading) {
        interval = setInterval(() => {
          setCurrentFactIndex(
            (prevIndex) => (prevIndex + 1) % marketingFacts.length
          );
        }, 3000); // Change fact every 2 seconds
      }
      return () => clearInterval(interval); // Cleanup interval on unmount
    }, [loading]);
  
    return (
      <Box
        sx={{
          width: "100%",
          height: "100vh",
          position: "relative",
          bgcolor: "primary.main",
        }}
      >
        {loading && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000, // Ensure it is on top
            }}
          >
            <LinearProgress sx={{ width: "50%", marginBottom: 2 }} />{" "}
            {/* Centered progress bar */}
            <Typography variant="h6" sx={{ color: "white", marginBottom: 2 }}>
              {marketingFacts[currentFactIndex]}{" "}
              {/* Display current marketing fact */}
            </Typography>
          </Box>
        )}
        <ReactFlowProvider>
          <Link
            to="/"
            style={{
              position: "absolute",
              top: 16,
              left: 16,
              textDecoration: "none",
            }}
          >
            <Button
              variant="contained"
              color="secondary" // Use theme color
              endIcon={<ArrowBack />} // Add arrow icon
              sx={{
                opacity: 0.9, // Slightly transparent
                "&:hover": {
                  opacity: 1, // Full opacity on hover
                },
              }}
            >
              Go Back
            </Button>
          </Link>
          <LayoutFlow setLoading={setLoading} />
          {/* CTA Button in the top right corner */}
          <Link
            to="/socials"
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              textDecoration: "none",
            }}
          >
            <Button
              variant="contained"
              color="secondary" // Use theme color
              endIcon={<ArrowForward />} // Add arrow icon
              sx={{
                opacity: 0.9, // Slightly transparent
                "&:hover": {
                  opacity: 1, // Full opacity on hover
                },
              }}
            >
              Go to Socials
            </Button>
          </Link>
        </ReactFlowProvider>
      </Box>
    );
  };
  
  export default Funnel;

// import { useState, useEffect } from "react";
// import ReactFlow, {
//   ReactFlowProvider,
//   useNodesState,
//   useEdgesState,
//   Background,
//   BackgroundVariant,
//   MiniMap,
//   Controls,
// } from "reactflow";
// import { stratify, tree } from "d3-hierarchy";
// import { Box, LinearProgress, Typography, Button, TextField, Paper } from "@mui/material";
// import { Link } from "react-router-dom";
// import { ArrowForward, ArrowBack } from "@mui/icons-material";
// import "reactflow/dist/style.css";

// import { useBusinessContext } from "../context/BusinessContext";

// const initialNodes: any[] = [];
// const initialEdges: any[] = [];

// const nodeWidth = 172;
// const nodeHeight = 36;

// // Hardcoded visualization data
// const HARDCODED_VISUALIZATION = {
//   nodes: [
//     {
//       id: "root",
//       position: { x: 100, y: 50 },
//       data: { label: "Marketing Funnel" },
//     },

//     // Awareness Stage
//     {
//       id: "awareness",
//       position: { x: 100, y: 200 },
//       data: { label: "Awareness Stage" },
//     },
//     { id: "social_media", position: { x: 50, y: 300 }, data: { label: "Social Media Campaigns" } },
//     { id: "seo", position: { x: 150, y: 300 }, data: { label: "SEO Optimization" } },
//     { id: "content", position: { x: 250, y: 300 }, data: { label: "Content Marketing" } },
//     { id: "influencers", position: { x: 350, y: 300 }, data: { label: "Influencer Partnerships" } },

//     // Consideration Stage
//     {
//       id: "consideration",
//       position: { x: 100, y: 450 },
//       data: { label: "Consideration Stage" },
//     },
//     { id: "email", position: { x: 50, y: 550 }, data: { label: "Email Nurturing" } },
//     { id: "lead_magnets", position: { x: 150, y: 550 }, data: { label: "Lead Magnets (E-books / Webinars)" } },
//     { id: "retargeting_ads", position: { x: 250, y: 550 }, data: { label: "Retargeting Ads" } },

//     // Conversion Stage
//     {
//       id: "conversion",
//       position: { x: 100, y: 700 },
//       data: { label: "Conversion Stage" },
//     },
//     { id: "discounts", position: { x: 50, y: 800 }, data: { label: "Discounts & Offers" } },
//     { id: "checkout", position: { x: 150, y: 800 }, data: { label: "Optimized Checkout" } },
//     { id: "cta", position: { x: 250, y: 800 }, data: { label: "Strong CTAs" } },

//     // Retention Stage
//     {
//       id: "retention",
//       position: { x: 100, y: 950 },
//       data: { label: "Retention Stage" },
//     },
//     { id: "loyalty", position: { x: 50, y: 1050 }, data: { label: "Loyalty Programs" } },
//     { id: "personalization", position: { x: 150, y: 1050 }, data: { label: "Personalized Emails" } },
//     { id: "referrals", position: { x: 250, y: 1050 }, data: { label: "Referral Incentives" } },
//   ],
//   edges: [
//     // Awareness
//     { id: "e1", source: "root", target: "awareness" },
//     { id: "e2", source: "awareness", target: "social_media" },
//     { id: "e3", source: "awareness", target: "seo" },
//     { id: "e4", source: "awareness", target: "content" },
//     { id: "e5", source: "awareness", target: "influencers" },

//     // Consideration
//     { id: "e6", source: "root", target: "consideration" },
//     { id: "e7", source: "consideration", target: "email" },
//     { id: "e8", source: "consideration", target: "lead_magnets" },
//     { id: "e9", source: "consideration", target: "retargeting_ads" },

//     // Conversion
//     { id: "e10", source: "root", target: "conversion" },
//     { id: "e11", source: "conversion", target: "discounts" },
//     { id: "e12", source: "conversion", target: "checkout" },
//     { id: "e13", source: "conversion", target: "cta" },

//     // Retention
//     { id: "e14", source: "root", target: "retention" },
//     { id: "e15", source: "retention", target: "loyalty" },
//     { id: "e16", source: "retention", target: "personalization" },
//     { id: "e17", source: "retention", target: "referrals" },
//   ],
// };

// const getLayoutedElements = (nodes: any[], edges: any[]) => {
//   if (nodes.length === 0) return { nodes, edges };

//   const hierarchy = stratify()
//     .id((d: any) => d.id)
//     .parentId((d: any) => {
//       const parentEdge = edges.find((edge) => edge.target === d.id);
//       return parentEdge?.source || null;
//     });

//   const root = hierarchy(nodes);
//   const treeLayout = tree().nodeSize([nodeWidth * 2, nodeHeight * 4]);
//   const layout = treeLayout(root);

//   const layoutedNodes = layout.descendants().map((node) => ({
//     ...(node.data as any),
//     position: {
//       x: node.x - nodeWidth / 2,
//       y: node.y - nodeHeight / 2,
//     },
//   }));

//   return { nodes: layoutedNodes, edges };
// };

// const LayoutFlow = ({
//   setLoading,
//   nodes,
//   edges,
//   setNodes,
//   setEdges,
// }: {
//   setLoading: (loading: boolean) => void;
//   nodes: any[];
//   edges: any[];
//   setNodes: (nodes: any[]) => void;
//   setEdges: (edges: any[]) => void;
// }) => {
//   const { businessId } = useBusinessContext();

//   useEffect(() => {
//     const renderHardcodedFunnel = async () => {
//       setLoading(true);
//       try {
//         await new Promise((resolve) => setTimeout(resolve, 1500));
//         const { nodes: newNodes, edges: newEdges } = HARDCODED_VISUALIZATION;
//         const edgesWithAnimation = newEdges.map((edge: any) => ({ ...edge, animated: true }));
//         const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(newNodes, edgesWithAnimation);
//         setNodes(layoutedNodes);
//         setEdges(layoutedEdges);
//       } catch (error) {
//         console.error("Error rendering hardcoded funnel:", error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     renderHardcodedFunnel();
//   }, [setNodes, setEdges, setLoading]);

//   return (
//     <ReactFlow nodes={nodes} edges={edges} fitView>
//       <Controls />
//       <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
//       <MiniMap nodeStrokeWidth={3} zoomable pannable />
//     </ReactFlow>
//   );
// };

// const Funnel = () => {
//   const [loading, setLoading] = useState(false);
//   const [currentFactIndex, setCurrentFactIndex] = useState(0);
//   const [nodes, setNodes] = useState<any[]>(initialNodes);
//   const [edges, setEdges] = useState<any[]>(initialEdges);
//   const { businessId } = useBusinessContext();

//   const [chatOpen, setChatOpen] = useState(true);
//   const [chatInput, setChatInput] = useState("");
//   const [chatLoading, setChatLoading] = useState(false);
//   const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);

//   const handleSend = async () => {
//     const text = chatInput.trim();
//     if (!text) return;
//     setChatInput("");
//     setMessages((m) => [...m, { role: "user", content: text }]);
//     setChatLoading(true);
//     try {
//       const response = await fetch("http://localhost:3000/chat-funnel-edit", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ businessId, message: text, nodes, edges }),
//       });
//       if (!response.ok) throw new Error("Failed to update funnel");
//       const data = await response.json();
//       const assistantMsg = data.assistant_message || "Applied changes.";
//       const { nodes: newNodes, edges: newEdges } = data.visualizationData || {};
//       if (Array.isArray(newNodes) && Array.isArray(newEdges)) {
//         const edgesWithAnimation = newEdges.map((edge: any) => ({ ...edge, animated: true }));
//         const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(newNodes, edgesWithAnimation);
//         setNodes(layoutedNodes);
//         setEdges(layoutedEdges);
//       }
//       setMessages((m) => [...m, { role: "assistant", content: assistantMsg }]);
//     } catch (err: any) {
//       setMessages((m) => [
//         ...m,
//         { role: "assistant", content: `There was an error applying your change: ${err?.message || "Unknown error"}` },
//       ]);
//     } finally {
//       setChatLoading(false);
//     }
//   };

//   const marketingFacts = [
//     "Generating a personalized funnel...",
//     "We create solutions tailored to your needs.",
//     "Your success is our priority.",
//     "Data-driven insights for better decisions.",
//     "Streamlining your processes for efficiency.",
//   ];

//   useEffect(() => {
//     let interval: NodeJS.Timeout;
//     if (loading) {
//       interval = setInterval(() => {
//         setCurrentFactIndex((prevIndex) => (prevIndex + 1) % marketingFacts.length);
//       }, 2500); // change every 2.5 seconds
//     }
//     return () => clearInterval(interval);
//   }, [loading]);

//   return (
//     <Box
//       sx={{
//         width: "100%",
//         height: "100vh",
//         position: "relative",
//         bgcolor: "primary.main",
//       }}
//     >
//       {loading && (
//         <Box
//           sx={{
//             position: "absolute",
//             top: 0,
//             left: 0,
//             right: 0,
//             bottom: 0,
//             backgroundColor: "rgba(0, 0, 0, 0.5)",
//             display: "flex",
//             flexDirection: "column",
//             alignItems: "center",
//             justifyContent: "center",
//             zIndex: 1000,
//           }}
//         >
//           <LinearProgress sx={{ width: "50%", marginBottom: 2 }} />
//           <Typography variant="h6" sx={{ color: "white", marginBottom: 2 }}>
//             {marketingFacts[currentFactIndex]}
//           </Typography>
//         </Box>
//       )}
//       <ReactFlowProvider>
//         <Link
//           to="/"
//           style={{
//             position: "absolute",
//             top: 16,
//             left: 16,
//             textDecoration: "none",
//           }}
//         >
//           <Button
//             variant="contained"
//             color="secondary"
//             endIcon={<ArrowBack />}
//             sx={{ opacity: 0.9, "&:hover": { opacity: 1 } }}
//           >
//             Go Back
//           </Button>
//         </Link>
//         <LayoutFlow setLoading={setLoading} nodes={nodes} edges={edges} setNodes={setNodes} setEdges={setEdges} />
//         <Link
//           to="/socials"
//           style={{
//             position: "absolute",
//             top: 16,
//             right: 16,
//             textDecoration: "none",
//           }}
//         >
//           <Button
//             variant="contained"
//             color="secondary"
//             endIcon={<ArrowForward />}
//             sx={{ opacity: 0.9, "&:hover": { opacity: 1 } }}
//           >
//             Go to Socials
//           </Button>
//         </Link>
//       </ReactFlowProvider>

//       {/* Chat panel */}
//       <Paper
//         elevation={6}
//         sx={{
//           position: "absolute",
//           right: 16,
//           bottom: 16,
//           width: 360,
//           maxHeight: 420,
//           display: chatOpen ? "flex" : "none",
//           flexDirection: "column",
//           overflow: "hidden",
//         }}
//       >
//         <Box sx={{ p: 1, borderBottom: "1px solid rgba(0,0,0,0.12)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
//           <Typography variant="subtitle1">Funnel Copilot</Typography>
//           <Button size="small" onClick={() => setChatOpen(false)}>Hide</Button>
//         </Box>
//         <Box sx={{ p: 1, flex: 1, overflowY: "auto", bgcolor: "background.default" }}>
//           {messages.length === 0 && (
//             <Typography variant="body2" color="text.secondary">
//               Ask for changes like: "Add TikTok under Awareness" or "Rename CTA to 'Schedule Demo'".
//             </Typography>
//           )}
//           {messages.map((m, idx) => (
//             <Box key={idx} sx={{ mb: 1.25 }}>
//               <Typography variant="caption" color={m.role === "user" ? "primary.main" : "secondary.main"}>
//                 {m.role === "user" ? "You" : "Assistant"}
//               </Typography>
//               <Typography variant="body2">{m.content}</Typography>
//             </Box>
//           ))}
//           {chatLoading && <LinearProgress />}
//         </Box>
//         <Box sx={{ p: 1, display: "flex", gap: 1 }}>
//           <TextField
//             size="small"
//             fullWidth
//             placeholder="Describe your change..."
//             value={chatInput}
//             onChange={(e) => setChatInput(e.target.value)}
//             onKeyDown={(e) => {
//               if (e.key === "Enter") handleSend();
//             }}
//           />
//           <Button variant="contained" onClick={() => handleSend()} disabled={chatLoading || !chatInput.trim()}>
//             Send
//           </Button>
//         </Box>
//       </Paper>

//       {/* Toggle button when hidden */}
//       {!chatOpen && (
//         <Button
//           variant="contained"
//           color="secondary"
//           sx={{ position: "absolute", right: 16, bottom: 16 }}
//           onClick={() => setChatOpen(true)}
//         >
//           Open Copilot
//         </Button>
//       )}
//     </Box>
//   );
// };

// export default Funnel;
