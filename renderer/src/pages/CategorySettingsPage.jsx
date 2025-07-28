import React, { useState, useEffect, useCallback } from 'react';

function CategorySettingsPage() {
    // 새 카테고리 추가를 위한 상태
    const [editingNewCategoryLabel, setEditingNewCategoryLabel] = useState('');
    const [editingNewCategoryColor, setEditingNewCategoryColor] = useState('#000000');

    // 기존 카테고리 수정/삭제를 위한 상태
    const [selectedCategoryToEdit, setSelectedCategoryToEdit] = useState(''); // 현재 선택된 카테고리의 value
    const [editedCategoryLabel, setEditedCategoryLabel] = useState('');     // 수정 중인 이름
    const [editedCategoryColor, setEditedCategoryColor] = useState('');     // 수정 중인 색상

    // 전체 카테고리 목록 상태
    const [categories, setCategories] = useState([]);

    // 카테고리 목록을 파일에 저장하고 상태를 업데이트하는 비동기 함수
    const saveCategories = useCallback(async (updatedCategories) => {
        try {
            await window.electron.writeCategories(updatedCategories);
            setCategories(updatedCategories); // UI 상태 업데이트

            // 카테고리 저장 후, 현재 선택된 편집 카테고리 상태를 동기화
            // (새 카테고리 추가 또는 기존 카테고리 삭제 후 목록이 비었을 때를 대비)
            if (updatedCategories.length > 0) {
                const defaultCat = updatedCategories.find(cat => cat.value === 'default') || updatedCategories[0];
                setSelectedCategoryToEdit(defaultCat.value);
                setEditedCategoryLabel(defaultCat.label);
                setEditedCategoryColor(defaultCat.color);
            } else {
                // 카테고리가 모두 삭제된 경우
                setSelectedCategoryToEdit('');
                setEditedCategoryLabel('');
                setEditedCategoryColor('');
            }

        } catch (error) {
            console.error('Failed to save categories:', error);
            // alert('카테고리 저장에 실패했습니다.'); // 네이티브 다이얼로그로 대체
            await window.electron.showAlert({
                type: 'error',
                title: '오류',
                message: '카테고리 저장에 실패했습니다.',
                detail: error.message || '파일 저장 중 알 수 없는 오류 발생'
            });
        }
    }, []); // 의존성 배열 비움: saveCategories 함수는 외부 상태에 의존하지 않고 독립적으로 동작

    // 컴포넌트 마운트 시 카테고리 데이터 불러오기
    useEffect(() => {
        const loadData = async () => {
            try {
                const loadedCategories = await window.electron.readCategories();
                setCategories(loadedCategories); // 상태에 로드된 카테고리 설정

                // 로드된 카테고리가 있다면, 첫 번째 또는 'default' 카테고리를 편집 대상으로 설정
                if (loadedCategories.length > 0) {
                    const defaultCat = loadedCategories.find(cat => cat.value === 'default') || loadedCategories[0];
                    setSelectedCategoryToEdit(defaultCat.value);
                    setEditedCategoryLabel(defaultCat.label);
                    setEditedCategoryColor(defaultCat.color);
                }
            } catch (error) {
                console.error('Failed to load categories:', error);
                // alert('카테고리 로드에 실패했습니다.'); // 네이티브 다이얼로그로 대체
                await window.electron.showAlert({
                    type: 'error',
                    title: '오류',
                    message: '카테고리 로드에 실패했습니다.',
                    detail: error.message || '파일 읽기 중 알 수 없는 오류 발생'
                });
            }
        }
        loadData();
    }, []); // 빈 의존성 배열: 컴포넌트 마운트 시 한 번만 실행

    // 새 카테고리 추가 핸들러
    const handleAddCategory = async() => {
        if (editingNewCategoryLabel.trim() === '') {
            await window.electron.showAlert({
                type: 'warning',
                title: '경고',
                message: '새 카테고리 이름을 입력해주세요.',
            });
        return;
        }

        const newCatValue = editingNewCategoryLabel.trim().toLowerCase().replace(/\s+/g, '-');
        // value 중복 체크
        if (categories.some(cat => cat.value === newCatValue)) {
            await window.electron.showAlert({
                type: 'warning',
                title: '경고',
                message: '이미 존재하는 카테고리 이름입니다. 다른 이름을 사용해주세요.',
            });
        return;
        }

        const newCategoryObj = {
            value: newCatValue,
            label: editingNewCategoryLabel.trim(),
            color: editingNewCategoryColor
        };
        const updatedCategories = [...categories, newCategoryObj];
        await saveCategories(updatedCategories); // await 추가

        // 입력 필드 초기화
        setEditingNewCategoryLabel('');
        setEditingNewCategoryColor('#000000');

        await window.electron.showAlert({
            type: 'info',
            title: '알림',
            message: '새 카테고리가 성공적으로 추가되었습니다.',
        });
    };

    // 기존 카테고리 수정 핸들러
    const handleUpdateCategory = async () => { // async 함수로 변경
        // 현재 선택된 카테고리의 원본 데이터 (업데이트 전)
        const originalCategory = categories.find(cat => cat.value === selectedCategoryToEdit);
        if (!originalCategory) {
            await window.electron.showAlert({
                type: 'warning',
                title: '경고',
                message: '수정할 카테고리를 찾을 수 없습니다.',
            });
            return;
        }

        if (editedCategoryLabel.trim() === '') {
            await window.electron.showAlert({
                type: 'warning',
                title: '경고',
                message: '카테고리 이름을 입력해주세요.',
            });
            return;
        }

        const newCatValue = editedCategoryLabel.trim().toLowerCase().replace(/\s+/g, '-');

        // label 변경 시 value 중복 체크 (자신을 제외하고 중복되는지 확인)
        const hasDuplicateValue = categories.filter((cat, i) =>
            cat.value !== originalCategory.value && cat.value === newCatValue
        ).length > 0;

        if (hasDuplicateValue) {
            await window.electron.showAlert({
                type: 'warning',
                title: '경고',
                message: '카테고리 이름 변경 시 기존 카테고리와 중복될 수 없습니다.',
            });
            return;
        }

        // 카테고리 목록 업데이트
        const updatedCategories = categories.map((cat) =>
            cat.value === selectedCategoryToEdit
                ? {
                    ...cat,
                    label: editedCategoryLabel.trim(),
                    color: editedCategoryColor,
                    value: newCatValue // 레이블 변경 시 value도 업데이트
                }
                : cat
        );

        try {
            // 1. categories.json 업데이트
            await saveCategories(updatedCategories);

            // 2. schedules.json 내의 해당 카테고리 일정을 업데이트
            const allSchedules = await window.electron.readSchedules();
            let schedulesModified = false;

            const updatedSchedules = allSchedules.map(schedule => {
                // 현재 일정의 카테고리 값이 원본 카테고리의 value와 일치하는 경우
                if (schedule.category === originalCategory.value) {
                    schedulesModified = true;
                    return {
                        ...schedule,
                        category: newCatValue,          // 변경된 category value
                        categoryColor: editedCategoryColor // 변경된 category color
                    };
                }
                return schedule;
            });

            if (schedulesModified) {
                await window.electron.writeSchedules(updatedSchedules);
            }

            await window.electron.showAlert({
                type: 'info',
                title: '알림',
                message: '카테고리가 성공적으로 수정되었습니다.',
            });

        } catch (error) {
            console.error('Failed to update category and schedules:', error);
            await window.electron.showAlert({
                type: 'error',
                title: '오류',
                message: '카테고리 수정 및 일정 업데이트에 실패했습니다.',
                detail: error.message || '알 수 없는 오류 발생'
            });
        }
    };

    // 카테고리 삭제 핸들러
    const handleDeleteCategory = async () => { // 비동기 함수로 변경
        const categoryToDelete = categories.find(cat => cat.value === selectedCategoryToEdit);

        if (!categoryToDelete) {
             // 이 경고창은 위에서 selectedCategoryToEdit이 없을 때 필드가 표시되지 않으므로 거의 발생하지 않겠지만, 안전을 위해 남겨둠.
            await window.electron.showAlert({
                type: 'warning',
                title: '경고',
                message: '삭제할 카테고리를 선택해주세요.',
            });
            return;
        }

        if (categoryToDelete.value === 'default') {
            await window.electron.showAlert({
                type: 'warning',
                title: '경고',
                message: '기본 카테고리는 삭제할 수 없습니다.',
            });
            return;
        }

        const confirmResponse = await window.electron.showConfirm({
            type: 'question',
            title: '카테고리 삭제 확인',
            message: `"${categoryToDelete.label}" 카테고리를 삭제하시겠습니까?`,
            detail: `이 카테고리를 사용하는 모든 일정은 '기본' 카테고리로 변경됩니다.`,
            buttons: ['취소', '삭제'], // 0: 취소, 1: 삭제
            cancelId: 0
        });

        if (confirmResponse === 1) { // '삭제' 버튼을 클릭한 경우
            try {
                // 1. 카테고리 목록에서 해당 카테고리 삭제
                const updatedCategories = categories.filter(cat => cat.value !== categoryToDelete.value);
                await saveCategories(updatedCategories); // `categories.json`에 저장

                // 2. `schedules.json`의 일정들을 업데이트
                const allSchedules = await window.electron.readSchedules(); // 모든 일정 불러오기
                const defaultCategory = updatedCategories.find(cat => cat.value === 'default');
                const defaultCategoryValue = defaultCategory ? defaultCategory.value : 'default';
                const defaultCategoryColor = defaultCategory ? defaultCategory.color : '#333333';

                // 삭제될 카테고리를 사용하는 일정을 찾아서 'default'로 변경
                const schedulesToUpdate = allSchedules.filter(s => s.category === categoryToDelete.value);

                if (schedulesToUpdate.length > 0) {
                    const updatedSchedules = allSchedules.map(schedule =>
                        schedule.category === categoryToDelete.value
                            ? {
                                ...schedule,
                                category: defaultCategoryValue,
                                categoryColor: defaultCategoryColor // 색상도 기본 카테고리로 업데이트
                            }
                            : schedule
                    );
                    await window.electron.writeSchedules(updatedSchedules); // `schedules.json`에 저장
                }

                await window.electron.showAlert({
                    type: 'info',
                    title: '알림',
                    message: `"${categoryToDelete.label}" 카테고리와 해당 카테고리를 사용하는 일정이 '기본' 카테고리로 성공적으로 변경되었습니다.`,
                });

            } catch (error) {
                console.error('Failed to delete category and update schedules:', error);
                await window.electron.showAlert({
                    type: 'error',
                    title: '오류',
                    message: '카테고리 삭제 및 일정 업데이트에 실패했습니다.',
                    detail: error.message || '알 수 없는 오류 발생'
                });
            }
        }
    };

    // 편집할 카테고리 드롭다운 선택 변경 핸들러
    const handleSelectCategoryToEdit = (e) => {
        const selectedValue = e.target.value;
        setSelectedCategoryToEdit(selectedValue);
        const selectedCat = categories.find(cat => cat.value === selectedValue);
        if (selectedCat) {
            setEditedCategoryLabel(selectedCat.label);
            setEditedCategoryColor(selectedCat.color);
        } else {
            // 선택된 카테고리가 없는 경우 (예: 목록이 비었을 때)
            setEditedCategoryLabel('');
            setEditedCategoryColor('#000000');
        }
    };

    return (
        <div className="modal-form-content category-edit-form">
            <h3>카테고리 수정/삭제</h3>
            <label htmlFor="select-category-to-edit">카테고리 선택:</label>
            <select
                id="select-category-to-edit"
                value={selectedCategoryToEdit}
                onChange={handleSelectCategoryToEdit}
            >
                {/* 카테고리 목록이 비어있을 경우를 대비한 조건부 렌더링 */}
                {categories.length === 0 && <option value="">카테고리 없음</option>}
                {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                        {cat.label}
                    </option>
                ))}
            </select>

            {selectedCategoryToEdit && ( // 선택된 카테고리가 있을 때만 수정/삭제 필드 표시
                <div className="edit-fields">
                    <label htmlFor="edit-category-label">이름:</label>
                    <input
                        type="text"
                        id="edit-category-label"
                        value={editedCategoryLabel}
                        onChange={(e) => setEditedCategoryLabel(e.target.value)}
                        disabled={selectedCategoryToEdit === 'default'} // default 카테고리 이름은 수정 불가
                    />
                    <label htmlFor="edit-category-color">색상:</label>
                    <input
                        type="color"
                        id="edit-category-color"
                        value={editedCategoryColor}
                        onChange={(e) => setEditedCategoryColor(e.target.value)}
                    />
                    <button onClick={handleUpdateCategory} disabled={selectedCategoryToEdit === 'default'}>수정</button>
                    <button onClick={handleDeleteCategory} disabled={selectedCategoryToEdit === 'default'}>삭제</button>
                </div>
            )}

            <hr style={{ margin: '20px 0' }} /> {/* 구분선 */}

            <h3>새 카테고리 추가</h3>
            <input
                type="text"
                value={editingNewCategoryLabel}
                onChange={(e) => setEditingNewCategoryLabel(e.target.value)}
                placeholder="새 카테고리 이름"
            />
            <input
                type="color"
                value={editingNewCategoryColor}
                onChange={(e) => setEditingNewCategoryColor(e.target.value)}
            />
            <button onClick={handleAddCategory}>카테고리 추가</button>
        </div>
    );
}

export default CategorySettingsPage;