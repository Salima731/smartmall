import { apiSlice } from '../api/apiSlice';

export const alertApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAlerts: builder.query({
      query: (mallId) => `/alerts/mall/${mallId}`,
      providesTags: ['Alert'],
    }),
    createAlert: builder.mutation({
      query: (data) => ({
        url: '/alerts',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Alert'],
    }),
    deactivateAlert: builder.mutation({
      query: (id) => ({
        url: `/alerts/${id}/deactivate`,
        method: 'PUT',
      }),
      invalidatesTags: ['Alert'],
    }),
  }),
});

export const { useGetAlertsQuery, useCreateAlertMutation, useDeactivateAlertMutation } = alertApiSlice;
