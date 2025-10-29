import axios from 'axios';

export const fetchGameState = async () => {
  const res = await axios.get('/api/game/state');
  return res.data;
};
