import { useState, useEffect } from "react";
import { generateSummary, answerQuestion, getWordDefinition } from "./gemini";

function App() {
  const [inputText, setInputText] = useState("");
  const [summary, setSummary] = useState("");
  const [question, setQuestion] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [clickedWord, setClickedWord] = useState(null);
  const [wordDefinition, setWordDefinition] = useState("");
  const [isLoadingDefinition, setIsLoadingDefinition] = useState(false);
  const [definitionPosition, setDefinitionPosition] = useState({ x: 0, y: 0 });

  // Close definition popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        clickedWord &&
        !event.target.closest(".word-definition-popup") &&
        !event.target.closest(".complex-word")
      ) {
        setClickedWord(null);
        setWordDefinition("");
      }
    };

    if (clickedWord) {
      document.addEventListener("click", handleClickOutside);
      return () => {
        document.removeEventListener("click", handleClickOutside);
      };
    }
  }, [clickedWord]);

  /**
   * Handles the summary generation when user clicks "Generate Summary"
   */
  const handleGenerateSummary = async () => {
    // Check if we have a file or text input
    const isPDF =
      selectedFile &&
      (selectedFile.type === "application/pdf" ||
        selectedFile.name.toLowerCase().endsWith(".pdf"));

    if (!inputText.trim() && !isPDF) {
      setError("Please enter some text or upload a file to summarize.");
      return;
    }

    setIsGeneratingSummary(true);
    setError("");
    setSummary("");
    setChatMessages([]); // Clear chat messages when generating new summary

    try {
      let result;
      if (isPDF) {
        // Send PDF file directly to API
        result = await generateSummary(null, selectedFile, "application/pdf");
      } else {
        // Send text to API
        result = await generateSummary(inputText);
      }
      setSummary(result);
    } catch (err) {
      setError(
        err.message || "Failed to generate summary. Please check your API key."
      );
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  /**
   * Handles the question answering when user clicks "Ask"
   */
  const handleAskQuestion = async () => {
    if (!question.trim()) {
      setError("Please enter a question.");
      return;
    }

    if (!summary) {
      setError("Please generate a summary first.");
      return;
    }

    const userQuestion = question.trim();
    // Add user question to chat
    setChatMessages((prev) => [
      ...prev,
      { type: "user", content: userQuestion, id: Date.now() },
    ]);
    setQuestion("");
    setIsAnswering(true);
    setError("");

    try {
      const result = await answerQuestion(summary, userQuestion);
      // Add AI answer to chat
      setChatMessages((prev) => [
        ...prev,
        { type: "assistant", content: result, id: Date.now() + 1 },
      ]);
    } catch (err) {
      setError(
        err.message || "Failed to answer question. Please check your API key."
      );
      // Add error message to chat
      setChatMessages((prev) => [
        ...prev,
        {
          type: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          id: Date.now() + 1,
        },
      ]);
    } finally {
      setIsAnswering(false);
    }
  };

  /**
   * Handles file selection and reads text content
   */
  const handleFileSelect = async (file) => {
    if (!file) return;

    // Check if file is a text file or PDF
    const validTypes = [
      "text/plain",
      "text/markdown",
      "text/html",
      "application/json",
      "text/csv",
      "application/pdf",
    ];

    const validExtensions = [".txt", ".md", ".json", ".csv", ".html", ".pdf"];

    if (
      !validTypes.includes(file.type) &&
      !validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
    ) {
      setError(
        "Please select a text file (.txt, .md, .json, .csv, .html) or PDF file (.pdf) or paste your text directly."
      );
      return;
    }

    setSelectedFile(file);
    setError("");
    setInputText(""); // Clear previous text
    setIsProcessingFile(true); // Show loading state for file processing

    try {
      // Check if it's a PDF file
      if (
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf")
      ) {
        // For PDF files, we'll send them directly to the API
        // No need to extract text - just store the file
        setIsProcessingFile(false);
      } else {
        // Read text file content
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target.result;
          setInputText(content);
          setIsProcessingFile(false);
        };
        reader.onerror = () => {
          setError("Failed to read file. Please try again.");
          setIsProcessingFile(false);
        };
        reader.readAsText(file);
        // For text files, don't set isProcessingFile to false here since it's async
        return;
      }
    } catch (err) {
      setError(err.message || "Failed to process file. Please try again.");
      setSelectedFile(null);
      setIsProcessingFile(false);
    }
  };

  /**
   * Handles file input change
   */
  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  /**
   * Handles drag and drop events
   */
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  /**
   * Clears the selected file
   */
  const handleClearFile = () => {
    setSelectedFile(null);
    setInputText("");
  };

  /**
   * Handles clicking on a complicated word to show its definition
   */
  const handleWordClick = async (word, event) => {
    // Prevent event bubbling
    event.preventDefault();
    event.stopPropagation();

    // Get click position for popup placement
    const rect = event.currentTarget.getBoundingClientRect();
    setDefinitionPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });

    // If same word is clicked, toggle the definition popup
    if (clickedWord === word && wordDefinition) {
      setClickedWord(null);
      setWordDefinition("");
      return;
    }

    setClickedWord(word);
    setWordDefinition("");
    setIsLoadingDefinition(true);

    try {
      const definition = await getWordDefinition(word);
      setWordDefinition(definition);
    } catch (err) {
      setWordDefinition("Failed to load definition. Please try again.");
    } finally {
      setIsLoadingDefinition(false);
    }
  };

  /**
   * Closes the definition popup
   */
  const closeDefinition = () => {
    setClickedWord(null);
    setWordDefinition("");
  };

  /**
   * Parses markdown bold (**text**) and returns an array of parts
   */
  const parseMarkdownBold = (text) => {
    const boldRegex = /\*\*([^*]+)\*\*/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          content: text.substring(lastIndex, match.index),
        });
      }

      // Add the bold text
      parts.push({
        type: "bold",
        content: match[1],
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: "text",
        content: text.substring(lastIndex),
      });
    }

    return parts.length > 0 ? parts : [{ type: "text", content: text }];
  };

  /**
   * Renders a text segment that may contain markdown bold
   */
  const renderTextWithMarkdown = (text) => {
    const parts = parseMarkdownBold(text);
    return (
      <>
        {parts.map((part, index) => {
          if (part.type === "bold") {
            return (
              <strong key={index} className="font-bold">
                {part.content}
              </strong>
            );
          }
          return <span key={index}>{part.content}</span>;
        })}
      </>
    );
  };

  /**
   * Parses markdown lists and converts them to HTML
   */
  const parseMarkdownLists = (text) => {
    const lines = text.split("\n");
    const result = [];
    let currentList = [];
    let currentParagraph = [];

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        result.push({
          type: "paragraph",
          content: currentParagraph.join("\n"),
        });
        currentParagraph = [];
      }
    };

    const flushList = () => {
      if (currentList.length > 0) {
        result.push({
          type: "list",
          items: currentList,
        });
        currentList = [];
      }
    };

    for (const line of lines) {
      // Check if line is a bullet point (starts with * or - followed by space)
      const bulletMatch = line.match(/^[\s]*[-*]\s+(.+)$/);
      if (bulletMatch) {
        // If we have a paragraph, flush it first
        flushParagraph();
        // Add the bullet item (remove the leading spaces, *, and single space)
        currentList.push(bulletMatch[1].trim());
      } else {
        // If we have a list, flush it first
        flushList();
        // Add line to paragraph
        if (line.trim() || currentParagraph.length > 0) {
          currentParagraph.push(line);
        }
      }
    }

    // Flush any remaining content
    flushParagraph();
    flushList();

    return result.length > 0 ? result : [{ type: "paragraph", content: text }];
  };

  /**
   * Renders the summary text with complicated words styled and clickable
   */
  const renderSummary = (text) => {
    if (!text) return "";

    // First, parse markdown lists (bullet points)
    const listParts = parseMarkdownLists(text);

    return (
      <>
        {listParts.map((part, partIndex) => {
          if (part.type === "list") {
            // Render list items
            return (
              <ul
                key={partIndex}
                className="list-disc list-inside mb-2 space-y-1 ml-4"
              >
                {part.items.map((item, itemIndex) => {
                  // Parse complex words in list items
                  const complexWordRegex = /\[COMPLEX:([^\]]+)\]/g;
                  const itemParts = [];
                  let lastIndex = 0;
                  let match;

                  while ((match = complexWordRegex.exec(item)) !== null) {
                    if (match.index > lastIndex) {
                      itemParts.push({
                        type: "text",
                        content: item.substring(lastIndex, match.index),
                      });
                    }
                    itemParts.push({
                      type: "complex",
                      content: match[1],
                    });
                    lastIndex = match.index + match[0].length;
                  }

                  if (lastIndex < item.length) {
                    itemParts.push({
                      type: "text",
                      content: item.substring(lastIndex),
                    });
                  }

                  const finalItemParts =
                    itemParts.length > 0
                      ? itemParts
                      : [{ type: "text", content: item }];

                  return (
                    <li key={itemIndex} className="text-gray-300">
                      {finalItemParts.map((segment, segIndex) => {
                        if (segment.type === "complex") {
                          return (
                            <span
                              key={segIndex}
                              onClick={(e) =>
                                handleWordClick(segment.content, e)
                              }
                              className="complex-word font-bold bg-yellow-400/20 text-yellow-300 px-1.5 py-0.5 rounded cursor-pointer hover:bg-yellow-400/30 transition-all relative border border-yellow-500/30"
                              style={{ textDecoration: "none" }}
                            >
                              {segment.content}
                            </span>
                          );
                        }
                        return (
                          <span key={segIndex}>
                            {renderTextWithMarkdown(segment.content)}
                          </span>
                        );
                      })}
                    </li>
                  );
                })}
              </ul>
            );
          }

          // For paragraphs, parse complex words
          const complexWordRegex = /\[COMPLEX:([^\]]+)\]/g;
          const parts = [];
          let lastIndex = 0;
          let match;

          while ((match = complexWordRegex.exec(part.content)) !== null) {
            if (match.index > lastIndex) {
              parts.push({
                type: "text",
                content: part.content.substring(lastIndex, match.index),
              });
            }
            parts.push({
              type: "complex",
              content: match[1],
            });
            lastIndex = match.index + match[0].length;
          }

          if (lastIndex < part.content.length) {
            parts.push({
              type: "text",
              content: part.content.substring(lastIndex),
            });
          }

          const finalParts =
            parts.length > 0
              ? parts
              : [{ type: "text", content: part.content }];

          return (
            <div key={partIndex} className="mb-2">
              {finalParts.map((segment, segIndex) => {
                if (segment.type === "complex") {
                  return (
                    <span
                      key={segIndex}
                      onClick={(e) => handleWordClick(segment.content, e)}
                      className="complex-word font-bold bg-yellow-400/20 text-yellow-300 px-1.5 py-0.5 rounded cursor-pointer hover:bg-yellow-400/30 transition-all relative border border-yellow-500/30"
                      style={{ textDecoration: "none" }}
                    >
                      {segment.content}
                    </span>
                  );
                }
                return (
                  <span key={segIndex}>
                    {renderTextWithMarkdown(segment.content)}
                  </span>
                );
              })}
            </div>
          );
        })}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-3 animate-slide-down">
            📄 DocInsight
          </h1>
          <p className="text-gray-300 text-lg animate-fade-in-delay">
            AI-Powered Document Summarization & Question Answering
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/30 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg mb-4 animate-slide-down backdrop-blur-sm">
            {error}
          </div>
        )}

        {/* Input Section */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-2xl p-6 mb-6 border border-gray-700/50 animate-fade-in-up">
          <label
            htmlFor="input-text"
            className="block text-sm font-medium text-gray-300 mb-3"
          >
            Upload a file or paste your document text:
          </label>

          {/* File Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-6 mb-4 text-center transition-all duration-300 ${
              isDragging
                ? "border-purple-500 bg-purple-500/10 scale-105"
                : "border-gray-600 bg-gray-900/30 hover:border-purple-400/50"
            }`}
          >
            <input
              type="file"
              id="file-input"
              accept=".txt,.md,.json,.csv,.html,.pdf,text/plain,text/markdown,application/json,text/csv,text/html,application/pdf"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <label
              htmlFor="file-input"
              className="cursor-pointer flex flex-col items-center"
            >
              <svg
                className="w-12 h-12 text-purple-400 mb-2 transition-transform hover:scale-110"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-gray-300 mb-1">
                <span className="text-purple-400 font-semibold">
                  Click to upload
                </span>{" "}
                or drag and drop
              </p>
              <p className="text-sm text-gray-400">
                Text files or PDF (.txt, .md, .json, .csv, .html, .pdf)
              </p>
            </label>
          </div>

          {/* Selected File Display */}
          {selectedFile && (
            <div className="mb-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg flex items-center justify-between animate-slide-down">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-purple-400 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="text-sm font-medium text-gray-200">
                  {selectedFile.name}
                </span>
                <span className="text-xs text-gray-400 ml-2">
                  ({(selectedFile.size / 1024).toFixed(2)} KB)
                </span>
                {isProcessingFile && (
                  <span className="ml-3 text-xs text-purple-400 flex items-center">
                    <svg
                      className="animate-spin h-4 w-4 mr-1"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </span>
                )}
              </div>
              <button
                onClick={handleClearFile}
                disabled={isProcessingFile}
                className="text-red-400 hover:text-red-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Remove
              </button>
            </div>
          )}

          {/* Divider */}
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-gray-800/50 text-gray-400">OR</span>
            </div>
          </div>

          {/* Textarea */}
          <textarea
            id="input-text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your document content here... (e.g., research papers, articles, technical documents)"
            className="w-full h-48 p-4 bg-gray-900/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none text-gray-200 placeholder-gray-500 transition-all"
          />
          <button
            onClick={handleGenerateSummary}
            disabled={
              isGeneratingSummary ||
              (!inputText.trim() &&
                !(
                  selectedFile &&
                  (selectedFile.type === "application/pdf" ||
                    selectedFile.name.toLowerCase().endsWith(".pdf"))
                ))
            }
            className="mt-4 w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 disabled:bg-gray-700 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-purple-500/50 transform hover:scale-[1.02] disabled:hover:scale-100"
          >
            {isGeneratingSummary ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Generating Summary...
              </>
            ) : (
              "Generate Summary"
            )}
          </button>
        </div>

        {/* Summary Section */}
        {summary && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-2xl p-6 mb-6 relative border border-gray-700/50 animate-fade-in-up">
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-4">
              📝 Summary
            </h2>
            <div className="prose max-w-none bg-gray-900/50 p-6 rounded-lg border border-gray-700/50">
              <div className="text-gray-200 leading-relaxed">
                {renderSummary(summary)}
              </div>
            </div>

            {/* Word Definition Popup */}
            {clickedWord && (
              <div
                className="word-definition-popup fixed z-50 bg-gray-800 border-2 border-purple-500/50 rounded-lg shadow-2xl p-4 max-w-sm backdrop-blur-sm animate-slide-up"
                style={{
                  left: `${Math.min(
                    definitionPosition.x,
                    window.innerWidth - 320
                  )}px`,
                  top: `${Math.max(definitionPosition.y - 100, 20)}px`,
                  transform: "translateX(-50%)",
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    {clickedWord}
                  </h3>
                  <button
                    onClick={closeDefinition}
                    className="text-gray-400 hover:text-gray-200 text-xl font-bold ml-2 transition-colors"
                    aria-label="Close definition"
                  >
                    ×
                  </button>
                </div>
                <div className="border-t border-gray-600 pt-2">
                  {isLoadingDefinition ? (
                    <div className="flex items-center justify-center py-4">
                      <svg
                        className="animate-spin h-5 w-5 text-purple-400"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span className="ml-2 text-gray-300">Loading...</span>
                    </div>
                  ) : (
                    <p className="text-gray-200 leading-relaxed">
                      {wordDefinition}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Chat Interface Section */}
        {summary && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-2xl p-6 border border-gray-700/50 animate-fade-in-up">
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-4">
              💬 Chat with AI
            </h2>

            {/* Chat Messages */}
            <div className="mb-4 h-96 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {chatMessages.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <p className="text-lg mb-2">👋</p>
                  <p>Ask me anything about the summary!</p>
                </div>
              ) : (
                chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.type === "user" ? "justify-end" : "justify-start"
                    } animate-slide-up`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.type === "user"
                          ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-br-sm"
                          : "bg-gray-700/80 text-gray-200 rounded-bl-sm"
                      } shadow-lg`}
                    >
                      <p className="leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                  </div>
                ))
              )}

              {/* Loading indicator */}
              {isAnswering && (
                <div className="flex justify-start animate-slide-up">
                  <div className="bg-gray-700/80 text-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !isAnswering && question.trim()) {
                    handleAskQuestion();
                  }
                }}
                placeholder="Type your question here..."
                className="flex-1 p-4 bg-gray-900/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-200 placeholder-gray-500 transition-all"
              />
              <button
                onClick={handleAskQuestion}
                disabled={isAnswering || !question.trim()}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold px-6 py-4 rounded-lg transition-all duration-300 disabled:bg-gray-700 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-purple-500/50 transform hover:scale-105 disabled:hover:scale-100"
              >
                {isAnswering ? (
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-gray-400 text-sm animate-fade-in">
          <p>
            Powered by Google Gemini AI • Made with React + Vite + Tailwind CSS
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
