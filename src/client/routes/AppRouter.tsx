import { BrowserRouter, Routes, Route } from 'react-router-dom';
import StartPage from '../pages/StartPage';
import HomePage from '../pages/HomePage';
import ProfilePage from '../pages/ProfilePage';
import FriendsPage from '../pages/FriendsPage';
import CollectionPage from '../pages/CollectionPage';
import DiscoverTradePage from '../pages/DiscoverTradePage';
import TradeRequestsPage from '../pages/TradeRequestPage';
import TradePage from '../pages/TradePage';
import CreateTradeRoomPage from '../pages/CreateRoomPage';
import OpenPackPage from '../pages/OpenPackPage';
import SearchPage from '../pages/SearchPage';

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/collection" element={<CollectionPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/abrir" element={<OpenPackPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/friends" element={<FriendsPage />} />
        <Route path="/discover" element={<DiscoverTradePage />} />
        <Route path="/trade-requests" element={<TradeRequestsPage />} />
        <Route path="/trade-room/:code" element={<TradePage />} />
        <Route path="/trade-room/create" element={<CreateTradeRoomPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
