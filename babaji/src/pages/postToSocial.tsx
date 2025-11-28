import { useEffect, useState } from "react";
import axios from "axios";
import {
    Box,
    Button,
    Card,
    CardContent,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Stack,
    Alert,
    Container,
    Grid,
    useTheme
} from "@mui/material";

export default function PostToSocial() {
    const theme = useTheme();
    const videoId = localStorage.getItem("videoId");
    const script = localStorage.getItem("videoScript");

    const [status, setStatus] = useState("generating");
    const [videoUrl, setVideoUrl] = useState("");
    const [openPopup, setOpenPopup] = useState(false);

    // Twitter states
    const [tweet, setTweet] = useState("");
    const [tweetLoading, setTweetLoading] = useState(false);

    // Instagram states
    const [igCaption, setIgCaption] = useState("");
    const [igLoading, setIgLoading] = useState(false);
    const [igImage, setIgImage] = useState<File | null>(null);
    const [igPreview, setIgPreview] = useState<string | null>(null);

    useEffect(() => {
        if (!videoId) return;

        const interval = setInterval(async () => {
            try {
                const res = await axios.get(
                    `http://localhost:3000/check-status/${videoId}`
                );

                setStatus(res.data.status);

                if (res.data.status === "completed") {
                    setVideoUrl(res.data.video_url);

                    localStorage.setItem("videoUrl", res.data.video_url);
                    localStorage.setItem("videoStatus", "completed");

                    clearInterval(interval);

                    setOpenPopup(true);
                }
            } catch (err) {
                console.error("Error checking status:", err);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [videoId]);

    // ===========================
    // TWITTER HANDLERS
    // ===========================
    const generateTweet = async () => {
        setTweetLoading(true);
        try {
            const raw = localStorage.getItem("businessData");
            const businessData = raw ? JSON.parse(raw) : null;

            const res = await axios.post("http://localhost:3000/generate-tweet", {
                businessData,
            });

            setTweet(res.data.tweet);
        } catch (err) {
            console.log("Tweet generation error:", err);
        }
        setTweetLoading(false);
    };

    const postTweetToTwitter = async () => {
        try {
            const res = await axios.post("http://localhost:3000/post-tweet", {
                tweetText: tweet,
            });

            alert("Tweet posted successfully!");
        } catch (err) {
            alert("Failed to post tweet.");
            console.error("Twitter post error:", err);
        }
    };

    // ===========================
    // INSTAGRAM HANDLERS
    // ===========================
    const generateInstagramCaption = async () => {
        setIgLoading(true);
        try {
            const raw = localStorage.getItem("businessData");
            const businessData = raw ? JSON.parse(raw) : null;

            const res = await axios.post("http://localhost:3000/generate-caption", {
                businessData,
            });

            setIgCaption(res.data.caption);
        } catch (err) {
            console.error("IG caption generation error:", err);
        }
        setIgLoading(false);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setIgImage(file);
        setIgPreview(file ? URL.createObjectURL(file) : null);
    };

    const postToInstagram = async () => {
        if (!igImage) return alert("Please select an image first.");

        const formData = new FormData();
        formData.append("caption", igCaption);
        formData.append("image", igImage);

        try {
            const res = await axios.post("http://localhost:3000/post-instagram", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            alert("Posted to Instagram!");
        } catch (err) {
            console.error("IG post error:", err);
            alert("Instagram post failed.");
        }
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h5" sx={{ mb: 3 }} fontWeight="bold">
                Post to Social Media
            </Typography>

            {status !== "completed" && (
                <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                    Your video is still being generated… prepare your social media posts meanwhile.
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* TWITTER BOX */}
                <Grid item xs={12} md={6}>
                    <Card
                        elevation={3}
                        sx={{
                            height: "100%",
                            border: `1px solid ${theme.palette.divider}`,
                            background: "rgba(255, 255, 255, 0.05)",
                            backdropFilter: "blur(10px)",
                        }}
                    >
                        <CardContent>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                                Twitter Post
                            </Typography>

                            <Button
                                variant="contained"
                                onClick={generateTweet}
                                disabled={tweetLoading}
                                size="small"
                                sx={{ mb: 2 }}
                            >
                                {tweetLoading ? "Generating..." : "Generate Tweet with AI"}
                            </Button>

                            <TextField
                                label="Generated Tweet"
                                multiline
                                fullWidth
                                rows={4}
                                size="small"
                                value={tweet}
                                onChange={(e) => setTweet(e.target.value)}
                                sx={{ mb: 2 }}
                            />

                            <Stack direction="row" justifyContent="flex-end">
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    disabled={!tweet}
                                    onClick={postTweetToTwitter}
                                    size="small"
                                >
                                    Post to Twitter
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                {/* INSTAGRAM BOX */}
                <Grid item xs={12} md={6}>
                    <Card
                        elevation={3}
                        sx={{
                            height: "100%",
                            border: `1px solid ${theme.palette.divider}`,
                            background: "rgba(255, 255, 255, 0.05)",
                            backdropFilter: "blur(10px)",
                        }}
                    >
                        <CardContent>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                                Instagram Post
                            </Typography>

                            <Stack spacing={2}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Button variant="contained" component="label" size="small">
                                        Upload Image
                                        <input hidden type="file" accept="image/*" onChange={handleImageUpload} />
                                    </Button>
                                    
                                    <Button
                                        variant="contained"
                                        onClick={generateInstagramCaption}
                                        disabled={igLoading}
                                        size="small"
                                    >
                                        {igLoading ? "Generating..." : "Generate Caption"}
                                    </Button>
                                </Stack>

                                {igPreview && (
                                    <Box
                                        component="img"
                                        src={igPreview}
                                        alt="preview"
                                        sx={{
                                            width: "100%",
                                            maxHeight: 200,
                                            objectFit: "cover",
                                            borderRadius: 2,
                                            border: `1px solid ${theme.palette.divider}`,
                                        }}
                                    />
                                )}

                                <TextField
                                    label="Instagram Caption"
                                    multiline
                                    fullWidth
                                    rows={3}
                                    size="small"
                                    value={igCaption}
                                    onChange={(e) => setIgCaption(e.target.value)}
                                />

                                <Stack direction="row" justifyContent="flex-end">
                                    <Button
                                        variant="outlined"
                                        color="secondary"
                                        disabled={!igImage}
                                        onClick={postToInstagram}
                                        size="small"
                                    >
                                        Post to Instagram
                                    </Button>
                                </Stack>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                {/* SHOW VIDEO */}
                {status === "completed" && (
                    <Grid item xs={12}>
                        <Card
                            elevation={3}
                            sx={{
                                border: `1px solid ${theme.palette.divider}`,
                                background: "rgba(255, 255, 255, 0.05)",
                                backdropFilter: "blur(10px)",
                            }}
                        >
                            <CardContent>
                                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                                    Your Video
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                    <video controls width="100%" style={{ maxWidth: "600px", borderRadius: "8px" }} src={videoUrl} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                )}
            </Grid>

            {/* SUCCESS POPUP */}
            <Dialog open={openPopup} onClose={() => setOpenPopup(false)} maxWidth="sm" fullWidth>
                <DialogTitle>🎉 Video Ready!</DialogTitle>
                <DialogContent>
                    <Typography sx={{ mb: 2 }}>
                        Your AI-generated marketing video is complete and ready to use!
                    </Typography>
                    <Box sx={{ borderRadius: 2, overflow: 'hidden', border: `1px solid ${theme.palette.divider}` }}>
                        <video controls width="100%" src={videoUrl} />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenPopup(false)} size="small">Close</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
