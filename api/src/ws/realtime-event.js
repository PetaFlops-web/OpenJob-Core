const createRealtimePayload = ({ id, type, message, ...data }) => ({
  id,
  type,
  message,
  created_at: new Date().toISOString(),
  data,
  ...data,
});

export { createRealtimePayload };
