// main.js
require('dotenv').config();
const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const path = require('path');
const fsPromises = require('fs/promises');
const fs = require('fs');
const { fetchHolidaysFromApi  } = require('./utils/holidaysUtils');

let mainWindow;
let SCHEDULES_FILE_PATH;
let CATEGORIES_FILE_PATH;
let HOLIDAYS_FILE_PATH;

const SERVICE_KEY = process.env.REACT_APP_SERVICE_KEY;
const BASE_URL = process.env.REACT_APP_API_BASE_URL + '/getRestDeInfo';
const NUM_OF_ROWS = 100; // API 호출 시 한 번에 가져올 행 수

function createWindow() {
	mainWindow = new BrowserWindow({
		width: 1200,
		height: 800,
		webPreferences: {
			preload: path.join(app.getAppPath(), 'preload.js'),
			nodeIntegration: false,
			contextIsolation: true
		}
	});

	// app.isPackaged 속성을 직접 사용합니다.
	if (app.isPackaged) {
		// 프로덕션 모드: 빌드된 React 앱 로드
		mainWindow.loadFile(path.join(__dirname, 'renderer', 'build', 'index.html'));
	} else {
		// 개발 모드: React 개발 서버 로드
		mainWindow.loadURL('http://localhost:3000');
        mainWindow.webContents.openDevTools();
	}

	mainWindow.on('closed', () => {
		mainWindow = null;
	});
}

 ipcMain.handle('get-all-schedules', async () => {
      try {
          const data = await fs.promises.readFile(SCHEDULES_FILE_PATH, 'utf8');
          return JSON.parse(data);
      } catch (error) {
          if (error.code === 'ENOENT') { // 파일이 존재하지 않을 경우 (첫 실행 등)
              console.log('Schedules file not found, returning empty array.');
              return []; // 빈 배열 반환
          }
          console.error('일정 파일을 읽는 데 실패했습니다:', error);
          throw error; // 다른 종류의 에러는 렌더러 프로세스로 다시 던집니다.
      }
  });

