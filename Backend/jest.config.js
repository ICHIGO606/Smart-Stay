export default {
  collectCoverageFrom: [
    "src/utils/ApiError.js",
    "src/utils/ApiResponse.js",
    "src/utils/AsyncHandler.js",
    "src/utils/helpers.js",
    "src/controllers/payment.controllers.js",
    "src/controllers/webhook.controllers.js",
    "src/middlewares/verifyHotelAdmin.middleware.js",
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
};
