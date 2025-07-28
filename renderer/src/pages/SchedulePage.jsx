import React, { useEffect, useState } from 'react';
import DefaultCalendar from '../components/calendar/DefaultCalendar';
import Modal from '../components/common/Modal';
import '../styles/pages/SchedulePage.css';

function SchedulePage() {
    const [holidays, setHolidays] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [newScheduleTitle, setNewScheduleTitle] = useState("");
    const [newScheduleDescription, setNewScheduleDescription] = useState("");
    const [selectedDate, setSelectedDate] = useState(new Date());
    
    const [categories, setCategories] = useState([]);
    const [isAddScheduleModalOpen, setIsAddScheduleModalOpen] = useState(false);
    const [newCategory, setNewCategory] = useState("default");
    const [selectedCategoryColor, setSelectedCategoryColor] = useState('#333333');

    // 일정 상세보기를 위한 새로운 상태
    const [selectedScheduleToView, setSelectedScheduleToView] = useState(null); // 상세보기할 일정 객체
    const [isEditing, setIsEditing] = useState(false); // 수정을 위한 새로운 상태
    const [editingSchedule, setEditingSchedule] = useState(null); // 수정할 일정 객체

    // 앱 시작시 JSON 파일에서 일정 및 카테고리 데이터 불러오기
    useEffect(() => {
        const loadData = async () => {
            try {
                const loadedSchedules = await window.electron.readSchedules();
                setSchedules(loadedSchedules);

                const loadedCategories = await window.electron.readCategories();
                setCategories(loadedCategories);

            } catch (error) {
                console.error('Failed to load initial data:', error);
                // alert('데이터 로드에 실패했습니다. 앱을 다시 시작해 주세요.'); // 네이티브 다이얼로그로 대체
                await window.electron.showAlert({
                    type: 'error',
                    title: '오류',
                    message: '데이터 로드에 실패했습니다. 앱을 다시 시작해 주세요.',
                    detail: error.message || '파일 읽기 중 알 수 없는 오류 발생'
                });
            }
        }
        loadData();
    }, []); // newCategory 의존성 제거: 카테고리 로드는 한 번만 필요하며, 새 카테고리 추가와는 별개입니다.

    // 카테고리 목록이 로드되거나 변경될 때 newCategory와 selectedCategoryColor 동기화
    useEffect(() => {
        const defaultCategory = categories.find(cat => cat.value === "default");
        if (defaultCategory) {
            setNewCategory("default");
            setSelectedCategoryColor(defaultCategory.color);
        } else if (categories.length > 0) { // default 카테고리가 없으면 첫 번째 카테고리 선택
            setNewCategory(categories[0].value);
            setSelectedCategoryColor(categories[0].color);
        } else { // 카테고리가 아예 없으면 기본값 설정
            setNewCategory(""); // 카테고리 없음
            setSelectedCategoryColor('#333333');
        }
    }, [categories]); // categories 배열이 변경될 때마다 실행

    useEffect(() => {
        const fetchHolidays = async () => {
            try {
                const loadedHolidays = await window.electron.readHolidays(new Date().getFullYear(), false);
                setHolidays(loadedHolidays);
            } catch (error) {
                console.error("공휴일을 불러오는 데 실패했습니다:", error);
                
                await window.electron.showAlert({
                    type: 'error',
                    title: '오류',
                    message: '공휴일을 불러오는 데 실패했습니다.',
                    detail: error.message || '파일 읽기 중 알 수 없는 오류 발생'
                });
            }
        };
        fetchHolidays();
    }, []); // 컴포넌트가 처음 마운트될 때 한 번만 실행되도록 빈 의존성 배열을 사용합니다.

    // 일정 데이터를 json 파일에 저장
    const saveSchedules = async (updatedSchedules) => {
        try {
            await window.electron.writeSchedules(updatedSchedules);
            setSchedules(updatedSchedules); // UI 상태도 업데이트
        } catch (error) {
            console.error('Failed to write schedules:', error);
            // alert('일정 저장에 실패했습니다.'); // 네이티브 다이얼로그로 대체
            await window.electron.showAlert({
                type: 'error',
                title: '오류',
                message: '일정 저장에 실패했습니다.',
                detail: error.message || '파일 저장 중 알 수 없는 오류 발생'
            });
        }
    };

    // 일정 추가 핸들러
    const handleAddSchedule = async () => {
        if (newScheduleTitle.trim() === "") {
            await window.electron.showAlert({
                type: 'warning',
                title: '경고',
                message: '일정 제목을 입력해주세요!',
            });
            return;
        }

        const year = selectedDate.getFullYear();
        const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
        const day = selectedDate.getDate().toString().padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;

        const newSchedule = {
            id: Date.now(),
            title: newScheduleTitle.trim(),
            description: newScheduleDescription.trim(),
            completed: false,
            date: formattedDate,
            category: newCategory,
            categoryColor: selectedCategoryColor
        };

        const updatedSchedules = [...schedules, newSchedule];
        await saveSchedules(updatedSchedules); // saveSchedules에서 setSchedules 호출

        setNewScheduleTitle("");
        setNewScheduleDescription("");
        setNewCategory("default"); // 기본 카테고리로 초기화
        const defaultCategory = categories.find(cat => cat.value === "default");
        setSelectedCategoryColor(defaultCategory ? defaultCategory.color : '#333333');
        setIsAddScheduleModalOpen(false);

        await window.electron.showAlert({
            type: 'info',
            title: '알림',
            message: '새 일정이 성공적으로 추가되었습니다.',
        });
    };

    // 일정 삭제 핸들러
    const handleDeleteSchedule = async (id) => {
        const confirmResponse = await window.electron.showConfirm({
            type: 'question',
            title: '일정 삭제 확인',
            message: '이 일정을 삭제하시겠습니까?',
            buttons: ['취소', '삭제'], // 0: 취소, 1: 삭제
            cancelId: 0
        });

        if (confirmResponse === 1) {
            const updatedSchedules = schedules.filter(schedule => schedule.id !== id);
            await saveSchedules(updatedSchedules);
            setSelectedScheduleToView(null); // 삭제 후 상세보기가 열려있었다면 닫기

            await window.electron.showAlert({
                type: 'info',
                title: '알림',
                message: '일정이 성공적으로 삭제되었습니다.',
            });
        }
    };

    // 일정 완료 상태 토글 핸들러
    const handleToggleComplete = async (id) => {
        const updatedSchedules = schedules.map(schedule =>
            schedule.id === id ? { ...schedule, completed: !schedule.completed } : schedule
        );
        await saveSchedules(updatedSchedules);

         if (selectedScheduleToView && selectedScheduleToView.id === id) {
            const updatedViewSchedule = updatedSchedules.find(s => s.id === id);
            if (updatedViewSchedule) {
                setSelectedScheduleToView(updatedViewSchedule);
            }
        }
    };

    // 달력 날짜 클릭 시 일정 추가 모달 열기
    const handleDayClick = (date) => {
        setSelectedDate(date);
        setSelectedScheduleToView(null); // 날짜 클릭 시 상세보기가 아닌 목록/추가 화면으로 초기화
        setNewScheduleTitle(""); // 새 일정 추가 필드 초기화
        setNewScheduleDescription(""); // 새 일정 추가 필드 초기화

        const defaultCategory = categories.find(cat => cat.value === "default");
        setNewCategory(defaultCategory ? defaultCategory.value : (categories.length > 0 ? categories[0].value : ""));
        setSelectedCategoryColor(defaultCategory ? defaultCategory.color : (categories.length > 0 ? categories[0].color : '#333333'));
        setIsAddScheduleModalOpen(true);
    };

    // 카테고리 변경 핸들러 (일정 추가 모달 내)
    const handleCategoryChange = (e) => {
        const categoryValue = e.target.value;
        setNewCategory(categoryValue);
        const selectedCat = categories.find(cat => cat.value === categoryValue);
        setSelectedCategoryColor(selectedCat ? selectedCat.color : '#333333');
    };

    // 일정 상세보기 핸들러
    const handleViewScheduleDetail = (schedule) => {
        setSelectedScheduleToView(schedule);
    };

    // 상세보기에서 목록으로 돌아가기 핸들러
    const handleBackToList = () => {
        setSelectedScheduleToView(null);
        setIsEditing(false); // 수정 모드도 함께 종료
    };

    // 일정 수정 핸들러
    const handleUpdateSchedule = async () => {
        if (!editingSchedule || editingSchedule.title.trim() === "") {
            await window.electron.showAlert({
                type: 'warning',
                title: '경고',
                message: '일정 제목을 입력해주세요!',
            });
            return;
        }

        const updatedSchedules = schedules.map(schedule =>
            schedule.id === editingSchedule.id ? editingSchedule : schedule
        );

        await saveSchedules(updatedSchedules);

        await window.electron.showAlert({
            type: 'info',
            title: '알림',
            message: '일정이 성공적으로 수정되었습니다.',
        });

        setSelectedScheduleToView(editingSchedule); // 상세 보기 화면 업데이트
        setIsEditing(false); // 수정 모드 종료
    };

    // 선택된 날짜에 해당하는 일정만 필터링하여 모달에 표시
    const schedulesForSelectedDate = schedules.filter(schedule => {
        const year = selectedDate.getFullYear();
        const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
        const day = selectedDate.getDate().toString().padStart(2, '0');
        const formattedSelectedDate = `${year}-${month}-${day}`;
        return schedule.date === formattedSelectedDate;
    });

    return (
        <div className="schedule-page">
            <DefaultCalendar
                value={selectedDate}
                onChange={setSelectedDate}
                onClickDay={handleDayClick}
                data={schedules}
                categories={categories}
                holidays={holidays}
            />

            {/* 일정 추가/보기/상세보기 모달 */}
            <Modal
                isOpen={isAddScheduleModalOpen}
                onClose={() => {
                    setIsAddScheduleModalOpen(false);
                    setSelectedScheduleToView(null); // 모달 닫을 때 상세보기도 초기화
                    setIsEditing(false); // 모달을 닫을 때 수정 모드도 함께 종료
                }}
                title={isEditing ? '일정 수정' : `${selectedDate.toLocaleDateString('ko-KR')} ${selectedScheduleToView ? '일정 상세 보기' : '새 일정 추가/보기'}`}
            >
                <div className="modal-form-content">
                    {isEditing ? (
                        // 일정 수정 화면
                        <div className="schedule-edit-view">
                            <input
                                type="text"
                                value={editingSchedule?.title || ''}
                                onChange={(e) => setEditingSchedule({ ...editingSchedule, title: e.target.value })}
                                placeholder="일정 제목"
                            />
                            <textarea
                                value={editingSchedule?.description || ''}
                                onChange={(e) => setEditingSchedule({ ...editingSchedule, description: e.target.value })}
                                placeholder="일정 설명"
                                rows="3"
                            ></textarea>
                            <select
                                value={editingSchedule?.category || ''}
                                onChange={(e) => {
                                    const newCategoryValue = e.target.value;
                                    const newCategoryColor = categories.find(c => c.value === newCategoryValue)?.color || '#333333';
                                    setEditingSchedule({ ...editingSchedule, category: newCategoryValue, categoryColor: newCategoryColor });
                                }}
                            >
                                {categories.map(cat => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                            <div className="edit-actions">
                                <button onClick={handleUpdateSchedule}>수정 완료</button>
                                <button onClick={() => setIsEditing(false)}>취소</button>
                            </div>
                        </div>
                    ) : selectedScheduleToView ? (
                        // 일정 상세 보기 화면
                        <div className="schedule-detail-view">
                            <h3>{selectedScheduleToView.title}</h3>
                            <p><strong>카테고리:</strong> <span style={{ color: selectedScheduleToView.categoryColor }}>
                                {categories.find(c => c.value === selectedScheduleToView.category)?.label || selectedScheduleToView.category}
                            </span></p>
                            <p><strong>날짜:</strong> {selectedScheduleToView.date}</p>
                            <p><strong>설명:</strong> {selectedScheduleToView.description || '없음'}</p>
                            <p><strong>완료 여부:</strong> {selectedScheduleToView.completed ? '완료됨' : '미완료'}</p>
                            <div className="detail-actions">
                                <button onClick={() => handleToggleComplete(selectedScheduleToView.id)}>
                                    {selectedScheduleToView.completed ? '미완료로 변경' : '완료로 변경'}
                                </button>
                                <button onClick={() => {
                                    setIsEditing(true);
                                    setEditingSchedule({ ...selectedScheduleToView });
                                }}>수정</button>
                                <button onClick={() => handleDeleteSchedule(selectedScheduleToView.id)}>삭제</button>
                                <button onClick={handleBackToList}>뒤로가기</button>
                            </div>
                        </div>
                    ) : (
                        // 일정 목록 및 추가 화면
                        <>
                            {schedulesForSelectedDate.length > 0 ? (
                                <ul>
                                    {schedulesForSelectedDate.map((schedule) => (
                                        <li key={schedule.id} style={{ textDecoration: schedule.completed ? 'line-through' : 'none' }}>
                                            <span style={{ color: schedule.categoryColor }}>
                                                [{categories.find(c => c.value === schedule.category)?.label || schedule.category}] {schedule.title}
                                            </span>
                                            <button onClick={() => handleToggleComplete(schedule.id)}>
                                                {schedule.completed ? '미완료' : '완료'}
                                            </button>
                                            <button onClick={() => handleViewScheduleDetail(schedule)}>상세보기</button> {/* 상세보기 버튼 추가 */}
                                            <button onClick={() => handleDeleteSchedule(schedule.id)}>삭제</button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p>선택된 날짜에 일정이 없습니다.</p>
                            )}

                            <h3>새 일정 추가</h3>
                            <input
                                type="text"
                                value={newScheduleTitle}
                                onChange={(e) => setNewScheduleTitle(e.target.value)}
                                placeholder="일정 제목을 입력하세요"
                            />
                            <textarea
                                value={newScheduleDescription}
                                onChange={(e) => setNewScheduleDescription(e.target.value)}
                                placeholder="일정 상세 내용을 입력하세요 (선택 사항)"
                                rows="3"
                            ></textarea>

                            <label htmlFor="schedule-category">카테고리:</label>
                            <select
                                id="schedule-category"
                                value={newCategory}
                                onChange={handleCategoryChange}
                            >
                                {categories.length === 0 && <option value="">카테고리 없음</option>}
                                {categories.map(cat => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>

                            <p style={{ marginTop: '10px' }}>
                                선택된 카테고리 색상: <span style={{ backgroundColor: selectedCategoryColor, display: 'inline-block', width: '20px', height: '20px', border: '1px solid #ccc', verticalAlign: 'middle', marginLeft: '5px' }}></span> {selectedCategoryColor}
                                <br/>
                                (색상 변경은 '카테고리 편집'에서 해주세요.)
                            </p>

                            <button onClick={handleAddSchedule}>일정 저장</button>
                        </>
                    )}
                </div>
            </Modal>
        </div>
    );
}

export default SchedulePage;