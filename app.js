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
    const { startDate, endDate } = req.query;
    const jsonData = await getSchedule(startDate, endDate);
    // console.log(jsonData);
    res.json(jsonData);
  }
  catch {
    res.statusCode(400);
  }

});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
