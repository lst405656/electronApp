import React from 'react';
import { useDrag } from 'react-dnd';

// 드래그할 항목의 타입을 정의합니다.
export const ItemTypes = {
    SCHEDULE_ITEM: 'schedule_item',
};

/**
 * 드래그 가능하게 만드는 래퍼 컴포넌트.
 * @param {Object} props
 * @param {string} props.type - 드래그할 항목의 타입 (예: ItemTypes.SCHEDULE_ITEM).
 * @param {Object} props.item - 드래그 시작 시 전달할 데이터 객체 (예: { id: '...', date: '...' }).
 * @param {React.ReactNode} props.children - 드래그 가능하게 만들 실제 UI 내용.
 * @param {string} [props.className] - DraggableItem 자체에 적용될 추가 CSS 클래스.
 */
function DraggableItem({ type, item, children, className }) {
	// useDrag 훅을 사용해 이 컴포넌트를 드래그 가능하게 만듭니다.
	// 첫 번째 배열 요소: 드래그 상태를 모니터링하는 객체
	// 두 번째 배열 요소: 드래그 가능한 요소를 참조할 ref
	const [{ isDragging }, drag] = useDrag(() => ({
		type: type, // 어떤 타입의 항목인지 지정 (ItemTypes.SCHEDULE_ITEM)
		item: item, // 드롭 시 전달할 실제 데이터 (예: 일정 ID, 원래 날짜)
		collect: (monitor) => ({
			// 드래그 상태를 수집하는 함수
			isDragging: monitor.isDragging(), // 현재 드래그 중인지 여부 (시각적 피드백에 사용)
		}),
	}), [type, item]); // type 또는 item 데이터가 변경될 때마다 훅을 재실행합니다.

	return (
		<div
			ref={drag} // 이 ref를 div에 연결하면 이 div가 드래그 가능한 요소가 됩니다.
			className={`draggable-item ${className || ''}`} // 기본 스타일 클래스와 외부에서 받은 클래스를 적용
			style={{ opacity: isDragging ? 0.5 : 1 }} // 드래그 중일 때 투명도를 조절하여 시각적 피드백 제공
		>
			{children}
		</div>
	);
}

export default DraggableItem;