import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch'; // Required for fetch in Node.js

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Main route for the widget's API calls
app.post('/api/chat', async (req, res) => {
    const { userInput, isVoiceEnabled } = req.body;

    // Retrieve API keys securely from environment variables
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const VOICE_ID = = process.env.VOICE_ID;

    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;
    const geminiSystemPrompt = "You are a world-class sales expert named Jeb Blount. Your personality is energetic, direct, supportive, and encouraging, providing actionable advice for sales professionals. Use a conversational, confident tone and answer with empathy. Avoid overly technical language. Your answers should be concise and highly practical. Never begin a response with conversational fillers such as \"Alright,\" \"Okay,\" or \"Got it.\" Ensure responses are no more than two paragraphs. Do not mention that you are an AI or a bot. Do not include any explicit content, language, answers, or information to any question. Your purpose is to help people with sales challenges based on the principles of your books and training. Conclude each response with a question that encourages further conversation on the current sales topic. If the user's query is not related to business or sales, gently redirect the conversation back to the topic of sales challenges or strategies.";

    const geminiPayload = {
        contents: [{
            parts: [{ text: userInput }]
        }],
        systemInstruction: {
            parts: [{ text: geminiSystemPrompt }]
        },
        tools: [{ "google_search": {} }],
    };

    try {
        // Step 1: Call Gemini for the text response
        const geminiResponse = await fetch(geminiApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiPayload)
        });

        if (!geminiResponse.ok) {
            console.error('Gemini API Error:', geminiResponse.status, await geminiResponse.text());
            return res.status(500).json({ error: "Failed to get response from Gemini." });
        }

        const geminiResult = await geminiResponse.json();
        let responseText = geminiResult?.candidates?.[0]?.content?.parts?.[0]?.text || "I apologize, I'm having trouble with that request. Can you try rephrasing?";
        responseText = responseText.replace(/\*/g, '');

        let audioBase64 = null;
        if (isVoiceEnabled) {
            // Step 2: Call ElevenLabs for the voice response
            const elevenLabsApiUrl = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;
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
                    'xi-api-key': ELEVENLABS_API_KEY
                },
                body: JSON.stringify(elevenLabsPayload)
            });

            if (elevenLabsResponse.ok) {
                const audioBlob = await elevenLabsResponse.blob();
                const arrayBuffer = await audioBlob.arrayBuffer();
                audioBase64 = Buffer.from(arrayBuffer).toString('base64');
            } else {
                console.error('ElevenLabs API Error:', elevenLabsResponse.status, await elevenLabsResponse.text());
                // Don't fail the entire request, just don't send audio
            }
        }
        
        res.json({ text: responseText, audio: `data:audio/mpeg;base64,${audioBase64}` });

    } catch (error) {
        console.error('Server-side error:', error);
        res.status(500).json({ error: "An unexpected server error occurred." });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
