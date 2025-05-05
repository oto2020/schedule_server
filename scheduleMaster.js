// scheduleMaster.js
var http = require('follow-redirects').http;
var fs = require('fs');
require('dotenv').config();

function getSchedule(startDate, endDate) {

  const options = {
    method: 'GET',
    hostname: process.env.API_HOSTNAME,
    port: process.env.API_PORT,
    path: `/fitness1c_chat/hs/api/v3/classes/?start_date=${startDate}&end_date=${endDate}&club_id=${process.env.API_CLUB_ID}`,
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.API_KEY,
      'usertoken': process.env.API_USER_TOKEN,
      'Authorization': process.env.API_AUTH,
    },
    maxRedirects: 20
  };


  // создаем промис, который будет резолвиться при выполнении  res.on("end"
  return new Promise((resolve, reject) => {
    // начало промиса
    let req = http.request(options, function (res) {
      var chunks = [];

      res.on("data", function (chunk) {
        chunks.push(chunk);
      });

      res.on("end", function (chunk) {
        var body = Buffer.concat(chunks);
        // console.log(body.toString());

        // Преобразуем в json
        var jsonData = JSON.parse(body);
        console.log(jsonData.data[0], jsonData.data[1]);
        // return;
        let classes = jsonData.data.map(el => extractDataFromJson(el));
        resolve(classes);
      });

      res.on("error", function (error) {
        reject(error);
      });
    });

    req.end();
    // конец промиса
  });
}

// Экспорт функций в виде объекта
module.exports = {
  getSchedule
};



// извлекает только нужные данные
function extractDataFromJson(jsonData) {
  const { service, employee, start_date, end_date, duration, room, canceled } = jsonData;

  const exerciseTitle = service.title;
  const trainerName = employee.name;

  // Преобразовываем строку start_date в объект Date
  const startDate = new Date(start_date);
  const startTime = start_date.split(' ')[1];
  const endTime = end_date.split(' ')[1];

  // Извлекаем час начала занятия в виде числа
  const hour = startDate.getHours();

  const dayOfWeek = startDate.toLocaleDateString('ru-RU', { weekday: 'long' });
  const dateOfMonth = startDate.getDate();

  const exerciseDuration = duration;
  const roomTitle = room.title;
  const backgroundColor = service.color;

  return {
    exerciseTitle,
    trainerName,
    startTime,
    endTime,
    hour,
    dayOfWeek,
    dateOfMonth,
    exerciseDuration,
    roomTitle,
    backgroundColor,
    canceled
  };
}
