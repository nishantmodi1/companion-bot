import { type FC } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import SelectionScreen from './components/SelectionScreen';
import ChatScreen from './components/ChatScreen';

const App: FC = () => (
  <Routes>
    <Route path="/" element={<SelectionScreen />} />
    <Route path="/chat/:id" element={<ChatScreen />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;