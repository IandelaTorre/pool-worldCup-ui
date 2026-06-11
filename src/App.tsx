import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CreateGroup from './pages/CreateGroup';
import GroupView from './pages/GroupView';
import MyGroups from './pages/MyGroups';
import JoinGroup from './pages/JoinGroup';
import { ColdStartModal } from './components/ColdStartModal';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/my-groups" element={<MyGroups />} />
        <Route path="/create-group" element={<CreateGroup />} />
        <Route path="/group/:id" element={<GroupView />} />
        <Route path="/join/:inviteCode" element={<JoinGroup />} />
      </Routes>
      <ColdStartModal />
    </BrowserRouter>
  );
}

export default App;
