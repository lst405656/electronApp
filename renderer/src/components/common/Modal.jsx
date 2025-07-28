import React, { useEffect } from 'react';
import ReactDOM from 'react-dom'; // 포탈(Portal)을 위해 필요
import '../../styles/components/common/Modal.css'; // 모달 스타일

/**
 * 모달 컴포넌트.
 * @param {Object} props
 * @param {boolean} props.isOpen - 모달의 열림/닫힘 상태.
 * @param {() => void} props.onClose - 모달을 닫을 때 호출될 함수.
 * @param {React.ReactNode} props.children - 모달 내부에 렌더링될 콘텐츠.
 * @param {string} [props.title] - 모달 제목 (선택 사항).
 */
function Modal({ isOpen, onClose, children, title }) {

    // ESC 키를 눌러 모달 닫기
    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => {
            window.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);
    
    // 모달이 열려있지 않으면 아무것도 렌더링하지 않음
    if (!isOpen){
        return null;
    }

    // Portal을 사용하여 모달을 DOM의 body 바로 아래에 렌더링하는 것이 일반적입니다.
    // 이는 CSS z-index 문제나 부모 컴포넌트의 overflow 속성으로부터 자유롭게 하기 위함입니다.
    return ReactDOM.createPortal(
        <div className="modal-overlay" onClick={onClose}>
            {/* stopPropagation을 사용하여 오버레이 클릭 시에만 닫히도록 함 */}
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    {title && <h2 className="modal-title">{title}</h2>}
                    <button className="modal-close-btn" onClick={onClose}>
                        &times;
                    </button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>,
        document.body // body 태그에 직접 렌더링
    );
}

export default Modal;