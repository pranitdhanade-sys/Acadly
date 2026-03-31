// Notes, quizzes, and XP hooks for each video in the playlist.
// Video IDs correspond to the `id` column in the MySQL `videos` table.

window.ACADLY_VIDEO_ENHANCEMENTS = {
  notes: {
    // --- Video 1: Intro to Machine Learning ---
    1: [
      "Difference between traditional programming and machine learning.",
      "Supervised vs unsupervised learning in one sentence each.",
      "One concrete idea where you could apply ML in your own studies.",
    ],
    // --- Video 2: Neural Networks Explained ---
    2: [
      "The role of layers, weights, and biases in a neural network.",
      "How activation functions like ReLU and sigmoid introduce non-linearity.",
      "The backpropagation steps: forward pass, loss calculation, and gradient descent.",
    ],
    // --- Video 3: Computer Vision with CNNs ---
    3: [
      "How convolutional filters detect edges and textures in an image.",
      "The purpose of pooling layers and how they reduce spatial dimensions.",
      "One real-world use case where CNNs outperform traditional image processing.",
    ],
  },

  quizzes: {
    // --- Video 1 ---
    1: {
      question: "Which of the following best describes supervised learning?",
      options: [
        "Learning from labeled examples to predict outputs.",
        "Randomly exploring data with no structure.",
        "Training a model only with reward signals.",
        "Storing rules written by humans.",
      ],
      correctIndex: 0,
    },
    // --- Video 2: Neural Networks Explained ---
    2: {
      question: "What is the main purpose of an activation function in a neural network?",
      options: [
        "To initialise the weights before training begins.",
        "To introduce non-linearity so the network can learn complex patterns.",
        "To shuffle the training data between epochs.",
        "To compress the model's size for deployment.",
      ],
      correctIndex: 1,
    },
    // --- Video 3: Computer Vision with CNNs ---
    3: {
      question: "What is the primary role of a pooling layer in a CNN?",
      options: [
        "To add more learnable parameters to the model.",
        "To apply colour corrections to the input image.",
        "To reduce the spatial size of feature maps and lower computation.",
        "To convert the image from RGB to greyscale.",
      ],
      correctIndex: 2,
    },
  },
};
