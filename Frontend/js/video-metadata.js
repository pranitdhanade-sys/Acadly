// Optional overrides when a MongoDB video document has no notes/quiz yet.
// Keys must match the video's MongoDB _id string (see GET /api/videos after upload).

window.ACADLY_VIDEO_ENHANCEMENTS = {
  notes: {
    // --- Video 1: Object-Oriented Programming (OOPs) ---
    "video_oops_001": [
      "Classes are blueprints that define the structure and behavior of objects.",
      "Inheritance allows a child class to inherit attributes and methods from a parent class.",
      "Polymorphism enables objects to take on multiple forms and respond to the same method call differently.",
      "Encapsulation hides internal object details and only exposes what's necessary.",
    ],
    // --- Video 2: Backpropagation - AI's Learning Engine ---
    "video_backprop_001": [
      "Backpropagation calculates gradients by computing the derivative of the loss function with respect to each weight.",
      "The chain rule is the mathematical foundation that allows gradients to flow backward through layers.",
      "During backpropagation, weights are updated by subtracting the gradient multiplied by the learning rate.",
      "Activation functions introduce non-linearity, allowing neural networks to learn complex patterns.",
    ],
  },

  quizzes: {
    // --- Video 1: OOPs ---
    "video_oops_001": {
      question: "Which of the following best describes object-oriented programming?",
      options: [
        "A programming paradigm centered around objects and classes.",
        "A method of storing all code in a single global scope.",
        "An approach that uses only functions without any data structures.",
        "A language-specific feature only available in Java.",
      ],
      correctIndex: 0,
    },
    // --- Video 2: Backpropagation ---
    "video_backprop_001": {
      question: "What is the purpose of backpropagation in neural networks?",
      options: [
        "To forward data through all layers without any updates.",
        "To calculate gradients and update weights to minimize the loss function.",
        "To add random noise to the model for regularization.",
        "To compress the model size for faster deployment.",
      ],
      correctIndex: 1,
    },
  },
};
