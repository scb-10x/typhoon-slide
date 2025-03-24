"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  FiSend,
  FiPlusCircle,
  FiMessageSquare,
  FiRefreshCw,
  FiEdit,
} from "react-icons/fi";
import { motion } from "framer-motion";

// Add an interface for generation status
interface GenerationStatus {
  id: string;
  status:
    | "understanding"
    | "planning"
    | "generating"
    | "finalizing"
    | "completed"
    | "error";
  progress: number; // 0-100
  message: string;
  result?: string;
  error?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean;
  generationId?: string;
  status?: GenerationStatus;
}

interface AIChatProps {
  onInsertMarkdown: (markdown: string) => void;
  onReplaceSlide: (markdown: string) => void;
  onReplaceAllSlides: (markdown: string) => void;
  currentSlideContext?: string;
}

export default function AIChat({
  onInsertMarkdown,
  onReplaceSlide,
  onReplaceAllSlides,
  currentSlideContext,
}: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your AI assistant. I can help you create slide content. What would you like help with?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastUserPrompt, setLastUserPrompt] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Poll for status updates
  const pollGenerationStatus = useCallback(
    async (generationId: string, messageIndex: number) => {
      console.log("AIChat: Polling generation status for ID:", generationId);
      if (!generationId) return;
      try {
        const response = await fetch(`/api/generate?id=${generationId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch generation status");
        }

        const status: GenerationStatus = await response.json();
        console.log("status", status);

        // Update the message with the current status
        setMessages((prev) => {
          const newMessages = [...prev];
          if (newMessages[messageIndex]) {
            newMessages[messageIndex].status = status;

            // If completed, update the content and stop polling
            if (status.status === "completed" && status.result) {
              newMessages[messageIndex].content = status.result;
              newMessages[messageIndex].isLoading = false;
              setIsLoading(false);
            } else if (status.status === "error") {
              newMessages[messageIndex].content = `Error: ${
                status.error || "Unknown error occurred"
              }`;
              newMessages[messageIndex].isLoading = false;
              setIsLoading(false);
            } else {
              // Continue polling
              setTimeout(
                () => pollGenerationStatus(generationId, messageIndex),
                5000
              );
            }
          }
          return newMessages;
        });
      } catch (error) {
        console.error("Error polling generation status:", error);

        // After several failed attempts, stop polling
        setTimeout(
          () => pollGenerationStatus(generationId, messageIndex),
          10000
        );
      }
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = { role: "user" as const, content: inputValue.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setLastUserPrompt(inputValue.trim()); // Store the user prompt for potential regeneration
    setInputValue("");
    setIsLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "60px";
    }

    try {
      // Get the current slide content to provide context to the AI
      const slideContext = getCurrentSlideContext();

      // Add a placeholder message for the assistant's response that will be updated
      const assistantMessageIndex = messages.length + 1; // +1 because we just added the user message
      const placeholderMessage: Message = {
        role: "assistant",
        content: "Generating content...",
        isLoading: true,
      };
      setMessages((prev) => [...prev, placeholderMessage]);

      // Start the generation process
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userPrompt: inputValue.trim(),
          slideContext,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate content");
      }

      const data = await response.json();

      if (data.generationId) {
        // Update the placeholder message with the generation ID
        setMessages((prev) => {
          const newMessages = [...prev];
          if (newMessages[assistantMessageIndex]) {
            newMessages[assistantMessageIndex].generationId = data.generationId;
            newMessages[assistantMessageIndex].status = {
              id: data.generationId,
              status: "understanding",
              progress: 0,
              message: "Processing your request...",
            };
          }
          return newMessages;
        });

        // Begin polling
        pollGenerationStatus(data.generationId, assistantMessageIndex);
      }
    } catch (error) {
      console.error("Error generating content:", error);
      const errorResponse = {
        role: "assistant" as const,
        content:
          "I apologize, but I encountered an error while generating content. Please try again.",
      };
      setMessages((prev) => {
        // Replace the placeholder if it exists
        if (prev.length > 0 && prev[prev.length - 1].isLoading) {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = errorResponse;
          return newMessages;
        }
        return [...prev, errorResponse];
      });
      setIsLoading(false);
    }
  };

  // Function to regenerate the last AI response
  const handleRegenerate = async () => {
    if (isLoading || !lastUserPrompt) return;

    // Remove the last AI message
    setMessages((prev) => {
      // If the last message is from the assistant, remove it
      if (prev.length > 0 && prev[prev.length - 1].role === "assistant") {
        return prev.slice(0, -1);
      }
      return prev;
    });

    setIsLoading(true);

    try {
      // Get the current slide content for context
      const slideContext = getCurrentSlideContext();

      // Add a placeholder message for the assistant's response that will be updated
      const assistantMessageIndex = messages.length; // We just removed the last message
      const placeholderMessage: Message = {
        role: "assistant",
        content: "Regenerating content...",
        isLoading: true,
      };
      setMessages((prev) => [...prev, placeholderMessage]);

      // Call our API route with the last user prompt
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userPrompt: lastUserPrompt,
          slideContext,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to regenerate content");
      }

      const data = await response.json();

      if (data.generationId) {
        // Update the placeholder message with the generation ID
        setMessages((prev) => {
          const newMessages = [...prev];
          if (newMessages[assistantMessageIndex]) {
            newMessages[assistantMessageIndex].generationId = data.generationId;
            newMessages[assistantMessageIndex].status = {
              id: data.generationId,
              status: "understanding",
              progress: 0,
              message: "Processing your request...",
            };
          }
          return newMessages;
        });

        // Begin polling
        pollGenerationStatus(data.generationId, assistantMessageIndex);
      } else if (data.text) {
        // Backward compatibility for direct responses
        const aiResponse = {
          role: "assistant" as const,
          content: data.text,
        };

        setMessages((prev) => {
          // Replace the placeholder
          const newMessages = [...prev];
          if (newMessages[assistantMessageIndex]) {
            newMessages[assistantMessageIndex] = aiResponse;
          } else {
            newMessages.push(aiResponse);
          }
          return newMessages;
        });
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error regenerating content:", error);
      const errorResponse = {
        role: "assistant" as const,
        content:
          "I apologize, but I encountered an error while regenerating content. Please try again.",
      };
      setMessages((prev) => {
        // Replace the placeholder if it exists
        if (prev.length > 0 && prev[prev.length - 1].isLoading) {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = errorResponse;
          return newMessages;
        }
        return [...prev, errorResponse];
      });
      setIsLoading(false);
    }
  };

  // Get context from current slides to provide to the AI
  const getCurrentSlideContext = () => {
    // Use the context passed from the parent component if available
    return (
      currentSlideContext ||
      "Current slide context: Empty slides or no slides yet."
    );
  };

  // Handle keydown events for the textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevent default to avoid new line
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  // Auto-resize textarea height based on content
  const adjustTextareaHeight = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = "auto"; // Reset height
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`; // Increased max height from 150 to 200
    setInputValue(textarea.value);
  };

  const insertAIContent = (content: string) => {
    // Add console log to debug
    console.log("AIChat: Insert button clicked");
    console.log("AIChat: Content to be inserted:", content);

    // Make sure we're not inserting empty content
    if (!content || !content.trim()) {
      console.error("AIChat: Attempted to insert empty content");
      return;
    }

    // Clean up the content if needed (remove excess whitespace)
    const cleanedContent = content.trim();

    // Call the parent component's handler to insert the content
    console.log("AIChat: Calling onInsertMarkdown with cleaned content");
    onInsertMarkdown(cleanedContent);
  };

  const replaceCurrentSlide = (content: string) => {
    // Add console log to debug
    console.log("AIChat: Replace this slide button clicked");
    console.log("AIChat: Content to replace current slide:", content);

    // Make sure we're not inserting empty content
    if (!content || !content.trim()) {
      console.error("AIChat: Attempted to replace with empty content");
      return;
    }

    // Clean up the content if needed (remove excess whitespace)
    const cleanedContent = content.trim();

    // Call the parent component's handler to replace the slide content
    console.log("AIChat: Calling onReplaceSlide with cleaned content");
    onReplaceSlide(cleanedContent);
  };

  // Scroll to bottom of messages when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Reset textarea height when input is cleared
  useEffect(() => {
    if (inputValue === "" && textareaRef.current) {
      textareaRef.current.style.height = "60px"; // Changed default height from 40px to 60px
    }
  }, [inputValue]);

  const messageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-grow overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent max-h-[calc(100%-56px)]">
        {messages.map((message, index) => (
          <motion.div
            key={index}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
            initial="hidden"
            animate="visible"
            variants={messageVariants}
            layout
          >
            <div
              className={`max-w-[90%] rounded-2xl px-3 py-2 ${
                message.role === "user"
                  ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md"
                  : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm"
              }`}
            >
              {message.role === "assistant" && (
                <div className="flex items-center gap-1.5 mb-1.5 pb-1.5 border-b border-gray-100 dark:border-gray-800">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                    AI
                  </div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    AI Assistant
                  </span>
                </div>
              )}

              <div className="whitespace-pre-wrap text-sm">
                {message.content}

                {/* Show status updates for assistant messages that are loading */}
                {message.role === "assistant" &&
                  message.isLoading &&
                  message.status && (
                    <div className="mt-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 dark:text-gray-400">
                          {message.status.message}
                        </span>
                        {message.status.status !== "error" && (
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full"
                              style={{ width: `${message.status.progress}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
              </div>

              {message.role === "assistant" && (
                <div className="mt-2 flex flex-wrap gap-3">
                  <motion.button
                    onClick={() => insertAIContent(message.content)}
                    className="flex items-center text-xs font-medium text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <FiPlusCircle className="mr-1.5" /> Insert into slides
                  </motion.button>

                  <motion.button
                    onClick={() => replaceCurrentSlide(message.content)}
                    className="flex items-center text-xs font-medium text-green-500 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <FiEdit className="mr-1.5" /> Replace this slide
                  </motion.button>

                  <motion.button
                    onClick={() => onReplaceAllSlides(message.content)}
                    className="flex items-center text-xs font-medium text-amber-500 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <FiEdit className="mr-1.5" /> Replace all slides
                  </motion.button>

                  {/* Only show the regenerate button for the last AI message */}
                  {index === messages.length - 1 && lastUserPrompt && (
                    <motion.button
                      onClick={handleRegenerate}
                      disabled={isLoading}
                      className="flex items-center text-xs font-medium text-purple-500 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <FiRefreshCw
                        className={`mr-1.5 ${isLoading ? "animate-spin" : ""}`}
                      />{" "}
                      Regenerate
                    </motion.button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {isLoading && (
          <motion.div
            className="flex justify-start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="max-w-[90%] rounded-2xl px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-1.5 mb-1.5 pb-1.5 border-b border-gray-100 dark:border-gray-800">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                  AI
                </div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  AI Assistant
                </span>
              </div>
              <div className="flex space-x-2 items-center h-5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 dark:bg-blue-500 animate-bounce"></div>
                <div
                  className="w-1.5 h-1.5 rounded-full bg-blue-400 dark:bg-blue-500 animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="w-1.5 h-1.5 rounded-full bg-blue-400 dark:bg-blue-500 animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                ></div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-2 border-t border-gray-200 dark:border-gray-700 shrink-0 bg-white dark:bg-gray-900"
      >
        <div className="flex gap-2 items-start">
          <div className="relative flex-grow">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={adjustTextareaHeight}
              onKeyDown={handleKeyDown}
              placeholder="Ask AI for slide content... (Shift+Enter for new line)"
              className="w-full p-2 pl-8 pr-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 shadow-sm resize-none min-h-[60px] max-h-[200px] overflow-y-auto"
              style={{ height: "60px" }}
              rows={2}
            />
            <FiMessageSquare className="absolute left-2.5 top-[calc(30px-0.5rem)] transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
          <motion.button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0 self-end"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiSend className="w-4 h-4" />
          </motion.button>
        </div>
      </form>
    </div>
  );
}
