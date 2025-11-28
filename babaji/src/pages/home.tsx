import {
    Box,
    Typography,
    Button,
    Container,
    Stack,
    Paper,
    LinearProgress,
    TextField,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { styled } from "@mui/material/styles";
import axios from "axios";
import { useBusinessContext } from "../context/BusinessContext";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

// Styled component for the upload button
const VisuallyHiddenInput = styled("input")({
    clip: "rect(0 0 0 0)",
    clipPath: "inset(50%)",
    height: 1,
    overflow: "hidden",
    position: "absolute",
    bottom: 0,
    left: 0,
    whiteSpace: "nowrap",
    width: 1,
});

export default function Home() {
    const { setBusinessId, setBusinessData, preFetchFunnel } = useBusinessContext();
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [businessId, setBusinessIdState] = useState(null); // State for business ID
    const { register, setValue, handleSubmit, watch } = useForm(); // Initialize useForm
    const [showcialLoading, setShowcialLoading] = useState(false);
    const [showcialError, setShowcialError] = useState("");
    const [showcialVideoUrl, setShowcialVideoUrl] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState("");
    
    const navigate = useNavigate();

    // Handler for 'go showcial' button
    const handleGoShowcial = async () => {
        setShowcialLoading(true);
        setShowcialError("");
        setShowcialVideoUrl(null);
        try {
            // Navigate to social page where video generation will happen
            navigate("/socials");
        } catch (err: any) {
            setShowcialError("Failed to navigate to video generation. Please try again.");
        } finally {
            setShowcialLoading(false);
        }
    };

    const handleFileUpload = async (event: any) => {
        const file = event.target.files?.[0];
        if (file) {
            const formData = new FormData();
            formData.append("doc", file);

            setLoading(true);
            setProgress(0);
            setUploadError("");

            try {
                const response = await axios.post(
                    // "https://adbaba.onrender.com/process-document",
                    "http://localhost:3000/process-document",
                    formData,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data",
                        },
                        onUploadProgress: (progressEvent) => {
                            const totalN = progressEvent.total;
                            const current = progressEvent.loaded;

                            // Check if totalN is defined before calculating percentCompleted
                            if (totalN !== undefined) {
                                const percentCompleted = Math.round((current * 100) / totalN);
                                setProgress(percentCompleted);
                            }
                        },
                    }
                );

                const { businessId, response: businessData } = response.data;
                setBusinessIdState(businessId);
                setBusinessId(businessId);

                // Pre-fill the form fields with the retrieved data
                Object.entries(businessData).forEach(([key, value]) => {
                    // Handle array and object values by converting them to strings
                    if (Array.isArray(value)) {
                        setValue(key, value.join(", "));
                    } else if (typeof value === "object" && value !== null) {
                        setValue(key, JSON.stringify(value));
                    } else {
                        setValue(key, value);
                    }
                });

                // Trigger speculative pre-fetch immediately with the new data
                preFetchFunnel(businessData);

                // Simulate a 5-second loading time
                await new Promise((resolve) => setTimeout(resolve, 5000));
            } catch (error: any) {
                console.error("Error uploading file:", error);
                setUploadError(error.response?.data?.error || "An error occurred during upload. Please try again.");
            } finally {
                setLoading(false);
                setProgress(100);
            }
        }
    };

    const handleContinue = (data: any) => {
        // Store business data in context
        setBusinessData(data);
        // Handle the continue action (e.g., navigate to the next step)
        console.log("Continue with data:", data);
        navigate("/funnel");
    };

    // Watch for form changes and trigger speculative pre-fetch
    useEffect(() => {
        const subscription = watch((value, { name, type }) => {
            if (type === 'change') {
                const handler = setTimeout(() => {
                    console.log("Form changed, triggering pre-fetch...", value);
                    preFetchFunnel(value as any);
                }, 2000); // 2 second debounce

                return () => clearTimeout(handler);
            }
        });
        return () => subscription.unsubscribe();
    }, [watch, preFetchFunnel]);

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 8 }}>
                <Stack spacing={4} alignItems="center" textAlign="center">
                    {/* go showcial button and video display */}
                    {/* <Button
                        variant="contained"
                        color="secondary"
                        onClick={handleGoShowcial}
                        disabled={showcialLoading}
                        sx={{ mt: 2 }}
                    >
                        {showcialLoading ? "Generating Video..." : "go showcial"}
                    </Button> */}
                    {showcialError && (
                        <Typography color="error" sx={{ mt: 1 }}>{showcialError}</Typography>
                    )}
                    {showcialVideoUrl && (
                        <Box sx={{ mt: 2 }}>
                            <video src={showcialVideoUrl} controls width="400" />
                        </Box>
                    )}
                    <Typography variant="h2" component="h1" fontWeight="bold">
                        AI-Powered Marketing Automation
                    </Typography>

                    <Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
                        Optimize your digital marketing campaigns with our intelligent
                        multi-agent system
                    </Typography>

                    {!loading ? (
                        <Button
                            component="label"
                            variant="contained"
                            size="large"
                            startIcon={<CloudUploadIcon />}
                            sx={{ mb: 4 }}
                        >
                            Upload Campaign Data
                            <VisuallyHiddenInput type="file" onChange={handleFileUpload} />
                        </Button>
                    ) : (
                        <Box sx={{ width: "100%", mt: 4 }}>
                            <LinearProgress color="primary" value={progress} />
                        </Box>
                    )}

                    {uploadError && (
                        <Typography color="error" sx={{ mt: 2 }}>
                            {uploadError}
                        </Typography>
                    )}

                    {/* Update the form section to include all available fields */}
                    {businessId && (
                        <Box sx={{ mt: 4, width: "100%" }}>
                            <Stack
                                spacing={2}
                                component="form"
                                onSubmit={handleSubmit(handleContinue)}
                            />
                            <Stack
                                spacing={2}
                                component="form"
                                onSubmit={handleSubmit(handleContinue)}
                            >
                                <TextField
                                    label="Company Name"
                                    {...register("name")}
                                    fullWidth
                                />
                                <TextField
                                    label="Industry"
                                    {...register("industry")}
                                    fullWidth
                                />
                                <TextField
                                    label="Description"
                                    {...register("description")}
                                    fullWidth
                                    multiline
                                    rows={4}
                                />
                                <TextField label="Website" {...register("website")} fullWidth />
                                <TextField
                                    label="Founded Year"
                                    {...register("founded_year")}
                                    fullWidth
                                />
                                <TextField
                                    label="Headquarters Location"
                                    {...register("hq_location")}
                                    fullWidth
                                />
                                <TextField
                                    label="Business Size"
                                    {...register("business_size")}
                                    fullWidth
                                />
                                <TextField
                                    label="Target Age Group"
                                    {...register("target_age_group")}
                                    fullWidth
                                />
                                <TextField
                                    label="Target Gender"
                                    {...register("target_gender")}
                                    fullWidth
                                />
                                <TextField
                                    label="Customer Interests"
                                    {...register("customer_interests")}
                                    fullWidth
                                />
                                <TextField
                                    label="Customer Behavior"
                                    {...register("customer_behavior")}
                                    fullWidth
                                    multiline
                                    rows={4}
                                />
                                <TextField
                                    label="Marketing Budget"
                                    {...register("marketing_budget")}
                                    fullWidth
                                />
                                <TextField
                                    label="Customer Acquisition Cost"
                                    {...register("customer_acquisition_cost")}
                                    fullWidth
                                />
                                <TextField
                                    label="Content Strategy"
                                    {...register("content_strategy")}
                                    fullWidth
                                />
                                <TextField
                                    label="Target Location"
                                    {...register("target_location")}
                                    fullWidth
                                />
                                <Button variant="contained" color="primary" type="submit">
                                    Continue
                                </Button>
                            </Stack>
                        </Box>
                    )}
                </Stack>

                {/* Features Section */}
                <Box sx={{ mt: 8 }}>
                    <Grid container spacing={3}>
                        {features.map((feature, index) => (
                            <Grid key={index} size={{ xs: 12, md: 4 }}>
                                <Paper elevation={2} sx={{ p: 3, height: "100%" }}>
                                    <Typography variant="h6" gutterBottom>
                                        {feature.title}
                                    </Typography>
                                    <Typography color="text.secondary">
                                        {feature.description}
                                    </Typography>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </Box>
        </Container>
    );
}

const features = [
    {
        title: "Intelligent Campaign Optimization",
        description:
            "Our AI agents analyze customer behavior and market trends to automatically optimize your marketing campaigns.",
    },
    {
        title: "Smart Budget Allocation",
        description:
            "Maximize ROI with intelligent budget distribution across different marketing channels and campaigns.",
    },
    {
        title: "Personalized Marketing Strategies",
        description:
            "Create targeted campaigns with AI-driven insights for better customer engagement and conversion rates.",
    },
];