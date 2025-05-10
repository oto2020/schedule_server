const http = require('follow-redirects').http;
require('dotenv').config();

const dayjs = require('dayjs');
const relativeTime = require('dayjs/plugin/relativeTime');
require('dayjs/locale/ru');

dayjs.extend(relativeTime);
dayjs.locale('ru');

const cache = new Map();
const MAX_CACHE_ENTRIES = 100;

async function getSchedule(startDate, endDate, useCache = true) {
  const startTime = Date.now();
  const cacheKey = `${startDate}_${endDate}`;

  if (useCache && cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    const duration = Date.now() - startTime;

    console.log(`[CACHE HIT] Params: startDate=${startDate}, endDate=${endDate}, duration=${duration}ms`);

    fetchAndUpdateCache(startDate, endDate, cacheKey).catch(err => {
      console.error(`[BACKGROUND FETCH ERROR] ${err.message}`);
    });

    return {
      data: cached.data,
      fetchedAt: cached.fetchedAt,
      fetchedAtHuman: dayjs(cached.fetchedAt).fromNow()
    };
  }

  return fetchAndUpdateCache(startDate, endDate, cacheKey, startTime);
}

function fetchAndUpdateCache(startDate, endDate, cacheKey, startTime = Date.now()) {
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

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      const chunks = [];

      res.on("data", chunk => chunks.push(chunk));
      res.on("end", () => {
        try {
          const body = Buffer.concat(chunks);
          const jsonData = JSON.parse(body);

          const classes = jsonData.data.map(el => extractDataFromJson(el));
          const fetchedAt = new Date();

          const cacheValue = {
            data: classes,
            fetchedAt
          };

          cache.set(cacheKey, cacheValue);

          // 💡 LRU очистка
          while (cache.size > MAX_CACHE_ENTRIES) {
            const oldestKey = cache.keys().next().value;
            cache.delete(oldestKey);
            console.warn(`[CACHE LRU EVICTED] Removed oldest cache entry: ${oldestKey}`);
          }

          const duration = Date.now() - startTime;
          console.log(`[FETCHED] Params: startDate=${startDate}, endDate=${endDate}, duration=${duration}ms`);

          console.log(fetchedAt, dayjs(fetchedAt).fromNow());
          resolve({
            data: classes,
            fetchedAt,
            fetchedAtHuman: dayjs(fetchedAt).fromNow()
          });
        } catch (err) {
          console.error(`[PARSING ERROR] ${err.message}`);
          reject(err);
        }
      });

      res.on("error", error => {
        const duration = Date.now() - startTime;
        console.error(`[ERROR] Params: startDate=${startDate}, endDate=${endDate}, duration=${duration}ms`);
        reject(error);
      });
    });

    req.end();
  });
}

function extractDataFromJson(jsonData) {
  const { service, employee, start_date, end_date, duration, room, canceled } = jsonData;

  const startDate = new Date(start_date);
  const startTime = start_date.split(' ')[1];
  const endTime = end_date.split(' ')[1];
  const hour = startDate.getHours();
  const dayOfWeek = startDate.toLocaleDateString('ru-RU', { weekday: 'long' });
  const dateOfMonth = startDate.getDate();

  return {
    exerciseTitle: service.title,
    trainerName: employee.name,
    startTime,
    endTime,
    hour,
    dayOfWeek,
    dateOfMonth,
    exerciseDuration: duration,
    roomTitle: room.title,
    backgroundColor: service.color,
    canceled
  };
}

module.exports = {
  getSchedule
};
