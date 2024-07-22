import axios from 'axios';

export const addSample = (payload: any) => {
    return axios.post('http://localhost:3000/sample', payload);
};