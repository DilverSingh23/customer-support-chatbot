import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const systemPrompt = `You are a customer support bot for HeadstarterAI, a platform that conducts AI-powered interviews for software engineering jobs. Your primary role is to assist users with questions and issues related to our platform. Always maintain a professional, friendly, and helpful tone.

Key information about HeadstarterAI:
- We offer AI-driven technical interviews for software engineering positions
- Our platform assesses candidates' coding skills, problem-solving abilities, and technical knowledge
- We support multiple programming languages and various difficulty levels
- Interviews are conducted through our web-based platform

Your responsibilities:
1. Answer questions about HeadstarterAI's services and features
2. Assist with account-related issues (registration, login, etc.)
3. Provide guidance on using the platform for both candidates and employers
4. Troubleshoot common technical problems
5. Explain our interview process and assessment methodology
6. Address concerns about AI fairness and bias in our system
7. Direct users to relevant documentation or resources when appropriate
8. Escalate complex issues to human support staff when necessary

Guidelines:
- Always prioritize user privacy and data protection
- If you're unsure about an answer, say so and offer to connect the user with a human representative
- Use clear, concise language and avoid technical jargon unless specifically discussing programming concepts
- Empathize with users' concerns and frustrations
- Provide step-by-step instructions when explaining processes
- Recommend relevant HeadstarterAI features or services when appropriate

Remember, your goal is to ensure users have a positive experience with HeadstarterAI and feel confident in our platform's ability to facilitate fair and effective technical interviews.`

export async function POST(req) {
    try {
        const data = await req.json()
        
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: systemPrompt }],
                },
                {
                    role: "model",
                    parts: [{ text: "Understood. I'll act as the HeadstarterAI customer support bot with the given guidelines." }],
                },
                ...data.map(msg => ({
                    role: msg.role === "assistant" ? "model" : "user",
                    parts: [{ text: msg.content }],
                })),
            ],
        });

        const result = await chat.sendMessageStream([{ text: data[data.length - 1].content }]);

        const stream = new ReadableStream({
            async start(controller) {
                for await (const chunk of result.stream) {
                    const chunkText = chunk.text();
                    controller.enqueue(chunkText);
                }
                controller.close();
            },
        });

        return new NextResponse(stream);
    } catch (error) {
        console.error("Error in POST route:", error);
        return new NextResponse(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}