import React from 'react';

/**
 * 달력 날짜 칸 내부에 표시될 개별 일정 항목의 UI 컴포넌트.
 * 이 컴포넌트는 DraggableItem의 children으로 사용되어 드래그 가능하게 됩니다.
 *
 * @param {Object} props
 * @param {Object} props.schedule - 표시할 일정 데이터 객체 (예: { id, title, categoryColor, time, completed, ... }).
 */
function CalendarScheduleItem({ schedule }) {
    // 일정 완료 여부에 따라 클래스 추가 (선택 사항)
    const itemClassName = `calendar-schedule-card ${schedule.completed ? 'completed' : ''}`;

    return (
    // 이 div는 DraggableItem에 의해 감싸질 실제 내용물입니다.
    // 여기에 일정 카드의 시각적인 디자인을 적용합니다.
    <div className={itemClassName}>
        <span
            className="schedule-category-dot"
            style={{ backgroundColor: schedule.categoryColor || '#ccc' }} // 카테고리 색상 적용
        ></span>
        <span className="schedule-title">
            {schedule.title} {/* 일정 제목 표시 */}
        </span>
        {schedule.time && ( // 시간 정보가 있다면 표시
            <span className="schedule-time">
                {schedule.time}
            </span>
        )}
        {/* 필요하다면 여기에 아이콘, 체크박스 등 추가 정보도 표시할 수 있습니다. */}
    </div>
    );
}

export default CalendarScheduleItem;