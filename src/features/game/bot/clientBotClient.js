export function createClientBotClient() {
  const worker = new Worker(new URL("./clientBot.worker.js", import.meta.url), {
    type: "module",
  });
  let nextRequestId = 0;
  const pendingRequests = new Map();

  worker.onmessage = (event) => {
    const message = event?.data || {};
    const requestId = message.id;
    const pendingRequest = pendingRequests.get(requestId);

    if (!pendingRequest) {
      return;
    }

    pendingRequests.delete(requestId);

    if (message.ok) {
      pendingRequest.resolve(message.result);
      return;
    }

    pendingRequest.reject(new Error(message.error || "Bot worker failed."));
  };

  function computeBestMove(payload) {
    return new Promise((resolve, reject) => {
      const requestId = `client-bot-${nextRequestId}`;
      nextRequestId += 1;

      pendingRequests.set(requestId, { resolve, reject });
      worker.postMessage({
        id: requestId,
        type: "compute-best-move",
        payload,
      });
    });
  }

  function terminate() {
    for (const pendingRequest of pendingRequests.values()) {
      pendingRequest.reject(new Error("Bot worker terminated."));
    }

    pendingRequests.clear();
    worker.terminate();
  }

  return {
    computeBestMove,
    terminate,
  };
}
