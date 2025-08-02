import React, { useEffect, useState } from 'react';
import DefaultCalendar from '../components/calendar/DefaultCalendar';
import Modal from '../components/common/Modal';
import { ScheduleUpdateModal, ScheduleDetailModal, ScheduleListModal, ScheduleInsertModal } from '../modal/schedule/index.js';
import '../styles/pages/SchedulePage.css';

// 모달 모드를 위한 상수 정의
const MODAL_MODE = {
    CLOSED: 'closed', // 모달 닫힘
    ADD: 'add',       // 새 일정 추가
    LIST: 'list',     // 날짜별 일정 목록 보기 (그리고 새 일정 추가 폼)
    DETAIL: 'detail', // 특정 일정 상세 보기
    EDIT: 'edit'      // 특정 일정 수정
};

function SchedulePage() {
    const [holidays, setHolidays] = useState([]);
    const [schedules, setSchedules] = useState([]);
    // const [newScheduleTitle, setNewScheduleTitle] = useState("");
    // const [newScheduleDescription, setNewScheduleDescription] = useState("");
    const [selectedDate, setSelectedDate] = useState(new Date());

    const [categories, setCategories] = useState([]);
    
    // 🌟 모달 상태를 관리하는 새로운 변수: 현재 모달이 어떤 모드인지 나타냅니다.
    const [modalMode, setModalMode] = useState(MODAL_MODE.CLOSED);
    // 🌟 모달에 전달할 특정 일정 데이터를 관리하는 변수 (상세보기, 수정 시 사용)
    const [selectedSchedule, setSelectedSchedule] = useState(null);

    // // 새 일정 추가 시 선택될 카테고리 상태 (ADD/LIST 모드에서 사용)
    // const [newCategory, setNewCategory] = useState("default");
    // const [selectedCategoryColor, setSelectedCategoryColor] = useState('#333333');

    // 앱 시작시 초기 데이터 로드(스케줄, 카테고리, 공휴일 데이터)
   useEffect(() => {
        const loadInitialData = async () => {
            try {
                
                // promise.all을 사용하여 여러 데이터를 동시에 로드
                const [loadedSchedules, loadedCategories, loadedHolidays] = await Promise.all([
                    window.electron.readSchedules(),
                    window.electron.readCategories(),
                    window.electron.readHolidays(new Date().getFullYear(), false)
                ]);

                setSchedules(loadedSchedules);
                setCategories(loadedCategories);
                setHolidays(loadedHolidays);

            } catch (error) {
                console.error('Failed to load initial data:', error);
                await window.electron.showAlert({
                    type: 'error',
                    title: '오류',
                    message: '데이터 로드에 실패했습니다. 앱을 다시 시작해 주세요.',
                    detail: error.message || '파일 읽기 중 알 수 없는 오류 발생'
                });
            }
        }
        loadInitialData();
    }, []);

    // 일정 데이터를 json 파일에 저장
    const saveSchedules = async (updatedSchedules) => {
        try {
            await window.electron.writeSchedules(updatedSchedules);
            setSchedules(updatedSchedules);
        } catch (error) {
            console.error('Failed to write schedules:', error);
            await window.electron.showAlert({
                type: 'error',
                title: '오류',
                message: '일정 저장에 실패했습니다.',
                detail: error.message || '파일 저장 중 알 수 없는 오류 발생'
            });
        }
    };

    // 일정 추가 핸들러
    const handleAddSchedule = async (newSchedule) => {
        try{
            const newScheduleData = {
                ...newSchedule,
                date: selectedDate.toISOString().split('T')[0], // 선택된 날짜를 ISO 형식으로 변환
                id: Date.now(), // 고유 ID 생성 (현재 시간 밀리초 단위)
                completed: false // 새 일정은 기본적으로 미완료
            };
            const updatedSchedules = [...schedules, newScheduleData];

            await saveSchedules(updatedSchedules);
    
            setModalMode(MODAL_MODE.CLOSED); // 🌟 모달 닫기

            
            await window.electron.showAlert({
                type: 'info',
                title: '알림',
                message: '새 일정이 성공적으로 추가되었습니다.',
            });
        }catch(error){
            
            await window.electron.showAlert({
                type: 'error',
                title: '오류',
                message: '일정 추가에 실패했습니다.',
                detail: error.message || '파일 저장 중 알 수 없는 오류 발생'
            });
        }
    };

    // 일정 삭제 핸들러
    const handleDeleteSchedule = async (id) => {
        const confirmResponse = await window.electron.showConfirm({
            type: 'question',
            title: '일정 삭제 확인',
            message: '이 일정을 삭제하시겠습니까?',
            buttons: ['취소', '삭제'],
            cancelId: 0
        });

        if (confirmResponse === 1) {
            const updatedSchedules = schedules.filter(schedule => schedule.id !== id);
            await saveSchedules(updatedSchedules);
            setModalMode(MODAL_MODE.CLOSED); // 삭제 후 모달 닫기 또는 목록으로 돌아가기
            setSelectedSchedule(null); // 삭제된 일정 데이터 초기화

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

        if (selectedSchedule && selectedSchedule.id === id) {
            const updatedViewSchedule = updatedSchedules.find(s => s.id === id);
            if (updatedViewSchedule) {
                setSelectedSchedule(updatedViewSchedule); // 🌟 상세보기/수정 중인 일정 데이터 업데이트
            }
        }
    };

    // 달력 날짜 클릭 시 일정 모달 열기 (기본은 LIST 모드)
    const handleDayClick = (date) => {
        setSelectedDate(date);
        setSelectedSchedule(null); // 기존에 선택된 일정 초기화
        setModalMode(MODAL_MODE.LIST); // 🌟 날짜 클릭 시 기본적으로 해당 날짜의 목록/추가 모달 열림
    };

    // 카테고리 변경 핸들러 (새 일정 추가 폼 내)
    // const handleCategoryChange = (e) => {
    //     const categoryValue = e.target.value;
    //     setNewCategory(categoryValue);
    //     const selectedCat = categories.find(cat => cat.value === categoryValue);
    //     setSelectedCategoryColor(selectedCat ? selectedCat.color : '#333333');
    // };

    // 일정 상세보기 핸들러
    const handleViewScheduleDetail = (schedule) => {
        setSelectedSchedule(schedule); // 상세 보기할 일정 설정
        setModalMode(MODAL_MODE.DETAIL); // 🌟 모달 모드를 DETAIL로 변경
    };

    // 특정 일정 수정 시작 핸들러
    const handleStartEditSchedule = (schedule) => {
        setSelectedSchedule({ ...schedule }); // 수정할 일정 데이터 복사하여 설정
        setModalMode(MODAL_MODE.EDIT); // 🌟 모달 모드를 EDIT으로 변경
    };

    // 수정 취소 또는 상세보기에서 목록으로 돌아가기
    const handleBackToList = () => {
        setSelectedSchedule(null); // 데이터 초기화
        setModalMode(MODAL_MODE.LIST); // 🌟 모달 모드를 LIST로 변경
    };

    const handleUpdateSchedule = async (updatedScheduleData) => {
        
        try {
            // 1. 기존 일정 목록에서 ID가 일치하는 일정을 찾아서 업데이트
            const updatedSchedules = schedules.map(schedule =>
                schedule.id === updatedScheduleData.id ? updatedScheduleData : schedule
            );

            // 2. 변경된 일정 목록을 파일에 저장
            await saveSchedules(updatedSchedules);

            // 3. 사용자에게 성공 알림 표시
            await window.electron.showAlert({
                type: 'info',
                title: '알림',
                message: '일정이 성공적으로 수정되었습니다.',
            });

            // 4. 모달 상태 갱신 및 모드 변경
            setSelectedSchedule(updatedScheduleData); // 업데이트된 데이터로 모달 상태 갱신
            setModalMode(MODAL_MODE.DETAIL); // 수정 완료 후 상세 보기 모드로 돌아가기
        } catch (error) {
            // 5. 일정 수정 과정(주로 saveSchedules)에서 발생할 수 있는 오류 처리
            await window.electron.showAlert({
                type: 'error',
                title: '오류',
                message: '일정 수정에 실패했습니다.',
                detail: error.message || '파일 저장 중 알 수 없는 오류 발생'
            });
        }
    };

    // 선택된 날짜에 해당하는 일정만 필터링
    const schedulesForSelectedDate = schedules.filter(schedule => {
        const year = selectedDate.getFullYear();
        const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
        const day = selectedDate.getDate().toString().padStart(2, '0');
        const formattedSelectedDate = `${year}-${month}-${day}`;
        return schedule.date === formattedSelectedDate;
    });

    // 모달 내용 렌더링 함수
    const renderModalContent = () => {
        switch (modalMode) {
            case MODAL_MODE.EDIT:
                return (
                    <ScheduleUpdateModal
                        schedule={selectedSchedule} // prop 이름 변경 (scehdule -> schedule)
                        categories={categories}
                        onUpdateComplete={handleUpdateSchedule}
                        onBackToList={() => handleBackToList()}
                        onClose={() => setModalMode(MODAL_MODE.CLOSED)} // 모달 닫기 핸들러
                    />
                );
            case MODAL_MODE.DETAIL:
                return (
                    <ScheduleDetailModal
                        schedule={selectedSchedule}
                        categories={categories}
                        onEdit={handleStartEditSchedule} // 수정 시작 핸들러
                        onToggleComplete={handleToggleComplete}
                        onDelete={handleDeleteSchedule}
                        onBackToList={() => handleBackToList()}
                        onClose={() => setModalMode(MODAL_MODE.CLOSED)} // 모달 닫기 핸들러
                    />
                );
            case MODAL_MODE.LIST:
                // LIST 모드에서는 선택된 날짜의 일정 목록과 새 일정 추가 폼을 함께 렌더링
                return (
                    <>
                        {schedulesForSelectedDate.length > 0 ? (
                            <ScheduleListModal
                                schedules={schedulesForSelectedDate}
                                categories={categories}
                                handleToggleComplete={handleToggleComplete}
                                openDetail={handleViewScheduleDetail}
                                onDelete={handleDeleteSchedule}
                                onClose={() => setModalMode(MODAL_MODE.CLOSED)} // 모달 닫기 핸들러
                            />
                        ) : (
                            <p>선택된 날짜에 일정이 없습니다.</p>
                        )}
                    </>
                );
            case MODAL_MODE.ADD: // ADD 모드도 LIST 모드와 같은 화면을 사용하도록 통합
                return (
                    <ScheduleInsertModal
                        date={selectedDate} // 새 일정 추가 시 선택된 날짜 전달
                        categories={categories}
                        onAddSchedule={handleAddSchedule}
                        onBackToList={() => handleBackToList()}
                        onClose={() => setModalMode(MODAL_MODE.CLOSED)} // 모달 닫기 핸들러
                    />
                );
            case MODAL_MODE.CLOSED:
                break;
            default:
                return null;
        }
    };

    // 모달 제목을 동적으로 설정
    const getModalTitle = () => {
        const dateString = selectedDate.toLocaleDateString('ko-KR');
        switch (modalMode) {
            case MODAL_MODE.EDIT:
                return '일정 수정';
            case MODAL_MODE.DETAIL:
                return `${dateString} 일정 상세 보기`;
            case MODAL_MODE.LIST:
                return `${dateString} 일정 보기`;
            case MODAL_MODE.ADD:
                return `${dateString} 새 일정 추가`;
            default:
                return '';
        }
    };

    return (
        <div className="schedule-page">
            <DefaultCalendar
                value={selectedDate}
                onChange={setSelectedDate}
                onClickDay={handleDayClick} // 날짜 클릭 시 모달 열기 로직 변경
                data={schedules}
                categories={categories}
                holidays={holidays}
            />

            <Modal
                isOpen={modalMode !== MODAL_MODE.CLOSED} // CLOSED 모드가 아니면 모달 열림
                onClose={() => setModalMode(MODAL_MODE.CLOSED)} // 모달 닫기
                title={getModalTitle()} // 동적으로 제목 설정
            >
                <div className="modal-form-content">
                    {renderModalContent()} {/* 함수 호출로 내용 렌더링 */}
                </div>
            </Modal>
        </div>
    );
}

export default SchedulePage;