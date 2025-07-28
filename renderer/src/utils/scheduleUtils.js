// preload.js를 통해 노출된 Electron API를 사용합니다.
const electronApi = window.electron;

/**
 * 모든 일정 데이터를 메인 프로세스로부터 불러옵니다.
 * @returns {Promise<Array<Object>>} 일정 데이터 배열을 반환하는 Promise.
 */
export const getSchedules = async () => {
    if (!electronApi) {
        console.warn("Electron API is not available. Running in a non-Electron environment or preload script not loaded.");
        // Electron 환경이 아닐 경우 테스트용 더미 데이터를 반환
        return [
            { id: 'dummy1', date: '2025-07-22', title: '더미 일정 1', categoryName: '업무', categoryColor: '#FF5733', completed: false, time: '10:00' },
            { id: 'dummy2', date: '2025-07-22', title: '더미 일정 2', categoryName: '개인', categoryColor: '#3366FF', completed: true, time: '14:30' },
            { id: 'dummy3', date: '2025-07-23', title: '더미 일정 3', categoryName: '회의', categoryColor: '#33FF66', completed: false, time: '09:00' }
        ];
    }
    try {
        // preload.js에 정의된 readSchedules 함수를 호출합니다.
        const schedules = await electronApi.readSchedules();
        return schedules;
    } catch (error) {
        console.error('스케줄을 가져오는 데 실패했습니다:', error);
        return []; // 에러 발생 시 빈 배열 반환
    }
};

/**
 * 변경된 일정 데이터를 메인 프로세스를 통해 파일에 저장합니다.
 * @param {Array<Object>} schedules - 저장할 일정 데이터 배열.
 * @returns {Promise<boolean>} 저장 성공 여부를 나타내는 Promise.
 */
export const saveSchedules = async (schedules) => {
    if (!electronApi) {
        console.warn("Electron API is not available. Data will not be saved.");
        return false;
    }
    try {
        // preload.js에 정의된 writeSchedules 함수를 호출합니다.
        await electronApi.writeSchedules(schedules);
        return true;
    } catch (error) {
        console.error('스케줄을 저장하는 데 실패했습니다:', error);
        return false;
    }
};

/**
 * 카테고리 목록을 가져옵니다.
 * @returns {Promise<Array<Object>>} 카테고리 목록을 반환하는 Promise.
 */
export const getCategories = async () => {
    if (!electronApi) {
        console.warn("Electron API is not available. Running in a non-Electron environment or preload script not loaded.");
        // Electron 환경이 아닐 경우 테스트용 더미 데이터를 반환
        return [];
    }
    try {
        const categories = await electronApi.readCategories();
        return categories;
    } catch (error) {
        console.error('카테고리를 가져오는 데 실패했습니다:', error);
        return [];
    }
};

/**
 * 카테고리 목록을 저장합니다.
 * @param {Array<Object>} categories - 저장할 카테고리 목록.
 * @returns {Promise<boolean>} 저장 성공 여부를 나타내는 Promise.
 */
export const saveCategories = async (categories) => {
    if (!electronApi) {
        console.warn("Electron API is not available. Data will not be saved.");
        return false;
    }
    try {
        await electronApi.writeCategories(categories);
        return true;
    } catch (error) {
        console.error('카테고리를 저장하는 데 실패했습니다:', error);
        return false;
    }
};

/**
 * 메인 프로세스에 경고창 표시를 요청합니다.
 * @param {Object} options - 경고창에 표시할 옵션.
 * @returns {Promise<void>}
 */
export const showAlert = async (options) => {
    if (!electronApi) {
        console.warn("Electron API is not available. Alert will be shown in browser console.");
        alert(`[${options.title}]
${options.message}`);
        return;
    }
    try {
        await electronApi.showAlert(options);
    } catch (error) {
        console.error('경고창을 표시하는 데 실패했습니다:', error);
    }
};

/**
 * 메인 프로세스에 확인창 표시를 요청합니다.
 * @param {Object} options - 확인창에 표시할 옵션.
 * @returns {Promise<boolean>} 사용자의 선택 결과를 반환하는 Promise (true 또는 false).
 */
export const showConfirm = async (options) => {
    if (!electronApi) {
        console.warn("Electron API is not available. Confirm will be shown in browser console.");
        return window.confirm(`[${options.title}]
${options.message}`);
    }
    try {
        const result = await electronApi.showConfirm(options);
        return result;
    } catch (error) {
        console.error('확인창을 표시하는 데 실패했습니다:', error);
        return false;
    }
};