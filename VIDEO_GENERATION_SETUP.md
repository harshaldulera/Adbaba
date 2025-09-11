# HeyGen Video Generation Setup

This document explains how to set up and use the HeyGen video generation feature in your application.

## Features

- **AI Script Generation**: Uses Google Gemini AI to generate personalized marketing scripts based on business data
- **Video Generation**: Uses HeyGen API to create professional marketing videos with AI avatars
- **Real-time Status Updates**: Polls video generation status and displays progress
- **Video Management**: Download, share, and view generated videos

## Setup Instructions

### 1. Backend Setup (API)

1. Navigate to the `api` directory
2. Install dependencies:
   ```bash
   cd api
   npm install
   ```

3. Create a `.env` file in the `api` directory with your Gemini API key:
   ```
   GEMINI_API_KEY=your-actual-gemini-api-key-here
   PORT=3000
   ```
   
   **Note**: If you don't have a Gemini API key, the system will use a fallback script generator. However, for the best experience, we recommend getting a free Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey).

4. Start the backend server:
   ```bash
   npm start
   ```

### 2. Frontend Setup (React App)

1. Navigate to the `babaji` directory
2. Install dependencies:
   ```bash
   cd babaji
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## How It Works

### User Flow

1. **Upload Business Data**: User uploads a document or fills out the business form on the home page
2. **Navigate to Social**: User clicks "go showcial" button or "Go to Socials" from the funnel page
3. **Automatic Video Generation**: 
   - System generates a personalized script using Gemini AI based on business data
   - HeyGen API creates a video with an AI avatar speaking the script
   - Real-time status updates show generation progress
4. **Video Display**: Once complete, user can view, download, and share the generated video

### API Endpoints

- `POST /generate-video`: Starts video generation process
- `GET /video-status/:videoId`: Checks video generation status
- `POST /generate-script`: Generates script only (for testing)

### Key Components

- **Home Page**: Contains the "go showcial" button and business data form
- **Social Page**: Displays video generation progress and final video
- **Business Context**: Stores business data across the application
- **Video Generation API**: Handles HeyGen integration and script generation

## Configuration

### HeyGen API
- The HeyGen API key is already configured in the code
- Default avatar and voice settings are used
- Videos are generated in 1280x720 resolution

### Gemini AI
- Uses the `gemini-1.5-flash` model (updated from deprecated `gemini-pro`)
- Requires a valid Gemini API key in the `.env` file
- Generates 30-60 second marketing scripts
- Tailored to business industry, target audience, and location
- **Fallback**: If no API key is provided, uses a template-based script generator

## Troubleshooting

### Common Issues

1. **"No business data available"**: Make sure to fill out the business form on the home page first
2. **Video generation fails**: Check that the HeyGen API key is valid and the backend server is running
3. **Script generation fails**: 
   - Verify your Gemini API key is correct and has sufficient quota
   - The system will automatically fall back to a template-based script if Gemini API fails
   - Make sure you're using the correct model name (`gemini-1.5-flash`)
4. **"models/gemini-pro is not found"**: This error means you need to update to `gemini-1.5-flash` (already fixed in the code)

### Error Handling

- The system includes comprehensive error handling and user feedback
- Failed video generations can be retried
- Status updates are shown in real-time

## Customization

### Script Generation
Modify the prompt in `api/generateVideo.js` to change how scripts are generated:
```javascript
const prompt = `
Create an engaging 30-60 second marketing video script for a business...
`;
```

### Video Settings
Adjust video parameters in the `generateVideoWithHeyGen` function:
- Avatar selection
- Voice settings
- Background options
- Video dimensions

## Security Notes

- HeyGen API key is embedded in the code (consider moving to environment variables for production)
- Gemini API key should be kept secure and not committed to version control
- Consider implementing rate limiting for production use
