export async function logInfo(message: string, meta?: any) {
  console.log(message, meta ?? '');
  await sendLog('info', message, meta);
}

export async function logError(message: string, meta?: any) {
  console.error(message, meta ?? '');
  await sendLog('error', message, meta);
}

async function sendLog(level: 'info' | 'error', message: string, meta?: any) {
  const endpoint = process.env.LOG_ENDPOINT;
  if (!endpoint) return;
  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, message, meta, timestamp: new Date().toISOString() }),
    });
  } catch (err) {
    console.error('sendLog failed', err);
  }
}
