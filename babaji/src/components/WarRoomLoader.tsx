import { Box, Typography, CircularProgress, keyframes } from "@mui/material";
import { useState, useEffect } from "react";

const pulse = keyframes`
  0% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
  100% { opacity: 0.6; transform: scale(1); }
`;

const messages = [
  "Analyzing Brand Voice...",
  "Identifying TOFU/MOFU Triggers...",
  "Calculating Conversion Logic...",
  "Drafting Node Architecture...",
  "Optimizing Funnel Flow...",
  "Finalizing Strategy..."
];

export default function WarRoomLoader() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(10, 25, 41, 0.95)", // Deep dark blue/black
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        color: "white",
      }}
    >
      <Box sx={{ position: 'relative', display: 'inline-flex', mb: 4 }}>
        <CircularProgress size={80} thickness={2} sx={{ color: '#00ff88' }} />
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: `${pulse} 2s infinite ease-in-out`
          }}
        >
          <Typography variant="caption" component="div" color="text.secondary" sx={{ color: '#00ff88', fontSize: '1.5rem' }}>
            AI
          </Typography>
        </Box>
      </Box>

      <Typography
        variant="h5"
        sx={{
          fontWeight: "bold",
          color: "#fff",
          textShadow: "0 0 10px rgba(0, 255, 136, 0.5)",
          animation: `${pulse} 2s infinite ease-in-out`,
          minHeight: "2em",
          textAlign: "center"
        }}
      >
        {messages[messageIndex]}
      </Typography>
      
      <Typography variant="body2" sx={{ mt: 2, color: "rgba(255,255,255,0.6)" }}>
        Constructing your marketing strategy...
      </Typography>
    </Box>
  );
}
