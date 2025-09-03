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
import { useState } from "react";
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
    const { setBusinessId } = useBusinessContext();
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [businessId, setBusinessIdState] = useState(null); // State for business ID
    const { register, setValue, handleSubmit } = useForm(); // Initialize useForm

    const fetchBusinessData = async (id: any) => {
        const HASURA_GRAPHQL_URL = process.env.VITE_GRAPHQL_URL; // Replace with your Hasura GraphQL endpoint
        const HASURA_ADMINN_SECRET = process.env.HASURA_ADMIN_SECRET; // Your Hasura admin secret

        if (!HASURA_GRAPHQL_URL || !HASURA_ADMINN_SECRET) {
            throw new Error("Missing required environment variables");
        }

        const query = `
        query displayFormData($id: uuid!) {
          businesses(where: {id: {_eq: $id}}) {
            name
            industry
            description
            website
            founded_year
            hq_location
            business_size
            target_age_group
            target_gender
            customer_interests
            customer_behavior
            marketing_budget
            customer_acquisition_cost
            content_strategy
            target_location
          }
        }
      `;

        try {
            const response = await axios.post(
                HASURA_GRAPHQL_URL,
                {
                    query,
                    variables: { id },
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "x-hasura-admin-secret": HASURA_ADMINN_SECRET,
                    },
                }
            );

            return response.data.data.businesses[0]; // Return the first business data
        } catch (error) {
            console.error("Error fetching business data:", error);
            throw error;
        }
    };

    const handleFileUpload = async (event: any) => {
        const file = event.target.files?.[0];
        if (file) {
            const formData = new FormData();
            formData.append("doc", file);

            setLoading(true);
            setProgress(0);

            try {
                const response = await axios.post(
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

                // Simulate a 5-second loading time
                await new Promise((resolve) => setTimeout(resolve, 5000));
            } catch (error) {
                console.error("Error uploading file:", error);
            } finally {
                setLoading(false);
                setProgress(100);
            }
        }
    };
    const navigate = useNavigate();

    const handleContinue = (data: any) => {
        // Handle the continue action (e.g., navigate to the next step)
        console.log("Continue with data:", data);
        navigate("/funnel");
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 8 }}>
                <Stack spacing={4} alignItems="center" textAlign="center">
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