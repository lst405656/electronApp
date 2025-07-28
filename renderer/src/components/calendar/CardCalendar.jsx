import React from 'react';
import AppCalendar from './AppCalendar'; // 핵심 달력 렌더러 임포트
import '../../styles/components/calendar/ScheduleCalendar.css'; // 이 디자인 전용 CSS

function CardCalendar({ value, onChange, schedules }) {
    return (
        <AppCalendar
            value={value}
            onChange={onChange}
            schedules={schedules}
            className="calendar-design--default" // 특정 디자인 클래스 주입
            // 이 디자인에 특화된 Calendar prop을 여기에 추가할 수 있음
            >
        {/* 이 디자인에는 달력 외에 추가될 UI 요소가 없으면 비워둡니다. */}
        </AppCalendar>
  );
}

export default CardCalendar;