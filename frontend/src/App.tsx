import Forum from './pages/Forum';
import TopicDetail from './components/TopicDetail';

// ... existing code ...

// Inside the Routes component, add these new routes:
<Route path="/forum" element={<Forum />} />
<Route path="/forum/topic/:topicId" element={<TopicDetail />} />

// ... existing code ... 