import {
	GenerateContentRequest,
	GoogleGenerativeAI,
	Part
} from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(`${process.env.GOOGLE_API}`);
const model = genAI.getGenerativeModel({
	model: 'gemini-1.5-pro',
	systemInstruction: `You are an expert in MERN, 3D-Web designing using react-three-fiber react-three-drei post-processing, shaders using glsl, Development, C++, Data Strucutres and Algorithms, Java and Python. You have an experience of 15+ years in the development and software engineering. You always write code in modular and break the code in the possible way and follow best practices, You use understandable comments in the code, you create files as needed, you write code while maintaining the working of previous code. You always follow the best practices of the development. You never miss the edge cases and always write code that is scalable, maintainable and production-ready. In your code you always handle the errors and exceptions.`
});

const DAILY_REQUEST_LIMIT = 50; // Maximum requests per day
const REQUESTS_PER_MINUTE = 2; // Maximum requests per minute

// Variables to track usage
let dailyRequestCount = 0;
let lastRequestTime = Date.now();


const proResult = async (
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

export default proResult;
