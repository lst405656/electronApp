import { React, useState, useEffect} from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // react-calendar 기본 CSS
import '../../styles/components/calendar/AppCalendar.css'; // AppCalendar 기본 스타일

/**
 * 앱 전반에서 사용되는 달력의 핵심 렌더러 컴포넌트.
 * react-calendar를 직접 렌더링하고, 공통 로직 및 데이터를 처리.
 * @param {Object} props
 * @param {Date | Date[]} props.value - 현재 선택된 날짜 (또는 날짜 배열).
 * @param {(value: Date | Date[]) => void} props.onChange - 날짜 변경 시 호출될 콜백 함수.
 * @param {Array<Object>} props.schedules - 달력에 표시할 일정 데이터 배열.
 * @param {string} [props.className] - 외부에서 전달받을 CSS 클래스 이름.
 * @param {React.ReactNode} [props.children] - 달력 주변에 렌더링될 추가적인 UI 요소 (예: 버튼, 설명 텍스트).
 */
function AppCalendar({
    value,
    onChange,
    onClickDay,
    data = [],
    className,
    children,
    tileContent,
    holidays,
    ...restProps
}) {
    const [holidayMap, setHolidayMap] = useState({});
    
    useEffect(() => {
        const newHolidayMap = {};
        // holidays가 객체인지 확인하고, 각 연도별 데이터를 순회합니다.
        
        if (holidays && typeof holidays === 'object') {
            Object.keys(holidays).forEach(year => {
                const yearHolidays = holidays[year];
                if (Array.isArray(yearHolidays)) {
                    yearHolidays.forEach(holiday => {
                        // 공휴일 날짜를 키로 사용 (YYYY-MM-DD 형식)
                        newHolidayMap[holiday.date] = true;
                    });
                }
            });
        }
        setHolidayMap(newHolidayMap);
    }, [holidays]); // holidays prop이 변경될 때만 이펙트 실행

    // 공통적으로 사용될 tileContent 로직
    const newTileContent = ({ date, view }) => {
        if (view === 'month') {
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0'); // 월은 0부터 시작하므로 +1
            const day = date.getDate().toString().padStart(2, '0');

            const formattedDate = `${year}-${month}-${day}`;
            const dailyData = data.filter(item => item.date === formattedDate);
            let customContent = null;
            
            if (tileContent && typeof tileContent === 'function') {
                customContent = tileContent({
                    date,          // 원래 date 객체
                    view,          // 현재 뷰 (month, year 등)
                    formattedDate, // 공통으로 포맷된 날짜 문자열
                    dailyData,     // 해당 날짜에 필터링된 데이터 배열
                    allData: data  // 전체 데이터
                });
            }

            if(customContent){
                return customContent;
            }

            if (dailyData.length > 0) {
                return (
                    <div className="app-calendar-daily-schedule-dot">
                        <span className="dot"></span>
                    </div>
                );
            }
        }
        return null;
    };

    const getTileClassName = ({ date, view }) => {
        if (view === 'month') {
            const dayOfWeek = date.getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일
            
            // 현재 타일의 연도를 가져옴
            const currentTileYear = date.getFullYear(); 
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            
            const formattedDate = `${currentTileYear}${month}${day}`; 

            // 공휴일 확인
            const isHoliday = !!holidayMap[formattedDate];

            // 클래스 적용
            if (dayOfWeek === 0) { // 일요일
                return 'app-calendar-sunday';
            } else if (dayOfWeek === 6 || isHoliday) { // 토요일 또는 공휴일
                return 'app-calendar-holiday';
            }
        }
        return null;
    };

    return (
        // className prop을 통해 외부에서 스타일 클래스 주입 가능
        <div className={`app-calendar-container ${className || ''}`}>
            <Calendar
                onChange={onChange}
                onClickDay={onClickDay}
                value={value}
                locale="ko-KR"
                calendarType="gregory"
                formatShortWeekday={(locale, date) => ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]}
                formatMonth={(locale, date) => `${date.getFullYear()}년 ${date.getMonth() + 1}월`}
                formatDay={(locale, date) => date.getDate()}
                tileContent={newTileContent}
                tileClassName={getTileClassName}
                {...restProps} // 추가적인 props 전달
                className="app-calendar" // 기본 클래스 이름
            />
            {children} {/* 달력 하단이나 옆에 추가될 UI 요소들 */}
        </div>
    );
}

export default AppCalendar;