// app.js
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3100;

const { getSchedule } = require('./scheduleMaster');

// Обёртка для асинхронных роутов
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Middleware для CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
app.use(cors());

// Роут с обработкой ошибок
app.get('/api/schedule/current', asyncHandler(async (req, res) => {
  const { startDate, endDate, useCache = 'true' } = req.query;
  const useCacheBool = useCache.toLowerCase() === 'true';

  const jsonData = await getSchedule(startDate, endDate, useCacheBool);
  res.json(jsonData);
}));

// Обработчик ошибок Express
app.use((err, req, res, next) => {
  console.error('Произошла ошибка в middleware или маршруте:', err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

// Глобальные обработчики ошибок Node.js
process.on('uncaughtException', (err) => {
  console.error('Необработанное исключение:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Необработанное отклонение промиса:', reason);
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
