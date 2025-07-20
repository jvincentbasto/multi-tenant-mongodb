//
const startServer = async (payload = {}) => {
  const { success } = payload;

  try {
    // if (!success) {
    //   throw new Error("Failed to Start Database");
    // }
    // app.listen(PORT, () => {
    //   console.log("Server is running on port:", PORT);
    // });
  } catch (err) {
    // console.error("Failed to start server:", err.message);
    // process.exit(1); // status code: failure = 1, success = 0
  }
};
export const fastifyHandlers = {
  startServer,
};
