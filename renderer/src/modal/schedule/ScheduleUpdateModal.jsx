import React, { useEffect, useState } from 'react';

function ScheduleUpdateModal({schedule, categories, onUpdateComplete, onBackToList, onClose}) {

    const [updatedScheduleData, setUpdatedScheduleData] = useState(schedule);

    useEffect(() => {
        setUpdatedScheduleData(schedule);
    }, [schedule]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUpdatedScheduleData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleUpdateClick = () => {
        if (!updatedScheduleData.title.trim()) {
            
            window.electron.showAlert({
                type: 'warning',
                title: '경고',
                message: '일정 제목을 입력해주세요!',
            });
            return;
        }
        onUpdateComplete(updatedScheduleData); // 유효한 데이터만 부모에게 전달
    };

    const handleCategoryChange = (e) => {
        const newCategoryValue = e.target.value;
        const newCategoryColor = categories.find(c => c.value === newCategoryValue)?.color || '#333333';
        setUpdatedScheduleData(prevData => ({ 
            ...prevData, 
            category: newCategoryValue, 
            categoryColor: newCategoryColor 
        }));
    };

    return (
        <div className="schedule-edit-view">
            <input
                type="text"
                value={updatedScheduleData?.title || ''}
                onChange={handleChange}
                placeholder="일정 제목"
            />
            <textarea
                value={updatedScheduleData?.description || ''}
                onChange={handleChange}
                placeholder="일정 설명"
                rows="3"
            ></textarea>
            <select
                value={updatedScheduleData?.category || ''}
                onChange={handleCategoryChange}
            >
                {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                        {cat.label}
                    </option>
                ))}
            </select>
            <div className="edit-actions">
                <button onClick={handleUpdateClick}>수정 완료</button>
                <button onClick={onBackToList}>목록으로 돌아가기</button>
                <button onClick={onClose}>취소</button>
            </div>
        </div>
    )
}

export default ScheduleUpdateModal;