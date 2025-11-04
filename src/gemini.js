// Gemini API endpoint URL
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=AIzaSyBvTcjVHIlQNflnRFig3IUQ5WMEuWXT3nQ";

/**
 * Converts a File to Base64 string
 * @param {File} file - The file to convert
 * @returns {Promise<string>} - Base64 encoded string
 */
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
      const base64String = reader.result.split(",")[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Makes a request to the Gemini API with text or file
 * @param {string} prompt - The prompt to send to the API
 * @param {File|null} file - Optional file to include (PDF, image, etc.)
 * @param {string|null} mimeType - MIME type of the file (e.g., "application/pdf")
 * @returns {Promise<string>} - The generated text response
 */
async function callGeminiAPI(prompt, file = null, mimeType = null) {
  try {
    const parts = [];

    // If a file is provided, add it as inline_data
    if (file && mimeType) {
      const base64Data = await fileToBase64(file);
      parts.push({
        inline_data: {
          mime_type: mimeType,
          data: base64Data,
        },
      });
    }

    // Add the text prompt
    parts.push({
      text: prompt,
    });

    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: parts,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message ||
          `API request failed with status ${response.status}`
      );
    }

    const data = await response.json();

    // Extract the generated text from the response
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!generatedText) {
      throw new Error("No text generated in the API response");
    }

    return generatedText;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
}

/**
 * Generates a summary of the provided text or file using Gemini API
 * @param {string|null} text - The text content to summarize (optional if file is provided)
 * @param {File|null} file - The file to summarize (optional if text is provided)
 * @param {string|null} mimeType - MIME type of the file (required if file is provided)
 * @returns {Promise<string>} - The summarized text with technical terms marked
 */
export async function generateSummary(
  text = null,
  file = null,
  mimeType = null
) {
  try {
    // Create the prompt for summarization
    let prompt = "";

    if (file && mimeType) {
      // For file uploads, the file is sent as inline_data
      prompt = `Summarize the following document in simple English. Make sure to keep the summary clear and easy to understand.

For any complicated or technical words that might be difficult for readers, mark them with the format [COMPLEX:word] where "word" is the complicated word.

Summary:`;
    } else if (text) {
      // For text input
      prompt = `Summarize the following text in simple English. Make sure to keep the summary clear and easy to understand.

For any complicated or technical words that might be difficult for readers, mark them with the format [COMPLEX:word] where "word" is the complicated word.

Text:
${text}

Summary:`;
    } else {
      throw new Error("Either text or file must be provided");
    }

    // Generate the summary
    const summary = await callGeminiAPI(prompt, file, mimeType);
    return summary;
  } catch (error) {
    console.error("Error generating summary:", error);
    throw new Error(
      error.message ||
        "Failed to generate summary. Please check your API key and try again."
    );
  }
}

/**
 * Gets the definition of a word using Gemini API
 * @param {string} word - The word to define
 * @returns {Promise<string>} - The definition of the word
 */
export async function getWordDefinition(word) {
  try {
    const prompt = `Provide a clear, simple definition for the word "${word}". Explain what it means in easy-to-understand language. Keep it concise (1-2 sentences).

Definition:`;

    const definition = await callGeminiAPI(prompt);
    return definition;
  } catch (error) {
    console.error("Error getting word definition:", error);
    throw new Error(
      error.message || "Failed to get word definition. Please try again."
    );
  }
}

/**
 * Answers a question based on the provided summary
 * @param {string} summary - The summary text to use as context
 * @param {string} question - The user's question
 * @returns {Promise<string>} - The answer to the question
 */
export async function answerQuestion(summary, question) {
  try {
    // Create the prompt for Q&A
    const prompt = `Based on the following summary, answer the user's question clearly and concisely.

Summary:
${summary}

User's Question: ${question}

Answer:`;

    // Generate the answer
    const answer = await callGeminiAPI(prompt);
    return answer;
  } catch (error) {
    console.error("Error answering question:", error);
    throw new Error(
      error.message ||
        "Failed to answer question. Please check your API key and try again."
    );
  }
}
