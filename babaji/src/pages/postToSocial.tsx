import { useEffect, useState } from "react";
import axios from "axios";
import {
    Box,
    Button,
    Card,
    CardContent,
    Typography,
    LinearProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Stack,
    Alert
} from "@mui/material";

export default function PostToSocial() {
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
        <Box sx={{ p: 4 }}>
            <Typography variant="h4" sx={{ mb: 3 }} fontWeight="bold">
                Post to Social Media
            </Typography>

            {status !== "completed" && (
                <Alert severity="info" sx={{ mb: 3 }}>
                    Your video is still being generated… prepare your social media posts meanwhile.
                </Alert>
            )}

            {/* TWITTER BOX */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Twitter Post
                    </Typography>

                    <Button
                        variant="contained"
                        onClick={generateTweet}
                        disabled={tweetLoading}
                    >
                        {tweetLoading ? "Generating tweet..." : "Generate Tweet with AI"}
                    </Button>

                    <TextField
                        label="Generated Tweet"
                        multiline
                        fullWidth
                        rows={4}
                        sx={{ mt: 2 }}
                        value={tweet}
                        onChange={(e) => setTweet(e.target.value)}
                    />

                    <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
                        <Button
                            variant="outlined"
                            color="primary"
                            disabled={!tweet}
                            onClick={postTweetToTwitter}
                        >
                            Post to Twitter
                        </Button>
                    </Stack>
                </CardContent>
            </Card>

            {/* ================================
                INSTAGRAM BOX
            ================================= */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Instagram Post
                    </Typography>

                    <Stack spacing={2}>
                        <Button variant="contained" component="label">
                            Upload Image
                            <input hidden type="file" accept="image/*" onChange={handleImageUpload} />
                        </Button>

                        {igPreview && (
                            <img
                                src={igPreview}
                                alt="preview"
                                style={{
                                    width: "200px",
                                    borderRadius: "8px",
                                    marginTop: "10px",
                                }}
                            />
                        )}

                        <Button
                            variant="contained"
                            onClick={generateInstagramCaption}
                            disabled={igLoading}
                        >
                            {igLoading ? "Generating caption…" : "Generate Instagram Caption"}
                        </Button>

                        <TextField
                            label="Instagram Caption"
                            multiline
                            fullWidth
                            rows={4}
                            value={igCaption}
                            onChange={(e) => setIgCaption(e.target.value)}
                        />

                        <Stack direction="row" justifyContent="flex-end">
                            <Button
                                variant="outlined"
                                color="secondary"
                                disabled={!igImage}
                                onClick={postToInstagram}
                            >
                                Post to Instagram
                            </Button>
                        </Stack>
                    </Stack>
                </CardContent>
            </Card>

            {/* SHOW VIDEO */}
            {status === "completed" && (
                <Card>
                    <CardContent>
                        <Typography variant="h6">Your Video</Typography>
                        <video controls width="600" src={videoUrl} style={{ marginTop: "10px" }} />
                    </CardContent>
                </Card>
            )}

            {/* SUCCESS POPUP */}
            <Dialog open={openPopup} onClose={() => setOpenPopup(false)}>
                <DialogTitle>🎉 Video Ready!</DialogTitle>
                <DialogContent>
                    <Typography sx={{ mb: 2 }}>
                        Your AI-generated marketing video is complete and ready to use!
                    </Typography>
                    <video controls width="100%" src={videoUrl} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenPopup(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
