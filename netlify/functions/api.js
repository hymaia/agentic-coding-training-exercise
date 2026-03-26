const path = require('node:path');
const serverless = require('serverless-http');

let cachedHandler;

async function getHandler() {
  if (cachedHandler) {
    return cachedHandler;
  }

  process.env.DATA_BACKEND = process.env.DATA_BACKEND || 'json';
  process.env.JSON_DATA_PATH = process.env.JSON_DATA_PATH || path.resolve(__dirname, '../../server/typescript/data/items.json');

  const { createApp } = await import('../../server/typescript/dist/infrastructure/http/server.js');
  const app = await createApp();
  cachedHandler = serverless(app);
  return cachedHandler;
}

exports.handler = async (event, context) => {
  const handler = await getHandler();
  return handler(event, context);
};
