"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  FiSend,
  FiPlusCircle,
  FiMessageSquare,
  FiRefreshCw,
  FiEdit,
  FiX,
  FiEye,
  FiHelpCircle,
  FiFileText,
  FiEdit2,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

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
  phaseContent?: {
    understanding?: string;
    planning?: string;
    generating?: string[];
    finalizing?: string;
  };
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

// Feature Guide component for the top of the chat
const FeatureGuide = ({ showGuide, setShowGuide }: { showGuide: boolean, setShowGuide: (show: boolean) => void }) => {
  return (
    <div className="border-b border-gray-200 bg-gray-50">
      <button 
        onClick={() => setShowGuide(!showGuide)}
        className="w-full px-3 py-1.5 text-xs text-gray-500 flex items-center justify-center hover:bg-gray-100 transition-colors"
      >
        {showGuide ? <FiChevronUp className="mr-1" /> : <FiChevronDown className="mr-1" />}
        {showGuide ? "Hide Guide" : "Show Feature Guide"}
      </button>
      
      {showGuide && (
        <div className="p-3 bg-white border-t border-gray-200 text-xs space-y-2">
          <div>
            <h4 className="font-medium text-gray-900">How to use this AI Assistant:</h4>
            <ul className="ml-5 mt-1 list-disc text-gray-600 space-y-1">
              <li><span className="text-blue-600 font-medium">Create slide for [audience], [pages], [content]</span> - Generate slides for specific audiences with page limit</li>
              <li><span className="text-green-600 font-medium">Edit instructions</span> - Request changes like &quot;make it shorter&quot; or &quot;add bullet points&quot;</li>
              <li><span className="text-purple-600 font-medium">Ask questions</span> - Get help with slide creation techniques or best practices</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">Tips:</h4>
            <ul className="ml-5 mt-1 list-disc text-gray-600 space-y-1">
              <li>Be specific about your target audience for better results</li>
              <li>Use action buttons below AI responses to insert or replace content</li>
              <li>Click the regenerate button to try again with the same prompt</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

// Quick Action buttons component (simplified - just the buttons)
const QuickActions = ({ onActionClick }: { onActionClick: (text: string) => void }) => {
  const exampleActions = [
    {
      icon: <FiFileText />,
      label: "Create Slide",
      example: "Create slide for developers, 5 pages, React hooks best practices",
      colorClass: "bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100"
    },
    {
      icon: <FiEdit2 />,
      label: "Edit Slide",
      example: "Make this more concise with bullet points",
      colorClass: "bg-green-50 text-green-700 border-green-100 hover:bg-green-100"
    },
    {
      icon: <FiHelpCircle />,
      label: "Get Help",
      example: "How do I create engaging presentation for executives?",
      colorClass: "bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100"
    }
  ];

  return (
    <div className="p-3 border-t border-gray-200 bg-gray-50">
      <p className="text-xs text-gray-500 mb-2">Quick Actions:</p>
      <div className="flex flex-wrap gap-2">
        {exampleActions.map((action, index) => (
          <button
            key={index}
            onClick={() => onActionClick(action.example)}
            className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 border transition-colors ${action.colorClass}`}
          >
            {action.icon}
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

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
        "Hello! I'm your AI assistant. I can help you create slide content. Here's how to use this chat:\n\n" +
        "1. **Create slide for [audience], [pages], [content]** - Generate slides for specific audiences with page limit\n" +
        "2. **Edit this slide** - Just tell me what to edit (e.g., 'make it shorter', 'add bullet points')\n" +
        "3. **Ask questions** - Get help with slides or how to create specific types of slides\n\n" +
        "What would you like help with today?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastUserPrompt, setLastUserPrompt] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Feature guide state
  const [showGuide, setShowGuide] = useState(false);

  // Modal state for viewing phase content
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activePhase, setActivePhase] = useState<string>("understanding");
  const [selectedMessageIndex, setSelectedMessageIndex] = useState<
    number | null
  >(null);

  // Get context from current slides to provide to the AI
  const getCurrentSlideContext = useCallback(() => {
    // Use the context passed from the parent component if available
    return (
      currentSlideContext ||
      "Current slide context: Empty slides or no slides yet."
    );
  }, [currentSlideContext]);

  // Get the currently selected message's phase content
  const getSelectedMessagePhaseContent = useCallback(() => {
    if (selectedMessageIndex === null) return undefined;
    return messages[selectedMessageIndex]?.status?.phaseContent;
  }, [messages, selectedMessageIndex]);

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
        console.log("Received status:", status);
        console.log("Status has phaseContent:", !!status.phaseContent);
        console.log(
          "Phase content keys:",
          status.phaseContent ? Object.keys(status.phaseContent) : []
        );

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
              newMessages[messageIndex].content = `Error: ${status.error || "Unknown error occurred"
                }`;
              newMessages[messageIndex].isLoading = false;
              setIsLoading(false);
            } else {
              // Continue polling
              setTimeout(
                () => pollGenerationStatus(generationId, messageIndex),
                2000
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

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
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
  }, [inputValue, isLoading, getCurrentSlideContext, messages.length, pollGenerationStatus]);

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

  const insertAIContent = useCallback(
    (content: string, isLoading?: boolean) => {
      // Don't insert if content is still loading
      if (isLoading) return;

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
    },
    [onInsertMarkdown]
  );

  const replaceCurrentSlide = useCallback(
    (content: string, isLoading?: boolean) => {
      // Don't replace if content is still loading
      if (isLoading) return;

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
    },
    [onReplaceSlide]
  );

  // Handle replacing all slides
  const replaceAllSlides = useCallback(
    (content: string, isLoading?: boolean) => {
      // Don't replace if content is still loading
      if (isLoading) return;

      // Add console log to debug
      console.log("AIChat: Replace all slides button clicked");
      console.log("AIChat: Content to replace all slides:", content);

      // Make sure we're not replacing with empty content
      if (!content || !content.trim()) {
        console.error(
          "AIChat: Attempted to replace all slides with empty content"
        );
        return;
      }

      // Clean up the content if needed (remove excess whitespace)
      const cleanedContent = content.trim();

      // Call the parent component's handler to replace all slides
      console.log("AIChat: Calling onReplaceAllSlides with cleaned content");
      onReplaceAllSlides(cleanedContent);
    },
    [onReplaceAllSlides]
  );


  // Reset textarea height when input is cleared
  useEffect(() => {
    if (inputValue === "" && textareaRef.current) {
      textareaRef.current.style.height = "60px"; // Changed default height from 40px to 60px
    }
  }, [inputValue]);

  // Effect for custom event listener
  useEffect(() => {
    const handleSetActivePhase = (event: CustomEvent) => {
      setActivePhase(event.detail);
    };

    window.addEventListener(
      "setActivePhase",
      handleSetActivePhase as EventListener
    );

    return () => {
      window.removeEventListener(
        "setActivePhase",
        handleSetActivePhase as EventListener
      );
    };
  }, []);

  const messageVariants = useMemo(
    () => ({
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    }),
    []
  );

  const PhaseContentModal = useCallback(
    ({
      isOpen,
      onClose,
      phaseContent,
      activePhase,
    }: {
      isOpen: boolean;
      onClose: () => void;
      phaseContent?: GenerationStatus["phaseContent"];
      activePhase: string;
    }) => {
      if (!isOpen || !phaseContent) return null;

      // Get the content for the active phase
      const getPhaseContent = () => {
        if (!phaseContent) return null;

        switch (activePhase) {
          case "understanding":
            return phaseContent.understanding || "No content available";
          case "planning":
            return phaseContent.planning || "No content available";
          case "generating":
            if (
              !phaseContent.generating ||
              phaseContent.generating.length === 0
            ) {
              return "No content available";
            }
            return phaseContent.generating.join("\n\n--- NEXT SLIDE ---\n\n");
          case "finalizing":
            return phaseContent.finalizing || "No content available";
          default:
            return "Select a phase to view content";
        }
      };

      // Format the phase name
      const formatPhase = (phase: string) => {
        return phase.charAt(0).toUpperCase() + phase.slice(1);
      };

      return (
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
              >
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {formatPhase(activePhase)} Phase Content
                  </h3>
                  <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FiX size={20} />
                  </button>
                </div>

                <div className="flex border-b border-gray-200">
                  {phaseContent &&
                    Object.keys(phaseContent).map((phase) => (
                      <button
                        key={phase}
                        className={`px-4 py-2 text-sm font-medium ${activePhase === phase
                          ? "border-b-2 border-blue-500 text-blue-600"
                          : "text-gray-500 hover:text-gray-700"
                          }`}
                        onClick={() => {
                          const event = new CustomEvent("setActivePhase", {
                            detail: phase,
                          });
                          window.dispatchEvent(event);
                        }}
                      >
                        {formatPhase(phase)}
                      </button>
                    ))}
                </div>

                <div className="flex-1 p-4 overflow-auto">
                  <pre className="whitespace-pre-wrap text-sm bg-gray-100 p-4 rounded overflow-auto">
                    {getPhaseContent()}
                  </pre>
                </div>

                <div className="p-4 border-t border-gray-200 flex justify-end">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      );
    },
    []
  );

  // Handle quick action button click
  const handleQuickActionClick = useCallback((text: string) => {
    setInputValue(text);
    
    // Adjust textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
    
    // Focus the textarea
    textareaRef.current?.focus();
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden rounded-xl bg-white shadow-sm border border-gray-200" id="ai-chat-container">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center gap-2">
          <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <FiMessageSquare className="h-3.5 w-3.5" />
          </div>
          <h3 className="font-semibold text-md">AI Assistant</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRegenerate}
            className="p-1.5 rounded-md text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            aria-label="Regenerate"
            title="Regenerate"
            id="regenerate-button"
          >
            <FiRefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Feature Guide at top */}
      <FeatureGuide showGuide={showGuide} setShowGuide={setShowGuide} />

      <div className="flex-1 overflow-y-auto px-4" id="chat-messages-container">
        {messages.map((message, index) => (
          <motion.div
            key={index}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"
              }`}
            initial="hidden"
            animate="visible"
            variants={messageVariants}
            layout
          >
            <div
              className={`max-w-[90%] rounded-2xl px-3 py-2 ${message.role === "user"
                ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md"
                : "bg-white border border-gray-200 shadow-sm"
                }`}
            >
              {message.role === "assistant" && (
                <div className="flex items-center gap-1.5 mb-1.5 pb-1.5 border-b border-gray-100">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                    AI
                  </div>
                  <span className="text-xs font-medium text-gray-500">
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
                        <span className="text-gray-500">
                          {message.status.message}
                        </span>
                        {message.status.status !== "error" && (
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
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
                    onClick={() =>
                      insertAIContent(message.content, message.isLoading)
                    }
                    disabled={message.isLoading}
                    className={`flex items-center text-xs font-medium ${message.isLoading
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-blue-500 hover:text-blue-700 transition-colors"
                      }`}
                    whileHover={!message.isLoading ? { scale: 1.03 } : {}}
                    whileTap={!message.isLoading ? { scale: 0.97 } : {}}
                  >
                    <FiPlusCircle className="mr-1.5" /> Insert into slides
                  </motion.button>

                  <motion.button
                    onClick={() =>
                      replaceCurrentSlide(message.content, message.isLoading)
                    }
                    disabled={message.isLoading}
                    className={`flex items-center text-xs font-medium ${message.isLoading
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-green-500 hover:text-green-700 transition-colors"
                      }`}
                    whileHover={!message.isLoading ? { scale: 1.03 } : {}}
                    whileTap={!message.isLoading ? { scale: 0.97 } : {}}
                  >
                    <FiEdit className="mr-1.5" /> Replace this slide
                  </motion.button>

                  <motion.button
                    onClick={() =>
                      replaceAllSlides(message.content, message.isLoading)
                    }
                    disabled={message.isLoading}
                    className={`flex items-center text-xs font-medium ${message.isLoading
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-amber-500 hover:text-amber-700 transition-colors"
                      }`}
                    whileHover={!message.isLoading ? { scale: 1.03 } : {}}
                    whileTap={!message.isLoading ? { scale: 0.97 } : {}}
                  >
                    <FiEdit className="mr-1.5" /> Replace all slides
                  </motion.button>

                  {/* Add view phase content button when phase content is available */}
                  {message.status?.phaseContent &&
                    Object.keys(message.status.phaseContent).length > 0 && (
                      <motion.button
                        onClick={() => {
                          setSelectedMessageIndex(index);
                          setActivePhase(
                            Object.keys(message.status!.phaseContent!)[0]
                          );
                          setIsModalOpen(true);
                        }}
                        className="flex items-center text-xs font-medium text-purple-500 hover:text-purple-700 transition-colors"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <FiEye className="mr-1.5" />{" "}
                        {message.isLoading
                          ? "View Progress Details"
                          : "View Generation Phases"}
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
            <div className="max-w-[90%] rounded-2xl px-3 py-2 bg-white border border-gray-200 shadow-sm">
              <div className="flex items-center gap-1.5 mb-1.5 pb-1.5 border-b border-gray-100">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                  AI
                </div>
                <span className="text-xs font-medium text-gray-500">
                  AI Assistant
                </span>
              </div>
              <div className="flex space-x-2 items-center h-5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"></div>
                <div
                  className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                ></div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions above the form */}
      <QuickActions onActionClick={handleQuickActionClick} />

      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-gray-200 flex gap-2 items-end"
        id="ai-chat-form"
      >
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              adjustTextareaHeight(e);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask for help with slide content..."
            className="w-full resize-none rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 px-3 py-2 text-sm min-h-[60px] max-h-[200px] placeholder:text-gray-400"
            id="ai-chat-input"
          />
        </div>
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className={`rounded-full p-2.5 flex-shrink-0 ${isLoading || !inputValue.trim()
            ? "bg-gray-200 text-gray-400"
            : "bg-indigo-600 text-white hover:bg-indigo-700"
            } transition-colors`}
          id="ai-chat-submit-button"
        >
          {isLoading ? (
            <FiRefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <FiSend className="w-5 h-5" />
          )}
        </button>
      </form>

      {/* Phase Content Modal */}
      <PhaseContentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        phaseContent={getSelectedMessagePhaseContent()}
        activePhase={activePhase}
      />
    </div>
  );
}
