import React, { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import TodaySchedulePage from './pages/TodaySchedulePage.jsx';
import SchedulePage from './pages/SchedulePage.jsx';
import CategorySettingsPage from './pages/CategorySettingsPage.jsx';

function App() {
	const navigate = useNavigate();

	useEffect(() => {
		const handleNavigate = (event) => {
			navigate(event.detail);
		};

		window.addEventListener('electron-navigate', handleNavigate);

		return () => {
			window.removeEventListener('electron-navigate', handleNavigate);
		};
	}, [navigate]);

	return (
		<DndProvider backend={HTML5Backend}>
			<Routes>
				<Route path="/" element={<TodaySchedulePage />} />
				<Route path="/schedule" element={<SchedulePage />} />
				<Route path="/settings/categories" element={<CategorySettingsPage />} />
				{/* <Route path="/about"={<AboutPage />} /> */}
				{/* 필요한 다른 라우트들을 여기에 추가하세요. */}
			</Routes>
		</DndProvider>
	);
}

export default App;