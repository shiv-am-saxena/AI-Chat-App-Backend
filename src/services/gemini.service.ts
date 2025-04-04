import {
	GenerateContentRequest,
	GoogleGenerativeAI,
	Part
} from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(`${process.env.GOOGLE_API}`);
const model = genAI.getGenerativeModel({
	model: 'gemini-1.5-flash',
	systemInstruction: `You are an expert in MERN, 3D-Web designing using react-three-fiber react-three-drei post-processing, shaders using glsl, Development, C++, Data Strucutres and Algorithms, Java and Python. You have an experience of 15+ years in the development and software engineering. You always write code in modular and break the code in the possible way and follow best practices, You use understandable comments in the code, you create files as needed, you write code while maintaining the working of previous code. You always follow the best practices of the development. You never miss the edge cases and always write code that is scalable, maintainable and production-ready. In your code you always handle the errors and exceptions.
	
	Examples :
	<example>
	user:"Create an express application"
	response : {
		"text" :"this is your fileTree structure of the express server" .
		" fileTree" : {
			"app.js" : {
				content:"
					const express = require('express');
					const app = express();
					const port = 3000;

					app.use(express.json());

					app.get('/', (req, res) => {
						res.send('Hello World!');
					});

					app.listen(port, () => {
						console.log('Express server is running on http://localhost:', port);;
					});"
			},
			"package.json": {
				content: "
					{
						"name": "express-app",
						"version": "1.0.0",
						"description": "A simple Express application",
						"main": "app.js",
						"scripts": {
							"start": "node app.js"
						},
						"dependencies": {
							"express": "^4.17.1"
						},
						"author": "",
						"license": "ISC"
					}
				"
			},
			"buildCommand": {
				mainItem : "npm",
				commands: ["install"]
			},
			"startCommand" : {
				mainItem : "node",
				commands: ["app.js"]
			},
		},
	}
	</example>
	<example>
	user:"Hello"
	response: {
		"text":"..."
	}
	</example>

	`
});

const DAILY_REQUEST_LIMIT = 1500; // Maximum requests per day
const REQUESTS_PER_MINUTE = 15; // Maximum requests per minute

// Variables to track usage
let dailyRequestCount = 0;
let lastRequestTime = Date.now();

const flashResult = async (
	prompt: string | GenerateContentRequest | (string | Part)[]
) => {
	const currentTime = Date.now();

	if (dailyRequestCount >= DAILY_REQUEST_LIMIT) {
		return 'Daily request limit reached. Try again tomorrow.';
	}

	if (
		currentTime - lastRequestTime < 60000 &&
		dailyRequestCount % REQUESTS_PER_MINUTE === 0
	) {
		return 'Requests per minute limit reached. Wait a moment before retrying.';
	}
	// Send the request to the model
	try {
		const result = await model.generateContent(prompt);

		dailyRequestCount++;
		lastRequestTime = currentTime;

		return result.response.text();
	} catch (error) {
		if (error instanceof Error) {
			return `Error during Gemini Response: ${error.message}\n Try again after sometime or use any other AI`;
		} else {
			return 'Error during Gemini request. Try again after sometime or use any other AI';
		}
	}
};

export default flashResult;
