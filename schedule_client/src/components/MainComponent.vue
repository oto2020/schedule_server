/* eslint-disable */
<template>
  <div class="">

    <div v-show="!fullScreenMode" name="Все кнопки с фильтрами: помещения и переключатели" style="text-align: left;">

      <div class="d-flex flex-wrap">
        <div v-for="section in roomsSections" :key="section" class="m-1">
          <div class="filter-title">{{ section.title }}</div>
          <div class="p-1">
            <div class="list-group">
              <button type="button" v-for="(item, index) in section.rooms" :key="index"
                :class="{ 'room-button list-group-item list-group-item-action active': item.isActive, 'room-button list-group-item list-group-item-action': !item.isActive }"
                @click="handleRoomButtonClick(item)">
                <font-awesome-icon v-if="item.isActive" :icon="['far', 'check-square']" />
                <font-awesome-icon v-if="!item.isActive" :icon="['far', 'square']" />
                {{ item.title }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="d-flex flex-wrap">
        <div name="Выбор коммерческого или бесплатного занятия commercials" class="filter-block m-1">
          <div class="filter-title">По стоимости</div>
          <div class="">
            <button v-for="commercial in commercials" :key="commercial" type="button"
              :class="{ 'filter-button btn active m-1': commercial.isActive, 'filter-button btn m-1': !commercial.isActive }"
              @click="handleCommercialButtonClick(commercial.val)">
              <font-awesome-icon :icon="['fas', commercial.icon]" />
              <br>
              {{ commercial.title }}
            </button>
          </div>
        </div>

        <div name="Выбор режима просмотра полный средний или минимальный modes" class="filter-block m-1">
          <div class="filter-title">Режим отображения строк</div>
          <div>
            <button v-for="mode in modes" :key="mode" type="button"
              :class="{ 'filter-button btn active m-1': mode.isActive, 'filter-button btn m-1': !mode.isActive }"
              @click="handleModeButtonClick(mode.val)">
              <font-awesome-icon :icon="['fas', mode.icon]" />
              <br>
              {{ mode.title }}
            </button>
          </div>
        </div>

        <div name="Выбор детских или взрослых занятий kids" class="filter-block m-1">
          <div class="filter-title">Возрастная группа</div>
          <div>
            <button v-for="kid in kids" :key="kid" type="button"
              :class="{ 'filter-button btn active m-1': kid.isActive, 'filter-button btn m-1': !kid.isActive }"
              @click="handleKidButtonClick(kid.val)">
              <font-awesome-icon :icon="['fas', kid.icon]" />
              <br>
              {{ kid.title }}
            </button>
          </div>
        </div>

        <div name="Выбор частей недели weekParts" class="filter-block m-1">
          <div class="filter-title">Выбор дней недели</div>
          <div>
            <button v-for="wp in weekParts" :key="wp" type="button"
              :class="{ 'filter-button btn active m-1': wp.isActive, 'filter-button btn m-1': !wp.isActive }"
              :disabled="isGeneratingAllPDFs"
              @click="handleWeekPartButtonClick(wp.val)">
              <font-awesome-icon :icon="['fas', wp.icon]" />
              <br>
              {{ wp.title }}
            </button>
          </div>
        </div>
      </div>

      <!-- Индикатор прогресса генерации PDF -->
      <div v-if="isGeneratingAllPDFs" class="m-3 p-3 bg-light border rounded">
        <div class="d-flex align-items-center">
          <div class="me-3">
            <font-awesome-icon icon="spinner" size="lg" spin />
          </div>
          <div class="flex-grow-1">
            <h6 class="mb-1">Генерация PDF файлов...</h6>
            <div class="progress mb-1" style="height: 20px;">
              <div class="progress-bar bg-success" role="progressbar" 
                   :style="{ width: pdfGenerationProgress + '%' }" 
                   :aria-valuenow="pdfGenerationProgress" 
                   aria-valuemin="0" 
                   aria-valuemax="100">
                {{ pdfGenerationProgress }}%
              </div>
            </div>
            <small class="text-muted">Пожалуйста, не закрывайте страницу до завершения процесса</small>
          </div>
        </div>
      </div>

      <div class="m-2 d-inline-block">Отступ справа при печати: <input v-model="paddingRightPercent"
          style="width: 60px; margin-right:4px;">%</div>
      <button @click="generatePDF()" :disabled="isGeneratingAllPDFs">Генерировать PDF A4 альбом с заданным отступом справа под наши уникальные
        неформальные рамки с отступом {{ paddingRightPercent }}%</button>

      <div class="w-100 fs-4 d-flex pl-4 mt-4">
        <button type="button" class="btn btn-outline-secondary"
          @click="weekNumberDecrementButtonClick"><font-awesome-icon :icon="['fas', 'fa-chevron-left']" /></button>
        <div class="mx-2">{{ computedStartDate }} — {{ computedEndDate }}</div>
        <button type="button" class="btn btn-outline-secondary"
          @click="weekNumberIncrementButtonClick"><font-awesome-icon :icon="['fas', 'fa-chevron-right']" /></button>
        <div name="Перечисление выбранных помещений" class="ml-2" style="margin-left: 10px;">
          {{ this.computedAllowedRoomTitles.join(', ') }}
        </div>
        <div class="ms-auto">
          <button class="btn" @click="forceRefresh">
            <img v-if="schedule" class="g1logo" :src="require('@/g1logo.png')" alt="Пример изображения">
            <div v-else class="mr-1"><font-awesome-icon icon="spinner" size="lg" spin /></div>
          </button>
        </div>
      </div>
    </div>

    <div name="Печатаемый контент" id="printingContent" v-if="fontSizeVW">
      <div id="contentCenter">
        <!-- Таблица для режима l -->
        <table v-if="computedModeValue === 'Три дня недели'" class="table table-bordered line-height-1-2 mb-4"
          style="table-layout: fixed; width: 100%;">
          <thead class="head-separator">
            <!-- Первая строка: дни недели -->
            <tr>
              <th rowspan="2" class="clock-column-style" @click="toggleFullScreen(true)">
                <font-awesome-icon :icon="['fas', 'clock']" size="sm" />
              </th>
              <th v-for="day in scheduleDays" :key="day" :colspan="scheduleRooms.length"
                class="text-center weekday-header">
                {{ day }}
              </th>
            </tr>
            <!-- Вторая строка: помещения -->
            <tr>
              <template v-for="day in scheduleDays" :key="day">
                <th v-for="(room, roomIndex) in scheduleRooms" :key="room" class="col-md-1 text-center" :class="[
                  'col-md-1', 'text-center', 'room-header',
                  (roomIndex === scheduleRooms.length - 1) ? 'day-separator' : '',
                  'day-group-bg-' + (scheduleDays.indexOf(day) % 2)
                ]">
                  {{ room }}
                </th>
              </template>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(hourData, hour) in scheduleByHours" :key="hour">
              <td class="clock-column-style day-separator day-group-bg-1">
                {{ hour }}
              </td>
              <template v-for="day in scheduleDays" :key="day">
                <td v-for="(room, roomIndex) in scheduleRooms" :key="room" class="td-container" :class="[
                  'td-container',
                  (roomIndex === scheduleRooms.length - 1) ? 'day-separator' : '',
                  'day-group-bg-' + (scheduleDays.indexOf(day) % 2)
                ]">
                  <div v-if="hourData[day] && hourData[day][room]" class="inner-div">
                    <div v-for="l in hourData[day][room]" :key="l.id || l.startTime + l.exerciseTitle">
                      <div class="lesson-parent m-1" :style="{ border: '1px solid ' + l.backgroundColor }">
                        <div>
                          <div class="exercise-title">{{ l.exerciseTitle }}</div>
                          <div class="trainer-name text-truncate d-inline-block">{{ l.trainerName }}</div>
                          <div class="trainer-name text-truncate d-inline-block">{{ formatDate(l.date) }}</div>
                          <div class="start-end-time">{{ l.startTime }} - {{ l.endTime }}</div>
                        </div>
                        <span class="lesson-color" :style="{ background: l.backgroundColor }"></span>
                        <div v-if="l.exerciseTitle.includes('₽')" class="ruble-icon">
                          <font-awesome-icon :icon="['fas', 'ruble-sign']" size="sm" />
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
              </template>
            </tr>
          </tbody>
        </table>
      </div>
      <div id="contentRight"></div>
    </div>
  </div>
