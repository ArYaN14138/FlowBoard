export const emitWorkspaceEvent = (req, event, payload) => {
  req.app.get("io")?.emit(event, payload);
};

export const emitUserEvent = (req, userId, event, payload) => {
  req.app.get("io")?.to(`user:${userId}`).emit(event, payload);
};
