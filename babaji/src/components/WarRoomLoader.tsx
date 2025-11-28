import { Box, Typography, CircularProgress, keyframes, useTheme } from "@mui/material";
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
  const theme = useTheme();

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
        inset: 0,
        backgroundColor: theme.palette.background.default,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        color: theme.palette.text.primary,
      }}
    >
      {/* Loader Stack */}
      <Box sx={{ position: "relative", display: "inline-flex", mb: 4 }}>
        <CircularProgress
          size={80}
          thickness={2}
          sx={{
            color: "#EC27B6", // Matches glowing pink nebula aesthetic
            filter: "drop-shadow(0px 0px 20px rgba(236,39,182,0.5))",
          }}
        />

        {/* Pulsing AI letters */}
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: "absolute",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: `${pulse} 2s infinite ease-in-out`,
          }}
        >
          <Typography
            variant="caption"
            component="div"
            sx={{
              fontSize: "1.5rem",
              color: "#EC27B6",
              textShadow: "0 0 15px rgba(236,39,182,0.7)",
              fontWeight: 700,
            }}
          >
            AI
          </Typography>
        </Box>
      </Box>

      {/* Dynamic message */}
      <Typography
        variant="h5"
        sx={{
          fontWeight: 600,
          textShadow: "0 0 18px rgba(236, 39, 182, 0.55)",
          animation: `${pulse} 2s infinite ease-in-out`,
          minHeight: "2.2em",
          textAlign: "center",
        }}
      >
        {messages[messageIndex]}
      </Typography>

      {/* Sub-message */}
      <Typography variant="body2" sx={{ mt: 2, color: "rgba(255,255,255,0.6)" }}>
        Constructing your marketing strategy...
      </Typography>
    </Box>
  );
}