</template>

<script>
/* eslint-disable no-mixed-spaces-and-tabs */
import axios from 'axios';
import { reactive } from 'vue';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default {
  name: 'MainComponent',
  data() {
    return {
      excerciseTitleFontSize: '18pt', // Reduced from 20pt to 18pt (10% reduction)
      weekdayHeaderFontSize: '20pt',
      roomHeaderTitleFontSize: '20pt',
      fontSizeVW: '100%',
      paddingRightPercent: 6.4,
      fullScreenMode: false,
      year: 0,
      weekNumber: 0,
      startDate: '',
      endDate: '',
      kids: [
        { title: 'Любые', icon: 'users', val: 'all', isActive: false },
        { title: 'Детские', icon: 'child', val: 'kid', isActive: false },
        { title: 'Взрослые', icon: 'user-tie', val: 'non-kid', isActive: true },
      ],
      commercials: [
        { title: 'Неважно', val: 'all', isActive: true, icon: 'question' },
        { title: 'Платные', val: 'commercial', isActive: false, icon: 'ruble-sign' },
        { title: 'Бесплатные', val: 'non-commercial', isActive: false, icon: 'fa-gift' },
      ],
      modes: [
        { title: 'Три дня недели', val: 'Три дня недели', isActive: true, icon: 'expand' },
      ],
      weekParts: [
        { title: 'Пн, Вт, Ср', icon: 'calendar', val: '0,1,2', isActive: false },
        { title: 'Ср, Чт, Пт', icon: 'calendar', val: '2,3,4', isActive: true },
        { title: 'Пт, Сб, Вс', icon: 'calendar', val: '4,5,6', isActive: false },
        { title: 'Вся неделя', icon: 'calendar', val: '0,1,2,3,4,5,6', isActive: false },
      ],
      schedule: [],
      rooms: [],
      roomsSections: [
        {
          "title": "ТЗ и студии",
          "icon": "tz",
          "rooms": [
            { "isActive": false, "title": "Тренажерный зал" },
            { "isActive": false, "title": "Студия пилатес" },
          ]
        },
        {
          "title": "Кроссфит и единоборства",
          "icon": "ring",
          "rooms": [
            { "isActive": false, "title": "Зона кроссфита" },
            { "isActive": false, "title": "Зона единоборств" }
          ]
        },
        {
          "title": "Групповые программы",
          "icon": "gp",
          "rooms": [
            { "isActive": true, "title": "Зал №1" },
            { "isActive": true, "title": "Зал №2" }
          ]
        },
        {
          "title": "Сайкл",
          "icon": "cycle",
          "rooms": [
            { "isActive": false, "title": "Сайкл студия" },
            { "isActive": false, "title": "Студия йоги" },
          ]
        },
        {
          "title": "Бассейны",
          "icon": "bassei",
          "rooms": [
            { "isActive": false, "title": "Аква зона" },
            { "isActive": false, "title": "Малый бассейн" },
          ]
        },
      ],
      scheduleByHours: reactive({}),
      testMode: false,
      isGeneratingAllPDFs: false,
      pdfGenerationProgress: 0,
      scheduleByHoursTest: { "7": null, "8": null, "9": { "понедельник": [], "вторник": [{ "exerciseTitle": "ХАТХА YOGA 60", "trainerName": "Шакура  Светлана", "startTime": "09:00", "endTime": "10:00", "hour": 9, "dayOfWeek": "вторник", "dateOfMonth": 9, "exerciseDuration": 60, "roomTitle": "Зал №1", "backgroundColor": "#B8C6EA" }], "среда": [], "четверг": [{ "exerciseTitle": "ХАТХА YOGA 60", "trainerName": "Шакура  Светлана", "startTime": "09:00", "endTime": "10:00", "hour": 9, "dayOfWeek": "четверг", "dateOfMonth": 11, "exerciseDuration": 60, "roomTitle": "Зал №1", "backgroundColor": "#B8C6EA" }], "пятница": [], "суббота": [{ "exerciseTitle": "СУСТАВНАЯ ГИМНАСТИКА", "trainerName": "Замостьянин Валерий", "startTime": "09:00", "endTime": "10:00", "hour": 9, "dayOfWeek": "суббота", "dateOfMonth": 13, "exerciseDuration": 60, "roomTitle": "Зал №1", "backgroundColor": "#CCFFCC" }], "воскресенье": [] }, "10": { "понедельник": [], "вторник": [{ "exerciseTitle": "STRETCHING", "trainerName": "Рогозинская Елена", "startTime": "10:00", "endTime": "11:00", "hour": 10, "dayOfWeek": "вторник", "dateOfMonth": 9, "exerciseDuration": 60, "roomTitle": "Зал №1", "backgroundColor": "#1974CE" }], "среда": [{ "exerciseTitle": "PILATES", "trainerName": "Волкова  Виктория ", "startTime": "10:00", "endTime": "11:00", "hour": 10, "dayOfWeek": "среда", "dateOfMonth": 10, "exerciseDuration": 60, "roomTitle": "Зал №1", "backgroundColor": "#CCFFCC" }], "четверг": [{ "exerciseTitle": "МЕДИТАЦИЯ В ГАМАКАХ ₽*", "trainerName": "Шакура  Светлана", "startTime": "10:00", "endTime": "11:00", "hour": 10, "dayOfWeek": "четверг", "dateOfMonth": 11, "exerciseDuration": 60, "roomTitle": "Студия йоги ", "backgroundColor": "#FFD700" }, { "exerciseTitle": "STRETCHING", "trainerName": "Рогозинская Елена", "startTime": "10:00", "endTime": "11:00", "hour": 10, "dayOfWeek": "четверг", "dateOfMonth": 11, "exerciseDuration": 60, "roomTitle": "Зал №1", "backgroundColor": "#1974CE" }], "пятница": [{ "exerciseTitle": "ZUMBA", "trainerName": "Николаенко Анна", "startTime": "10:00", "endTime": "11:00", "hour": 10, "dayOfWeek": "пятница", "dateOfMonth": 12, "exerciseDuration": 60, "roomTitle": "Зал №1", "backgroundColor": "#EE82EE" }], "суббота": [{ "exerciseTitle": "ХАТХА YOGA 60", "trainerName": "Шакура  Светлана", "startTime": "10:00", "endTime": "11:00", "hour": 10, "dayOfWeek": "суббота", "dateOfMonth": 13, "exerciseDuration": 60, "roomTitle": "Зал №1", "backgroundColor": "#B8C6EA" }], "воскресенье": [] }, "11": { "понедельник": [{ "exerciseTitle": "STRETCHING", "trainerName": "Волкова  Виктория ", "startTime": "11:00", "endTime": "12:00", "hour": 11, "dayOfWeek": "понедельник", "dateOfMonth": 8, "exerciseDuration": 60, "roomTitle": "Зал №1", "backgroundColor": "#1974CE" }], "вторник": [{ "exerciseTitle": "UNIFLY ₽", "trainerName": "Заремблюк Наталия", "startTime": "11:00", "endTime": "11:55", "hour": 11, "dayOfWeek": "вторник", "dateOfMonth": 9, "exerciseDuration": 55, "roomTitle": "Студия йоги ", "backgroundColor": "#FFD700" }], "среда": [{ "exerciseTitle": "YOGA HEALTH ₽", "trainerName": "Рогозинская Елена", "startTime": "11:00", "endTime": "12:20", "hour": 11, "dayOfWeek": "среда", "dateOfMonth": 10, "exerciseDuration": 80, "roomTitle": "Студия йоги ", "backgroundColor": "#A6CAF0" }, { "exerciseTitle": "TOTAL MAX & BOSU/FITBALL", "trainerName": "Сысоева Олеся", "startTime": "11:00", "endTime": "11:55", "hour": 11, "dayOfWeek": "среда", "dateOfMonth": 10, "exerciseDuration": 55, "roomTitle": "Зал №1", "backgroundColor": "#FBED9E" }], "четверг": [{ "exerciseTitle": "СУСТАВНАЯ ГИМНАСТИКА", "trainerName": "Замостьянин Валерий", "startTime": "11:00", "endTime": "12:00", "hour": 11, "dayOfWeek": "четверг", "dateOfMonth": 11, "exerciseDuration": 60, "roomTitle": "Зал №1", "backgroundColor": "#CCFFCC" }], "пятница": [{ "exerciseTitle": "UNIFLY ₽", "trainerName": "Заремблюк Наталия", "startTime": "11:00", "endTime": "11:55", "hour": 11, "dayOfWeek": "пятница", "dateOfMonth": 12, "exerciseDuration": 55, "roomTitle": "Студия йоги ", "backgroundColor": "#FFD700" }, { "exerciseTitle": "STRONG NATION", "trainerName": "Николаенко Анна", "startTime": "11:00", "endTime": "12:00", "hour": 11, "dayOfWeek": "пятница", "dateOfMonth": 12, "exerciseDuration": 60, "roomTitle": "Зал №1", "backgroundColor": "#D02090" }], "суббота": [], "воскресенье": [{ "exerciseTitle": "PILATES", "trainerName": "Сысоева Олеся", "startTime": "11:00", "endTime": "12:00", "hour": 11, "dayOfWeek": "воскресенье", "dateOfMonth": 14, "exerciseDuration": 60, "roomTitle": "Зал №1", "backgroundColor": "#CCFFCC" }] }, "12": { "понедельник": [{ "exerciseTitle": "UNIFLY ₽", "trainerName": "Заремблюк Наталия", "startTime": "12:00", "endTime": "12:55", "hour": 12, "dayOfWeek": "понедельник", "dateOfMonth": 8, "exerciseDuration": 55, "roomTitle": "Студия йоги ", "backgroundColor": "#FFD700" }, { "exerciseTitle": "ANIMAL FLOW ₽*", "trainerName": "Волкова  Виктория ", "startTime": "12:00", "endTime": "13:00", "hour": 12, "dayOfWeek": "понедельник", "dateOfMonth": 8, "exerciseDuration": 60, "roomTitle": "Зал №1", "backgroundColor": "#FFB6C1" }], "вторник": [], "среда": [], "четверг": [{ "exerciseTitle": "PILATES", "trainerName": "Волкова  Виктория ", "startTime": "12:00", "endTime": "13:00", "hour": 12, "dayOfWeek": "четверг", "dateOfMonth": 11, "exerciseDuration": 60, "roomTitle": "Зал №1", "backgroundColor": "#CCFFCC" }], "пятница": [], "суббота": [], "воскресенье": [] }, "13": null, "14": { "понедельник": [], "вторник": [{ "exerciseTitle": "СУСТАВНАЯ ГИМНАСТИКА", "trainerName": "Замостьянин Валерий", "startTime": "14:00", "endTime": "15:00", "hour": 14, "dayOfWeek": "вторник", "dateOfMonth": 9, "exerciseDuration": 60, "roomTitle": "Зал №1", "backgroundColor": "#CCFFCC" }], "среда": [], "четверг": [], "пятница": [], "суббота": [], "воскресенье": [] }, "15": { "понедельник": [], "вторник": [{ "exerciseTitle": "PILATES", "trainerName": "Сысоева Олеся", "startTime": "15:00", "endTime": "16:00", "hour": 15, "dayOfWeek": "вторник", "dateOfMonth": 9, "exerciseDuration": 60, "roomTitle": "Зал №1", "backgroundColor": "#CCFFCC" }], "среда": [{ "exerciseTitle": "ZUMBA GOLD", "trainerName": "Николаенко Анна", "startTime": "15:00", "endTime": "16:00", "hour": 15, "dayOfWeek": "среда", "dateOfMonth": 10, "exerciseDuration": 60, "roomTitle": "Зал №1", "backgroundColor": "#EE82EE" }], "четверг": [{ "exerciseTitle": "CIRCL MOBILITY", "trainerName": "Николаенко Анна", "startTime": "15:00", "endTime": "16:00", "hour": 15, "dayOfWeek": "четверг", "dateOfMonth": 11, "exerciseDuration": 60, "roomTitle": "Зал №1", "backgroundColor": "#CCFFCC" }], "пятница": [{ "exerciseTitle": "СУСТАВНАЯ ГИМНАСТИКА", "trainerName": "Замостьянин Валерий", "startTime": "15:00", "endTime": "16:00", "hour": 15, "dayOfWeek": "пятница", "dateOfMonth": 12, "exerciseDuration": 60, "roomTitle": "Зал №1", "backgroundColor": "#CCFFCC" }], "суббота": [], "воскресенье": [] }, "16": null, "17": null, "18": { "понедельник": [], "вторник": [{ "exerciseTitle": "STRONG NATION", "trainerName": "Николаенко Анна", "startTime": "18:00", "endTime": "19:00", "hour": 18, "dayOfWeek": "вторник", "dateOfMonth": 9, "exerciseDuration": 60, "roomTitle": "Зал №1", "backgroundColor": "#D02090" }], "среда": [], "четверг": [{ "exerciseTitle": "UNIFLY ₽", "trainerName": "Заремблюк Наталия", "startTime": "18:00", "endTime": "18:55", "hour": 18, "dayOfWeek": "четверг", "dateOfMonth": 11, "exerciseDuration": 55, "roomTitle": "Студия йоги ", "backgroundColor": "#FFD700" }, { "exerciseTitle": "ANIMAL FLOW ₽*", "trainerName": "Николаенко Анна", "startTime": "18:00", "endTime": "19:00", "hour": 18, "dayOfWeek": "четверг", "dateOfMonth": 11, "exerciseDuration": 60, "roomTitle": "Зал №1", "backgroundColor": "#FFB6C1" }], "пятница": [{ "exerciseTitle": "ART FUNCTIONAL", "trainerName": "Волкова  Виктория ", "startTime": "18:00", "endTime": "18:55", "hour": 18, "dayOfWeek": "пятница", "dateOfMonth": 12, "exerciseDuration": 55, "roomTitle": "Зал №1", "backgroundColor": "#CCFFCC" }], "суббота": [], "воскресенье": [] }, "19": { "понедельник": [], "вторник": [{ "exerciseTitle": "ZUMBA", "trainerName": "Николаенко Анна", "startTime": "19:00", "endTime": "20:00", "hour": 19, "dayOfWeek": "вторник", "dateOfMonth": 9, "exerciseDuration": 60, "roomTitle": "Зал №1", "backgroundColor": "#EE82EE" }], "среда": [{ "exerciseTitle": "UNIFLY ₽", "trainerName": "Заремблюк Наталия", "startTime": "19:00", "endTime": "19:55", "hour": 19, "dayOfWeek": "среда", "dateOfMonth": 10, "exerciseDuration": 55, "roomTitle": "Студия йоги ", "backgroundColor": "#FFD700" }, { "exerciseTitle": "PROPILATES ₽", "trainerName": "Волкова  Виктория ", "startTime": "19:00", "endTime": "19:55", "hour": 19, "dayOfWeek": "среда", "dateOfMonth": 10, "exerciseDuration": 55, "roomTitle": "Зал №1", "backgroundColor": null }], "четверг": [{ "exerciseTitle": "ZUMBA", "trainerName": "Николаенко Анна", "startTime": "19:00", "endTime": "20:00", "hour": 19, "dayOfWeek": "четверг", "dateOfMonth": 11, "exerciseDuration": 60, "roomTitle": "Зал №1", "backgroundColor": "#EE82EE" }], "пятница": [{ "exerciseTitle": "STRETCHING", "trainerName": "Волкова  Виктория ", "startTime": "19:00", "endTime": "20:00", "hour": 19, "dayOfWeek": "пятница", "dateOfMonth": 12, "exerciseDuration": 60, "roomTitle": "Зал №1", "backgroundColor": "#1974CE" }], "суббота": [], "воскресенье": [] }, "20": { "понедельник": [], "вторник": [{ "exerciseTitle": "CIRCL MOBILITY", "trainerName": "Николаенко Анна", "startTime": "20:00", "endTime": "21:00", "hour": 20, "dayOfWeek": "вторник", "dateOfMonth": 9, "exerciseDuration": 60, "roomTitle": "Зал №1", "backgroundColor": "#CCFFCC" }], "среда": [{ "exerciseTitle": "ХАТХА YOGA 60", "trainerName": "Шакура  Светлана", "startTime": "20:00", "endTime": "21:00", "hour": 20, "dayOfWeek": "среда", "dateOfMonth": 10, "exerciseDuration": 60, "roomTitle": "Зал №1", "backgroundColor": "#B8C6EA" }], "четверг": [], "пятница": [{ "exerciseTitle": "ХАТХА YOGA 60", "trainerName": "Шакура  Светлана", "startTime": "20:00", "endTime": "21:00", "hour": 20, "dayOfWeek": "пятница", "dateOfMonth": 12, "exerciseDuration": 60, "roomTitle": "Зал №1", "backgroundColor": "#B8C6EA" }], "суббота": [], "воскресенье": [] }, "21": null, "22": null },
      weekDays: ['понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье'],
    };
  },
  mounted() {
    this.year = this.getCurrentYear();
    this.weekNumber = this.getCurrentWeekNumber();
    this.setWeekStartEndDate(this.year, this.weekNumber);
    console.log('Компонент загружен!');
    if (this.testMode == false) {
      // Восстановим состояние фильтров из URL перед загрузкой данных
      this.restoreStateFromUrl();
      this.fetchData();
    }
  },
  computed: {
    computedAllowedRoomTitles() {
      let allowedRoomTitles = [];
      this.roomsSections.forEach((curr) => { allowedRoomTitles.push(...curr.rooms.filter(item => item.isActive).map(el => el.title)); });
      return allowedRoomTitles;
    },
    computedStartDate() {
      const options = { day: 'numeric', month: 'long' };
      const date = new Date(this.startDate);
      return date.toLocaleDateString('ru-RU', options);
    },
    computedEndDate() {
      const options = { day: 'numeric', month: 'long' };
      const date = new Date(this.endDate);
      return date.toLocaleDateString('ru-RU', options);
    },
    computedKidValue() {
      return this.kids.find((kid) => kid.isActive).val;
    },
    computedModeValue() {
      return this.modes.find((mode) => mode.isActive).val;
    },
    computedCommercialValue() {
      return this.commercials.find((commercial) => commercial.isActive).val;
    },
    computedWeekPartValue() {
      return this.weekParts.find((wp) => wp.isActive).val;
    },
  },
  methods: {
    toggleFullScreen() {
      this.fullScreenMode = !this.fullScreenMode;
    },
    weekNumberIncrementButtonClick() {
      if (this.weekNumber == 52) {
        this.weekNumber = 1;
        this.year++;
      } else {
        this.weekNumber++;
      }
      this.setWeekStartEndDate(this.year, this.weekNumber);
      this.fetchData();
    },
    weekNumberDecrementButtonClick() {
      if (this.weekNumber == 1) {
        this.weekNumber = 52;
        this.year--;
      } else {
        this.weekNumber--;
      }
      this.setWeekStartEndDate(this.year, this.weekNumber);
      this.fetchData();
    },
    setWeekStartEndDate(year, weekNumber) {
      const januaryFirst = new Date(year, 0, 1);
      const daysToMonday = (1 - januaryFirst.getDay() + 7) % 7;
      const daysToTargetWeek = (weekNumber - 1) * 7;
      const currentWeekStartDate = new Date(januaryFirst);
      currentWeekStartDate.setDate(januaryFirst.getDate() + daysToMonday + daysToTargetWeek);
      currentWeekStartDate.setHours(0, 0, 0, 0);
      const nextWeekStartDate = new Date(currentWeekStartDate);
      nextWeekStartDate.setDate(currentWeekStartDate.getDate() + 7);
      const currentWeekEndDate = new Date(nextWeekStartDate);
      currentWeekEndDate.setSeconds(currentWeekEndDate.getSeconds() - 1);
      this.startDate = this.formatDateToISOStringWithoutMilliseconds(currentWeekStartDate);
      this.endDate = this.formatDateToISOStringWithoutMilliseconds(currentWeekEndDate);
    },
    formatDateToISOStringWithoutMilliseconds(date) {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    },
    getMondayMidnightDate(weekNumber, year) {
      const januaryFirst = new Date(year, 0, 1);
      const daysToMonday = (1 - januaryFirst.getDay() + 7) % 7;
      const daysToTargetWeek = (weekNumber - 1) * 7;
      const targetDate = new Date(januaryFirst);
      targetDate.setDate(januaryFirst.getDate() + daysToMonday + daysToTargetWeek);
      targetDate.setHours(0, 0, 0, 0);
      return targetDate;
    },
    getCurrentYear() {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      return currentYear;
    },
    getCurrentWeekNumber() {
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      currentDate.setDate(currentDate.getDate() + 4 - (currentDate.getDay() || 7));
      const yearStart = new Date(currentDate.getFullYear(), 0, 1);
      const weekNumber = Math.ceil(((currentDate - yearStart) / 86400000 + 1) / 7);
      return weekNumber;
    },
    formatDate(dateStr) {
      const date = new Date(dateStr);
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    },
    formatDateForFilename(dateStr) {
      const date = new Date(dateStr);
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const dayOfWeek = date.toLocaleDateString('ru-RU', { weekday: 'short' });
      return `${day}.${month.toString().padStart(2, '0')} (${dayOfWeek})`;
    },
    formatWeekPartRangeForFilename() {
      // Строит строку вроде: 29.10-31.10 (ср-пт)
      const activeWeekPart = this.weekParts.find(wp => wp.isActive);
      if (!activeWeekPart) {
        // Фоллбэк на старое поведение
        const startD = new Date(this.startDate);
        const endD = new Date(this.endDate);
        const dd = (n) => n.toString().padStart(2, '0');
        const s = `${dd(startD.getDate())}.${dd(startD.getMonth() + 1)}`;
        const e = `${dd(endD.getDate())}.${dd(endD.getMonth() + 1)}`;
        const sw = startD.toLocaleDateString('ru-RU', { weekday: 'short' });
        const ew = endD.toLocaleDateString('ru-RU', { weekday: 'short' });
        return `${s}-${e} (${sw}-${ew})`;
      }

      const dayNumbers = activeWeekPart.val
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .map(Number)
        .sort((a, b) => a - b);

      // Базовая дата понедельника текущей недели берётся из startDate
      const monday = new Date(this.startDate);
      const firstDay = new Date(monday);
      const lastDay = new Date(monday);
      firstDay.setDate(monday.getDate() + dayNumbers[0]);
      lastDay.setDate(monday.getDate() + dayNumbers[dayNumbers.length - 1]);

      const dd = (n) => n.toString().padStart(2, '0');
      const firstStr = `${dd(firstDay.getDate())}.${dd(firstDay.getMonth() + 1)}`;
      const lastStr = `${dd(lastDay.getDate())}.${dd(lastDay.getMonth() + 1)}`;
      const firstW = firstDay.toLocaleDateString('ru-RU', { weekday: 'short' });
      const lastW = lastDay.toLocaleDateString('ru-RU', { weekday: 'short' });
      return `${firstStr}-${lastStr} (${firstW}-${lastW})`;
    },
    applySettings() {
      let filteredSchedule = this.schedule.filter(el => this.computedAllowedRoomTitles.includes(el.roomTitle));
      if (this.computedCommercialValue === 'commercial') {
        filteredSchedule = filteredSchedule.filter(el => el.exerciseTitle.includes('₽'));
      }
      if (this.computedCommercialValue === 'non-commercial') {
        filteredSchedule = filteredSchedule.filter(el => !el.exerciseTitle.includes('₽'));
      }
      if (this.computedKidValue === 'kid') {
        filteredSchedule = filteredSchedule.filter(el => el.exerciseTitle.includes('KIDS'));
      }
      if (this.computedKidValue === 'non-kid') {
        filteredSchedule = filteredSchedule.filter(el => !el.exerciseTitle.includes('KIDS'));
      }
      if (this.computedWeekPartValue) {
        const allowedDays = this.computedWeekPartValue
          .split(',')
          .map(str => str.trim())
          .filter(str => str !== '')
          .map(Number);
        filteredSchedule = filteredSchedule.filter(el => allowedDays.includes(Number(el.dayOfWeekNumber)));
      }
      this.scheduleByHours = [];
      if (this.computedModeValue === 'Три дня недели') {
        let result = {};
        const allowedDayNumbers = this.computedWeekPartValue
          .split(',')
          .map(str => str.trim())
          .filter(str => str !== '')
          .map(Number);
        const allowedDays = allowedDayNumbers.map(num => this.weekDays[num]);
        const usedDays = [...new Set(
          filteredSchedule
            .map(el => el.dayOfWeek)
            .filter(day => allowedDays.includes(day))
        )];
        const usedRooms = [...new Set(filteredSchedule.map(el => el.roomTitle))].sort((a, b) => a.localeCompare(b));
        for (let hour = 7; hour <= 22; hour++) {
          result[hour] = {};
          usedDays.forEach(day => {
            if (!result[hour][day]) result[hour][day] = {};
            usedRooms.forEach(room => {
              const entries = filteredSchedule.filter(
                item => item.hour === hour && item.dayOfWeek === day && item.roomTitle === room
              );
              result[hour][day][room] = entries.length > 0 ? entries : null;
            });
          });
        }
        this.scheduleDays = usedDays;
        this.scheduleRooms = usedRooms;
        this.scheduleByHours = result;
      }
    },
    handleRoomButtonClick(item) {
      item.isActive = !item.isActive;
      this.applySettings();
      this.updateUrlFromState();
    },
    handleModeButtonClick(modeVal) {
      this.modes.forEach(m => m.isActive = m.val == modeVal);
      this.applySettings();
    },
    handleCommercialButtonClick(commercialVal) {
      this.commercials.forEach(c => c.isActive = c.val == commercialVal);
      this.applySettings();
    },
    handleKidButtonClick(kidVal) {
      this.kids.forEach(k => k.isActive = k.val == kidVal);
      this.applySettings();
    },
    handleWeekPartButtonClick(wpVal) {
      // Если выбрана "Вся неделя", запускаем генерацию всех PDF
      if (wpVal === '0,1,2,3,4,5,6') {
        this.generateAllPDFs();
        return;
      }
      
      this.weekParts.forEach(wp => wp.isActive = wp.val == wpVal);
      this.applySettings();
      this.updateUrlFromState();
    },
    forceRefresh() {
      // Принудительное обновление данных и кэша для выбранной недели
      this.fetchData(true);
    },
    async generatePDF() {
      this.excerciseTitleFontSize = '22.5pt'; // Reduced from 25pt to 22.5pt (10% reduction)
      this.weekdayHeaderFontSize = '25pt';
      this.roomHeaderTitleFontSize = '25pt';
      const printingContent = document.getElementById('printingContent');
      const contentCenter = document.getElementById('contentCenter');
      const contentRight = document.getElementById('contentRight');
      const oldWidthPrintingContent = printingContent.offsetWidth;
      const A4_WIDTH = 297;
      const A4_HEIGHT = 210;
      const a4AspectRatio = A4_WIDTH / A4_HEIGHT;
      const newWidthPrintingContent = printingContent.offsetHeight * a4AspectRatio;
      if (newWidthPrintingContent > oldWidthPrintingContent)
        printingContent.style.width = newWidthPrintingContent + 'px';
      let contentCenterWidth = Math.floor(printingContent.offsetWidth * (100 - this.paddingRightPercent) / 100);
      let contentRightWidth = Math.ceil(printingContent.offsetWidth * (this.paddingRightPercent) / 100);
      contentCenter.style.width = contentCenterWidth + 'px';
      contentRight.style.width = contentRightWidth + 'px';
      const canvas = await html2canvas(printingContent);
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [printingContent.offsetWidth, printingContent.offsetHeight]
      });
      pdf.addImage(canvas.toDataURL('image/jpeg'), 'JPEG', 0, 0, printingContent.offsetWidth, printingContent.offsetHeight);
      const rangeLabel = this.formatWeekPartRangeForFilename();
      let fileName = `${rangeLabel}, ${this.computedAllowedRoomTitles.join(',')}`;
      pdf.save(fileName + '.pdf');
      printingContent.style.width = oldWidthPrintingContent + 'px';
      contentCenter.style.width = oldWidthPrintingContent + 'px';
      contentRight.style.width = '0 px';
      this.excerciseTitleFontSize = '18pt'; // Restore to reduced size
      this.weekdayHeaderFontSize = '20pt';
      this.roomHeaderTitleFontSize = '20pt';
    },
    async generateAllPDFs() {
      // Определяем комбинации weekParts и roomsSections
      const weekPartsCombinations = [
        { title: 'Пн, Вт, Ср', val: '0,1,2' },
        { title: 'Ср, Чт, Пт', val: '2,3,4' },
        { title: 'Пт, Сб, Вс', val: '4,5,6' }
      ];

      const roomsCombinations = [
        {
          title: 'ТЗ и студии',
          rooms: [
            { isActive: true, title: 'Тренажерный зал' },
            { isActive: true, title: 'Студия пилатес' }
          ]
        },
        {
          title: 'Кроссфит и единоборства', 
          rooms: [
            { isActive: true, title: 'Зона кроссфита' },
            { isActive: true, title: 'Зона единоборств' }
          ]
        },
        {
          title: 'Групповые программы',
          rooms: [
            { isActive: true, title: 'Зал №1' },
            { isActive: true, title: 'Зал №2' }
          ]
        },
        {
          title: 'Сайкл',
          rooms: [
            { isActive: true, title: 'Сайкл студия' },
            { isActive: true, title: 'Студия йоги' }
          ]
        },
        {
          title: 'Бассейны',
          rooms: [
            { isActive: true, title: 'Аква зона' }
          ]
        }
      ];

      // Сохраняем текущие настройки
      const originalWeekPart = this.weekParts.find(wp => wp.isActive);
      const originalRoomsSections = JSON.parse(JSON.stringify(this.roomsSections));

      // Устанавливаем флаг генерации
      this.isGeneratingAllPDFs = true;
      this.pdfGenerationProgress = 0;

      console.log('Начинаем генерацию 15 PDF файлов...');

      let currentFile = 1;
      const totalFiles = weekPartsCombinations.length * roomsCombinations.length;

      try {
        // Генерируем PDF для каждой комбинации
        for (const weekPart of weekPartsCombinations) {
          for (const roomsSection of roomsCombinations) {
            console.log(`Генерируем файл ${currentFile}/${totalFiles}: ${weekPart.title} - ${roomsSection.title}`);

            // Устанавливаем текущую комбинацию
            this.weekParts.forEach(wp => wp.isActive = wp.val === weekPart.val);
            this.roomsSections = JSON.parse(JSON.stringify(roomsCombinations));
            this.roomsSections.forEach(section => {
              if (section.title === roomsSection.title) {
                section.rooms = roomsSection.rooms;
              } else {
                section.rooms.forEach(room => room.isActive = false);
              }
            });

            // Применяем настройки и генерируем PDF
            this.applySettings();
            
            // Небольшая задержка для обновления DOM
            await new Promise(resolve => setTimeout(resolve, 100));
            
            await this.generatePDF();

            // Обновляем прогресс
            this.pdfGenerationProgress = Math.round((currentFile / totalFiles) * 100);
            currentFile++;
          }
        }

        console.log('Генерация всех PDF файлов завершена!');

      } catch (error) {
        console.error('Ошибка при генерации PDF:', error);
        alert('Произошла ошибка при генерации PDF файлов');
      } finally {
        // Восстанавливаем оригинальные настройки
        this.weekParts.forEach(wp => wp.isActive = wp.val === originalWeekPart.val);
        this.roomsSections = originalRoomsSections;
        this.applySettings();
        
        // Сбрасываем флаг генерации
        this.isGeneratingAllPDFs = false;
        this.pdfGenerationProgress = 0;
      }
    },
    async fetchData(force = false) {
      try {
        this.schedule = null;
        console.log(process.env.VUE_APP_API_URL);
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/schedule/current?startDate=${this.startDate}&endDate=${this.endDate}&useCache=${!force}`);
        this.schedule = response.data.data;
        this.rooms = [...new Set(this.schedule.map(item => item.roomTitle))].sort().map(el => { return { isActive: false, title: el } });
        this.applySettings();
        this.updateUrlFromState();
        console.log(`Обновлено ${response.data.fetchedAtHuman}`);
      } catch (error) {
        console.error('Ошибка при получении данных:', error);
      }
    },
    updateUrlFromState() {
      try {
        const params = new URLSearchParams(window.location.search);
        // weekPart
        const activeWeekPart = this.weekParts.find(wp => wp.isActive);
        if (activeWeekPart) params.set('weekPart', activeWeekPart.val);
        // rooms (из roomsSections только активные)
        const activeRooms = [];
        this.roomsSections.forEach(section => {
          section.rooms.filter(r => r.isActive).forEach(r => activeRooms.push(r.title));
        });
        if (activeRooms.length > 0) {
          params.set('rooms', activeRooms.join(','));
        } else {
          params.delete('rooms');
        }
        // диапазон дат недели
        params.set('startDate', this.startDate);
        params.set('endDate', this.endDate);
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({}, '', newUrl);
      } catch (e) {
        console.warn('Не удалось обновить URL из состояния', e);
      }
    },
    restoreStateFromUrl() {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlWeekPart = params.get('weekPart');
        const urlRooms = params.get('rooms');
        const urlStart = params.get('startDate');
        const urlEnd = params.get('endDate');

        if (urlStart && urlEnd) {
          this.startDate = urlStart;
          this.endDate = urlEnd;
        }

        if (urlWeekPart) {
          this.weekParts.forEach(wp => wp.isActive = (wp.val === urlWeekPart));
        }

        if (urlRooms) {
          const wanted = new Set(urlRooms.split(',').map(s => s.trim()).filter(Boolean));
          this.roomsSections.forEach(section => {
            section.rooms.forEach(r => { r.isActive = wanted.has(r.title); });
          });
        }
        this.applySettings();
      } catch (e) {
        console.warn('Не удалось восстановить состояние из URL', e);
      }
    }
  },
  props: {}
}
</script>

<style scoped>
#contentCenter {
  padding: 2px;
  border-right: 1px dashed rgb(131, 130, 130);
}
.full-screen-button {
  -webkit-transition: all 0.3s ease;
  -o-transition: all 0.3s ease;
  transition: all 0.3s ease;
  height: 27px;
  width: 27px;
}
.g1logo {
  -webkit-transition: all 0.3s ease;
  -o-transition: all 0.3s ease;
  transition: all 0.3s ease;
  height: 27px;
  width: 100px;
}
.room-button {
  padding: 5px;
  font-size: 11pt;
}
button {
  border-radius: 0;
  font-weight: bold;
  border-color: #f33;
  color: #333;
  border: 1px solid #f33;
}
button.active,
button:hover {
  font-weight: bold;
  transition: background-color 0.3s ease;
  background-color: #f33;
  border-color: #333;
  color: #fff;
}
.list-group {
  border-radius: 0;
}
.list-group-item:hover,
.list-group-item.active {
  font-weight: bold;
  transition: background-color 0.3s ease;
  background-color: #f33;
  border-color: #333;
  color: #fff;
}
.filter-block {
  padding: 0px;
}
.filter-title {
  padding-left: 5px;
  font-size: 10pt;
}
.filter-button {
  text-align: center;
  font-size: 12pt;
}
.ruble-icon {
  position: absolute;
  bottom: 3px;
  right: 7px;
}
.line-height-1-2 {
  line-height: 1.2;
}
.lesson-parent {
  font-size: v-bind(fontSizeVW);
}
.weekday-header {
  font-size: v-bind(weekdayHeaderFontSize);
  font-weight: bold;
}
.room-header {
  font-size: v-bind(roomHeaderTitleFontSize);
  text-align: center;
}
.exercise-title {
  font-size: v-bind(excerciseTitleFontSize);
  text-align: left;
  margin-left: 6px;
  font-weight: bold;
}
.trainer-name {
  font-size: 15pt;
  width: 100%;
  text-align: left;
  margin-left: 6px;
}
.start-end-time {
  width: 100%;
  text-align: left;
  margin-left: 6px;
}
.room-title {
  width: 100%;
  text-align: left;
  margin-left: 6px;
}
.td-container {
  padding: 0;
  height: 100%;
  position: relative;
}
.inner-div {
  height: 100%;
}
.lesson-parent {
  position: relative;
  border-radius: 10px;
  padding-left: 20px;
  padding-right: 3px;
  padding-top: 3px;
  padding-bottom: 3px;
  background-color: #f0f0f0;
}
.lesson-color {
  position: absolute;
  left: 0;
  top: 0;
  width: 20px;
  height: 100%;
  border-top-left-radius: 10px;
  border-bottom-left-radius: 10px;
}
.clock-column-style {
  font-size: 30px;
  width: 60px !important;
  min-width: 60px !important;
  max-width: 60px !important;
}
.day-group-bg-0 {
  background-color: #ffffff;
}
.day-group-bg-1 {
  background-color: #f5f5f5;
}
.day-separator {
  border-right: 2px solid #a0a0a0;
}
.head-separator {
  border-bottom: 2px solid #a0a0a0;
}
</style>