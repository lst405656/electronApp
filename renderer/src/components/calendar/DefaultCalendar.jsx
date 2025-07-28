// renderer/src/components/calendar/DefaultCalendar.js

import React from 'react';
import AppCalendar from './AppCalendar';
import '../../styles/components/calendar/DefaultCalendar.css';

// 🌟🌟🌟 props에 'categories'를 추가합니다.
function DefaultCalendar({ value, onChange, onClickDay, data, categories, holidays }) {
    
    const setTileContent = ({ date, view, formattedDate, dailyData, allData }) => {
        
        if (view === 'month') {
            const schedulesWithCategories = dailyData.map(schedule => {
                const category = categories.find(cat => cat.value === schedule.category);
                return {
                    ...schedule,
                    categoryColor: category ? category.color : '#333333' // 기본 색상 설정
                };
            });

            const top5Schedules = schedulesWithCategories.slice(0, 5);

            if (top5Schedules.length > 0) {
                return (
                    <div className="custom-schedule-list">
                        {top5Schedules.map((schedule, index) => (
                            <p
                                key={index}
                                className="schedule-title"
                                style={{ color: schedule.categoryColor }}
                            >
                                {schedule.title}
                            </p>
                        ))}
                        {dailyData.length > 5 && (
                            <span className="more-schedules-indicator">...</span>
                        )}
                    </div>
                );
            }
        }
        return null;
    };

    return (
        <AppCalendar
            value={value}
            onChange={onChange}
            onClickDay={onClickDay}
            data={data}
            className="calendar-design--default"
            tileContent={setTileContent}
            holidays={holidays}
        />
    );
}

export default DefaultCalendar;