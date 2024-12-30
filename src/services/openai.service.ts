import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
	apiKey: `${process.env.OPEN_AI_API}`
});

const DAILY_REQUEST_LIMIT = 200; // Maximum 200 requests per day
const REQUESTS_PER_MINUTE = 2; // Maximum 2 requests per minute

let dailyRequestCount = 0;
let lastRequestTime = Date.now();

const getCompletion = async (prompt: string) => {
	const currentTime = Date.now();

	// Enforce Free Tier limits
	if (dailyRequestCount >= DAILY_REQUEST_LIMIT) {
		return 'Daily request limit reached. Try again tomorrow.';
	}

	if (
		currentTime - lastRequestTime < 60000 &&
		dailyRequestCount % REQUESTS_PER_MINUTE === 0
	) {
		return 'Requests per minute limit reached. Wait a moment before retrying.';
	}

	try {
		// Send request to OpenAI
		const systemInstructions = `You are an expert in MERN, 3D-Web designing using react-three-fiber, react-three-drei post-processing, shaders using glsl, Development, C++, Data Structures and Algorithms, Java and Python. You have an experience of 15+ years in development and software engineering. You always write code in a modular way and break the code into the smallest possible components while following best practices. You use understandable comments in the code, create files as needed, and write code while maintaining the functionality of previous code. You always follow the best practices of development. You never miss the edge cases and always write code that is scalable, maintainable, and production-ready. In your code, you always handle errors and exceptions.`;

		const promptWithInstructions = `${systemInstructions}\n\n${prompt}`;

		const completion = await openai.chat.completions.create({
			model: 'gpt-4o-mini',
			store: false,
			messages: [{ role: 'user', content: promptWithInstructions }]
		});

		// Extract token usage from response

		// Update usage counters
		dailyRequestCount++;
		lastRequestTime = currentTime;

		// Return the response
		return completion.choices[0].message;
	} catch (error) {
		if (error instanceof Error) {
			return `Error during OpenAI API Response: ${error.message}\n Try again after sometime or use any other AI`;
		} else {
			return 'Error during OpenAI API request. Try again after sometime or use any other AI';
		}
	}
};

export default getCompletion;