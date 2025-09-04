import { useState, useEffect } from "react";
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

    // Create a hierarchy from the nodes and edges
    const hierarchy = stratify()
        .id((d: any) => d.id)
        .parentId((d: any) => {
            // for each node, find if there's an edge whose `target` is this node
            // that edge's `source` is the parent
            const parentEdge = edges.find((edge) => edge.target === d.id);
            return parentEdge?.source || null;
        });

    const root = hierarchy(nodes);

    // Configure d3 tree layout
    const treeLayout = tree().nodeSize([nodeWidth * 2, nodeHeight * 4]);
    const layout = treeLayout(root);

    // Map the d3-hierarchy positions back to React Flow positions
    const layoutedNodes = layout.descendants().map((node) => ({
        ...(node.data as any),
        position: {
            x: node.x - nodeWidth / 2,
            y: node.y - nodeHeight / 2,
        },
    }));

    return { nodes: layoutedNodes, edges };
};

const LayoutFlow = ({ setLoading }: { setLoading: (loading: boolean) => void }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
    // If you use a context to get businessId
    const { businessId } = useBusinessContext();
  
    useEffect(() => {
      const fetchFunnelData = async () => {
        setLoading(true);
        try {
          console.log("Attempting to fetch with businessId:", businessId);
          const response = await fetch(
            "http://localhost:3000/generate-funnel-flow",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ businessId }),
            }
          );
  
          if (!response.ok) {
            throw new Error("Failed to fetch funnel data");
          }
  
          const data = await response.json();
          console.log("Funnel Data:", data);
  
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
  
      if (businessId) {
        fetchFunnelData();
      } else {
        console.log("No businessId available");
      }
    }, [businessId, setNodes, setEdges, setLoading]);
  
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