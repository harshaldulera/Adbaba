import { Image, ThumbDown, ThumbUp } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  LinearProgress,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import axios from "axios";
import { enqueueSnackbar } from "notistack";
import { useEffect, useState } from "react";
import { useBusinessContext } from "../context/BusinessContext";

interface Tweet {
  id: number;
  content: string;
  hasMedia: boolean;
  editable?: boolean;
}

export default function Socials() {
  const { businessId } = useBusinessContext();
  const [prompt, setPrompt] = useState("");
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(false);
  const [businessData, setBusinessData] = useState<any>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingTweetId, setPendingTweetId] = useState<number | null>(null);

  useEffect(() => {
    // Example: fetch business data from backend or context
    setBusinessData({ name: "Nike", product: "Shoes" });
  }, [businessId]);

  useEffect(() => {
    if (businessData && Object.keys(businessData).length > 0) {
      // Generate tweet on first load with businessData only
      const generateInitialTweet = async () => {
        setLoading(true);
        try {
          const response = await axios.post(
            `http://localhost:3000/generate-tweet-api`,
            {
              businessData,
              hasMedia: false,
            },
            { timeout: 100000 }
          );
          const content =
            (response?.data?.tweetText?.tweetContent as string | undefined) ||
            "(no content)";
          const newTweet: Tweet = {
            id: 1,
            content,
            hasMedia: false,
            editable: false,
          };
          setTweets([newTweet]);
        } catch (error) {
          console.error("Error generating initial tweet:", error);
          enqueueSnackbar("Failed to generate initial tweet", {
            variant: "error",
          });
        } finally {
          setLoading(false);
        }
      };
      generateInitialTweet();
    }
  }, [businessData]);

  const generateNewSuggestion = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const response = await axios.post(
        `http://localhost:3000/generate-tweet-api`,
        {
          businessData: { ...businessData, prompt },
          hasMedia: false,
        },
        { timeout: 100000 }
      );
      const content =
        (response?.data?.tweetText?.tweetContent as string | undefined) ||
        "(no content)";
      const newTweet: Tweet = {
        id: tweets.length + 1,
        content,
        hasMedia: false,
        editable: false,
      };
      setTweets((prev) => [...prev, newTweet]);
      setPrompt("");
    } catch (error) {
      console.error("Error generating new suggestion:", error);
      enqueueSnackbar("Failed to generate suggestion", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = (id: number) => {
    setPendingTweetId(id);
    setConfirmOpen(true);
  };

  const handleConfirmSend = async () => {
    if (pendingTweetId == null) return;
    try {
      const tweet = tweets.find((tweet) => tweet.id === pendingTweetId);
      if (!tweet) return;
      // Use only tweet content, no media
      await axios.post("http://localhost:3000/post-tweet", {
        tweetText: tweet.content,
      });
      enqueueSnackbar("Tweet accepted and posted!", { variant: "success" });
      setTweets((prev) => prev.filter((t) => t.id !== pendingTweetId));
    } catch (error) {
      console.error("Error accepting tweet:", error);
      enqueueSnackbar("Failed to post tweet", { variant: "error" });
    } finally {
      setConfirmOpen(false);
      setPendingTweetId(null);
    }
  };

  const handleCancelSend = () => {
    setConfirmOpen(false);
    setPendingTweetId(null);
  };

  const handleEdit = (id: number) => {
    setTweets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, editable: true } : t))
    );
  };

  const handleSaveEdit = (id: number, newContent: string) => {
    setTweets((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, content: newContent, editable: false } : t
      )
    );
  };

  const handleReject = (id: number) => {
    setTweets((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div style={{ maxWidth: "80vw", margin: "auto", padding: "16px" }}>
      <div style={{ marginBottom: "24px", display: "flex", gap: "8px" }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Enter prompt for new suggestion"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <Button
          variant="contained"
          onClick={generateNewSuggestion}
          disabled={!prompt.trim()}
        >
          Generate
        </Button>
      </div>
      {loading && (
        <Box
          sx={{
            width: "100%",
            height: "50vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography variant="h6" align="center" gutterBottom>
              Social Media Agent Generating Tweets...
            </Typography>
            <LinearProgress />
          </Box>
        </Box>
      )}
      <div style={{ display: "grid", gap: "16px" }}>
        {tweets.map((tweet) => (
          <Card
            key={tweet.id}
            style={{ display: "flex", flexDirection: "column" }}
          >
            <CardContent style={{ flexGrow: 1 }}>
              {tweet.editable ? (
                <>
                  <TextField
                    fullWidth
                    multiline
                    value={tweet.content}
                    onChange={(e) => handleSaveEdit(tweet.id, e.target.value)}
                    variant="outlined"
                    sx={{ marginBottom: 2 }}
                  />
                  <Button
                    variant="contained"
                    onClick={() => handleSaveEdit(tweet.id, tweet.content)}
                  >
                    Save
                  </Button>
                </>
              ) : (
                <>
                  <p style={{ fontSize: "16px", marginBottom: "16px" }}>
                    {tweet.content}
                  </p>
                  <Button
                    variant="text"
                    onClick={() => handleEdit(tweet.id)}
                    sx={{ marginBottom: 1 }}
                  >
                    Modify
                  </Button>
                </>
              )}
              {tweet.hasMedia && (
                <div
                  style={{
                    backgroundColor: "#f0f0f0",
                    height: "150px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "8px",
                  }}
                >
                  <Image style={{ fontSize: "48px", color: "#bbb" }} />
                </div>
              )}
            </CardContent>
            <CardActions style={{ justifyContent: "space-between" }}>
              <Button
                onClick={() => handleAccept(tweet.id)}
                variant="outlined"
                startIcon={<ThumbUp />}
                disabled={tweet.editable}
              >
                Accept
              </Button>
              <Button
                onClick={() => handleReject(tweet.id)}
                variant="outlined"
                startIcon={<ThumbDown />}
              >
                Reject
              </Button>
            </CardActions>
          </Card>
        ))}
      </div>
      <Dialog open={confirmOpen} onClose={handleCancelSend}>
        <DialogTitle>Confirm Tweet</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to send this tweet?
          </DialogContentText>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1">
              {pendingTweetId != null &&
                tweets.find((t) => t.id === pendingTweetId)?.content}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelSend}>Cancel</Button>
          <Button
            onClick={handleConfirmSend}
            variant="contained"
            color="primary"
          >
            Send Tweet
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
