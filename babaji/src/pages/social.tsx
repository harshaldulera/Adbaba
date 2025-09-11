import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Container,
  Stack,
  Paper,
  LinearProgress,
  Alert,
  Card,
  CardContent,
  CardMedia,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import {
  ArrowBack,
  PlayArrow,
  Download,
  Share,
  Refresh,
  VideoLibrary,
  Psychology,
  AutoAwesome,
} from "@mui/icons-material";
import { Link, useNavigate } from "react-router-dom";
import { useBusinessContext } from "../context/BusinessContext";
import axios from "axios";

interface VideoData {
  videoId?: string;
  script: string;
  status: "generating" | "completed" | "failed";
  videoUrl?: string;
  thumbnailUrl?: string;
  error?: string;
}

export default function Social() {
  const { businessId, businessData: contextBusinessData } =
    useBusinessContext();
  const navigate = useNavigate();
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [showScript, setShowScript] = useState(false);
  const [businessData, setBusinessData] = useState<any>(null);
  const [dialogue, setDialogue] = useState<string>("");

  // Set default dialogue based on business data
  useEffect(() => {
    if (contextBusinessData) {
      const defaultDialogue = `Welcome to ${
        contextBusinessData.name || "our company"
      }! We're revolutionizing the ${
        contextBusinessData.industry || "industry"
      } with innovative solutions designed for professionals like you. Our cutting-edge technology helps businesses streamline operations, increase efficiency, and drive growth. Don't miss out on this opportunity to transform your business. Contact us today and discover how we can help you achieve your goals. Visit our website or call now to get started. Your success is our mission!`;
      setDialogue(defaultDialogue);
      setBusinessData(contextBusinessData);
    } else {
      setError(
        "No business data available. Please go back and upload your business information first."
      );
    }
  }, [contextBusinessData]);

  // Poll for video status when video is generating
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (videoData && videoData.status === "generating") {
      interval = setInterval(() => {
        checkVideoStatus(videoData.videoId);
      }, 5000); // Check every 5 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [videoData]);

  const generateVideo = async () => {
    setLoading(true);
    setError("");

    try {
      if (!dialogue.trim()) {
        throw new Error("Please enter dialogue text");
      }

      const response = await axios.post(
        "http://localhost:3000/generate-video",
        {
          dialogue: dialogue,
        }
      );

      if (response.data.videoId) {
        setVideoData({
          videoId: response.data.videoId,
          script: dialogue,
          status: "generating",
        });
      } else {
        throw new Error("Failed to start video generation");
      }
    } catch (err: any) {
      console.error("Error generating video:", err);
      setError(
        err.response?.data?.error ||
          "Failed to generate video. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const checkVideoStatus = async (videoId: string) => {
    try {
      const response = await axios.get(
        `https://api.heygen.com/v1/video_status.get?video_id=${videoId}`,
        {
          headers: {
            "X-Api-Key":
              "ZDEzN2YyNjZmNzU5NGE3MGFiZTBmODgwYjc5NmRiMGUtMTc1NzYxNjY4OQ==",
          },
        }
      );

      // Handle the actual HeyGen API response structure
      if (response.data.code === 100) {
        const { status, video_url, thumbnail_url } = response.data.data;

        setVideoData((prev) =>
          prev
            ? {
                ...prev,
                status: status === "completed" ? "completed" : "generating",
                videoUrl: video_url || prev.videoUrl,
                thumbnailUrl: thumbnail_url || prev.thumbnailUrl,
              }
            : null
        );
      } else {
        // Handle error case
        setVideoData((prev) =>
          prev
            ? {
                ...prev,
                status: "failed",
                error: response.data.message || "Video generation failed",
              }
            : null
        );
      }
    } catch (err: any) {
      console.error("Error checking video status:", err);
      setVideoData((prev) =>
        prev
          ? {
              ...prev,
              status: "failed",
              error: "Failed to check video status",
            }
          : null
      );
    }
  };

  const handleRetry = () => {
    generateVideo();
  };

  const handleDownload = () => {
    if (videoData?.videoUrl) {
      const link = document.createElement("a");
      link.href = videoData.videoUrl;
      link.download = `marketing-video-${businessData?.name || "business"}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleShare = () => {
    if (videoData?.videoUrl) {
      navigator.clipboard.writeText(videoData.videoUrl);
      // You could add a toast notification here
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "generating":
        return "warning";
      case "completed":
        return "success";
      case "failed":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "generating":
        return "Generating Video...";
      case "completed":
        return "Video Ready!";
      case "failed":
        return "Generation Failed";
      default:
        return "Unknown";
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
          <Link to="/funnel" style={{ textDecoration: "none" }}>
            <Button variant="outlined" startIcon={<ArrowBack />} sx={{ mr: 2 }}>
              Back to Funnel
            </Button>
          </Link>
          <Typography variant="h4" component="h1" fontWeight="bold">
            AI-Generated Marketing Video
          </Typography>
        </Stack>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
            <Button onClick={handleRetry} sx={{ ml: 2 }}>
              Try Again
            </Button>
          </Alert>
        )}

        {/* Dialogue Input */}
        {!videoData && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Enter Your Video Dialogue
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={6}
                value={dialogue}
                onChange={(e) => setDialogue(e.target.value)}
                placeholder="Enter the dialogue text for your video..."
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                onClick={generateVideo}
                disabled={loading || !dialogue.trim()}
                startIcon={<AutoAwesome />}
              >
                {loading ? "Generating Video..." : "Generate Video"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <Paper sx={{ p: 4, textAlign: "center", mb: 3 }}>
            <Stack spacing={3} alignItems="center">
              <AutoAwesome sx={{ fontSize: 48, color: "primary.main" }} />
              <Typography variant="h6">
                Creating your personalized marketing video with AI avatar...
              </Typography>
              <LinearProgress sx={{ width: "100%", maxWidth: 400 }} />
              <Typography variant="body2" color="text.secondary">
                This may take a few minutes. Please don't close this page.
              </Typography>
            </Stack>
          </Paper>
        )}

        {/* Video Display */}
        {videoData && (
          <Stack spacing={3}>
            {/* Status Card */}
            <Card>
              <CardContent>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={2}
                  sx={{ mb: 2 }}
                >
                  <VideoLibrary color="primary" />
                  <Typography variant="h6">Video Generation Status</Typography>
                  <Chip
                    label={getStatusText(videoData.status)}
                    color={getStatusColor(videoData.status) as any}
                    size="small"
                  />
                </Stack>

                {videoData.status === "generating" && (
                  <Box sx={{ mb: 2 }}>
                    <LinearProgress />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      Your video is being generated. This usually takes 2-5
                      minutes.
                    </Typography>
                  </Box>
                )}

                {videoData.status === "completed" && videoData.videoUrl && (
                  <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                     <Button
                       variant="contained"
                       startIcon={<PlayArrow />}
                       onClick={() => setShowScript(true)}
                     >
                       View Dialogue
                     </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Download />}
                      onClick={handleDownload}
                    >
                      Download
                    </Button>
                     <Button
                       variant="outlined"
                       startIcon={<Share />}
                       onClick={handleShare}
                     >
                       Share
                     </Button>
                     <Button
                       variant="outlined"
                       startIcon={<Refresh />}
                       onClick={() => {
                         setVideoData(null);
                         setError("");
                       }}
                     >
                       New Video
                     </Button>
                  </Stack>
                )}

                {videoData.status === "failed" && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {videoData.error ||
                      "Video generation failed. Please try again."}
                    <Button onClick={handleRetry} sx={{ ml: 2 }}>
                      <Refresh />
                      Retry
                    </Button>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Video Player */}
            {videoData.status === "completed" && videoData.videoUrl && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Your Marketing Video
                  </Typography>
                  <Box
                    sx={{
                      position: "relative",
                      width: "100%",
                      maxWidth: 800,
                      mx: "auto",
                    }}
                  >
                    <video
                      controls
                      style={{
                        width: "100%",
                        height: "auto",
                        borderRadius: 8,
                      }}
                      poster={videoData.thumbnailUrl}
                    >
                      <source src={videoData.videoUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Business Info */}
            {businessData && (
              <Card>
                <CardContent>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={2}
                    sx={{ mb: 2 }}
                  >
                    <Psychology color="primary" />
                    <Typography variant="h6">
                      Generated for Your Business
                    </Typography>
                  </Stack>
                  <Stack spacing={1}>
                    <Typography>
                      <strong>Company:</strong> {businessData.name}
                    </Typography>
                    <Typography>
                      <strong>Industry:</strong> {businessData.industry}
                    </Typography>
                    <Typography>
                      <strong>Target Audience:</strong>{" "}
                      {businessData.target_age_group} age group
                    </Typography>
                    <Typography>
                      <strong>Location:</strong> {businessData.target_location}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Stack>
        )}

        {/* Script Dialog */}
         <Dialog
           open={showScript}
           onClose={() => setShowScript(false)}
           maxWidth="md"
           fullWidth
         >
           <DialogTitle>Video Dialogue</DialogTitle>
          <DialogContent>
            <Typography
              variant="body1"
              sx={{ whiteSpace: "pre-line", lineHeight: 1.6 }}
            >
              {videoData?.script}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowScript(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
}
