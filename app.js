// app.js
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3100;

const { getSchedule } = require('./scheduleMaster');

// Middleware для обработки CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.use(cors());

// Роут для возврата JSON данных
app.get('/api/schedule/current', async (req, res) => {
  try {
    const { startDate, endDate, useCache = 'true' } = req.query;
    const useCacheBool = useCache.toLowerCase() === 'true';

    const jsonData = await getSchedule(startDate, endDate, useCacheBool);
    res.json(jsonData);
  } catch (e) {
    console.error('Ошибка при получении расписания:', e);
    res.status(400).json({ error: 'Ошибка при получении данных' });
  }
});


// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
