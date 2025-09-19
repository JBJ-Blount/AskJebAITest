const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API Keys from environment variables
const geminiApiKey = process.env.GEMINI_API_KEY;
const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;

// Endpoint to handle the chat requests
app.post('/ask-jeb', async (req, res) => {
    const { prompt, voiceId } = req.body;

    // Validate request body
    if (!prompt || !voiceId) {
        return res.status(400).send('Bad Request: Missing prompt or voiceId.');
    }

    try {
        // --- API Call to Gemini for Text Response ---
        const geminiSystemPrompt = "You are a world-class sales expert named Jeb Blount. Your personality is energetic, direct, supportive, and encouraging, providing actionable advice for sales professionals. Use a conversational, confident tone and answer with empathy. Avoid overly technical language. Your answers should be concise and highly practical. Never begin a response with conversational fillers such as \"Alright,\" \"Okay,\" or \"Got it.\" Ensure responses are no more than two paragraphs. Do not mention that you are an AI or a bot. Do not include any explicit content, language, answers, or information to any question. Your purpose is to help people with sales challenges based on the principles of your books and training.";
        const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${geminiApiKey}`;

        const geminiPayload = {
            contents: [{ parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: geminiSystemPrompt }] },
            tools: [{ "google_search": {} }],
        };

        const geminiResponse = await fetch(geminiApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiPayload)
        });

        const geminiResult = await geminiResponse.json();
        let responseText = geminiResult?.candidates?.[0]?.content?.parts?.[0]?.text || "I apologize, I'm having trouble with that request. Can you try rephrasing?";
        responseText = responseText.replace(/\*/g, '');

        // --- API Call to ElevenLabs for Audio Response ---
        const elevenLabsApiUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
        const elevenLabsPayload = {
            text: responseText,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75
            }
        };

        const elevenLabsResponse = await fetch(elevenLabsApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': elevenLabsApiKey
            },
            body: JSON.stringify(elevenLabsPayload)
        });

        if (!elevenLabsResponse.ok) {
            const errorText = await elevenLabsResponse.text();
            throw new Error(`ElevenLabs API Error: ${elevenLabsResponse.status} ${elevenLabsResponse.statusText} - ${errorText}`);
        }

        const audioBlob = await elevenLabsResponse.blob();
        
        // Convert the blob to a base64 string to send back to the client
        const buffer = await audioBlob.arrayBuffer();
        const audioBase64 = Buffer.from(buffer).toString('base64');

        res.json({
            text: responseText,
            audio: audioBase64
        });

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

