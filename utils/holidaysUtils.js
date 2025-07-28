// utils/holidaysUtils.js
// 이 파일은 Node.js 환경에서 실행됩니다.

const axios = require('axios'); // axios 임포트

/**
 * 공공 API로부터 특정 연도의 공휴일 데이터를 가져옵니다.
 * 이 함수는 API 키와 기본 URL을 외부에서 주입받아 사용합니다.
 *
 * @param {number} year - 공휴일을 가져올 연도.
 * @param {string} serviceKey - 공공데이터포털 API 서비스 키.
 * @param {string} baseUrl - 공공데이터포털 공휴일 API의 기본 URL.
 * @param {number} numOfRows - 한 페이지에 가져올 데이터의 최대 개수.
 * @returns {Promise<Array<Object>>} 해당 연도의 공휴일 데이터 배열.
 */
async function fetchHolidaysFromApi(year, serviceKey, baseUrl, numOfRows = 100) {
    let allFetchedHolidays = [];

    if (!serviceKey) {
        console.error("API 서비스 키가 전달되지 않았습니다.");
        throw new Error("API service key is not configured.");
    }

    try {
        const fetchPromises = [];
        for (let month = 1; month <= 12; month++) {
            const formattedMonth = String(month).padStart(2, '0');

            fetchPromises.push(
                axios.get(baseUrl, {
                    params: {
                        serviceKey: decodeURIComponent(serviceKey), // 서비스 키 디코딩 (필요시)
                        solYear: year,
                        solMonth: formattedMonth,
                        numOfRows: numOfRows,
                        pageNo: 1, // 항상 첫 페이지를 가정
                    },
                })
            );
        }

        const responses = await Promise.all(fetchPromises);

        responses.forEach(response => {
            if (response.data.response && response.data.response.body && response.data.response.body.items) {
                const items = response.data.response.body.items.item;
                if (items) {
                    const holidayArray = Array.isArray(items) ? items : [items];
                    const formattedHolidays = holidayArray.map(item => ({
                        date: String(item.locdate),
                        name: item.dateName,
                        isHoliday: item.isHoliday === 'Y'
                    }));
                    allFetchedHolidays = allFetchedHolidays.concat(formattedHolidays);
                }
            }
        });

        console.log(`[${year}년] 총 ${allFetchedHolidays.length}개의 공휴일 데이터를 API에서 가져왔습니다.`);
        return allFetchedHolidays;

    } catch (error) {
        console.error(`[${year}년] 공휴일 데이터 API 호출 실패:`, error.message);
        throw error;
    }
}

module.exports = {
    fetchHolidaysFromApi // API 호출 함수만 노출
};