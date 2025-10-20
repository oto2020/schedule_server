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

    // Фоновый фетч для обновления кэша
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

async function fetchAndUpdateCache(startDate, endDate, cacheKey, startTime = Date.now()) {
  const dates = [];
  let currentDate = dayjs(startDate);
  const end = dayjs(endDate);

  // Генерируем список дат в диапазоне
  while (currentDate.isBefore(end) || currentDate.isSame(end, 'day')) {
    dates.push(currentDate.format('YYYY-MM-DD'));
    currentDate = currentDate.add(1, 'day');
  }

  console.log(`[FETCHING DAYS] Total days: ${dates.length}, dates: ${dates.join(', ')}`);

  // Отправляем запросы для каждого дня параллельно
  const fetchPromises = dates.map(date => fetchDayData(date));
  const results = await Promise.allSettled(fetchPromises);

  // Собираем данные: склеиваем классы и merge titleDescriptions
  const allClasses = [];
  const allTitleDescriptions = {};

  results.forEach((result, index) => {
    const date = dates[index];
    if (result.status === 'fulfilled' && result.value) {
      const dayData = result.value;
      allClasses.push(...dayData.classes);
      Object.assign(allTitleDescriptions, dayData.titleDescriptions);
      console.log(`[SUCCESS] Date: ${date}, classes: ${dayData.classes.length}`);
    } else {
      console.warn(`[FAILED] Date: ${date}, reason: ${result.reason?.message || 'unknown'}`);
      // Для неудачного дня — пусто, но ничего не добавляем
    }
  });

  const fetchedAt = new Date();
  const cacheValue = {
    data: allClasses,
    fetchedAt
  };

  cache.set(cacheKey, cacheValue);

  // LRU очистка
  while (cache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
    console.warn(`[CACHE LRU EVICTED] Removed oldest cache entry: ${oldestKey}`);
  }

  const duration = Date.now() - startTime;
  console.log(`[FETCHED] Params: startDate=${startDate}, endDate=${endDate}, total classes: ${allClasses.length}, duration=${duration}ms`);
  console.log(fetchedAt, dayjs(fetchedAt).fromNow());
  console.log('All titleDescriptions:', allTitleDescriptions);

  return {
    data: allClasses,
    fetchedAt,
    fetchedAtHuman: dayjs(fetchedAt).fromNow()
  };
}

function fetchDayData(date) {
  const startDateTime = `${date}T00:00:00`;
  const endDateTime = `${date}T23:59:59`;

  const options = {
    method: 'GET',
    hostname: process.env.API_HOSTNAME,
    port: process.env.API_PORT,
    path: `/fitness1c_chat/hs/api/v3/classes/?start_date=${encodeURIComponent(startDateTime)}&end_date=${encodeURIComponent(endDateTime)}&club_id=${encodeURIComponent(process.env.API_CLUB_ID)}`,
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
          const text = body.toString();

          if (!text.startsWith('{')) {
            console.error(`[RESPONSE IS NOT JSON] Date: ${date}`);
            console.error(text.substring(0, 500));
            return resolve({ classes: [], titleDescriptions: {} });
          }

          const jsonData = JSON.parse(text);

          // Если data отсутствует или пустое, возвращаем пусто
          if (!jsonData.data || !Array.isArray(jsonData.data)) {
            console.warn(`[EMPTY DATA] Date: ${date}`);
            return resolve({ classes: [], titleDescriptions: {} });
          }

          const classes = jsonData.data.map(el => extractDataFromJson(el));
          const titleDescriptions = {};

          for (let i = 0; i < jsonData.data.length; i++) {
            let el = extractTitleDescriptionFromJson(jsonData.data[i]);
            let title = el.title;
            let description = el.description;
            titleDescriptions[title] = { title, description };
          }

          console.log(`[PARSED] Date: ${date}, raw classes: ${jsonData.data.length}, processed: ${classes.length}`);
          resolve({ classes, titleDescriptions });
        } catch (err) {
          console.error(`[PARSING ERROR] Date: ${date}, ${err.message}`);
          resolve({ classes: [], titleDescriptions: {} });
        }
      });

      res.on("error", error => {
        console.error(`[REQUEST ERROR] Date: ${date}, ${error.message}`);
        resolve({ classes: [], titleDescriptions: {} });
      });
    });

    req.end();
  });
}

function extractTitleDescriptionFromJson(jsonData) {
  return { title: jsonData.service.title, description: jsonData.service.description };
}

function extractDataFromJson(jsonData) {
  const { service, employee, start_date, end_date, duration, room, canceled } = jsonData;
  const date = start_date.split(' ')[0];
  const startDate = new Date(start_date);
  const startTime = start_date.split(' ')[1];
  const endTime = end_date.split(' ')[1];
  const hour = startDate.getHours();
  const dayOfWeek = startDate.toLocaleDateString('ru-RU', { weekday: 'long' });
  const dayOfWeekNumber = (startDate.getDay() + 6) % 7;
  const dateOfMonth = startDate.getDate();

  return {
    exerciseTitle: service.title,
    trainerName: employee.name,
    date,
    startTime,
    endTime,
    hour,
    dayOfWeek,
    dayOfWeekNumber,
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