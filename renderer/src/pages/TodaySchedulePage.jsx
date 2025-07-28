import React, { useState, useEffect } from 'react';
import { getSchedules } from '../utils/scheduleUtils'; // 일정 데이터를 불러오는 유틸리티 함수 임포트

function TodaySchedulePage() {
    const [todaySchedules, setTodaySchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTodaySchedules = async () => {
            try {
                setLoading(true);
                // 모든 일정을 불러와서 오늘 날짜의 일정만 필터링합니다.
                const allSchedules = await getSchedules(); // scheduleUtils.js에서 모든 일정 가져오기
                
                const today = new Date();
                // 오늘 날짜를 'YYYY-MM-DD' 형식으로 포맷합니다.
                const year = today.getFullYear();
                const month = (today.getMonth() + 1).toString().padStart(2, '0'); // 월은 0부터 시작하므로 +1
                const day = today.getDate().toString().padStart(2, '0');
                const formattedToday = `${year}-${month}-${day}`;

                // 오늘 날짜와 일치하는 일정만 필터링합니다.
                const filteredSchedules = allSchedules.filter(schedule => schedule.date === formattedToday);
                setTodaySchedules(filteredSchedules);

            } catch (err) {
                console.error("오늘 일정을 불러오는 데 실패했습니다:", err);
                setError("오늘 일정을 불러오는 데 실패했습니다.");
            } finally {
                setLoading(false);
            }
        };

        fetchTodaySchedules();
    }, []); // 컴포넌트가 처음 마운트될 때 한 번만 실행되도록 빈 의존성 배열을 사용합니다.

    if (loading) {
        return <div className="today-schedule-page">로딩 중...</div>;
    }

    if (error) {
        return <div className="today-schedule-page error">{error}</div>;
    }

    return (
        <div className="today-schedule-page">
            <h2>오늘 할 일 ({new Date().toLocaleDateString('ko-KR')})</h2>
            {todaySchedules.length > 0 ? (
                <ul className="schedule-list">
                    {todaySchedules.map(schedule => (
                        <li key={schedule.id} className={schedule.completed ? 'completed' : ''}>
                            <span 
                                className="schedule-category" 
                                style={{ backgroundColor: schedule.categoryColor || '#ccc' }}
                            >
                                {schedule.category || '기타'}
                            </span>
                            <span className="schedule-title">{schedule.title}</span>
                            {schedule.time && <span className="schedule-time">{schedule.time}</span>}
                        </li>
                    ))}
                </ul>
            ) : (
                <p>오늘 할 일이 없습니다!</p>
            )}
        </div>
    );
}

export default TodaySchedulePage;