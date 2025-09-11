const axios = require('axios');

// Test the video generation API
async function testVideoGeneration() {
    const baseURL = 'http://localhost:3000';
    
    // Mock business data
    const businessData = {
        name: "TechCorp Solutions",
        industry: "Technology",
        description: "AI-powered business automation platform",
        target_age_group: "25-45",
        target_gender: "All",
        target_location: "Global"
    };

    try {
        console.log('Testing video generation API...');
        console.log('Business data:', businessData);

        // Test script generation
        console.log('\n1. Testing script generation...');
        const scriptResponse = await axios.post(`${baseURL}/generate-script`, {
            businessData: businessData
        });
        
        if (scriptResponse.data.success) {
            console.log('✅ Script generation successful!');
            console.log('Generated script:', scriptResponse.data.script);
        } else {
            console.log('❌ Script generation failed');
        }

        // Test video generation
        console.log('\n2. Testing video generation...');
        const videoResponse = await axios.post(`${baseURL}/generate-video`, {
            businessData: businessData
        });
        
        if (videoResponse.data.success) {
            console.log('✅ Video generation started successfully!');
            console.log('Video ID:', videoResponse.data.videoId);
            console.log('Script:', videoResponse.data.script);
            
            // Test status check
            console.log('\n3. Testing video status check...');
            const statusResponse = await axios.get(`${baseURL}/video-status/${videoResponse.data.videoId}`);
            
            if (statusResponse.data.success) {
                console.log('✅ Status check successful!');
                console.log('Status:', statusResponse.data.status);
                if (statusResponse.data.videoUrl) {
                    console.log('Video URL:', statusResponse.data.videoUrl);
                }
            } else {
                console.log('❌ Status check failed');
            }
        } else {
            console.log('❌ Video generation failed');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

// Run the test
testVideoGeneration();
