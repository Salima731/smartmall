import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5020/api',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.userInfo?.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const apiSlice = createApi({
  baseQuery,
  tagTypes: ['User', 'Mall', 'Shop', 'Product', 'Parking', 'Order', 'Restroom', 'Offer', 'Review', 'Alert', 'Complaint', 'Notification', 'Settings'],
  endpoints: (builder) => ({}),
});