app.whenReady().then(async () => {

	const baseDir = process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(app.getPath('exe')); // .exe 파일 옆 경로
    const dataDir = path.join(baseDir, 'data'); // .exe 옆에 'data' 폴더 생성
    SCHEDULES_FILE_PATH = path.join(dataDir, 'schedules.json');
    CATEGORIES_FILE_PATH = path.join(dataDir, 'categories.json');
    HOLIDAYS_FILE_PATH = path.join(dataDir, 'holidays.json');
	createWindow();

	if (!fs.existsSync(dataDir)) {
        try {
            fs.mkdirSync(dataDir, { recursive: true });
            console.log(`Data directory created at: ${dataDir}`);
        } catch (err) {
            console.error('Failed to create data directory:', err);
            app.quit();
        }
    }

    // scheduless.json 파일 초기화 (없으면 빈값으로 생성)
    try {
        await fsPromises.access(SCHEDULES_FILE_PATH); // 파일 존재 여부 확인
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fsPromises.writeFile(SCHEDULES_FILE_PATH, JSON.stringify([]), 'utf8'); // 🌟 fs.promises.writeFile 사용
            console.log('schedules.json created with empty array.');
        } else {
            console.error('Error accessing schedules.json:', error);
            app.quit();
            return;
        }
    }

    // categories.json 파일 초기화 (없으면 기본 카테고리로 생성)
    try {
        await fsPromises.access(CATEGORIES_FILE_PATH); // 파일 존재 여부 확인
    } catch (error) {
        if (error.code === 'ENOENT') {
            const defaultCategories = [
                { value: "default", label: "기본", color: "#333333" },
                { value: "personal", label: "개인", color: "#007bff" },
                { value: "work", label: "업무", color: "#28a745" },
                { value: "meeting", label: "회의", "color": "#6f42c1" },
                { value: "deadline", "label": "마감", "color": "#dc3545" },
                { value: "study", "label": "학업", "color": "#fd7e14" },
                { value: "family", "label": "가족", "color": "#e83e8c" },
                { value: "health", "label": "건강", "color": "#20c997" },
                { value: "todo", "label": "할 일", "color": "#6c757d" },
                { value: "event", "label": "이벤트", "color": "#17a2b8" },
                { value: "travel", "label": "여행", "color": "#6610f2" },
                { value: "shopping", "label": "쇼핑", "color": "#ffc107" },
                { value: "bills", "label": "청구서", "color": "#6f42c1" },
                { value: "birthday", "label": "생일", "color": "#ff007f" },
                { value: "important", "label": "중요", "color": "#000000" }
            ];
            await fsPromises.writeFile(CATEGORIES_FILE_PATH, JSON.stringify(defaultCategories, null, 2), 'utf8');
            console.log('categories.json created with default categories.');
        } else {
            console.error('Error accessing categories.json:', error);
            app.quit();
            return;
        }
    }

    // holidays.json 파일 초기화 (없으면 빈 값으로 생성)
    try {
        await fsPromises.access(HOLIDAYS_FILE_PATH); // 파일 존재 여부 확인
        console.log('holidays.json already exists. No initial fetch needed.');
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log('holidays.json not found. Fetching initial data from API.');
            const currentYear = new Date().getFullYear();
            let initialHolidays = {}; // 🌟 배열에서 객체로 변경
            // 현재 연도와 앞뒤 1년치를 초기화 시점에 가져오기
            const yearsToInitialize = [currentYear - 1, currentYear, currentYear + 1];
            for (const yearToFetch of yearsToInitialize) {
                try {
                    // 🌟 유틸리티 함수 호출 시 필요한 API 정보 전달
                    const fetched = await fetchHolidaysFromApi(yearToFetch, SERVICE_KEY, BASE_URL, NUM_OF_ROWS);
                    initialHolidays[yearToFetch] = fetched; // 🌟 연도를 키로 사용
                } catch (apiError) {
                    console.error(`초기 공휴일 (${yearToFetch}년) 가져오기 실패:`, apiError.message);
                    // 실패해도 앱 종료하지 않고, 해당 연도 데이터는 비워둠
                }
            }
            await fsPromises.writeFile(HOLIDAYS_FILE_PATH, JSON.stringify(initialHolidays, null, 2), 'utf8');
            console.log('holidays.json created with initial holiday data for current and surrounding years.');
        } else {
            console.error('Error accessing holidays.json:', error);
            app.quit();
            return;
        }
    }

    // 매년 1월 1일 공휴일 데이터를 업데이트하는 함수
    async function scheduleYearlyHolidayFetch() {
        const today = new Date();
        // 1월 1일에만 실행
        if (today.getMonth() === 0 && today.getDate() === 1) {
            console.log('1월 1일입니다. 공휴일 데이터 업데이트를 확인합니다.');
            const currentYear = today.getFullYear();
            const yearsToUpdate = [currentYear, currentYear + 1]; // 올해와 내년 데이터 업데이트

            let allHolidaysData = {};
            try {
                const fileContent = await fsPromises.readFile(HOLIDAYS_FILE_PATH, 'utf8');
                allHolidaysData = JSON.parse(fileContent);
            } catch (error) {
                if (error.code !== 'ENOENT') console.error('공휴일 파일을 읽는 중 오류 발생:', error);
            }

            let updated = false;
            for (const year of yearsToUpdate) {
                if (!allHolidaysData[year]) { // 해당 연도 데이터가 없으면
                    console.log(`${year}년 공휴일 데이터를 새로 가져옵니다.`);
                    try {
                        const fetchedHolidays = await fetchHolidaysFromApi(year, SERVICE_KEY, BASE_URL, NUM_OF_ROWS);
                        allHolidaysData[year] = fetchedHolidays;
                        updated = true;
                    } catch (apiError) {
                        console.error(`${year}년 공휴일 데이터를 가져오는 데 실패했습니다:`, apiError);
                    }
                }
            }

            if (updated) {
                try {
                    await fsPromises.writeFile(HOLIDAYS_FILE_PATH, JSON.stringify(allHolidaysData, null, 2), 'utf8');
                    console.log('공휴일 데이터가 성공적으로 업데이트되었습니다.');
                } catch (writeError) {
                    console.error('업데이트된 공휴일 데이터를 파일에 쓰는 데 실패했습니다:', writeError);
                }
            } else {
                console.log('공휴일 데이터가 이미 최신 상태입니다. 업데이트가 필요하지 않습니다.');
            }
        }
    }

    // 앱 시작 시 즉시 실행하고, 그 후 24시간마다 주기적으로 실행
    scheduleYearlyHolidayFetch();
    setInterval(scheduleYearlyHolidayFetch, 24 * 60 * 60 * 1000);

	// --- IPC Main 핸들러 등록 ---
    ipcMain.handle("read-schedules", async () => {
        try {
            const data = await fs.promises.readFile(SCHEDULES_FILE_PATH, "utf8");
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') { return []; } // 파일이 없는 경우 빈 배열 반환
            console.error("Error Reading File: ", error);
            throw error;
        }
    });

    ipcMain.handle("write-schedules", async (event, data) => {
        try {
            await fs.promises.writeFile(SCHEDULES_FILE_PATH, JSON.stringify(data, null, 2));
            return { success: true };
        } catch (error) {
            console.error("Error writing File: ", error);
            return { success: false, error: error.message };
        }
    });

	ipcMain.handle("read-categories", async () => {
        try {
            const data = await fs.promises.readFile(CATEGORIES_FILE_PATH, "utf8");
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') { return []; } // 파일이 없는 경우 빈 배열 반환
            console.error("Error Reading File: ", error);
            throw error;
        }
    });

    ipcMain.handle("write-categories", async (event, data) => {
        try {
            await fs.promises.writeFile(CATEGORIES_FILE_PATH, JSON.stringify(data, null, 2));
            return { success: true };
        } catch (error) {
            console.error("Error writing File: ", error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle("read-holidays", async (event, year, forceUpdate = false) => {
        let allHolidaysData = {};

        try {
            // 파일에서 기존 데이터 로드 시도
            const fileContent = await fsPromises.readFile(HOLIDAYS_FILE_PATH, 'utf8');
            allHolidaysData = JSON.parse(fileContent);
            console.log("Existing holidays data loaded from file for IPC request.");
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log('Holidays file not found during IPC request. Will attempt to fetch.');
            } else {
                console.error('Failed to read holidays file for IPC request:', error);
            }
            allHolidaysData = {}; // 파일 없거나 에러 시 빈 객체로 시작
        }

        // 강제 업데이트 요청이 있거나, 해당 연도의 데이터가 없는 경우 API 호출 및 파일 업데이트
        if (forceUpdate || !allHolidaysData[year]) {
            console.log(`Initiating holiday fetch/update for year ${year} (IPC request). Force update: ${forceUpdate}`);
            try {
                // 현재 요청된 연도, 그리고 (선택적으로) 현재 연도와 그 주변 연도를 함께 처리
                const yearsToProcess = new Set([year]);
                const currentActualYear = new Date().getFullYear();
                yearsToProcess.add(currentActualYear);
                yearsToProcess.add(currentActualYear - 1);
                yearsToProcess.add(currentActualYear + 1);

                const sortedYears = Array.from(yearsToProcess).sort((a, b) => a - b);

                for (const y of sortedYears) {
                    if (forceUpdate || !allHolidaysData[y]) {
                        console.log(`Fetching/Updating holidays for year: ${y} (during IPC request)`);
                        // 🌟 유틸리티 함수 호출 시 필요한 API 정보 전달
                        const fetched = await fetchHolidaysFromApi(y, SERVICE_KEY, BASE_URL, NUM_OF_ROWS);
                        allHolidaysData[y] = fetched;
                    }
                }
                // 업데이트된 전체 공휴일 데이터를 파일에 저장
                await fsPromises.writeFile(HOLIDAYS_FILE_PATH, JSON.stringify(allHolidaysData, null, 2), 'utf8');
                console.log('All holidays data successfully saved to file after IPC update.');
            } catch (apiError) {
                console.error(`Error during holiday API fetch or save (IPC request):`, apiError);
            }
        } else {
            console.log(`Holidays for year ${year} found in file for IPC request. No API fetch needed.`);
        }
        return allHolidaysData || []; // 요청된 연도의 데이터만 반환
    });

    ipcMain.handle('show-alert', async (event, options) => {
        // options는 type, message, detail 등을 포함할 수 있습니다.
        const response = await dialog.showMessageBox(mainWindow, {
            type: options.type || 'info', // 'info', 'warning', 'error', 'question', 'none'
            title: options.title || '알림',
            message: options.message,
            detail: options.detail || '',
            buttons: ['확인']
        });
        return response.response; // 클릭된 버튼의 인덱스 (여기서는 0)
    });

    ipcMain.handle('show-confirm', async (event, options) => {
        const response = await dialog.showMessageBox(mainWindow, {
            type: options.type || 'question',
            title: options.title || '확인',
            message: options.message,
            detail: options.detail || '',
            buttons: options.buttons || ['취소', '확인'], // 기본 버튼: 취소, 확인
            cancelId: options.cancelId || 0 // '취소' 버튼의 인덱스
        });
        return response.response; // 클릭된 버튼의 인덱스 (0: 취소, 1: 확인)
    });

	const template = [
        {
            label: '메뉴',
            submenu: [
                {
                    label: '새 일정',
                    click() {
                        mainWindow.webContents.send('navigate-to', '/schedule');
                    }
                },
                {
                    label: '홈으로',
                    click() {
                        mainWindow.webContents.send('navigate-to', '/');
                    }
                },
                { type: 'separator' },
                {
                    label: '종료',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                    click() {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: '설정',
            submenu: [
                {
                    label: '카테고리 편집',
                    click() {
                        mainWindow.webContents.send('navigate-to', '/settings/categories');
                    }
                },
                {
                    label: '정보',
                    click() {
                        mainWindow.webContents.send('navigate-to', '/about');
                    }
                },
                { type: 'separator' },
                { role: 'reload' },
                { role: 'toggledevtools' }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		}
	});
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});